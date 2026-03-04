$lines = Get-Content "types.rs"
$keep = [System.Collections.Generic.List[string]]::new()
$skip = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $lineNum = $i + 1
    # Start skipping at line 5925 (start of duplicate block)
    if ($lineNum -eq 5925) { $skip = $true }
    # Stop skipping when we reach the TransferBlocked struct (first non-duplicate after duplicates)
    if ($skip -and $lines[$i] -match '/// Custom struct: TransferBlocked') { $skip = $false }
    if (-not $skip) { $keep.Add($lines[$i]) }
}

$keep | Set-Content "types.rs"
Write-Host "Done. Lines remaining: $($keep.Count)"
