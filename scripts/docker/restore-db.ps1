[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$BackupPath,
    [string]$EnvironmentFile = '.env.docker',
    [string]$TargetDatabase = 'mess_management_restore',
    [switch]$AllowPrimaryDatabase,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$environmentPath = (Resolve-Path (Join-Path $repositoryRoot $EnvironmentFile)).Path
$resolvedBackupPath = (Resolve-Path $BackupPath).Path

if ([System.IO.Path]::GetExtension($resolvedBackupPath) -ne '.sql') {
    throw 'Only .sql backup files can be restored.'
}

if ($TargetDatabase -notmatch '^[A-Za-z0-9_]+$') {
    throw 'TargetDatabase may contain only letters, numbers, and underscores.'
}

if ($TargetDatabase -eq 'mess_management' -and -not $AllowPrimaryDatabase) {
    throw 'Restoring over the primary coursework database requires -AllowPrimaryDatabase.'
}

if (-not $Force) {
    $confirmation = Read-Host "Restore '$resolvedBackupPath' into '$TargetDatabase'? Type RESTORE to continue"
    if ($confirmation -cne 'RESTORE') {
        Write-Host 'Restore cancelled. No database changes were made.'
        exit 0
    }
}

$createDatabase = "CREATE DATABASE IF NOT EXISTS ``$TargetDatabase``;"
& docker compose --env-file $environmentPath exec -T db sh -lc "exec mysql -u\"`$MYSQL_USER\" -p\"`$MYSQL_PASSWORD\" -e '$createDatabase'"
if ($LASTEXITCODE -ne 0) {
    throw "Could not create target database '$TargetDatabase'."
}

Get-Content -LiteralPath $resolvedBackupPath -Raw |
    & docker compose --env-file $environmentPath exec -T db sh -lc "exec mysql -u\"`$MYSQL_USER\" -p\"`$MYSQL_PASSWORD\" '$TargetDatabase'"

if ($LASTEXITCODE -ne 0) {
    throw "Database restore failed with exit code $LASTEXITCODE."
}

Write-Host "Restore completed successfully into '$TargetDatabase'."
