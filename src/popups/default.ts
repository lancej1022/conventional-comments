let root = document.getElementById('cc-popup-body');
if (root === null) {
    root = document.getElementById('cc-modal-container').shadowRoot.getElementById('cc-popup-body');
}

// Delayed attachment in case popup is running within fallback modal
let delayedAttachement = setTimeout(attachListeners, 300);

// Attach listeners to settings checkboxes
function attachListeners() {
    if (delayedAttachement) {
        clearTimeout(delayedAttachement);
        delayedAttachement = null;
    }

    // Prettify option
    const prettifyToggle = root.querySelector('#prettify');

    if (prettifyToggle) {
        chrome.storage.local.get(['prettify'], (result) => {
            prettifyToggle.checked = result.prettify ?? true; // Default to true
        });
    
        prettifyToggle.addEventListener('change', () => {
            const isEnabled = prettifyToggle.checked;
            chrome.storage.local.set({ prettify: isEnabled });
        });
    }

    // Slack threads option
    const slackThreadsToggle = root.querySelector('#slack-threads');

    if (slackThreadsToggle) {
        chrome.storage.local.get(['slack'], (result) => {
            slackThreadsToggle.checked = result.slack ?? true; // Default to true
        });
    
        slackThreadsToggle.addEventListener('change', () => {
            const isEnabled = slackThreadsToggle.checked;
            chrome.storage.local.set({ slack: isEnabled });
        });
    }
}

document.addEventListener('DOMContentLoaded', attachListeners);