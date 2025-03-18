function saveTabGroup(name, tabUrls, tags = [], notes = '', callback) {
  const cookies = [];
  const session = {
    name,
    timestamp: Date.now(),
    tabs: tabUrls.map(url => ({ url })),
    tags,
    notes
  };

  // Process tabs in smaller batches to avoid overwhelming Chrome
  async function processTabs() {
    const BATCH_SIZE = 3;
    for (let i = 0; i < tabUrls.length; i += BATCH_SIZE) {
      const batch = tabUrls.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (url) => {
        if (url.startsWith("chrome://")) {
          return;
        }
        
        try {
          const domain = new URL(url).hostname;
          const tab = await createHiddenTab(url);
          const tabCookies = await getCookiesForTab(tab.id, domain);
          cookies.push(...tabCookies);
          await chrome.tabs.remove(tab.id);
        } catch (error) {
          console.error(`Error processing tab ${url}:`, error);
        }
      }));
    }

    const uniqueCookies = [...new Map(cookies.map(c => [c.name + c.domain, c])).values()];
    session.cookies = uniqueCookies;
    
    // Save to sync storage
    try {
      await chrome.storage.sync.set({ [name]: session });
      if (callback) callback();
    } catch (error) {
      // If sync fails, fall back to local storage
      await chrome.storage.local.set({ [name]: session });
      if (callback) callback();
    }
  }

  processTabs();
}

// Helper function to create a hidden tab
function createHiddenTab(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({
      url: 'about:blank',
      active: false,
      hidden: true // This will hide the tab from the user
    }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(tab);
        }
      });
    });
  });
}

// Helper function to get cookies for a tab
function getCookiesForTab(tabId, domain) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({tabId}, '1.3', async () => {
      try {
        const result = await chrome.debugger.sendCommand(
          {tabId}, 
          'Network.getAllCookies'
        );
        const relevantCookies = result.cookies.filter(cookie => 
          cookie.domain.includes(domain)
        );
        chrome.debugger.detach({tabId});
        resolve(relevantCookies);
      } catch (error) {
        chrome.debugger.detach({tabId});
        reject(error);
      }
    });
  });
}

function restoreTabGroup(name) {
  chrome.storage.sync.get(name, (data) => {
    const tabGroup = data[name];
    if (!tabGroup) {
            console.error('Tab group not found');
            return;
        }

        const { urls, cookies } = tabGroup;

        // Create a temporary tab to set cookies
        chrome.tabs.create({ url: 'about:blank' }, (tab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);

                    // Attach debugger to set cookies
                    chrome.debugger.attach({ tabId: tab.id }, '1.3', () => {
                        let completed = 0;

                        // Set cookies for each URL
                        cookies.forEach((cookie) => {
                            chrome.debugger.sendCommand({ tabId: tab.id }, 'Network.setCookie', cookie, () => {
                                completed++;
                                if (completed === cookies.length) {
                                    // Detach debugger and open the saved URLs
                                    chrome.debugger.detach({ tabId: tab.id });
                                    chrome.tabs.remove(tab.id); // Close the temporary tab
                                    
                                    // Open saved URLs in new tabs
                                    urls.forEach(url => {
                                        chrome.tabs.create({ url }); // Open each saved URL
                                    });
                                }
                            });
                        });
                    });
        }
      });
    });
  });
}

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('defaultGroup', (data) => {
    if (data.defaultGroup) restoreTabGroup(data.defaultGroup);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "save") {
    saveTabGroup(request.name, request.urls, request.tags, request.notes, () => {
      sendResponse({success: true});
    });
    return true;
  } else if (request.action === "restore") {
    restoreTabGroup(request.name);
    sendResponse({success: true});
  } else if (request.action === "restorePartial") {
    restoreTabGroupData(request.session);
    sendResponse({success: true});
  } else if (request.action === "smartGroup") {
    chrome.tabs.query({currentWindow: true}, (tabs) => {
      // Group all tabs together with the current timestamp
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const groupName = `TabGroup_${timestamp}`;
      const tabUrls = tabs.map(tab => tab.url);
      
      saveTabGroup(
        groupName,
        tabUrls,
        ['grouped'],
        `Group created at ${timestamp}`,
        () => sendResponse({success: true})
      );
    });
    return true;
  }
}); 