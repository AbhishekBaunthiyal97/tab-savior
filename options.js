// No need for HTML structure in this JavaScript file
    // No need for HTML structure in this JavaScript file

    const savedSessionsButton = document.createElement('button');
    savedSessionsButton.id = 'savedSessionsButton';
    savedSessionsButton.textContent = 'Saved Sessions';

    const saveBtn = document.createElement('button');
    saveBtn.id = 'saveBtn';
    saveBtn.className = 'save-btn';
    saveBtn.innerHTML = '<span class="material-icons-round">save</span> Save Current Tabs';

    const importBtn = document.createElement('button');
    importBtn.className = 'import-btn';
    importBtn.textContent = 'Import Sessions';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.textContent = 'Export Sessions';

    // Append buttons to a specific container instead of the document body
    const container = document.getElementById('buttonContainer'); // Assuming there's a container with this ID
    container.append(savedSessionsButton, saveBtn, importBtn, exportBtn);

document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get({
    enableSync: true,
    enableAutoSave: true,
    autoSaveInterval: 15
  }, (items) => {
        console.log(document.getElementById('enableSync')); // Check if this is null
        console.log(document.getElementById('enableAutoSave')); // Check if this is null
        console.log(document.getElementById('autoSaveInterval')); // Check if this is null

        if (document.getElementById('enableSync')) {
    document.getElementById('enableSync').checked = items.enableSync;
        }
        if (document.getElementById('enableAutoSave')) {
    document.getElementById('enableAutoSave').checked = items.enableAutoSave;
        }
        if (document.getElementById('autoSaveInterval')) {
    document.getElementById('autoSaveInterval').value = items.autoSaveInterval;
        }
  });

  // Save settings
  document.getElementById('saveOptions').addEventListener('click', () => {
    const enableSync = document.getElementById('enableSync').checked;
    const enableAutoSave = document.getElementById('enableAutoSave').checked;
    const autoSaveInterval = parseInt(document.getElementById('autoSaveInterval').value);

    chrome.storage.sync.set({
      enableSync,
      enableAutoSave,
      autoSaveInterval
        });
    });

    // Import/Export functionality
    function handleExportSession() {
        chrome.storage.sync.get(null, (sessions) => {
            if (chrome.runtime.lastError) {
                alert('Error exporting sessions');
                return;
            }

            const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sessions.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Sessions exported successfully!');
        });
    }

    function handleImportSession() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const sessions = JSON.parse(event.target.result);
                    chrome.storage.sync.set(sessions, () => {
        if (chrome.runtime.lastError) {
                            alert('Error importing sessions');
        } else {
                            alert('Sessions imported successfully!');
        }
      });
  } catch (error) {
                    alert('Invalid file format');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // Attach event listeners
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.import-btn')) {
            handleImportSession();
        }
        if (e.target.closest('.export-btn')) {
            handleExportSession();
        }
    });
}); 