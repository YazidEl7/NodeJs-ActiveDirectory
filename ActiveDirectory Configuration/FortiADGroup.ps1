#Creation of group and adding user
# Define the security group
$GroupName = "FortiAD2"
$Group = New-ADGroup -Name $GroupName -GroupCategory Security -GroupScope Global

# Add user "jdoe" to the security group
Add-ADGroupMember -Identity $GroupName -Members co1

