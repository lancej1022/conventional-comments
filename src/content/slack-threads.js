import Platform, { SLACK_LINK_MARKER_CLASS } from './platform.js';

let slackStatus = '';
let slackRedirectKey = '';
let slackRequesterId = '';

export async function checkSlackStatus() {
    if (slackStatus == 'PENDING') return;
    slackStatus = 'PENDING';

    try {
        const params = await Platform.strategy.extractSlackStatusCheckParams();
        slackRequesterId = params.requester_id;

        const response = await chrome.runtime.sendMessage({
            type: 'GET_PR_SLACK_STATUS',
            domain: window.location.hostname,
            organization: params.organization,
            repository: params.repository,
            number: params.number,
            requester_id: params.requester_id,
        });

        if (response.error) {
            console.error(response.error);
            slackStatus = 'UNAVAILABLE';
            return;
        }

        slackStatus = response.status ?? '';
        slackRedirectKey = response.key ?? '';
    } catch (e) {
        console.error(e);
        slackStatus = 'UNAVAILABLE';
    }
}

export function processThreads() {
    if (!slackStatus || slackStatus == 'PENDING') return;

    const threads = document.querySelectorAll(Platform.strategy.getUnprocessedThreadQuery());
    threads.forEach(initializeSlackLinkForThread);
}

export function getSlackStatus() {
    return slackStatus;
}

function initializeSlackLinkForThread(threadElement) {
    if (!slackStatus || slackStatus == 'PENDING' || slackStatus == 'UNAVAILABLE' || slackStatus == 'NOT_TRACKED' ||
        threadElement.classList.contains(SLACK_LINK_MARKER_CLASS)
    ) return;

    threadElement.classList.add(SLACK_LINK_MARKER_CLASS);

    (async () => {
        let redirectUrl;

        switch (slackStatus) {
            case 'NOT_INSTALLED':
                redirectUrl = 'https://pullpo.io/products/channels';
                break;
            case 'AVAILABLE':
                const threadId = Platform.strategy.getThreadIdFromThreadElement(threadElement);
                if (!threadId) {
                    return false;
                }

                const response = await chrome.runtime.sendMessage({
                    type: 'GET_SLACK_REDIRECT_URL',
                    key: slackRedirectKey,
                    thread_id: threadId,
                    requester_id: slackRequesterId,
                });

                if (response.error) {
                    console.error('SLACK URL error:', response.error);
                    return false;
                }

                redirectUrl = response.redirect_url;
                break;
            default:
                return false;
        }

        if (!redirectUrl) return false;

        const slackButton = createSlackRedirectButton(redirectUrl);
        return Platform.strategy.insertThreadSlackRedirectButton(threadElement, slackButton);
    })().then((inserted) => {
        if (!inserted) threadElement.classList.remove(SLACK_LINK_MARKER_CLASS);
    });
}

function createSlackRedirectButton(url) {
    const button = document.createElement('a');
    button.href = url;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';

    button.className = Platform.strategy.getSlackThreadButtonClassName();
    button.style.textDecoration = 'none';

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('assets/slack_icon.svg');
    icon.style.height = '16px';
    icon.style.width = '16px';
    icon.style.marginRight = '4px';
    icon.style.verticalAlign = 'text-bottom';

    const buttonText = document.createElement('span');
    buttonText.textContent = 'Open in Slack';

    button.appendChild(icon);
    button.appendChild(buttonText);

    return button;
}

export function checkAndInitializeAddedThreads(node) {
    const query = Platform.strategy.getUnprocessedThreadQuery();
    if (node.matches && node.matches(query) && !node.classList.contains(SLACK_LINK_MARKER_CLASS)) {
        initializeSlackLinkForThread(node);
    } else if (node.querySelectorAll) {
        const threadElements = node.querySelectorAll(query);
        threadElements.forEach(threadElement => {
            initializeSlackLinkForThread(threadElement);
        });
    }
}


