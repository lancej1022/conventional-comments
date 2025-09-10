// --- Selector marker constants used across modules ---
export const TOOLBAR_MARKER_CLASS = "cc-toolbar-added";
const SLACK_LINK_MARKER_CLASS = "cc-slack-button-added";

const GITHUB_CONFIG_OLD = {
  targetTextareaSelectors: [
    'textarea[name="comment[body]"]',
    'textarea[name="issue_comment[body]"]',
    'textarea[name="pull_request_review_comment[body]"]',
    'textarea[name="pull_request_review[body]"]',
  ],
  targetThreadSelectors: ["div.js-inline-comments-container"],
} as const;

const GITHUB_CONFIG_NEW = {
  targetTextareaSelectors: [
    "textarea.prc-Textarea-TextArea-13q4j",
    'textarea[aria-label="Markdown value"]',
    'textarea[aria-describedby$="-description"]',
  ],
  targetThreadSelectors: [
    "div.js-inline-comments-container",
    "div[data-marker-id]",
  ],
} as const;

// --- Platform strategies ---
const basePlatformStrategy = {
  // TODO: remove `any`
  config: {} as Record<string, any>,

  getUnprocessedTextareaQuery() {
    return this.config.targetTextareaSelectors
      .map((sel: string) => `${sel}:not(.${TOOLBAR_MARKER_CLASS})`)
      .join(", ");
  },
  getUnprocessedThreadQuery() {
    return this.config.targetThreadSelectors
      .map((sel: string) => `${sel}:not(.${SLACK_LINK_MARKER_CLASS})`)
      .join(", ");
  },
};

const githubBaseStrategy = {
  ...basePlatformStrategy,
  getPullRequestIdentifier() {
    const urlParts = window.location.pathname.split("/");
    return `${urlParts[1]}#${urlParts[2]}#${urlParts[4]}`;
  },
};

const githubOldStrategy = {
  ...githubBaseStrategy,
  config: GITHUB_CONFIG_OLD,
  // @ts-expect-error fix this TS error carried over from the original fork
  getThreadIdFromThreadElement(threadElement: HTMLElement) {
    const threadComments = threadElement.querySelector(
      "div.js-comments-holder"
    );
    if (!threadComments) return;

    const firstThreadComment = threadComments.children[0];
    if (firstThreadComment) {
      return firstThreadComment.id.startsWith("discussion_r")
        ? firstThreadComment.id.substring(12)
        : firstThreadComment.id.substring(1);
    }
  },
};

const githubNewStrategy = {
  ...githubBaseStrategy,
  config: GITHUB_CONFIG_NEW,
  // @ts-expect-error fix this TS error carried over from the original fork
  getThreadIdFromThreadElement(threadElement: HTMLElement) {
    const firstThreadComment = threadElement.querySelector(
      'div[data-first-thread-comment="true"]'
    );
    if (firstThreadComment) {
      return firstThreadComment.id.startsWith("discussion_r")
        ? firstThreadComment.id.substring(12)
        : firstThreadComment.id.substring(1);
    }
  },
};

// --- Platform object to automatically select proper strategy ---
function detectGithubExperience() {
  if (document.querySelector('div[data-testid="review-thread"]')) return "new";
  return "old";
}

export const Platform = (function () {
  let currentStrategy: null | ReturnType<typeof determineStrategy> = null;
  let currentSettings: null | Record<string, any> = null;

  // Promise-based initialization
  let resolveReady: (value: void | PromiseLike<void>) => void | undefined;
  const readyPromise = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function determineStrategy() {
    const hostname = window.location.hostname;

    if (hostname.includes("github.com")) {
      const experience = detectGithubExperience();
      return experience === "new" ? githubNewStrategy : githubOldStrategy;
    }

    return basePlatformStrategy;
  }

  chrome.storage.local.get(null, (settings) => {
    currentSettings = settings;
    resolveReady?.();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    // We only care about changes in 'local' storage
    if (areaName === "local") {
      // Update currentSettings with the new values
      for (let key in changes) {
        if (currentSettings) {
          currentSettings[key] = changes[key]?.newValue;
        }
      }

      document.dispatchEvent(
        new CustomEvent("platformSettingsChanged", { detail: { changes } })
      );
    }
  });

  const publicInterface = {
    // A promise that resolves when the initial settings have been loaded.
    // Use this to ensure the Platform is ready before using it.
    ready: () => readyPromise,

    recheck() {
      currentStrategy = determineStrategy();
    },
    get config() {
      return currentStrategy ? currentStrategy.config : {};
    },
    get strategy() {
      return currentStrategy;
    },
    settings: {
      get(key: string, defaultValue: string | undefined = undefined) {
        if (currentSettings === null) {
          return defaultValue;
        }

        return currentSettings.hasOwnProperty(key)
          ? currentSettings[key]
          : defaultValue;
      },
      set(key: string, value: any) {
        return chrome.storage.local.set({ [key]: value });
      },
    },
  };

  currentStrategy = determineStrategy();
  return publicInterface;
})();

export default Platform;
