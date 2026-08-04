export const APP_STATE_VERSION = 1;

export function createInitialAppState() {
    return Object.freeze({
        version: APP_STATE_VERSION,
        activeWorkspaceId: null,
        shellMode: 'loading',
        personalOrientation: null
    });
}
