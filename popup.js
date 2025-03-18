document.addEventListener('DOMContentLoaded', () => {
  let isSaving = false;
  let activeFilters = new Set();
  let currentView = 'current'; // 'current' or 'saved'

  // Initialize notification system first
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.textContent = message;
    
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    document.body.appendChild(notification);
    
    // Add initial styles for animation
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
      notification.style.transition = 'all 0.3s ease';
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Navigation handling
  const currentGroupsBtn = document.getElementById('currentGroupsBtn');
  const savedSessionsBtn = document.getElementById('savedSessionsBtn');
  const currentGroupsPage = document.getElementById('currentGroupsPage');
  const savedSessionsPage = document.getElementById('savedSessionsPage');

  // Show Current Groups by default
  currentGroupsPage.classList.add('active');
  savedSessionsPage.classList.remove('active');

  // Handle navigation clicks
  currentGroupsBtn.addEventListener('click', () => {
    currentGroupsPage.classList.add('active');
    savedSessionsPage.classList.remove('active');
    currentGroupsBtn.classList.add('active');
    savedSessionsBtn.classList.remove('active');
  });

  savedSessionsBtn.addEventListener('click', () => {
    savedSessionsPage.classList.add('active');
    currentGroupsPage.classList.remove('active');
    savedSessionsBtn.classList.add('active');
    currentGroupsBtn.classList.remove('active');
    displaySavedSessions(); // Only load saved sessions when switching to that page
  });

  // Function to display saved sessions
  function displaySavedSessions() {
    const savedSessionsList = document.getElementById('savedSessionsList');
    savedSessionsList.innerHTML = ''; // Clear the list
    
    chrome.storage.sync.get(null, (items) => {
        // Filter out items that are not sessions (like settings)
        const sessions = Object.entries(items).filter(([key, value]) => 
            value && typeof value === 'object' && value.tabs && Array.isArray(value.tabs)
        );
        
        if (sessions.length === 0) {
            // Display a message when no sessions are saved
            savedSessionsList.innerHTML = `
                <div class="no-sessions-message">
                    <span class="material-icons-round">bookmark_border</span>
                    <p>No saved sessions yet</p>
                    <p class="no-sessions-hint">Save your current tabs to create a session</p>
                </div>
            `;
            return;
        }
        
        // Display each session
        sessions.forEach(([name, session]) => {
            displaySession(savedSessionsList, name, session);
    });
  });
  }

  // Search functionality - only for saved sessions page
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      if (savedSessionsPage.classList.contains('active')) {  // Only filter if on saved sessions page
        filterSessions(e.target.value);
      }
    });
  }

  function filterSessions(searchText, activeTags) {
    chrome.storage.sync.get(null, (data) => {
      const list = document.getElementById('tabGroupsList');
      list.innerHTML = '';
      
      for (const [name, session] of Object.entries(data)) {
        if (!session.tabs) continue;

        const matchesSearch = !searchText || 
          name.toLowerCase().includes(searchText.toLowerCase()) ||
          (session.notes && session.notes.toLowerCase().includes(searchText.toLowerCase()));

        const matchesTags = activeTags.size === 0 || 
          session.tags.some(tag => activeTags.has(tag));

        if (matchesSearch && matchesTags) {
          displaySession(list, name, session);
        }
      }
    });
  }

  function displaySession(list, name, session) {
    const li = document.createElement('li');
    li.className = 'session-item';
    
    // Format tags with pill/circle background, no icon
    const formattedTags = session.tags 
        ? session.tags.map(tag => `<span class="tag-pill">• ${tag}</span>`).join(' ') 
        : '';

    // Format time to "10:04 PM" style
    const date = new Date(session.dateTime); // Use the existing dateTime property
    const formattedTime = date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
    });

    li.innerHTML = `
        <div class="session-header">
            <span class="session-name">${name}</span>
            <button class="more-options-btn">
                <span class="material-icons-round">more_vert</span>
            </button>
            <div class="more-options-menu hidden">
                <button class="edit-btn">
                    <span class="material-icons-round">edit</span>
                    Edit
                </button>
                <button class="manage-websites-btn">
                    <span class="material-icons-round">web</span>
                    Manage Websites
                </button>
                <button class="export-session-btn">
                    <span class="material-icons-round">download</span>
                    Export
                </button>
            </div>
        </div>

        <!-- Edit Modal -->
        <div class="edit-modal hidden">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Session</h3>
                    <button class="close-modal-btn">
                        <span class="material-icons-round">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <span class="material-icons-round">title</span>
                        <input type="text" class="edit-name" value="${name}" placeholder="Enter session name">
                    </div>
                    
                    <div class="input-group">
                        <span class="material-icons-round">local_offer</span>
                        <input type="text" class="edit-tags" value="${session.tags || ''}" placeholder="Add tags (comma separated)">
                    </div>
                    
                    <div class="input-group">
                        <span class="material-icons-round">notes</span>
                        <textarea class="edit-notes" placeholder="Add notes (optional)">${session.notes || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="save-edit-btn">Save</button>
                    <button class="cancel-edit-btn">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Manage Websites Modal -->
        <div class="manage-websites-modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Manage Websites</h3>
                    <button class="close-modal-btn">
                        <span class="material-icons-round">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="websites-list-edit">
                        ${session.tabs.map((tab, index) => {
                            let displayUrl = tab;
                            try {
                                const url = new URL(tab);
                                displayUrl = url.hostname;
                                const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
                                return `
                                    <div class="website-item-edit">
                                        <img src="${faviconUrl}" class="website-favicon" alt="favicon">
                                        <span class="website-url">${displayUrl}</span>
                                        <button class="remove-website-btn" data-index="${index}">
                                            <span class="material-icons-round">delete</span>
                                        </button>
                                    </div>
                                `;
                            } catch (e) {
                                return `
                                    <div class="website-item-edit">
                                        <span class="material-icons-round website-favicon">link</span>
                                        <span class="website-url">${displayUrl}</span>
                                        <button class="remove-website-btn" data-index="${index}">
                                            <span class="material-icons-round">delete</span>
                                        </button>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                    <button class="add-websites-btn">
                        <span class="material-icons-round">add</span>
                        Add Websites
                    </button>
                </div>
                <div class="modal-footer">
                    <button class="save-websites-btn">Save Changes</button>
                    <button class="cancel-websites-btn">Cancel</button>
                </div>
            </div>
        </div>

        <div class="session-content">
            <div class="tag-row">
                ${formattedTags}
            </div>

            <div class="metadata-row">
                <div class="timestamp">
                    <span class="material-icons-round">schedule</span>
                    <span>${formattedTime}</span>
                </div>
                <div class="tab-count">
                    <span class="material-icons-round">folder</span>
                    <span>${session.tabs.length} tabs</span>
                </div>
            </div>

            <div class="notes-row">
                ${session.notes || ''}
            </div>

            <button class="show-websites-btn">
                <span class="material-icons-round">expand_more</span>
                Show Websites (${session.tabs.length})
            </button>

            <div class="websites-list hidden">
                ${session.tabs.map((tab, index) => {
                    try {
                        const url = new URL(tab);
                        const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
                        return `
                            <div class="website-item">
                                <img src="${faviconUrl}" class="website-favicon" alt="favicon">
                                <span class="website-url">${url.hostname}</span>
                            </div>
                        `;
                    } catch (e) {
                        // Handle invalid URLs gracefully
                        console.warn('Invalid URL in session:', tab);
                        return `
                            <div class="website-item">
                                <span class="material-icons-round website-favicon">link</span>
                                <span class="website-url">${tab}</span>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        </div>

        <div class="session-actions">
            <button class="btn btn-restore">Restore</button>
            <button class="btn btn-delete">Delete</button>
        </div>
    `;

    // Show Websites button functionality
    const showWebsitesBtn = li.querySelector('.show-websites-btn');
    const websitesList = li.querySelector('.websites-list');
    showWebsitesBtn.addEventListener('click', () => {
        websitesList.classList.toggle('hidden');
        const icon = showWebsitesBtn.querySelector('.material-icons-round');
        if (websitesList.classList.contains('hidden')) {
            icon.textContent = 'expand_more';
            showWebsitesBtn.innerHTML = `
                <span class="material-icons-round">expand_more</span>
                Show Websites (${session.tabs.length})
            `;
        } else {
            icon.textContent = 'expand_less';
            showWebsitesBtn.innerHTML = `
                <span class="material-icons-round">expand_less</span>
                Hide Websites (${session.tabs.length})
            `;
        }
    });

    // Three-dot menu functionality
    const moreOptionsBtn = li.querySelector('.more-options-btn');
    const moreOptionsMenu = li.querySelector('.more-options-menu');
    const editModal = li.querySelector('.edit-modal');
    
    moreOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreOptionsMenu.classList.toggle('hidden');
    });

    // Edit button functionality
    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
        editModal.classList.remove('hidden');
        moreOptionsMenu.classList.add('hidden');
    });

    // Cancel button functionality
    const cancelEditBtn = li.querySelector('.cancel-edit-btn');
    const closeModalBtn = li.querySelector('.close-modal-btn');
    
    [cancelEditBtn, closeModalBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
    });

    // Save changes functionality
    const saveEditBtn = li.querySelector('.save-edit-btn');
    saveEditBtn.addEventListener('click', () => {
        const newName = li.querySelector('.edit-name').value.trim();
        const newTags = li.querySelector('.edit-tags').value.trim();
        const newNotes = li.querySelector('.edit-notes').value.trim();

        if (!newName) {
            alert('Session name is required');
            return;
        }

        // Update storage with new values
        chrome.storage.sync.get(name, (data) => {
            const updatedSession = data[name];
            updatedSession.tags = newTags ? newTags.split(',').map(tag => tag.trim()) : [];
            updatedSession.notes = newNotes;

            // If name changed, remove old entry and add new one
        chrome.storage.sync.remove(name, () => {
                chrome.storage.sync.set({ [newName]: updatedSession }, () => {
                    editModal.classList.add('hidden');
                    // Refresh the display
                    displaySavedSessions();
                });
            });
        });
    });

    // Find the manage websites button and add click handler
    if (li.querySelector('.manage-websites-btn')) {
        const manageBtn = li.querySelector('.manage-websites-btn');
        manageBtn.addEventListener('click', () => {
            const manageWebsitesModal = li.querySelector('.manage-websites-modal');
            // Show the manage websites modal
            manageWebsitesModal.classList.remove('hidden');
            
            // Handle removing websites
            const removeButtons = manageWebsitesModal.querySelectorAll('.remove-website-btn');
            removeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    btn.closest('.website-item-edit').remove();
                });
            });
            
            // Handle adding websites
            const addWebsitesBtn = manageWebsitesModal.querySelector('.add-websites-btn');
            addWebsitesBtn.addEventListener('click', () => {
                // Show website selector dialog
                showWebsiteSelectorDialog(manageWebsitesModal, session);
            });
            
            // Handle saving changes
            const saveBtn = manageWebsitesModal.querySelector('.save-websites-btn');
            saveBtn.addEventListener('click', () => {
                // Get the remaining websites
                const updatedTabs = [];
                manageWebsitesModal.querySelectorAll('.website-item-edit').forEach(item => {
                    const index = parseInt(item.querySelector('.remove-website-btn').dataset.index);
                    updatedTabs.push(session.tabs[index]);
                });
                
                // Update the session with the new tabs
                session.tabs = updatedTabs;
                chrome.storage.sync.set({ [name]: session }, () => {
                    manageWebsitesModal.classList.add('hidden');
                    showNotification('Websites updated successfully', 'success');
                    // Refresh the session display
                    displaySavedSessions();
                });
            });
            
            // Handle cancel
            const cancelBtn = manageWebsitesModal.querySelector('.cancel-websites-btn');
            cancelBtn.addEventListener('click', () => {
                manageWebsitesModal.classList.add('hidden');
            });
            
            // Handle close button
            const closeBtn = manageWebsitesModal.querySelector('.close-modal-btn');
            closeBtn.addEventListener('click', () => {
                manageWebsitesModal.classList.add('hidden');
            });
        });
    }

    // Add event listeners for the Restore and Delete buttons
    const restoreBtn = li.querySelector('.btn-restore');
    const deleteBtn = li.querySelector('.btn-delete');
    
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            console.log('Restore button clicked for session:', name);
            // Get the URLs from the saved session
            const urls = session.tabs;
            
            // Get the current window ID
            chrome.windows.getCurrent((currentWindow) => {
                // First, create the first tab (to avoid empty window)
                if (urls.length > 0) {
                    chrome.tabs.create({
                        url: urls[0],
                        windowId: currentWindow.id
                    });
                    
                    // Then create the rest of the tabs
                    for (let i = 1; i < urls.length; i++) {
                        chrome.tabs.create({
                            url: urls[i],
                            windowId: currentWindow.id,
                            active: false // Only the first tab will be active
                        });
                    }
                    
                    showNotification('Session restored successfully', 'success');
                } else {
                    showNotification('No tabs to restore', 'error');
                }
            });
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            console.log('Delete button clicked for session:', name);
            // Confirm before deleting
            if (confirm(`Are you sure you want to delete the session "${name}"?`)) {
                chrome.storage.sync.remove(name, () => {
                    li.remove();
                    showNotification('Session deleted successfully', 'success');
                    // Refresh the display
                    displaySavedSessions();
                });
            }
        });
    }

    // Add export option to the more options menu
    const exportBtn = moreOptionsMenu.querySelector('.export-session-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportSession(name, session);
            moreOptionsMenu.classList.add('hidden'); // Hide the menu after clicking
        });
    }

    list.appendChild(li);
  }

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

  // Save functionality
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveCurrentTabs);
  } else {
    console.error('Save button not found');
  }

  // Function to display saved tab groups
  function displaySavedGroups() {
    chrome.storage.sync.get(null, (data) => {
      const sessionsList = document.querySelector('.sessions-list');
      const emptyState = document.getElementById('emptyState');
      
      if (!sessionsList || !emptyState) return;
      
      sessionsList.innerHTML = '';
      
      const sessions = Object.entries(data).filter(([key, value]) => value.urls);
      
      if (sessions.length === 0) {
        emptyState.classList.add('active');
        sessionsList.classList.remove('active');
      } else {
        emptyState.classList.remove('active');
        sessionsList.classList.add('active');
        
        sessions.forEach(([name, session]) => {
          const sessionCard = createSessionCard(name, session);
          sessionsList.appendChild(sessionCard);

          // Add event listeners for restore and delete buttons
          sessionCard.querySelector('.restore-btn').addEventListener('click', () => {
            restoreTabGroup(name); // Call the restore function
          });

          sessionCard.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTabGroup(name); // Ensure this function is defined
          });
        });
      }
    });
  }

  function createSessionCard(name, session) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
        <h3 class="session-title">${name}</h3>
        <p class="session-tags">Tags: ${session.tags.join(', ')}</p>
        <p class="session-notes">Notes: ${session.notes}</p>
        <p class="session-date">Date: ${session.dateTime}</p>
        <p class="session-total-tabs">Total Tabs: ${session.totalTabs}</p>
      <div class="session-actions">
            <button class="restore-btn" data-name="${name}">Restore</button>
            <button class="delete-btn" data-name="${name}">Delete</button>
      </div>
    `;
    return card;
  }

  // Updated restoreTabGroup function
  function restoreTabGroup(name) {
    chrome.storage.sync.get(name, (data) => {
      const tabGroup = data[name];
      if (!tabGroup) {
        console.error('Tab group not found');
        return;
      }

      const urls = tabGroup.urls;

      // Open saved URLs in new tabs directly
      urls.forEach(url => {
        chrome.tabs.create({ url });
      });
    });
  }

  function deleteTabGroup(name) {
    chrome.storage.sync.remove(name, () => {
      displaySavedGroups(); // Refresh the saved groups display
    });
  }

  // Split the edit dialog into two separate dialogs
  function showEditSessionDialog(name, session) {
    const dialog = document.createElement('div');
    dialog.className = 'edit-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <h3>Edit Session Details</h3>
            <div class="input-wrapper">
                <label for="editName">Name</label>
                <input type="text" id="editName" value="${name}">
            </div>
            <div class="input-wrapper">
                <label for="editTags">Tags (comma separated)</label>
                <input type="text" id="editTags" value="${(session.tags || []).join(', ')}">
            </div>
            <div class="input-wrapper">
                <label for="editNotes">Notes</label>
                <textarea id="editNotes">${session.notes || ''}</textarea>
            </div>
            <div class="dialog-actions">
                <button class="btn-secondary" id="cancelEdit" style="min-width: 80px;">Cancel</button>
                <button class="btn-primary" id="saveEdit" style="min-width: 120px;">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    document.getElementById('cancelEdit').onclick = () => {
        dialog.remove();
    };

    document.getElementById('saveEdit').onclick = async () => {
        const newName = document.getElementById('editName').value.trim();
        const newTags = document.getElementById('editTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        const newNotes = document.getElementById('editNotes').value.trim();

        if (!newName) {
            showNotification('Session name cannot be empty', 'error');
            return;
        }

        // Update session data
        const updatedSession = {
            ...session,
            tags: newTags,
            notes: newNotes
        };

        try {
            if (newName !== name) {
                await chrome.storage.sync.remove(name);
                await chrome.storage.sync.set({ [newName]: updatedSession });
            } else {
                await chrome.storage.sync.set({ [name]: updatedSession });
            }

            dialog.remove();
            displaySavedGroups();
            showNotification('Session updated successfully!', 'success');
        } catch (error) {
            showNotification('Failed to update session', 'error');
        }
    };
  }

  function showManageWebsitesDialog(name, session) {
    // Helper function to get website name from URL
    function getWebsiteName(url) {
        try {
            const urlObj = new URL(url);
            // Remove 'www.' if present and get the hostname
            return urlObj.hostname.replace(/^www\./, '');
        } catch (e) {
            return url; // Fallback to full URL if parsing fails
        }
    }

    const dialog = document.createElement('div');
    dialog.className = 'edit-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <h3>Manage Websites</h3>
            <div class="tabs-navigation">
                <button class="tab-btn active" data-tab="manage">Current Websites</button>
                <button class="tab-btn" data-tab="add">Add Websites</button>
            </div>

            <div id="manageWebsitesTab" class="tab-content active">
                <div class="tab-list">
                    ${session.tabs.map((tab, index) => `
                        <div class="tab-item">
                            <input type="checkbox" data-index="${index}">
                            <img src="${getFaviconUrl(tab.url)}" class="tab-favicon" 
                                 onerror="this.src='images/default-favicon.png';">
                            <span class="tab-title" title="${tab.url}">${getWebsiteName(tab.url)}</span>
                        </div>
                    `).join('')}
                </div>
                <button id="removeSelectedTabs" class="btn-danger">
                    <span class="material-icons-round">delete</span>
                    Remove Selected Websites
                </button>
            </div>

            <div id="addWebsitesTab" class="tab-content">
                <div class="tab-list">
                    Loading current tabs...
                </div>
                <button id="addSelectedTabs" class="btn-primary">
                    <span class="material-icons-round">add</span>
                    Add Selected Websites
                </button>
            </div>

            <div class="dialog-actions">
                <button class="btn-secondary" id="closeDialog">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Load current tabs with website names
    chrome.tabs.query({currentWindow: true}, (tabs) => {
        const tabsList = dialog.querySelector('#addWebsitesTab .tab-list');
        tabsList.innerHTML = tabs.map(tab => `
            <label class="tab-item">
                <input type="checkbox" data-url="${tab.url}">
                <img src="${tab.favIconUrl || getFaviconUrl(tab.url)}" class="tab-favicon" 
                     onerror="this.src='images/default-favicon.png';">
                <span class="tab-title" title="${tab.url}">${getWebsiteName(tab.url)}</span>
            </label>
        `).join('');
    });

    // Tab navigation
    const tabBtns = dialog.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding content
            const tabContents = dialog.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            const activeTabContent = dialog.querySelector(`#${btn.dataset.tab}WebsitesTab`);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
            } else {
                alert('The selected tab does not have corresponding content. Please try again.');
            }
        });
    });
  }

  // Add this function to handle saving tabs
  function saveCurrentTabs() {
    const groupName = document.getElementById('groupName').value.trim();
    const groupTags = document.getElementById('groupTags').value.trim();
    const groupNotes = document.getElementById('groupNotes').value.trim();

    // Check if session name is provided (mandatory)
    if (!groupName) {
        alert('Please enter a session name');
            return;
        }

    // Get all current tabs
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const tabUrls = tabs.map(tab => tab.url);
        
        // Create session object
        const session = {
            name: groupName,
            tags: groupTags ? groupTags.split(',').map(tag => tag.trim()) : [],
            notes: groupNotes,
            dateTime: new Date().toLocaleString(),
            tabs: tabUrls
        };

        // Save to chrome.storage.sync
        chrome.storage.sync.set({ [groupName]: session }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving tabs:', chrome.runtime.lastError);
                alert('Failed to save tabs. Please try again.');
      } else {
                // Clear input fields
                document.getElementById('groupName').value = '';
                document.getElementById('groupTags').value = '';
                document.getElementById('groupNotes').value = '';

                // Switch to Saved Sessions page
                const savedSessionsBtn = document.getElementById('savedSessionsBtn');
                const savedSessionsPage = document.getElementById('savedSessionsPage');
                const currentGroupsBtn = document.getElementById('currentGroupsBtn');
                const currentGroupsPage = document.getElementById('currentGroupsPage');

                // Update active states
                savedSessionsBtn.classList.add('active');
                currentGroupsBtn.classList.remove('active');
                savedSessionsPage.classList.add('active');
                currentGroupsPage.classList.remove('active');

                // Refresh the saved sessions list
                displaySavedSessions();

                // Show success message
                alert('Tabs saved successfully!');
            }
      });
    });
  }

  // Attach event listeners for import/export buttons
  document.getElementById('importButton').addEventListener('click', importSession);
  document.getElementById('exportButton').addEventListener('click', function() {
    // Get all saved sessions
    chrome.storage.sync.get(null, (items) => {
        // Filter out items that are not sessions
        const sessions = Object.entries(items).filter(([key, value]) => 
            value && typeof value === 'object' && value.tabs && Array.isArray(value.tabs)
        );
        
        if (sessions.length === 0) {
            showNotification('No saved sessions to export', 'error');
            return;
        }
        
        // If there's only one session, export it directly
        if (sessions.length === 1) {
            const [name, session] = sessions[0];
            exportSession(name, session);
            return;
        }
        
        // Create a dialog to select which session to export
        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>Export Session</h3>
                </div>
                <div class="dialog-body">
                    <p>Select a session to export:</p>
                    <div class="sessions-list">
                        ${sessions.map(([name, session]) => `
                            <div class="session-export-item" data-name="${name}">
                                <span>${name}</span>
                                <span class="material-icons-round">download</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="cancel-dialog-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add click handlers for session items
        dialog.querySelectorAll('.session-export-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const session = items[name];
                exportSession(name, session);
                dialog.remove();
            });
        });
        
        // Add cancel button handler
        dialog.querySelector('.cancel-dialog-btn').addEventListener('click', () => {
            dialog.remove();
        });
    });
});

  function importSession() {
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
                        
                        // Replace switchPage with direct navigation code
                        savedSessionsPage.classList.add('active');
                        currentGroupsPage.classList.remove('active');
                        savedSessionsBtn.classList.add('active');
                        currentGroupsBtn.classList.remove('active');
                        displaySavedSessions(); // Refresh the saved sessions display
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

  function exportSession(name, session) {
    console.log(`Exporting session: ${name}`); // Debug log
    
    // Create a JSON blob with just this session
    const sessionData = {};
    sessionData[name] = session;
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    
    // Create a download link and trigger it
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${name}.json`; // Use the session name for the file
    
    // Append to the body, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);
    
    // Show success notification
    showNotification(`Session "${name}" exported successfully`, 'success');
  }

  document.querySelectorAll('.show-websites-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const websiteList = e.target.previousElementSibling;
        websiteList.classList.toggle('hidden');
        
        // Update button icon and text
        const icon = button.querySelector('.material-icons-round');
        if (websiteList.classList.contains('hidden')) {
            icon.textContent = 'expand_more';
            button.innerHTML = `
                <span class="material-icons-round">expand_more</span>
                Show Websites (6)
            `;
              } else {
            icon.textContent = 'expand_less';
            button.innerHTML = `
                <span class="material-icons-round">expand_less</span>
                Hide Websites (6)
            `;
            }
          });
        });
        
  // Add click handler for menu button
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const sessionCard = e.target.closest('.session-card');
        const menu = document.createElement('div');
        menu.className = 'session-menu';
        menu.innerHTML = `
            <button class="menu-item">
                <span class="material-icons-round">edit</span>
                Edit Session
            </button>
            <button class="menu-item">
                <span class="material-icons-round">content_copy</span>
                Duplicate
            </button>
        `;
        
        // Position the menu
        const rect = btn.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
        
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    });
  });

  // Function to show website selector dialog
  function showWebsiteSelectorDialog(modal, session) {
    const dialog = document.createElement('div');
    dialog.className = 'website-selector-dialog';
    dialog.innerHTML = `
        <div class="dialog-overlay"></div>
        <div class="dialog-content">
            <div class="dialog-header">
                <h3>Add Websites</h3>
        </div>
            <div class="dialog-body">
                <div class="tabs-list"></div>
            </div>
            <div class="dialog-footer">
                <button class="add-selected-btn">Add Selected</button>
                <button class="cancel-dialog-btn">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Get current tabs
    chrome.tabs.query({currentWindow: true}, (tabs) => {
        const tabsList = dialog.querySelector('.tabs-list');
        
        // Filter out tabs that are already in the session
        const existingUrls = session.tabs.map(url => {
            try {
                return new URL(url).hostname;
                } catch (e) {
                return url;
            }
        });
        
        // Filter tabs to only show new ones
        const newTabs = tabs.filter(tab => {
            try {
                const hostname = new URL(tab.url).hostname;
                return !existingUrls.includes(hostname);
            } catch (e) {
                return !existingUrls.includes(tab.url);
            }
        });
        
        if (newTabs.length === 0) {
            tabsList.innerHTML = `<div class="no-tabs-message">All open websites are already in this session.</div>`;
            return;
        }
        
        tabsList.innerHTML = newTabs.map(tab => {
            // Use a simple check to see if favicon exists
            const faviconUrl = tab.favIconUrl && tab.favIconUrl.startsWith('http') 
                ? tab.favIconUrl 
                : 'images/default-icon.png';
                
            return `
                <div class="tab-item">
                    <label class="tab-checkbox-container">
                        <input type="checkbox" class="tab-checkbox" data-url="${tab.url}">
                        <span class="checkmark"></span>
                    </label>
                    <img src="${faviconUrl}" class="tab-favicon" alt="favicon">
                    <span class="tab-title">${tab.title}</span>
                </div>
            `;
        }).join('');
        
        // Handle favicon loading errors
        const favicons = tabsList.querySelectorAll('.tab-favicon');
        favicons.forEach(img => {
            img.addEventListener('error', function() {
                this.src = 'images/default-icon.png';
            });
          });
        });
        
    // Handle add selected
    const addSelectedBtn = dialog.querySelector('.add-selected-btn');
    addSelectedBtn.addEventListener('click', () => {
        const selectedUrls = [];
        dialog.querySelectorAll('.tab-checkbox:checked').forEach(checkbox => {
            selectedUrls.push(checkbox.dataset.url);
        });
        
        if (selectedUrls.length === 0) {
            // Show a message if no websites are selected
            alert('Please select at least one website to add.');
            return;
        }
        
        // Add selected tabs to the manage websites modal
        const websitesList = modal.querySelector('.websites-list-edit');
        selectedUrls.forEach(url => {
            try {
                const urlObj = new URL(url);
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
                const index = session.tabs.length;
                session.tabs.push(url);
                
                const websiteItem = document.createElement('div');
                websiteItem.className = 'website-item-edit';
                websiteItem.innerHTML = `
                    <img src="${faviconUrl}" class="website-favicon" alt="favicon">
                    <span class="website-url">${urlObj.hostname}</span>
                    <button class="remove-website-btn" data-index="${index}">
                        <span class="material-icons-round">delete</span>
                    </button>
                `;
                
                websitesList.appendChild(websiteItem);
                
                // Add event listener to new remove button
                const removeBtn = websiteItem.querySelector('.remove-website-btn');
                removeBtn.addEventListener('click', () => {
                    websiteItem.remove();
                });
            } catch (e) {
                console.error('Error adding website:', e);
            }
        });
        
        // Close the dialog
        dialog.remove();
    });
    
    // Handle cancel
    const cancelBtn = dialog.querySelector('.cancel-dialog-btn');
    cancelBtn.addEventListener('click', () => {
        dialog.remove();
    });
  }
}); 