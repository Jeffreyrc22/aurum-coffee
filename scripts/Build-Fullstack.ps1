$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
& "$PSScriptRoot/Stop-Local.ps1"
& "$PSScriptRoot/Stop-Local.ps1" -TestApi
$portable = Join-Path $projectRoot '.runtime'
if (!$env:JAVA_HOME) { $env:JAVA_HOME = (Get-ChildItem $portable -Directory -Filter 'jdk-*' | Select-Object -First 1).FullName }
$maven = if (Get-Command mvn.cmd -ErrorAction SilentlyContinue) { (Get-Command mvn.cmd).Source } else { Join-Path $portable 'apache-maven-3.9.11/bin/mvn.cmd' }
npm.cmd --prefix frontend run build
if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
& $maven "-Dmaven.repo.local=$portable/m2" -f backend/pom.xml compile
if ($LASTEXITCODE -ne 0) { throw 'Backend compilation failed.' }
$static = Join-Path $projectRoot 'backend/target/classes/static'
New-Item -ItemType Directory -Force -Path $static | Out-Null
Copy-Item -Path 'frontend/dist/*' -Destination $static -Recurse
& $maven "-Dmaven.repo.local=$portable/m2" -f backend/pom.xml verify
if ($LASTEXITCODE -ne 0) { throw 'Full-stack packaging failed.' }
Write-Output 'Frontend and API packaged in the same executable JAR.'
