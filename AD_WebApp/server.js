const express = require('express');
const bodyParser = require('body-parser');
const ldap = require('ldapjs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Add session middleware to your Express app
const session = require('express-session');
app.use(session({
    // Secret to be replaced
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// LDAP Configuration
const ldapConfig = {
    url: 'ldap://DC-01.dom.local',
    baseDN: 'OU=Utilisateurs,DC=dom,DC=local',
};

// LDAP Authentication
function authenticateUser(username, password, callback) {
    // Check if username is a string
    if (typeof username !== 'string') {
        callback(new Error('Username must be a string'));
        return;
    }

    try {
        // Create LDAP client
        const client = ldap.createClient({ url: ldapConfig.url });

        // Bind to LDAP server with user credentials
        client.bind(username, password, (err) => {
            if (err) {
                // Handle specific error cases
                if (err instanceof ldap.InvalidCredentialsError) {
                    callback(new Error('Invalid username or password'));
                } else {
                    callback(err); // Pass other errors through
                }
                return;
            }
            // Unbind and close LDAP client connection
            client.unbind(() => {
                callback(null, true); // Authentication successful
            });
        });
    } catch (error) {
        callback(error); // Handle client creation errors
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route for user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Authenticate user
    authenticateUser(username, password, (err, isAuthenticated) => {
        if (err || !isAuthenticated) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Store credentials in the session
        req.session.username = username;
        req.session.password = password;
        // If authentication is successful, proceed to the search page
        //res.sendStatus(200);
        res.redirect('/search.html')
    });
});

// Add check-authentication endpoint
app.get('/check-authentication', (req, res) => {
    if (req.session.username && req.session.password) {
        // User is authenticated
        res.sendStatus(200);
    } else {
        // User is not authenticated
        res.redirect('/');

    }
});

// Add logout endpoint
app.get('/logout', (req, res) => {
    // Clear session credentials
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.sendStatus(500);
            return;
        }
        // Redirect to login page after logout
        res.redirect('/');
    });
});
// query
app.post('/query', (req, res) => {
    const { username, password } = req.session;

            // Execute PowerShell search command with user's credentials
   		 const command = `powershell.exe -ExecutionPolicy Bypass -File ./Psh/Query.ps1 -Credential (New-Object System.Management.Automation.PSCredential("${username}", (ConvertTo-SecureString "${password}" -AsPlainText -Force)))`;
    		exec(command, (error, stdout, stderr) => {
        	if (error) {
            	console.error(error);
            	res.status(500).json({ error: 'Internal server error' });
            	return;
        	}

        	if (stderr) {
            		console.error(stderr);
            		res.status(400).json({ error: 'Invalid request' });
            		return;
        	}

        	const result = JSON.parse(stdout.trim());
        	res.json(result);

    		});

});

// Route for executing PowerShell search command
app.post('/search', (req, res) => {
    const { samAccountName } = req.body;
    const { username, password } = req.session;
        // Check if user is authenticated
    if (!req.session.username || !req.session.password) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    // Log the received credentials (for debugging purposes)
    //console.log('Received credentials:');
    //console.log('Username:', req.session.username);
    //console.log('Password:', req.session.password);
    //console.log('samaccountname:', samAccountName);

            // Execute PowerShell search command with user's credentials
   		 const command = `powershell.exe -ExecutionPolicy Bypass -File ./Psh/search.ps1 -SamAccountName "${samAccountName}" -Credential (New-Object System.Management.Automation.PSCredential("${username}", (ConvertTo-SecureString "${password}" -AsPlainText -Force)))`;
    		exec(command, (error, stdout, stderr) => {
        	if (error) {
            	console.error(error);
            	res.status(500).json({ error: 'Internal server error' });
            	return;
        	}

        	if (stderr) {
            		console.error(stderr);
            		res.status(400).json({ error: 'Invalid request' });
            		return;
        	}

        	const result = JSON.parse(stdout.trim());
        	res.json(result);

    		});
    
});


// Route for executing PowerShell commands
app.post('/group-action', (req, res) => {
    const { samAccountName, group, action, token } = req.body;
    const { username, password } = req.session;
        // Check if user is authenticated
    if (!req.session.username || !req.session.password) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // Authenticate user
    authenticateUser(username, password, (err, isAuthenticated) => {
        if (err || !isAuthenticated) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Execute PowerShell command with user's credentials
        const powershellCommand = getPowerShellCommand(username, password, samAccountName, group, action, token);
        //console.log('psd : ',powershellCommand);
        exec(powershellCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal server error' });
			console.log(error);
                return;
            }

            if (stderr) {
                console.error(stderr);
                res.status(400).json({ error: 'Invalid request' });
                return;
            }

            const result = stdout.trim();
            res.json({ message: result });
        });
    });
});

// Function to construct PowerShell command with user's credentials
function getPowerShellCommand(username, password, samAccountName, group, action, token) {
let Cred = "(New-Object System.Management.Automation.PSCredential('"+username+"', (ConvertTo-SecureString '"+password+"' -AsPlainText -Force))) -Confirm:$false";
    let command = '';
    // Construct PowerShell command based on action and group
    if (action === 'remove') {
        if (group === 'FortiTokenMobile') {
            command = "Remove-ADGroupMember -Identity FortiTokenMobile -Members "+samAccountName+" -Credential " + Cred;
	} else if (group === 'FortiTokenHard') {
            command = "Remove-ADGroupMember -Identity FortiTokenHard -Members "+samAccountName+" -Credential " + Cred+"; Set-ADUser -Identity "+samAccountName+" -EmployeeNumber 'Emptied'";
        }
    } else if (action === 'add') {
        if (group === 'FortiTokenMobile') {
            command = "Add-ADGroupMember -Identity FortiTokenMobile -Members "+samAccountName+" -Credential " + Cred;
        } else if (group === 'FortiTokenHard') {
            if (!token) {
                throw new Error('Token is required for adding to FortiTokenHard group');
            }
            command = "Add-ADGroupMember -Identity FortiTokenHard -Members "+samAccountName+" -Credential " + Cred+"; Set-ADUser -Identity "+samAccountName+" -EmployeeNumber "+token;
        }
    }
	 return `powershell.exe -ExecutionPolicy Bypass -Command `+command;

}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
