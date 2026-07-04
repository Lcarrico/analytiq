# AnalytIQ - Claude Code sequential prompt runner
# Runs prompts 5-15 one at a time. Each must complete before the next starts.
# Run from the repo root: .\run_prompts.ps1

Set-Location $PSScriptRoot

$prompts = @(
    "prompts\p05_postgres_migration.txt",
    "prompts\p06_credential_encryption.txt",
    "prompts\p07_rate_limiting.txt",
    "prompts\p08_email_notifications.txt",
    "prompts\p09_audit_logging.txt",
    "prompts\p10_stripe_billing.txt",
    "prompts\p11_docker_deployment.txt",
    "prompts\p12_artifact_scheduling.txt",
    "prompts\p13_export_download.txt",
    "prompts\p14_additional_connectors.txt",
    "prompts\p15_search_pagination.txt"
)

$total = $prompts.Count
$i = 0

foreach ($file in $prompts) {
    $i++
    $name = (Get-Item $file).BaseName
    Write-Host ""
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    Write-Host "  [$i/$total] $name" -ForegroundColor Cyan
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan

    $prompt = Get-Content $file -Raw -Encoding UTF8
    claude --dangerously-skip-permissions -p $prompt

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "X Prompt $i failed (exit code $LASTEXITCODE). Stopping." -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host ""
    Write-Host "OK $name complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "--------------------------------------------------" -ForegroundColor Green
Write-Host "  All $total prompts complete." -ForegroundColor Green
Write-Host "--------------------------------------------------" -ForegroundColor Green
