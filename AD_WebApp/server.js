const express = require('express');
const bodyParser = require('body-parser');
const ldap = require('ldapjs');
const { exec } = require('child_process');
const path = require('path');
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require('express-validator');
const compression = require('compression');
const secretKey = process.env.SESSION_SECRET || 'your-secret-key';
const fs = require('fs');

const app = express();
const port = 3000;

app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiter to all requests
app.use(limiter);

// Middleware
// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Add session middleware to your Express app
const session = require('express-session');
app.use(session({
    // Secret to be replaced
    secret: secretKey,
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

            // Check if the user is a member of the specified group
            client.search(ldapConfig.baseDN, { filter: `(&(userPrincipalName=${username})(memberOf=CN=FortiAD2,OU=Utilisateurs,DC=dom,DC=local))`, scope: 'sub' }, (searchErr, searchRes) => {
                if (searchErr) {
                    callback(searchErr);
                    return;
                }

                let isMember = false;
                searchRes.on('searchEntry', (entry) => {
                    isMember = true;
                });
                searchRes.on('end', () => {
                    // Unbind and close LDAP client connection
                    client.unbind(() => {
                        if (isMember) {
                            callback(null, true); // Authentication successful
                        } else {
                            callback(new Error('User is not a member of the required group'));
                        }
                    });
                });
            });
        });
    } catch (error) {
        callback(error); // Handle client creation errors
    }
}
// R

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route for user login
app.post('/login', [
  // Validate email and password fields
  body('username').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 7 }).withMessage('Password must be at least 5 characters long')
], (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // Authenticate user
  authenticateUser(username, password, (err, isAuthenticated) => {
    if (err || !isAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Store credentials in the session
    req.session.username = username;
    req.session.password = password;
    // If authentication is successful, proceed to the search page
    res.redirect('/search.html');
  });
});


// Add check-authentication endpoint
app.get('/check-authentication', (req, res) => {
    if (req.session.username && req.session.password) {
        // User is authenticated
        res.status(200).json({ authenticated: true, username: req.session.username });
    } else {
        // User is not authenticated
        res.status(401).json({ authenticated: false });
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
app.post('/group-action', [
  // Validate input fields
  body('samAccountName').notEmpty().withMessage('SamAccountName is required'),
  body('group').notEmpty().withMessage('Group is required'),
  body('action').notEmpty().withMessage('Action is required')
], (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { samAccountName, group, action, token } = req.body;
  const { username, password } = req.session;

  // Authenticate user
  authenticateUser(username, password, (err, isAuthenticated) => {
    if (err || !isAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Execute PowerShell command with user's credentials
    const powershellCommand = getPowerShellCommand(username, password, samAccountName, group, action, token);
    exec(powershellCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (stderr) {
        console.error(stderr);
        return res.status(400).json({ error: 'Invalid request' });
      }

      const result = stdout.trim();

      return res.json({ message: 'Successful' });
	
    });
  });
});

// Function to construct PowerShell command with user's credentials
function getPowerShellCommand(username, password, samAccountName, group, action, token) {
let Cred = "(New-Object System.Management.Automation.PSCredential('"+username+"', (ConvertTo-SecureString '"+password+"' -AsPlainText -Force))) -Confirm:$false";
    let command = '';
    let logEntry='';
    // Construct PowerShell command based on action and group
    if (action === 'remove') {
        if (group === 'FortiTokenMobile') {
            command = "Remove-ADGroupMember -Identity FortiTokenMobile -Members "+samAccountName+" -Credential " + Cred;
            logEntry = `${new Date().toISOString()} - Username: ${username}, SamAccountName: ${samAccountName} , Action: Removed from FortiTokenMobile\n`;
	    }   else if (group === 'FortiTokenHard') {
            command = "Remove-ADGroupMember -Identity FortiTokenHard -Members "+samAccountName+" -Credential " + Cred+"; Set-ADUser -Identity "+samAccountName+" -EmployeeNumber 'Emptied'";
            logEntry = `${new Date().toISOString()} - Username: ${username}, SamAccountName: ${samAccountName} , Action: Removed from FortiTokenHard\n`;
        }
    } else if (action === 'add') {
        if (group === 'FortiTokenMobile') {
            command = "Add-ADGroupMember -Identity FortiTokenMobile -Members "+samAccountName+" -Credential " + Cred;
            logEntry = `${new Date().toISOString()} - Username: ${username}, SamAccountName: ${samAccountName} , Action: Added FortiTokenMobile\n`;
        } else if (group === 'FortiTokenHard') {
            if (!token) {
                throw new Error('Token is required for adding to FortiTokenHard group');
            }
            command = "Add-ADGroupMember -Identity FortiTokenHard -Members "+samAccountName+" -Credential " + Cred+"; Set-ADUser -Identity "+samAccountName+" -EmployeeNumber "+token;
            logEntry = `${new Date().toISOString()} - Username: ${username}, SamAccountName: ${samAccountName} , Action: Added to FortiTokenHard, Token: ${token}\n`;
        }
    }
    fs.appendFile('./logs/log.txt', logEntry, (err) => {
        if (err) {
            console.error('Error appending to log file:', err);
        }
    });

	 return `powershell.exe -ExecutionPolicy Bypass -Command `+command;

}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
