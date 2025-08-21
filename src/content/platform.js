// --- Selector marker constants used across modules ---

export const TOOLBAR_MARKER_CLASS = 'cc-toolbar-added';
export const SLACK_LINK_MARKER_CLASS = 'cc-slack-button-added';

// --- Platform specific configurations ---

const GITHUB_CONFIG = {
	slackThreadButtonClassName: 'Button--secondary Button--medium Button',
};

const GITHUB_CONFIG_OLD = {
	...GITHUB_CONFIG,
	targetTextareaSelectors: [
		'textarea[name="comment[body]"]',
		'textarea[name="issue_comment[body]"]',
		'textarea[name="pull_request_review_comment[body]"]',
		'textarea[name="pull_request_review[body]"]',
	],
	targetThreadSelectors: [
		'div.js-inline-comments-container',
	],
};

const GITHUB_CONFIG_NEW = {
	...GITHUB_CONFIG,
	targetTextareaSelectors: [
		'textarea.prc-Textarea-TextArea-13q4j',
		'textarea[aria-label="Markdown value"]',
		'textarea[aria-describedby$="-description"]',
	],
	targetThreadSelectors: [
		'div.js-inline-comments-container',
		'div[data-marker-id]',
	],
};

const GITLAB_CONFIG = {
	targetTextareaSelectors: [
		'textarea[name="note[note]"]',
		'textarea[name="work-item-add-or-edit-comment"]',
	],
	targetThreadSelectors: [
		'div[data-discussion-id]',
	],
	slackThreadButtonClassName: 'ml-sm-2 gl-w-full sm:gl-w-auto btn gl-button btn-default btn-md px-5',
};

// --- Platform strategies ---

const basePlatformStrategy = {
	config: {},

	getUnprocessedTextareaQuery() {
		return this.config.targetTextareaSelectors.map(
			sel => `${sel}:not(.${TOOLBAR_MARKER_CLASS})`
		).join(', ');
	},
	getUnprocessedThreadQuery() {
		return this.config.targetThreadSelectors.map(
			sel => `${sel}:not(.${SLACK_LINK_MARKER_CLASS})`
		).join(', ');
	},

	getSlackThreadButtonClassName() {
		return this.config.slackThreadButtonClassName;
	},
};

const githubBaseStrategy = {
	...basePlatformStrategy,
	async extractSlackStatusCheckParams() {
		if (!window.location.pathname.includes('/pull/')) {
			throw new Error('Not a PR discussion.');
		}

		const urlParts = window.location.pathname.split('/');
		const slug = urlParts[1];

		// Get organization ID via API using slug
		const response = await chrome.runtime.sendMessage({ type: 'GET_GITHUB_ORG_ID', slug });

		// Get requester ID from DOM
		const requester_id =
			document.querySelector('meta[name="octolytics-actor-id"]')?.getAttribute('content') ?? '<anonymous-user>';

		return { organization: response.id, repository: urlParts[2], number: urlParts[4], requester_id };
	},
};

const githubOldStrategy = {
	...githubBaseStrategy,
	config: GITHUB_CONFIG_OLD,
	getThreadIdFromThreadElement(threadElement) {
		const threadComments = threadElement.querySelector('div.js-comments-holder');
		if (!threadComments) return;

		const firstThreadComment = threadComments.children[0];
		if (firstThreadComment) {
			return firstThreadComment.id.startsWith('discussion_r')
				? firstThreadComment.id.substring(12)
				: firstThreadComment.id.substring(1);
		}
	},
	insertThreadSlackRedirectButton(threadElement, slackButton) {
		const actionsContainer = threadElement.children[threadElement.children.length - 1];
		if (!actionsContainer) return false;

		actionsContainer.classList.add('flex-items-center');
		actionsContainer.classList.add('pr-3');
		actionsContainer.appendChild(slackButton);
		return true;
	},
};

const githubNewStrategy = {
	...githubBaseStrategy,
	config: GITHUB_CONFIG_NEW,
	getThreadIdFromThreadElement(threadElement) {
		const firstThreadComment = threadElement.querySelector('div[data-first-thread-comment="true"]');
		if (firstThreadComment) {
			return firstThreadComment.id.startsWith('discussion_r')
				? firstThreadComment.id.substring(12)
				: firstThreadComment.id.substring(1);
		}
	},
	insertThreadSlackRedirectButton(threadElement, slackButton) {
		const commentContainer = threadElement.children[0];
		if (!commentContainer) return false;

		const actionsContainer = commentContainer.children[commentContainer.children.length - 1];
		if (!actionsContainer) return false;

		actionsContainer.classList.add('flex-justify-between');
		actionsContainer.appendChild(slackButton);
		return true;
	},
};

const gitlabStrategy = {
	...basePlatformStrategy,
	config: GITLAB_CONFIG,
	extractSlackStatusCheckParams() {
		if (!window.location.pathname.includes('/merge_requests/')) {
			throw new Error('Not a PR discussion.');
		}

		const organization = document.body.dataset.namespaceId;
		const repository = document.body.dataset.projectId;
		const number = document.body.dataset.pageTypeId;
		let requester_id = '<anonymous-user>';

		const img = document.querySelector('img[data-testid="user-avatar-content"]');
		if (img) {
			const src = img.getAttribute('src');
			const match = src.match(/\/user\/avatar\/(\d+)\//);
			if (match) requester_id = match[1];
		}

		return { organization, repository, number, requester_id };
	},
	getThreadIdFromThreadElement(threadElement) {
		return threadElement.dataset.discussionId;
	},
	insertThreadSlackRedirectButton(threadElement, slackButton) {
		const actionsContainer = threadElement.querySelector('div.discussion-with-resolve-btn');
		if (!actionsContainer) return false;

		actionsContainer.insertBefore(slackButton, actionsContainer.children[actionsContainer.children.length - 1]);
		return true;
	},
};

// --- Platform object to automatically select proper strategy ---

function detectGithubExperience() {
	if (document.querySelector('div[data-testid="review-thread"]')) return 'new';
	return 'old';
}

export const Platform = (function() {
	let currentStrategy = null;

	function determineStrategy() {
		const hostname = window.location.hostname;

		if (hostname.includes('github.com')) {
			const experience = detectGithubExperience();
			return experience === 'new' ? githubNewStrategy : githubOldStrategy;
		}
		if (hostname.includes('gitlab.com')) {
			return gitlabStrategy;
		}

		return { ...basePlatformStrategy };
	}

	const publicInterface = {
		recheck() {
			currentStrategy = determineStrategy();
		},
		get config() {
			return currentStrategy ? currentStrategy.config : {};
		},
		get strategy() {
			return currentStrategy;
		},
	};

	currentStrategy = determineStrategy();
	return publicInterface;
})();

export default Platform;


