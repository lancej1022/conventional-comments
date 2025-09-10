// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Validate sender is this chrome extension
  if (sender.id !== chrome.runtime.id) {
    return false; // Ignore this message
  }

  // Assume all messages contain at least the 'type' field

  switch (request.type) {
    case "OPEN_POPUP":
      handleOpenPopup(request).then(sendResponse);
      return true;
    case "GET_GITHUB_ORG_ID":
      handleGetGithubOrgId(request).then(sendResponse);
      return true;
    case "OPEN_INSTALL_POPUP":
      handleOpenInstallPopup(request).then(sendResponse);
      return true;
    case "OPEN_EXTERNAL_URL":
      handleOpenExternalUrl(request).then(sendResponse);
      return true;
    default:
      sendResponse({ error: "Unrecognized message" });
      return true;
  }
});

async function handleOpenPopup(request: { path: string }) {
  return new Promise((resolve) => {
    chrome.action.setPopup({ popup: request.path }, () => {
      try {
        chrome.action.openPopup({}, () => {
          setTimeout(() => {
            // Reset popup to default behavior after small delay, ensuring new popup has time to render
            chrome.action.setPopup({ popup: "popups/default.html" });
          }, 300);
          resolve({ success: true });
        });
      } catch {
        // Reset popup to default behavior immediately
        chrome.action.setPopup({ popup: "popups/default.html" });
        resolve({ error: "API_UNAVAILABLE" });
      }
    });
  });
}

async function handleGetGithubOrgId(request: { slug: string }) {
  const apiUrl = `https://api.github.com/orgs/${request.slug}`;

  try {
    const data = await fetch(apiUrl).then((response) => response.json());
    if (data.id) {
      return { id: data.id };
    } else {
      return { error: "Organization not found or API error" };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function handleOpenInstallPopup(request: { org: string }) {
  return new Promise((resolve) => {
    const popupUrl = `popups/install-pullpo.html?org=${encodeURIComponent(request.org)}`;

    chrome.action.setPopup({ popup: popupUrl }, () => {
      try {
        chrome.action.openPopup({}, () => {
          setTimeout(() => {
            // Reset popup to default behavior after small delay, ensuring new popup has time to render
            chrome.action.setPopup({ popup: "popups/default.html" });
          }, 300);
          resolve({ success: true });
        });
      } catch {
        // Reset popup to default behavior immediately
        chrome.action.setPopup({ popup: "popups/default.html" });
        resolve({ error: "API_UNAVAILABLE" });
      }
    });
  });
}

async function handleOpenExternalUrl(request: { url: string }) {
  try {
    await chrome.tabs.create({
      url: request.url,
      active: true,
    });

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
