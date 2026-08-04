export function createWorkspaceOutlet() {
    const outlet = document.createElement('div');
    outlet.className = 'app-workspace';
    outlet.id = 'workspace-outlet';
    outlet.tabIndex = -1;
    outlet.setAttribute('aria-label', 'Rechner wird geladen');

    return outlet;
}
