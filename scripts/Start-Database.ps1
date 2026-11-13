$ErrorActionPreference='Stop'
$runtime=Join-Path (Split-Path $PSScriptRoot -Parent) '.runtime'
$ready=Join-Path $runtime 'pgsql/bin/pg_isready.exe'
& $ready -h 127.0.0.1 -p 55432 *> $null
if($LASTEXITCODE -eq 0){return}
$ctl=Join-Path $runtime 'pgsql/bin/pg_ctl.exe'
$argsList=@('-D',('"'+(Join-Path $runtime 'pgdata')+'"'),'-l',('"'+(Join-Path $runtime 'postgres.log')+'"'),'-o','"-p 55432 -h 127.0.0.1"','-t','30','start')
Start-Process -FilePath $ctl -ArgumentList $argsList -WindowStyle Hidden -RedirectStandardOutput "$runtime/pg-start.log" -RedirectStandardError "$runtime/pg-start-error.log" | Out-Null
for($attempt=0;$attempt -lt 30;$attempt++){& $ready -h 127.0.0.1 -p 55432 *> $null;if($LASTEXITCODE -eq 0){return};Start-Sleep -Seconds 1}
throw 'PostgreSQL did not become ready. Inspect .runtime/postgres.log.'
