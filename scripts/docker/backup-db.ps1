[CmdletBinding()]
param(
    [string]$EnvironmentFile = '.env.docker',
    [string]$OutputDirectory = 'backups'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$environmentPath = (Resolve-Path (Join-Path $repositoryRoot $EnvironmentFile)).Path
$resolvedOutputDirectory = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot $OutputDirectory))
$repositoryPrefix = $repositoryRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

if (-not $resolvedOutputDirectory.StartsWith($repositoryPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The backup output directory must remain inside the repository.'
}

[System.IO.Directory]::CreateDirectory($resolvedOutputDirectory) | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $resolvedOutputDirectory "messmate-$timestamp.sql"
$composeArguments = @(
    'compose', '--env-file', $environmentPath,
    'exec', '-T', 'db', 'sh', '-lc',
    'exec mysqldump --single-transaction --no-tablespaces --routines --triggers -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
)

Write-Host "Creating coursework database backup: $backupPath"
try {
    & docker @composeArguments | Set-Content -LiteralPath $backupPath -Encoding utf8NoBOM
    if ($LASTEXITCODE -ne 0) {
        throw "Database backup failed with exit code $LASTEXITCODE."
    }
    if ((Get-Item -LiteralPath $backupPath).Length -eq 0) {
        throw 'Database backup produced an empty file.'
    }
    if (-not (Select-String -LiteralPath $backupPath -Pattern '^-- Dump completed on ' -Quiet)) {
        throw 'Database backup is incomplete: the dump completion marker is missing.'
    }
} catch {
    Remove-Item -LiteralPath $backupPath -Force -ErrorAction SilentlyContinue
    throw
}

Write-Host "Backup completed successfully: $backupPath"
