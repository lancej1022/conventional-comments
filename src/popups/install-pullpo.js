let root = document.getElementById('cc-popup-body');
if (root === null) {
    root = document.getElementById('cc-modal-container').shadowRoot.getElementById('cc-popup-body');
}

// Extract org parameter from URL
function getOrgFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('org') || '';
}

// Apply theme based on system preference
function applyTheme() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
    }
}

// Delayed attachment in case popup is running within fallback modal
let delayedAttachement = setTimeout(attachListeners, 300);

function attachListeners() {
    if (delayedAttachement) {
        clearTimeout(delayedAttachement);
        delayedAttachement = null;
    }

    const orgSlug = getOrgFromUrl();

    // Learn More button
    const learnMoreBtn = root.querySelector('#learn-more-btn');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', () => {
            const url = `https://pullpo.io/pr-channels-from-cc?org=${encodeURIComponent(orgSlug)}`;
            
            try {
                chrome.runtime.sendMessage({
                    type: 'OPEN_EXTERNAL_URL',
                    url: url
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('Extension context invalidated, opening page directly:', chrome.runtime.lastError);
                        window.open(url, '_blank');
                    }
                    // Close the popup after opening
                    window.close();
                });
            } catch (error) {
                console.warn('Chrome extension error, opening page directly:', error);
                window.open(url, '_blank');
                window.close();
            }
        });
    }

    // Watch Demo button
    const watchDemoBtn = root.querySelector('#watch-demo-btn');
    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', () => {
            // Add demo parameter to trigger video modal automatically
            const url = `https://pullpo.io/pr-channels-from-cc?org=${encodeURIComponent(orgSlug)}&demo=true`;
            
            try {
                chrome.runtime.sendMessage({
                    type: 'OPEN_EXTERNAL_URL',
                    url: url
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('Extension context invalidated, opening page directly:', chrome.runtime.lastError);
                        window.open(url, '_blank');
                    }
                    // Close the popup after opening
                    window.close();
                });
            } catch (error) {
                console.warn('Chrome extension error, opening page directly:', error);
                window.open(url, '_blank');
                window.close();
            }
        });
    }

    // Disable Slack buttons
    const disableSlackBtn = root.querySelector('#disable-slack-btn');
    if (disableSlackBtn) {
        disableSlackBtn.addEventListener('click', () => {
            // Save setting to disable Slack threads
            chrome.storage.local.set({ slack: false }, () => {
                // Dispatch event to notify content scripts
                try {
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        if (tabs[0]) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'SETTINGS_CHANGED',
                                changes: { slack: { newValue: false } }
                            }).catch(() => {
                                // Ignore errors - content script might not be ready
                            });
                        }
                    });
                } catch (error) {
                    // Ignore errors in popup context
                }
                
                // Close the popup
                window.close();
            });
        });
    }

    // Join new integrations Waitlist button
    const newIntegrationsBtn = root.querySelector('#new-integrations-btn');
    if (newIntegrationsBtn) {
        newIntegrationsBtn.addEventListener('click', () => {
            const url = 'https://pullpo.io/new-integrations';
            
            try {
                chrome.runtime.sendMessage({
                    type: 'OPEN_EXTERNAL_URL',
                    url: url
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('Extension context invalidated, opening page directly:', chrome.runtime.lastError);
                        window.open(url, '_blank');
                    }
                });
            } catch (error) {
                console.warn('Chrome extension error, opening page directly:', error);
                window.open(url, '_blank');
            }
        });
    }

}

// Apply theme on load
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    attachListeners();
});

// Listen for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
});