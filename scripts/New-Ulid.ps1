# scripts/New-Ulid.ps1
# Sinh Ma Dinh Danh Duy Nhat ULID Chuan 26 Ky Tu Viet Hoa (Crockford Base32)
# Chuan: Universally Unique Lexicographically Sortable Identifier
function Get-Ulid {
    $Crockford = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
    $ms = [long]([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
    $chars = New-Object char[] 26
    
    # 10 ky tu dau: Timestamp mili-giay (48 bits)
    for ($i = 9; $i -ge 0; $i--) {
        $chars[$i] = $Crockford[[int]($ms -band 31L)]
        $ms = $ms -shr 5
    }
    
    # 16 ky tu sau: Randomness an toan mat ma (80 bits)
    $bytes = New-Object byte[] 10
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    
    $bitBuffer = [System.Numerics.BigInteger]::Zero
    for ($i = 0; $i -lt 10; $i++) {
        $bitBuffer = ($bitBuffer -shl 8) + $bytes[$i]
    }
    
    for ($i = 25; $i -ge 10; $i--) {
        $val = [int]($bitBuffer -band 31)
        $chars[$i] = $Crockford[$val]
        $bitBuffer = $bitBuffer -shr 5
    }
    
    return -join $chars
}

Get-Ulid
