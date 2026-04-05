param(
    [Parameter(Mandatory = $true)]
    [string]$Query
)

if ([string]::IsNullOrWhiteSpace($Query)) {
    Write-Error "Query is required. Example: .\\scripts\\find-code.ps1 booking"
    exit 1
}

$targets = @(
    "hotelbooking-frontend/src",
    "src/main/java/com/example/hotelbooking",
    "src/test/java/com/example/hotelbooking"
)

rg -n --hidden --glob "!**/node_modules/**" --glob "!**/target/**" $Query $targets
