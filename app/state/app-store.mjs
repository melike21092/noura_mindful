import { createInitialAppState } from './app-state-schema.mjs';

export function createAppStore(initialState = createInitialAppState()) {
    let state = initialState;
    const listeners = new Set();

    function publish(patch) {
        const nextState = Object.freeze({ ...state, ...patch });
        if (Object.keys(patch).every(key => Object.is(state[key], nextState[key]))) return state;
        state = nextState;
        for (const listener of listeners) listener(state);
        return state;
    }

    return Object.freeze({
        getState: () => state,
        setActiveWorkspace: activeWorkspaceId => publish({ activeWorkspaceId }),
        setShellMode: shellMode => publish({ shellMode }),
        setPersonalOrientation: personalOrientation => publish({ personalOrientation }),
        clearPersonalOrientation: () => publish({ personalOrientation: null }),
        subscribe(listener) {
            if (typeof listener !== 'function') throw new TypeError('Store-Listener muss eine Funktion sein.');
            listeners.add(listener);
            listener(state);
            return () => listeners.delete(listener);
        }
    });
}
