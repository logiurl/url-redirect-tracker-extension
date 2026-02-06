// Popup script for URL Redirect Tracker
let isTracking = false;
let logs = [];
let sessionStartTime = null;
let sessionTimer = null;

// DOM elements
const trackingToggle = document.getElementById('trackingToggle');
const statusText = document.getElementById('statusText');
const logCount = document.getElementById('logCount');
const sessionTime = document.getElementById('sessionTime');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const filterInput = document.getElementById('filterInput');
const logsContainer = document.getElementById('logsContainer');

// Initialize popup
async function init() {
    // Get current status from background
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
    isTracking = response.isTracking;
    trackingToggle.checked = isTracking;
    updateStatusText();

    // Load logs
    await loadLogs();

    // Start session timer if tracking
    if (isTracking) {
        startSessionTimer();
    }
}

// Toggle tracking
trackingToggle.addEventListener('change', async () => {
    isTracking = trackingToggle.checked;

    const response = await chrome.runtime.sendMessage({
        action: 'toggleTracking',
        enabled: isTracking
    });

    updateStatusText();

    if (isTracking) {
        startSessionTimer();
        showToast('Tracking enabled');
    } else {
        stopSessionTimer();
        logs = [];
        renderLogs();
        showToast('Tracking disabled');
    }
});

// Update status text
function updateStatusText() {
    statusText.textContent = `Tracking: ${isTracking ? 'ON' : 'OFF'}`;
    statusText.style.color = isTracking ? '#4CAF50' : 'rgba(255, 255, 255, 0.8)';
}

// Load logs from background
async function loadLogs() {
    const response = await chrome.runtime.sendMessage({ action: 'getLogs' });
    logs = response.logs || [];
    renderLogs();
    updateLogCount();
}

// Render logs
function renderLogs() {
    const filterText = filterInput.value.toLowerCase();
    const filteredLogs = logs.filter(log => {
        const url = (log.url || '').toLowerCase();
        const type = (log.type || '').toLowerCase();
        const redirectUrl = (log.redirectUrl || '').toLowerCase();
        return url.includes(filterText) || type.includes(filterText) || redirectUrl.includes(filterText);
    });

    if (filteredLogs.length === 0) {
        logsContainer.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        <p>${logs.length === 0 ? 'No logs yet. Enable tracking to start monitoring redirects.' : 'No logs match your filter.'}</p>
      </div>
    `;
        return;
    }

    logsContainer.innerHTML = filteredLogs.map(log => createLogEntry(log)).join('');
}

// Create log entry HTML
function createLogEntry(log) {
    const typeClass = getLogTypeClass(log.type);

    let detailsHTML = '';
    if (log.tabId !== undefined) {
        detailsHTML += `<span class="log-detail"><strong>Tab:</strong> ${log.tabId}</span>`;
    }
    if (log.frameId !== undefined && log.frameId !== 0) {
        detailsHTML += `<span class="log-detail"><strong>Frame:</strong> ${log.frameId}</span>`;
    }
    if (log.transitionType) {
        detailsHTML += `<span class="log-detail"><strong>Type:</strong> ${log.transitionType}</span>`;
    }
    if (log.qualifier && log.qualifier !== 'none') {
        detailsHTML += `<span class="log-detail"><strong>Qualifier:</strong> ${log.qualifier}</span>`;
    }
    if (log.statusCode) {
        detailsHTML += `<span class="log-detail"><strong>Status:</strong> ${log.statusCode}</span>`;
    }

    let redirectHTML = '';
    if (log.redirectUrl) {
        redirectHTML = `
      <div class="redirect-arrow">↓ Redirected to:</div>
      <div class="log-url">${escapeHtml(log.redirectUrl)}</div>
    `;
    }

    return `
    <div class="log-entry ${typeClass}">
      <div class="log-header">
        <span class="log-type">${escapeHtml(log.type)}</span>
        <span class="log-time">${escapeHtml(log.timeDisplay)}</span>
      </div>
      <div class="log-url">${escapeHtml(log.url)}</div>
      ${redirectHTML}
      ${detailsHTML ? `<div class="log-details">${detailsHTML}</div>` : ''}
    </div>
  `;
}

// Get log type class for styling
function getLogTypeClass(type) {
    if (type.includes('Redirect')) return 'redirect';
    if (type.includes('Script') || type.includes('History')) return 'script';
    if (type.includes('Completed')) return 'completed';
    return 'navigation';
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update log count
function updateLogCount() {
    logCount.textContent = logs.length;
}

// Clear logs
clearBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all logs?')) {
        await chrome.runtime.sendMessage({ action: 'clearLogs' });
        logs = [];
        renderLogs();
        updateLogCount();
        showToast('Logs cleared');
    }
});

// Copy logs to clipboard
copyBtn.addEventListener('click', async () => {
    const text = logs.map(log => {
        let line = `[${log.timeDisplay}] ${log.type}: ${log.url}`;
        if (log.redirectUrl) {
            line += ` → ${log.redirectUrl}`;
        }
        return line;
    }).join('\n');

    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
    } catch (err) {
        showToast('Failed to copy', true);
    }
});

// Export logs as JSON
exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `redirect-logs-${timestamp}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Exported successfully!');
});

// Filter logs
filterInput.addEventListener('input', () => {
    renderLogs();
});

// Session timer
function startSessionTimer() {
    sessionStartTime = Date.now();
    sessionTimer = setInterval(updateSessionTime, 1000);
}

function stopSessionTimer() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
    sessionStartTime = null;
    sessionTime.textContent = '00:00';
}

function updateSessionTime() {
    if (!sessionStartTime) return;

    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    sessionTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Listen for log updates from background
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'logUpdate') {
        logs.unshift(message.log);
        if (logs.length > 1000) {
            logs = logs.slice(0, 1000);
        }
        renderLogs();
        updateLogCount();
    }
});

// Show toast notification
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (isError) {
        toast.style.background = '#ef4444';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// Initialize on load
init();
