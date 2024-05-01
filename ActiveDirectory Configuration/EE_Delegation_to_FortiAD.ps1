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
$allPropertiesGUID = [GUID]"a8df73ef-c5ea-11d1-bbcb-0080c76670c0"

# Create the Active Directory Access Rule
$accessRule = New-Object System.DirectoryServices.ActiveDirectoryAccessRule($groupSID, $rights, $accessControlType, $allPropertiesGUID, $inheritanceFlags)

# Add ACL rule for the right "Read-write all properties/this object and all descendants"
$acl.AddAccessRule($accessRule)

# Apply ACL rules
Set-ACL "AD:\$OU_dn" $acl
