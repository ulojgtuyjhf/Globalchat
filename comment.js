
// User Avatar Generator
class UserAvatarGenerator {
  constructor() {
    // Color palette for consistent colors per user
    this.colorPalette = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#607d8b'
    ];
    
    this.avatarCache = new Map(); // Cache generated avatars for performance
    
    // Start processing
    this.init();
  }
  
  init() {
    // Apply avatars to existing messages
    this.processExistingMessages();
    
    // Set up observer for new messages
    this.setupMessageObserver();
  }
  
  // Generate avatar for a user
  generateAvatar(name, userId) {
    // Return from cache if available
    const cacheKey = `${userId}-${name}`;
    if (this.avatarCache.has(cacheKey)) {
      return this.avatarCache.get(cacheKey);
    }
    
    const firstLetter = name.charAt(0).toUpperCase();
    
    // Use deterministic color selection based on user ID or name
    const colorIndex = userId ? 
      [...userId].reduce((acc, char) => acc + char.charCodeAt(0), 0) % this.colorPalette.length :
      [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % this.colorPalette.length;
    
    const color = this.colorPalette[colorIndex];
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const context = canvas.getContext('2d');
    
    // Draw background
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.fillStyle = 'white';
    context.font = 'bold 50px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(firstLetter, canvas.width / 2, canvas.height / 2);
    
    const dataUrl = canvas.toDataURL('image/png');
    
    // Store in cache
    this.avatarCache.set(cacheKey, dataUrl);
    
    return dataUrl;
  }
  
  // Process existing messages
  processExistingMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => this.processMessage(message));
  }
  
  // Process a single message element
  processMessage(messageEl) {
    const profileImg = messageEl.querySelector('.profile-image');
    if (!profileImg) return;
    
    // Skip if already has a valid image (not default)
    if (profileImg.complete && profileImg.naturalHeight !== 0 && 
        !profileImg.src.includes('default_profile') && 
        !profileImg.src.startsWith('data:image/png;base64,')) {
      return;
    }
    
    // Extract username and ID
    const nameEl = messageEl.querySelector('.user-name');
    if (!nameEl) return;
    
    const username = nameEl.textContent;
    const userId = messageEl.getAttribute('data-message-id') || 
                  messageEl.querySelector('[data-user-id]')?.getAttribute('data-user-id');
    
    // Generate and set avatar
    profileImg.src = this.generateAvatar(username, userId);
  }
  
  // Set up observer for new messages
  setupMessageObserver() {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;
    
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList.contains('message')) {
              this.processMessage(node);
            }
          });
        }
      });
    });
    
    observer.observe(chatContainer, { childList: true, subtree: true });
  }
}

// Initialize avatar generator after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait slightly to ensure the chat app is initialized
  setTimeout(() => {
    window.avatarGenerator = new UserAvatarGenerator();
  }, 500);
});
