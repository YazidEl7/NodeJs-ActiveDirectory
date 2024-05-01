// Function to check if user is authenticated
        async function checkAuthentication() {
            try {
                const response = await fetch('/check-authentication');

                if (response.redirected) {
                    // Redirect to login page if not authenticated
                    window.location.href = response.url;
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
                // Logout function
        async function logout() {
            try {
                const response = await fetch('/logout');
                if (response.redirected) {
                    // Redirect to login page after logout
                    window.location.href = response.url;
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
        // Check authentication status when page loads
        checkAuthentication();
        // Add event listener for logout button
        document.getElementById('logoutButton').addEventListener('click', logout);
        // Query
                function displayQueryResults(data) {
                    const resultDiv = document.getElementById('resultQ');
                    resultDiv.innerHTML = `
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Token</th>
                                    <th>Group</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(user => `
                                    <tr>
                                        <td>${user.UserName}</td>
                                        <td>${user.EmployeeNumber}</td>
                                        <td>${user.Group}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                }

        fetch('/query', { method: 'POST' })
            .then(response => response.json())
            .then(data => displayQueryResults(data))
            .catch(error => console.error('Error:', error));
        // Function to display search result in a table
        function displaySearchResult(data) {
            const resultContainer = document.getElementById('resultContainer');
            const tableHTML = `
                <h2>Search Result:</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Matricule</th>
                            <th>Groups</th>
                            <th>Token</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${data.Email}</td>
                            <td>${data.Matricule}</td>
                            <td>${data.MemberOf.join(', ')}</td>
                            <td>${data.Token}</td>
                        </tr>
                    </tbody>
                </table>
            `;
            resultContainer.innerHTML = tableHTML;
        }
        document.getElementById('searchForm').addEventListener('submit', async function(event) {
            event.preventDefault();
            const samAccountName = document.getElementById('samAccountName').value;
            try {
                const response = await fetch('/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ samAccountName })
                });
                const data = await response.json();

                displaySearchResult(data);

                // Display search result
                document.getElementById('resultContainer2').innerHTML = `
                    <h2>Action to do:</h2>

                    <form id="groupActionForm">
                        <label for="group">Select group:</label>
                        <select id="group" name="group">
                            <option value="none" selected>None</option>
                            <option value="FortiTokenMobile">FortiTokenMobile</option>
                            <option value="FortiTokenHard">FortiTokenHard</option>
                        </select>
                        <label for="action">Select action:</label>
                        <select id="action" name="action">
                            <option value="none" selected>None</option>
                            <option value="add">Add to group</option>
                            <option value="remove">Remove from group</option>
                        </select>
                        <div id="tokenInput" style="display:none;">
                            <label for="token">Enter Token:</label>
                            <input type="text" id="token" name="token">
                        </div>
                        <button type="submit">Execute Action</button>
                    </form>
                `;
                document.getElementById('action').addEventListener('change', function() {
                    const group = document.getElementById('group').value;
                    const action = this.value;
                    const tokenInput = document.getElementById('tokenInput');

                    if (group === 'FortiTokenHard' && action === 'add') {
                        tokenInput.style.display = 'block';
                    } else {
                        tokenInput.style.display = 'none';
                    }
                });
                document.getElementById('groupActionForm').addEventListener('submit', async function(event) {
                    event.preventDefault();
                    const formData = new FormData(document.getElementById('groupActionForm'));
                    const group = formData.get('group');
                    const action = formData.get('action');
                    const token = formData.get('token');
                    try {
                        const response = await fetch('/group-action', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ samAccountName: samAccountName, group, action, token })
                        });
                        const result = await response.json();

                        // Display action result
                        document.getElementById('resultContainer').innerHTML += `
                            <h2>Action Result:</h2>
                            <pre>${JSON.stringify(result, null, 2)}</pre>
                        `;
                    } catch (error) {
                        console.error('Error:', error);
                    }
                });
            } catch (error) {
                console.error('Error:', error);
            }
        });