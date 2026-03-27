param(
    [int]$PublicPort = 10001,
    [int]$LoopbackPort = 11001
)

Add-Type -Language CSharp -TypeDefinition @"
using System;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;

public static class PortForwarder
{
    public static void Run(int publicPort, int loopbackPort)
    {
        var listener = new TcpListener(IPAddress.Any, publicPort);
        listener.Start();
        Console.WriteLine("Forwarding 0.0.0.0:{0} -> 127.0.0.1:{1}", publicPort, loopbackPort);

        while (true)
        {
            var client = listener.AcceptTcpClient();
            Task.Run(() => HandleClient(client, loopbackPort));
        }
    }

    private static async Task HandleClient(TcpClient incomingClient, int loopbackPort)
    {
        using (incomingClient)
        using (var backendClient = new TcpClient())
        {
            await backendClient.ConnectAsync(IPAddress.Loopback, loopbackPort).ConfigureAwait(false);

            using (var incomingStream = incomingClient.GetStream())
            using (var backendStream = backendClient.GetStream())
            {
                var forwardToBackend = incomingStream.CopyToAsync(backendStream);
                var forwardToClient = backendStream.CopyToAsync(incomingStream);
                await Task.WhenAny(forwardToBackend, forwardToClient).ConfigureAwait(false);
            }
        }
    }
}
"@

[PortForwarder]::Run($PublicPort, $LoopbackPort)