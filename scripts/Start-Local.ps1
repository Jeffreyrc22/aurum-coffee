param([switch]$TestApi)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
$runtime=Join-Path $projectRoot '.runtime'
if(!(Test-Path "$runtime/local-env.json")){throw 'Portable runtime is not initialized. Use the Docker setup in README.md or configure Java/PostgreSQL manually.'}
$config=Get-Content -Raw "$runtime/local-env.json" | ConvertFrom-Json
$jdk=Get-ChildItem $runtime -Directory -Filter 'jdk-*' | Select-Object -First 1
$java=Join-Path $jdk.FullName 'bin/java.exe'
$env:POSTGRES_PASSWORD=$config.POSTGRES_PASSWORD
$env:POSTGRES_USER='aurum'
$env:ADMIN_EMAIL=$config.ADMIN_EMAIL
$env:ADMIN_PASSWORD=$config.ADMIN_PASSWORD
$env:SESSION_SECURE='false'
& "$PSScriptRoot/Start-Database.ps1"
$port=if($TestApi){8081}else{8080}
$database=if($TestApi){'aurum_test'}else{'aurum'}
$env:DATABASE_URL="jdbc:postgresql://127.0.0.1:55432/$database"
$env:APP_PORT="$port"
$env:UPLOAD_DIR=if($TestApi){Join-Path $runtime 'test-uploads'}else{Join-Path $projectRoot 'uploads'}
$suffix=if($TestApi){'test'}else{'app'}
$processFile=Join-Path $runtime "$suffix-processes.json"
if(Test-Path $processFile){$old=Get-Content -Raw $processFile|ConvertFrom-Json;foreach($entry in @($old)){$existing=Get-Process -Id $entry.id -ErrorAction SilentlyContinue;if($existing -and $existing.ProcessName -eq $entry.name -and $existing.StartTime -and $existing.StartTime.ToUniversalTime() -eq ([datetimeoffset]$entry.started).UtcDateTime){throw 'A recorded process is still running. Run Stop-Local.ps1 first.'}}}
$jar=Join-Path $projectRoot 'backend/target/aurum-api-1.0.0.jar'
if(!(Test-Path $jar)){throw 'Build the backend first (see README).'}
$backend=Start-Process -FilePath $java -ArgumentList @('-jar',('"'+$jar+'"')) -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput "$runtime/$suffix-api.log" -RedirectStandardError "$runtime/$suffix-api-error.log" -PassThru
$entries=@(@{id=$backend.Id;started=$backend.StartTime.ToUniversalTime().ToString('o');name='java'})
$entries|ConvertTo-Json|Set-Content $processFile
$ready=$false
for($i=0;$i -lt 45;$i++){try{if((Invoke-WebRequest "http://127.0.0.1:$port/actuator/health" -TimeoutSec 2).StatusCode -eq 200){$ready=$true;break}}catch{Start-Sleep -Seconds 1}}
if(!$ready){throw "API failed to start. Inspect .runtime/$suffix-api.log and run Stop-Local.ps1."}
if(!$TestApi){$node=(Get-Command node).Source;$vite=Join-Path $projectRoot 'frontend/node_modules/vite/bin/vite.js';$web=Start-Process -FilePath $node -ArgumentList @(('"'+$vite+'"'),'--host','127.0.0.1','--port','5174','--strictPort') -WorkingDirectory "$projectRoot/frontend" -WindowStyle Hidden -RedirectStandardOutput "$runtime/web.log" -RedirectStandardError "$runtime/web-error.log" -PassThru;$entries+=@{id=$web.Id;started=$web.StartTime.ToUniversalTime().ToString('o');name='node'};$entries|ConvertTo-Json|Set-Content $processFile;Write-Output 'AURUM store: http://127.0.0.1:5174'}else{Write-Output 'Isolated test API: http://127.0.0.1:8081'}
