# 1st part #
#Permission will be set in the following OU DistinguishedName
$OU_dn = "OU=Utilisateurs,DC=dom,DC=local"

#Group DistinguishedNames used for ACL permissions
$group_readwrite = "CN=FortiAD2,OU=Utilisateurs,DC=dom,DC=local"

# Get OU ACL
$acl = Get-ACL "AD:\$OU_dn"

# Get the Group SIDs
$groupSID = (Get-ADGroup -Server "dom.local" $group_readwrite).SID

# Create the Active Directory rights for Read and Write properties
$rights = [System.DirectoryServices.ActiveDirectoryRights]::ReadProperty -bor [System.DirectoryServices.ActiveDirectoryRights]::WriteProperty

# Create the Inheritance flags for ThisObject and Descendents
$inheritanceFlags = [System.DirectoryServices.ActiveDirectorySecurityInheritance]::ThisObject -bor [System.DirectoryServices.ActiveDirectorySecurityInheritance]::Descendents

# Create the Access Control Type
$accessControlType = [System.Security.AccessControl.AccessControlType]::Allow

# Create the GUID for All Properties
$allPropertiesGUID = [GUID]"bf967991-0de6-11d0-a285-00aa003049e2"

# Create the Active Directory Access Rule
$accessRule = New-Object System.DirectoryServices.ActiveDirectoryAccessRule($groupSID, $rights, $accessControlType, $allPropertiesGUID, $inheritanceFlags)

# Add ACL rule for the right "Read-write all properties/this object and all descendants"
$acl.AddAccessRule($accessRule)

# Apply ACL rules
Set-ACL "AD:\$OU_dn" $acl

# End of 1st part #
# It turned out that it just gave me the read permissions on user's "memberof" attribute
# So the following 2nd part is fixing that by giving me permission on Add-ADGroupMember

# Define the groups and the group to grant permission
$groupName = "CN=FortiTokenHard,OU=Utilisateurs,DC=dom,DC=local"
$groupName2 = "CN=FortiTokenMobile,OU=Utilisateurs,DC=dom,DC=local"
$groupToGrantPermission = "CN=FortiAD2,OU=Utilisateurs,DC=dom,DC=local"

# Get the security identifiers (SIDs) of the groups
$groupSID = (Get-ADGroup -Identity $groupToGrantPermission).SID

# Grant permission to add members to the groups
foreach ($group in $groupName, $groupName2) {
    if ($group -ne $null) {
        $acl = Get-Acl "AD:\$group"
        $permission = New-Object System.DirectoryServices.ActiveDirectoryAccessRule($groupSID, [System.DirectoryServices.ActiveDirectoryRights]::WriteProperty, "Allow")
        $acl.AddAccessRule($permission)
        Set-Acl "AD:\$group" $acl
    } else {
        Write-Host "Group $group does not exist."
    }
}
