param(
    [string]$Token,
    [string]$FileKey = '4iyGlWAJXMiJAmMatLlDXV',
    [string]$NodeId = '325:4086',
    [string]$OutDir = 'src/assets/figma',
    [int]$Scale = 2,
    [string]$Format = 'png'
)

if (-not $Token) {
    if ($env:FIGMA_TOKEN) { $Token = $env:FIGMA_TOKEN }
    else {
        $secure = Read-Host "Enter Figma token (input hidden)" -AsSecureString
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
}

if (-not $Token) {
    Write-Error "No Figma token provided. Set FIGMA_TOKEN env var or pass -Token parameter."
    exit 2
}

$headers = @{ 'X-Figma-Token' = $Token }

$fullOut = Join-Path -Path (Get-Location) -ChildPath $OutDir
if (-not (Test-Path $fullOut)) { New-Item -ItemType Directory -Force -Path $fullOut | Out-Null }

Write-Host "Fetching file JSON for $FileKey..."
$filesUri = "https://api.figma.com/v1/files/$FileKey"
try {
    Invoke-WebRequest -Headers $headers -Uri $filesUri -OutFile (Join-Path $fullOut 'kebun-file.json') -UseBasicParsing
} catch {
    Write-Error "Failed to fetch file JSON: $_"
    exit 3
}

Write-Host "Fetching image metadata for node $NodeId..."
# Ensure values are URL-encoded to avoid API query parsing issues
$encNodeId = [uri]::EscapeDataString($NodeId)
$encFileKey = [uri]::EscapeDataString($FileKey)
$imagesUri = "https://api.figma.com/v1/images/$encFileKey?ids=$encNodeId&format=$Format&scale=$Scale"
Write-Host "Images metadata URL: $imagesUri"
$resp = $null
try {
    $resp = Invoke-WebRequest -Headers $headers -Uri $imagesUri -UseBasicParsing -ErrorAction Stop
    $content = $resp.Content
    # write raw content to debug file
    $content | Out-File -FilePath (Join-Path $fullOut 'images_raw.json') -Encoding utf8
    $imageResp = $null
    try { $imageResp = $content | ConvertFrom-Json } catch { $imageResp = $null }
    if ($imageResp -eq $null) {
        Write-Error "Images metadata response not valid JSON. See images_raw.json"
        exit 4
    }
    $imageResp | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $fullOut 'images.json') -Encoding utf8
} catch {
    Write-Error "Failed to fetch images metadata: $_"
    if ($_.Exception -and $_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "Response body:"; Write-Host $body
            $body | Out-File -FilePath (Join-Path $fullOut 'images_error_body.txt') -Encoding utf8
        } catch { }
    }
    exit 4
}

if (-not $imageResp.images.ContainsKey($NodeId)) {
    Write-Error "No image URL returned for node id $NodeId. See images_raw.json and images_error_body.txt"
    exit 5
}

$imageUrl = $imageResp.images[$NodeId]
$outFile = Join-Path $fullOut ("kebun-$($NodeId.Replace(':','_')).$Format")
Write-Host "Downloading image to $outFile ..."
try {
    Invoke-WebRequest -Uri $imageUrl -OutFile $outFile -UseBasicParsing
} catch {
    Write-Error "Failed to download image: $_"
    exit 6
}

Write-Host "Done. Files saved to $fullOut"
Get-ChildItem -Path $fullOut | ForEach-Object { Write-Host " - $($_.Name)" }
