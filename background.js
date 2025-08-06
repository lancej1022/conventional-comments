import browser from './browser-polyfill.js'

// Message handler
browser.runtime.onMessage.addListener(async (request, sender) => {
    // Validate sender is this chrome extension
    if (sender.id !== browser.runtime.id) {
        return; // Ignore this message
    }

    // Assume all messages contain at least the 'type' field
    switch (request.type) {
        case 'GET_GITHUB_ORG_ID':
            return handleGetGithubOrgId(request);
        case 'GET_PR_SLACK_STATUS':
            return handleGetPrSlackStatus(request);
        case 'GET_SLACK_REDIRECT_URL':
            return handleGetSlackRedirectUrl(request);
        default:
            return { error: 'Unrecognized message' };
    }
});

async function handleGetGithubOrgId(request) {
    const apiUrl = `https://api.github.com/orgs/${request.slug}`;

    try {
        const data = await fetch(apiUrl).then(response => response.json())
        if (data.id) {
            return { id: data.id };
        } else {
            return { error: 'Organization not found or API error' };
        }
    } catch (error) {
        return { error: error.message };
    }
}

async function handleGetPrSlackStatus(request) {
    const apiUrl = 'https://api.pullpo.io/ext/conventional-comments/slack-status' +
        `?domain=${request.domain}`+
        `&organization=${request.organization}`+
        `&repository=${request.repository}`+
        `&number=${request.number}`+
        `&requester_id=${request.requester_id}`;

    try {
        const data = await fetch(apiUrl).then(response => response.json())
        return { status: data.status, key: data.key };
    } catch (error) {
        return { error: error.message };
    }
}

async function handleGetSlackRedirectUrl(request) {
    const apiUrl = 'https://api.pullpo.io/ext/conventional-comments/slack-redirect' +
        `?key=${request.key}`+
        `&thread_id=${request.thread_id}`+
        `&requester_id=${request.requester_id}`;

    try {
        const data = await fetch(apiUrl).then(response => response.json())
        return { redirect_url: data.redirect_url };
    } catch (error) {
        return { error: error.message };
    }
}