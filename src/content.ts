import Platform from "./content/platform";

import {
  processCommentAreas,
  checkAndInitializeAddedTextareas,
} from "./content/badges";

// Enhanced initialization with multiple strategies
let isProcessing = false;

function processUiElements() {
  Platform.recheck();

  processCommentAreas();
}

function handleUrlChange() {
  // Process
  isProcessing = false;
  processUiElements();
  setTimeout(processUiElements, 500);
  setTimeout(processUiElements, 1000);
  setTimeout(processUiElements, 2000);
}

// Listen for History API changes
window.addEventListener("popstate", handleUrlChange);
window.addEventListener("pushstate", handleUrlChange);
window.addEventListener("replacestate", handleUrlChange);

// Intercept History API methods
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

// TODO: Implement an actual router lol
history.pushState = function () {
  // @ts-expect-error see above TODO comment
  originalPushState.apply(this, arguments);
  handleUrlChange();
};

history.replaceState = function () {
  // @ts-expect-error see above TODO comment
  originalReplaceState.apply(this, arguments);
  handleUrlChange();
};

function main() {
  // Initial load
  processUiElements();

  // Periodic check for new elements
  setInterval(() => {
    if (!isProcessing) {
      const textareas = document.querySelectorAll(
        Platform.strategy?.getUnprocessedTextareaQuery()
      );
      if (textareas.length > 0) {
        processCommentAreas();
      }
    }
  }, 1000);

  // Mutation observer
  const observer = new MutationObserver((mutationsList) => {
    if (isProcessing) return;
    isProcessing = true;

    setTimeout(() => {
      Platform.recheck();

      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          // @ts-expect-error fix this TS error carried over from the original fork
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              checkAndInitializeAddedTextareas(node);
            }
          }
        }
      }
      isProcessing = false;
    }, 100);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "id"],
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      processUiElements();
    }
  });
}

Platform.ready().then(main);
