param(
  [ValidateSet("web", "native")]
  [string]$Mode = "web",
  [ValidateRange(1024, 65535)]
  [int]$BackendPort = 3000,
  [bool]$KeepAlive = $true
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $projectRoot "apps\mobile"

function Stop-DeepStudyProcessTree {
  param([int]$ProcessId)
  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId"
  foreach ($child in $children) {
    Stop-DeepStudyProcessTree -ProcessId $child.ProcessId
  }
  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

$network = Get-NetIPConfiguration |
  Where-Object {
    $_.IPv4DefaultGateway -and
    $_.NetAdapter.Status -eq "Up" -and
    $_.IPv4Address.IPAddress
  } |
  Select-Object -First 1
$lanIp = $network.IPv4Address.IPAddress
if (-not $lanIp) {
  throw "No active LAN IPv4 address was found. Connect this computer and the iPhone to the same Wi-Fi network."
}

$apiBaseUrl = "http://${lanIp}:$BackendPort"
$mobileEnvironmentPath = Join-Path $mobileRoot ".env.local"
[System.IO.File]::WriteAllText(
  $mobileEnvironmentPath,
  "EXPO_PUBLIC_API_BASE_URL=$apiBaseUrl`n",
  [System.Text.UTF8Encoding]::new($false)
)

$devVarsPath = Join-Path $projectRoot ".dev.vars"
$originalDevVars = if (Test-Path -LiteralPath $devVarsPath) {
  [System.IO.File]::ReadAllText($devVarsPath)
} else {
  $null
}
$devVarOverrides = [ordered]@{
  APP_ENV = "development"
  APP_BASE_URL = $apiBaseUrl
  MOBILE_APP_SCHEME = "deepstudy"
  IP_HASH_SECRET = "local-iphone-development-only-secret-2026"
  UNSUBSCRIBE_TOKEN_SECRET = "local-iphone-unsubscribe-secret-2026"
  UPLOADS_MOCK_ENABLED = "true"
  AI_MOCK_ENABLED = "true"
  DEVELOPMENT_FULL_ACCESS = "true"
  TURNSTILE_REQUIRED = "false"
}
$existingLines = @()
if ($null -ne $originalDevVars) {
  $existingLines = $originalDevVars -split "\r?\n" |
    Where-Object {
      $line = $_
      -not ($devVarOverrides.Keys | Where-Object {
        $line -match "^$([Regex]::Escape($_))="
      })
    }
}
$localDevVars = @(
  $existingLines
  $devVarOverrides.GetEnumerator() | ForEach-Object {
    "$($_.Key)=$($_.Value)"
  }
) -join "`n"
[System.IO.File]::WriteAllText(
  $devVarsPath,
  "$localDevVars`n",
  [System.Text.UTF8Encoding]::new($false)
)

$env:APP_ENV = "development"
$env:APP_BASE_URL = $apiBaseUrl
$env:MOBILE_APP_SCHEME = "deepstudy"
$env:IP_HASH_SECRET = "local-iphone-development-only-secret-2026"
$env:UNSUBSCRIBE_TOKEN_SECRET = "local-iphone-unsubscribe-secret-2026"
$env:UPLOADS_MOCK_ENABLED = "true"
$env:AI_MOCK_ENABLED = "true"
$env:DEVELOPMENT_FULL_ACCESS = "true"
$env:TURNSTILE_REQUIRED = "false"

$npm = (Get-Command npm.cmd).Source
$backendLog = Join-Path $projectRoot "tmp\iphone-backend.log"
$backendErrorLog = Join-Path $projectRoot "tmp\iphone-backend-error.log"
New-Item -ItemType Directory -Force -Path (Split-Path $backendLog) |
  Out-Null

$backend = $null
try {
  $backend = Start-Process `
    -FilePath $npm `
    -ArgumentList @(
      "run",
      "dev",
      "--",
      "--hostname",
      "0.0.0.0",
      "--port",
      $BackendPort
    ) `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendLog `
    -RedirectStandardError $backendErrorLog `
    -PassThru

  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
    if ($backend.HasExited) {
      throw "The DeepStudy backend stopped during startup. Check $backendErrorLog."
    }
    try {
      Invoke-WebRequest -Uri $apiBaseUrl -TimeoutSec 2 -UseBasicParsing |
        Out-Null
      $ready = $true
      break
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  if (-not $ready) {
    throw "The DeepStudy backend did not become reachable at $apiBaseUrl."
  }

  Write-Host ""
  Write-Host "DeepStudy is reachable on your Wi-Fi:" -ForegroundColor Green
  Write-Host "  $apiBaseUrl"
  Write-Host ""
  Write-Host "Immediate iPhone option:"
  Write-Host "  Open that address in Safari, sign up, then use Share > Add to Home Screen."

  if ($Mode -eq "native") {
    Write-Host ""
    Write-Host "Starting Metro for an installed DeepStudy development build..."
    Set-Location $mobileRoot
    & npx.cmd expo start --dev-client --lan
  } else {
    Write-Host ""
    if ($KeepAlive) {
      Read-Host "Press Enter to stop the local iPhone server"
    } else {
      Write-Host "Startup validation passed; stopping the test server."
    }
  }
} finally {
  if ($backend) {
    Stop-DeepStudyProcessTree -ProcessId $backend.Id
  }
  if ($null -eq $originalDevVars) {
    Remove-Item -LiteralPath $devVarsPath -Force -ErrorAction SilentlyContinue
  } else {
    [System.IO.File]::WriteAllText(
      $devVarsPath,
      $originalDevVars,
      [System.Text.UTF8Encoding]::new($false)
    )
  }
}
