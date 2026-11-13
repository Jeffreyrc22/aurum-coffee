param([switch]$TestApi,[switch]$StopDatabase)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$suffix=if($TestApi){'test'}else{'app'}
$file=Join-Path $projectRoot ".runtime/$suffix-processes.json"
if(Test-Path $file){foreach($entry in @(Get-Content -Raw $file|ConvertFrom-Json)){$process=Get-Process -Id $entry.id -ErrorAction SilentlyContinue;if($process -and $process.ProcessName -eq $entry.name -and $process.StartTime.ToUniversalTime().ToString('o') -eq $entry.started){Stop-Process -Id $process.Id}};Remove-Item -LiteralPath $file}
if($StopDatabase){& "$projectRoot/.runtime/pgsql/bin/pg_ctl.exe" -D "$projectRoot/.runtime/pgdata" -m fast -w stop}

