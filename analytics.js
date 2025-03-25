import { config } from './config.js';

// Google Analytics Configuration
const GA_MEASUREMENT_ID = config.GA_MEASUREMENT_ID;
const MEASUREMENT_PROTOCOL_URL = 'https://www.google-analytics.com/mp/collect';
const API_SECRET = config.GA_API_SECRET;

// Debug mode for development
const DEBUG_MODE = config.DEBUG_MODE;

// Get browser information
function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browserName = "Unknown";
    let browserVersion = "Unknown";
    
    if (userAgent.indexOf("Chrome") > -1) {
        browserName = "Chrome";
        browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (userAgent.indexOf("Edg") > -1) {
        browserName = "Edge";
        browserVersion = userAgent.match(/Edg\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
        browserName = "Opera";
        browserVersion = userAgent.match(/(?:Opera|OPR)\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (userAgent.indexOf("Firefox") > -1) {
        browserName = "Firefox";
        browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || "Unknown";
    }
    
    return { browserName, browserVersion };
}

// Get system information
function getSystemInfo() {
    const platform = navigator.platform;
    const language = navigator.language;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    return { platform, language, screenResolution };
}

// Generate a unique client ID
function getClientId() {
    let clientId = localStorage.getItem('ga_client_id');
    if (!clientId) {
        clientId = crypto.randomUUID();
        localStorage.setItem('ga_client_id', clientId);
    }
    return clientId;
}

// Send event to Google Analytics
async function sendEvent(name, params = {}) {
    try {
        const clientId = getClientId();
        const browserInfo = getBrowserInfo();
        const systemInfo = getSystemInfo();
        const sessionId = localStorage.getItem('ga_session_id');
        const installDate = localStorage.getItem('install_date') || new Date().toISOString();
        
        if (!localStorage.getItem('install_date')) {
            localStorage.setItem('install_date', installDate);
        }

        const event = {
            client_id: clientId,
            non_personalized_ads: true,
            events: [{
                name,
                params: {
                    ...params,
                    // User metrics
                    engagement_time_msec: 100,
                    session_id: sessionId,
                    days_since_install: Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24)),
                    
                    // System information
                    browser_name: browserInfo.browserName,
                    browser_version: browserInfo.browserVersion,
                    platform: systemInfo.platform,
                    language: systemInfo.language,
                    screen_resolution: systemInfo.screenResolution,
                    
                    // Extension information
                    extension_version: chrome.runtime.getManifest().version,
                    extension_id: chrome.runtime.id,
                    
                    // Session information
                    session_start_time: localStorage.getItem('session_start_time'),
                    total_sessions: parseInt(localStorage.getItem('total_sessions') || '0'),
                    
                    // Feature usage counts
                    total_tabs_saved: parseInt(localStorage.getItem('total_tabs_saved') || '0'),
                    total_sessions_restored: parseInt(localStorage.getItem('total_sessions_restored') || '0')
                }
            }]
        };

        if (DEBUG_MODE) {
            console.log('Sending event:', {
                name,
                params: event.events[0].params
            });
        }

        const response = await fetch(
            `${MEASUREMENT_PROTOCOL_URL}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${API_SECRET}`,
            {
                method: 'POST',
                body: JSON.stringify(event)
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (DEBUG_MODE) {
            console.log(`Event ${name} sent successfully`);
        }
    } catch (error) {
        console.error('Failed to send event:', error);
        const failedEvents = JSON.parse(localStorage.getItem('failed_events') || '[]');
        failedEvents.push({ name, params, timestamp: Date.now() });
        localStorage.setItem('failed_events', JSON.stringify(failedEvents));
    }
}

// Initialize analytics session
function initSession() {
    const sessionId = crypto.randomUUID();
    const totalSessions = parseInt(localStorage.getItem('total_sessions') || '0') + 1;
    
    localStorage.setItem('ga_session_id', sessionId);
    localStorage.setItem('session_start_time', new Date().toISOString());
    localStorage.setItem('total_sessions', totalSessions.toString());
    
    return sessionId;
}

// Analytics object
const Analytics = {
    // Initialize analytics
    init() {
        initSession();
        // Try to send any failed events
        this.retryFailedEvents();
    },

    // Track when extension is opened
    async trackOpen() {
        await sendEvent('extension_open', {
            event_category: 'engagement',
            event_label: 'popup_open',
            session_count: parseInt(localStorage.getItem('total_sessions') || '0')
        });
    },

    // Track when sessions are saved
    async trackSessionSave(tabCount) {
        const totalTabsSaved = parseInt(localStorage.getItem('total_tabs_saved') || '0') + tabCount;
        localStorage.setItem('total_tabs_saved', totalTabsSaved.toString());
        
        await sendEvent('save_session', {
            event_category: 'feature_usage',
            event_label: 'save_tabs',
            tab_count: tabCount,
            total_tabs_saved: totalTabsSaved
        });
    },

    // Track when sessions are restored
    async trackSessionRestore(tabCount) {
        const totalRestored = parseInt(localStorage.getItem('total_sessions_restored') || '0') + 1;
        localStorage.setItem('total_sessions_restored', totalRestored.toString());
        
        await sendEvent('restore_session', {
            event_category: 'feature_usage',
            event_label: 'restore_tabs',
            tab_count: tabCount,
            total_sessions_restored: totalRestored
        });
    },

    // Track session management actions
    async trackSessionAction(action, details = {}) {
        await sendEvent('session_action', {
            event_category: 'feature_usage',
            event_label: action,
            ...details
        });
    },

    // Track feature usage duration
    async trackUsageDuration(duration) {
        await sendEvent('usage_duration', {
            event_category: 'engagement',
            event_label: 'time_spent',
            duration_seconds: Math.round(duration)
        });
    },

    // Track any errors that occur
    async trackError(errorType, errorMessage) {
        await sendEvent('error', {
            event_category: 'error',
            event_label: errorType,
            error_message: errorMessage
        });
    },

    // Retry failed events
    async retryFailedEvents() {
        const failedEvents = JSON.parse(localStorage.getItem('failed_events') || '[]');
        if (failedEvents.length === 0) return;

        const retryPromises = failedEvents.map(event => 
            sendEvent(event.name, event.params)
        );

        await Promise.allSettled(retryPromises);
        localStorage.setItem('failed_events', '[]');
    }
};

// Initialize analytics when the script loads
Analytics.init();

// Export the Analytics object
export default Analytics; 