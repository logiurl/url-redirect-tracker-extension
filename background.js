// Background service worker for tracking URL changes
let isTracking = false;
let redirectLogs = [];
const MAX_LOGS = 1000; // Prevent memory overflow

// Initialize tracking state from storage
chrome.storage.local.get(['isTracking', 'redirectLogs'], (result) => {
  isTracking = result.isTracking || false;
  redirectLogs = result.redirectLogs || [];
});

// Listen for tracking toggle from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleTracking') {
    isTracking = message.enabled;
    chrome.storage.local.set({ isTracking });
    
    if (!isTracking) {
      // Clear logs when tracking is disabled
      redirectLogs = [];
      chrome.storage.local.set({ redirectLogs: [] });
    }
    
    sendResponse({ success: true, isTracking });
  } else if (message.action === 'getStatus') {
    sendResponse({ isTracking, logsCount: redirectLogs.length });
  } else if (message.action === 'getLogs') {
    sendResponse({ logs: redirectLogs });
  } else if (message.action === 'clearLogs') {
    redirectLogs = [];
    chrome.storage.local.set({ redirectLogs: [] });
    sendResponse({ success: true });
  }
  return true;
});

// Track web navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (!isTracking) return;
  
  logRedirect({
    type: 'Navigation Start',
    url: details.url,
    tabId: details.tabId,
    frameId: details.frameId,
    timestamp: new Date().toISOString(),
    timeDisplay: new Date().toLocaleTimeString()
  });
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (!isTracking) return;
  
  let transitionType = details.transitionType;
  let qualifier = details.transitionQualifiers.join(', ') || 'none';
  
  logRedirect({
    type: 'Navigation Committed',
    url: details.url,
    tabId: details.tabId,
    frameId: details.frameId,
    transitionType: transitionType,
    qualifier: qualifier,
    timestamp: new Date().toISOString(),
    timeDisplay: new Date().toLocaleTimeString()
  });
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (!isTracking) return;
  
  logRedirect({
    type: 'History State Updated (Script)',
    url: details.url,
    tabId: details.tabId,
    frameId: details.frameId,
    timestamp: new Date().toISOString(),
    timeDisplay: new Date().toLocaleTimeString()
  });
});

chrome.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
  if (!isTracking) return;
  
  logRedirect({
    type: 'Fragment Updated',
    url: details.url,
    tabId: details.tabId,
    frameId: details.frameId,
    timestamp: new Date().toISOString(),
    timeDisplay: new Date().toLocaleTimeString()
  });
});

// Track server-side redirects
chrome.webRequest.onBeforeRedirect.addListener(
  (details) => {
    if (!isTracking) return;
    
    logRedirect({
      type: 'Server Redirect',
      url: details.url,
      redirectUrl: details.redirectUrl,
      tabId: details.tabId,
      statusCode: details.statusCode,
      timestamp: new Date().toISOString(),
      timeDisplay: new Date().toLocaleTimeString()
    });
  },
  { urls: ['<all_urls>'] }
);

// Track completed requests
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!isTracking) return;
    
    // Only log main frame requests to avoid clutter
    if (details.type === 'main_frame') {
      logRedirect({
        type: 'Request Completed',
        url: details.url,
        tabId: details.tabId,
        statusCode: details.statusCode,
        timestamp: new Date().toISOString(),
        timeDisplay: new Date().toLocaleTimeString()
      });
    }
  },
  { urls: ['<all_urls>'] }
);

// Helper function to log redirects
function logRedirect(logEntry) {
  redirectLogs.unshift(logEntry); // Add to beginning for newest first
  
  // Limit log size
  if (redirectLogs.length > MAX_LOGS) {
    redirectLogs = redirectLogs.slice(0, MAX_LOGS);
  }
  
  // Save to storage
  chrome.storage.local.set({ redirectLogs });
  
  // Notify popup if it's open
  chrome.runtime.sendMessage({ action: 'logUpdate', log: logEntry }).catch(() => {
    // Popup might not be open, ignore error
  });
}

// Badge to show tracking status
function updateBadge() {
  if (isTracking) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Update badge on startup and when tracking changes
chrome.storage.local.get(['isTracking'], (result) => {
  isTracking = result.isTracking || false;
  updateBadge();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.isTracking) {
    isTracking = changes.isTracking.newValue;
    updateBadge();
  }
});
