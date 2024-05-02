# NodeJs-ActiveDirectory
Outsourcing a specific ActiveDirectory task through a NodeJs WebApp

## Description
This project aims to leverage web technology as an alternative to traditional remote desktop sessions for executing specific tasks within the Active Directory environment. 
However, its flexibility extends beyond Active Directory tasks; it can be customized to handle various other operations, such as those related to DNS management and more.

## Features
- Granting minimal privileges necessary to accomplish a particular task using GUIDs "https://github.com/YazidEl7/PowerShellScripts/tree/main/SchemaGUIDs".
- Authentication using LDAP credentials.

## Getting Started

### Prerequisites

In my test lab, I used a Windows 10 x64 which needs the following : 
- The process for installing the Active Directory module to enable the execution of PowerShell scripts encountered errors initially, despite diligently following the instructions available online. Eventually, the issue was resolved after executing one of these PowerShell commands; [AD module](./miscellaneous).

A Windows Server 2019 which will require the following configuration :
- Creating a security group involves defining the group and then adding the desired users to grant them permissions. [security group](./ActiveDirectory Configuration/FortiADGroup.ps1).
- Delegation of user's "EmployeeNumber" modification to the created group [EE_Delegation](./ActiveDirectory Configuration/EE_Delegation_to_FortiAD.ps1).
- Delegating the membership of two specific groups involves assigning the membership management of those groups to the newly created security group. [Membership_Delegation](./ActiveDirectory Configuration/Membership_Delegation_to_FortiAD.ps1).
  
#### Note :
- You'll need to update the domain name in the files to match your own domain, as well as modify the names of groups or users to align with your specific environment.
- I haven't used HTTPs.
- Change the secret Key.
  
### Installation
Back to the windows 10 :
- To install Node.js, visit the official Node.js website (https://nodejs.org/) and download the appropriate installer for your operating system. Follow the installation instructions provided on the website.
Once Node.js is installed, you can proceed with the initial configuration, setting up environment variables, and installing dependencies.
- I used the following dependencies; "body-parser": "^1.20.2","express": "^4.19.2","express-session": "^1.18.0","ldapjs": "^3.0.7".

### Usage Example
- You use the credentials of one of the security group members to authenticate.
![comp-info](/assets/images/1-login.jpg)
- After a successful authentication, the table shown in the screenshot below will appear. This table is the result of running the Query.ps1 script, which retrieves the EmployeeNumber and group membership details for all users.
- For additional information on the query results and its underlying logic, please refer to [Query](./AD_WebApp/Psh)
![comp-info](/assets/images/2-home.jpg)
- To perform modification actions on a user or to locate a user, please utilize the SAMAccountName in the search box as depicted below. This unique identifier enables precise identification and management of user accounts within the system.
![comp-info](/assets/images/3-query.jpg)
When searching for a specific user, you have the option to execute actions such as adding or removing them from groups, in addition to providing their token for authentication.
![comp-info](/assets/images/4-addtogroup.jpg)

## License

This project is licensed under the GNU General Public License v2.0 - see the [LICENSE](./LICENSE) file for details.

## Contact
LinkedIn : [SpecOp7](https://www.linkedin.com/in/specop7)

Certainly! Enhancements and advancements can always be implemented in future versions to further improve functionality and user experience. Your willingness to innovate and enhance the system in future versions is commendable and can lead to even greater utility and satisfaction. If you have any specific ideas or features you'd like to incorporate in the next version, feel free to share them for consideration.
