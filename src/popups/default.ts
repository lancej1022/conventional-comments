let root: HTMLElement | null | undefined =
  document.getElementById("cc-popup-body");

if (!root) {
  root = document
    ?.getElementById("cc-modal-container")
    ?.shadowRoot?.getElementById("cc-popup-body");
}

if (!root) {
  throw new Error("Root element not found");
}

// Delayed attachment in case popup is running within fallback modal
let delayedAttachement: number | null = window.setTimeout(attachListeners, 300);

// Attach listeners to settings checkboxes
function attachListeners() {
  if (delayedAttachement) {
    clearTimeout(delayedAttachement);
    delayedAttachement = null;
  }

  // Prettify option
  const prettifyToggle = root?.querySelector("#prettify");

  if (prettifyToggle) {
    chrome.storage.local.get(["prettify"], (result) => {
      if (!prettifyToggle || !(prettifyToggle instanceof HTMLInputElement)) {
        console.error(
          "Prettify toggle not found or is not an HTMLInputElement"
        );
        return;
      }

      prettifyToggle.checked = result.prettify ?? true; // Default to true
    });

    prettifyToggle.addEventListener("change", () => {
      if (!(prettifyToggle instanceof HTMLInputElement)) {
        console.error(
          "Prettify toggle not found or is not an HTMLInputElement"
        );
        return;
      }

      const isEnabled = prettifyToggle.checked;
      chrome.storage.local.set({ prettify: isEnabled });
    });
  }
}

document.addEventListener("DOMContentLoaded", attachListeners);
