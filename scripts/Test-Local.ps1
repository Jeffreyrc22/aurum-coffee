$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot
try {
 & "$PSScriptRoot/Start-Local.ps1" -TestApi
 $config=Get-Content -Raw .runtime/local-env.json|ConvertFrom-Json
 $env:ADMIN_EMAIL=$config.ADMIN_EMAIL;$env:ADMIN_PASSWORD=$config.ADMIN_PASSWORD;$env:TEST_API_URL='http://127.0.0.1:8081'
 node --test tests/api.integration.test.mjs
 if($LASTEXITCODE -ne 0){throw 'API integration checks failed.'}
} finally { & "$PSScriptRoot/Stop-Local.ps1" -TestApi }
