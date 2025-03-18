import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));

// Assuming you have an array of saved sessions
const savedSessions = [
    { name: "Website Name", icon: "path/to/icon.png" },
    // ... other sessions ...
];

// Function to render saved sessions
function renderSavedSessions() {
    const container = document.getElementById('saved-sessions-container');
    savedSessions.forEach(session => {
        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'saved-session';
        
        const icon = document.createElement('img');
        icon.src = session.icon; // Set the icon URL
        icon.alt = "Website Icon";
        icon.className = 'website-icon';
        
        const name = document.createElement('span');
        name.className = 'website-name';
        name.textContent = session.name; // Set the website name
        
        sessionDiv.appendChild(icon);
        sessionDiv.appendChild(name);
        container.appendChild(sessionDiv);
    });
} 