const Popup = {
  async open(path: any) {
    const result = await chrome.runtime.sendMessage({
      type: "OPEN_POPUP",
      path,
    });

    if (result && result.error == "API_UNAVAILABLE") {
      openFallbackModal(path);
    }
  },
};

export default Popup;

async function openFallbackModal(path: string) {
  const MODAL_ID = "cc-modal-container";

  if (document.getElementById(MODAL_ID)) return;

  const [htmlResponse, cssResponse] = await Promise.all([
    fetch(chrome.runtime.getURL(path)),
    fetch(chrome.runtime.getURL("popups/style.css")),
  ]);

  const htmlContent = await htmlResponse.text();
  const cssContent = await cssResponse.text(); // Get the text content of the stylesheet

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const ccIcon = chrome.runtime.getURL("assets/cc_icon.png");
  const popupBody = doc.body.innerHTML;

  const modalHost = document.createElement("div");
  modalHost.id = MODAL_ID;
  document.body.appendChild(modalHost);

  const shadowRoot = modalHost.attachShadow({ mode: "open" });

  // Since the common styling `style.css` is found inside the <head> tag, and here we extract the popup's <body>
  // we need to inject it along with the styling of the modal itself.
  shadowRoot.innerHTML = `
        <style>
        ${cssContent}

        :host {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 2147483647;
            display: flex; justify-content: end; align-items: top;
            padding-top: 5px; padding-right: 40px;
            font-family: 'Inter', sans-serif;
        }
        .modal-content {
            pointer-events: auto;
            position: relative; background-color: #020617; width: 430px; padding-top: 15px;
            border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .cc-icon {
            position: absolute; top: 10px; left: 10px;
            width: 24px; height: 24px;
        }
        .close-btn {
            position: absolute; top: 8px; right: 8px; border: none;
            aspect-ratio: 1; padding: 0 5px 2px; border-radius: 4px; 
            background: none; font-size: 18px; font-weight: 200;
            cursor: pointer; color: #64748b;
        }
        .close-btn:hover {
            background: #1e293b;
        }
        </style>
        <div id="modal-overlay">
            <div class="modal-content">
                <img src="${ccIcon}" class="cc-icon" />
                <button class="close-btn" title="Close">&times;</button>
                <div id="cc-popup-body" style="width: auto">
                    ${popupBody}
                </div>
            </div>
        </div>
    `;

  // The fallback modal won't load the scripts automatically, we need to load them within the extention's
  // environment (here) "manually"
  doc.querySelectorAll("script").forEach(async (scriptTag) => {
    if (!scriptTag.src) {
      return;
    }

    // Assume scripts are modules inside extension's ./popups directory and contain an initialize function
    await import(
      chrome.runtime.getURL("popups/" + scriptTag.getAttribute("src"))
    );
  });

  const closeModal = () => {
    // Remove the global listener to prevent memory leaks
    document.removeEventListener("click", handleOutsideClick);
    modalHost.remove();
  };

  const handleOutsideClick = (event: Event) => {
    // If our modalHost is NOT in that path, the click was outside.
    if (!event.composedPath().includes(modalHost)) {
      closeModal();
    }
  };

  shadowRoot.querySelector(".close-btn")?.addEventListener("click", closeModal);

  // Add the global listener for clicks outside the modal
  // A small timeout ensures this listener is added after the current click event cycle is complete
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 10);
}
