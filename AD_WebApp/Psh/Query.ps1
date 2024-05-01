# Get users who are members of FortitokenHard or Fortitokenmobile groups within the specified search base
$users = Get-ADUser -Filter * -SearchBase "OU=Utilisateurs,DC=dom,DC=local" -Properties MemberOf, EmployeeNumber | 
    Where-Object {
        $_.MemberOf -match "CN=FortitokenHard" -or $_.MemberOf -match "CN=Fortitokenmobile"
    }

# Create an array to store user information
$userInfo = @()

# Iterate through each user
foreach ($user in $users) {
    $memberOf = $null

    # Determine which group the user belongs to
    if ($user.MemberOf -match "CN=FortitokenHard") {
        $memberOf = "FortitokenHard"
    } elseif ($user.MemberOf -match "CN=Fortitokenmobile") {
        $memberOf = "Fortitokenmobile"
    }

    # Add user information to the array
    $userInfo += [PSCustomObject]@{
        UserName = $user.SamAccountName
        EmployeeNumber = $user.EmployeeNumber
        Group = $memberOf
    }
}

# Output result as JSON
Write-Output ($userInfo | ConvertTo-Json)
