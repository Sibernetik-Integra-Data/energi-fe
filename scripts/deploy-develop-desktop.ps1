param(
    [string]$ImageName = 'energi-fe:dev',
    [string]$ContainerName = 'energi-fe-dev',
    [int]$Port = 10001,
    [int]$LoopbackPort = 11001,
    [string]$BindHost = '0.0.0.0'
)

$ErrorActionPreference = 'Stop'

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDirectory
$backupImageName = if ($ImageName -match '^(.+):([^:]+)$') {
    "$($Matches[1]):backup"
} else {
    "$ImageName-backup"
}

Set-Location $projectRoot

Write-Host 'Building frontend dist output...'
npm.cmd run build

Write-Host 'Pruning Podman images older than 24 hours...'
podman image prune -f --filter until=24h | Out-Null

$existingContainers = podman ps -a --format '{{.Names}}'
if ($existingContainers -contains $ContainerName) {
    Write-Host "Backing up existing container '$ContainerName' to '$backupImageName'..."
    if (podman image exists $backupImageName) {
        podman rmi -f $backupImageName | Out-Null
    }
    podman commit $ContainerName $backupImageName | Out-Null
}
elseif (podman image exists $ImageName) {
    Write-Host "Backing up existing image '$ImageName' to '$backupImageName'..."
    if (podman image exists $backupImageName) {
        podman rmi -f $backupImageName | Out-Null
    }
    podman tag $ImageName $backupImageName
}

Write-Host "Building Podman image '$ImageName'..."
podman build -f dockerfile.development -t $ImageName .

if ($existingContainers -contains $ContainerName) {
    Write-Host "Removing existing container '$ContainerName'..."
    podman rm -f $ContainerName | Out-Null
}

Write-Host "Starting '$ContainerName' with published port mapping and restart policy..."
podman run `
    -d `
    --name $ContainerName `
    --publish 127.0.0.1:${LoopbackPort}:${Port} `
    --restart always `
    -e NODE_ENV=development `
    -e PORT=$Port `
    -e HOST=$BindHost `
    -e DIST_DIR=/app/dist `
    $ImageName

$forwarderScript = Join-Path $scriptDirectory 'start-port-forward.ps1'
$forwarderPidFile = Join-Path $scriptDirectory 'port-forward.pid'

if (Test-Path $forwarderPidFile) {
    $existingForwarderPid = Get-Content $forwarderPidFile -ErrorAction SilentlyContinue
    if ($existingForwarderPid) {
        Stop-Process -Id $existingForwarderPid -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $forwarderPidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting host forwarder from 0.0.0.0:$Port to localhost:$LoopbackPort..."
$forwarderProcess = Start-Process -FilePath powershell.exe `
    -ArgumentList @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', $forwarderScript,
        '-PublicPort', $Port,
        '-LoopbackPort', $LoopbackPort
    ) `
    -PassThru `
    -WindowStyle Hidden

Set-Content -Path $forwarderPidFile -Value $forwarderProcess.Id