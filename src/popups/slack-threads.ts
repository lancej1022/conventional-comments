let root = document.getElementById('cc-popup-body');
if (root === null) {
    root = document.getElementById('cc-modal-container').shadowRoot.getElementById('cc-popup-body');
}

// Delayed attachment in case DOMContentLoaded event fails to be triggered
let delayedAttachement = setTimeout(attachListeners, 300);

function attachListeners() {
    if (delayedAttachement) {
        clearTimeout(delayedAttachement);
        delayedAttachement = null;
    }

    const button = root.querySelector('#cc-disable-slack-threads');

    if (!button) return;

    button.addEventListener('click', () => {
        // Deactivate Slack threads on settings (local storage).
        chrome.storage.local.set({ slack: false });
    });
}

document.addEventListener('DOMContentLoaded', attachListeners);
