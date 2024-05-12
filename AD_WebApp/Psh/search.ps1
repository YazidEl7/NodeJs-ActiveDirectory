# search.ps1
param([string]$samAccountName)



    $user = Get-ADUser -Identity $samAccountName -Properties EmployeeNumber, MemberOf, UserPrincipalName


$o = @()
$user.MemberOf | ForEach-Object {$o += (Get-ADGroup -Identity $_).name}

# Format result as JSON
$result = @{
    Matricule = $user.SamAccountName
    Token = $user.EmployeeNumber
    MemberOf = $o
    Email = $user.UserPrincipalName
}

# Output result as JSON
Write-Output ($result | ConvertTo-Json)