document.addEventListener('DOMContentLoaded', function() {
    // Prevent Copy
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        showBlockMessage('Copying is not allowed');
    });

    // Prevent Cut
    document.addEventListener('cut', function(e) {
        e.preventDefault();
        showBlockMessage('Cutting is not allowed');
    });

    // Prevent Paste
    document.addEventListener('paste', function(e) {
        e.preventDefault();
        showBlockMessage('Pasting is not allowed');
    });

    // Prevent Context Menu (Right-Click)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showBlockMessage('copying is disabled');
    });

    // Disable Select
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });

    // Keyboard Shortcut Prevention
    document.addEventListener('keydown', function(e) {
        // Prevent Ctrl+C, Ctrl+V, Ctrl+X
        if ((e.ctrlKey || e.metaKey) && 
            (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
            e.preventDefault();
            showBlockMessage('Copy/Paste shortcuts are disabled');
        }
    });

    // Create a blocking overlay
    function showBlockMessage(message) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        overlay.style.color = 'white';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.fontSize = '20px';
        overlay.textContent = message;

        document.body.appendChild(overlay);

        // Remove overlay after 2 seconds
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 2000);
    }

    // Disable developer tools
    document.addEventListener('keydown', function(e) {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J'))
        ) {
            e.preventDefault();
        }
    });

    // Prevent text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
});