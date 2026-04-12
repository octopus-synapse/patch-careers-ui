/**
 * Global chat state — accessible from any page.
 * Controls drawer visibility, fullscreen mode, and active conversation.
 */

let isOpen = $state(false);
let isFullscreen = $state(false);
let activeConversationId = $state<string | null>(null);
let pendingRecipientId = $state<string | null>(null);

export const chatState = {
	get isOpen() { return isOpen; },
	get isFullscreen() { return isFullscreen; },
	get activeConversationId() { return activeConversationId; },
	get pendingRecipientId() { return pendingRecipientId; },

	toggle() { isOpen = !isOpen; },
	open() { isOpen = true; },
	close() { isOpen = false; isFullscreen = false; },

	openFullscreen() { isOpen = true; isFullscreen = true; },
	toggleFullscreen() { isFullscreen = !isFullscreen; },
	exitFullscreen() { isFullscreen = false; },

	openConversation(convId: string) {
		activeConversationId = convId;
		isOpen = true;
	},

	startConversationWith(recipientId: string) {
		pendingRecipientId = recipientId;
		activeConversationId = null;
		isOpen = true;
	},

	clearPendingRecipient() {
		pendingRecipientId = null;
	},

	setActiveConversation(convId: string | null) {
		activeConversationId = convId;
	},
};
