
// Add message sent sound effect
(function() {
  // Create a simple, clean "sent" sound using the Web Audio API
  // This creates the sound directly instead of loading an external file
  function createMessageSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    return function playSound() {
      // Create oscillator for the "sent" sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configure sound - clean, short "ping" sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(900, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.1);
      
      // Configure volume envelope
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      // Connect and play
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    };
  }
  
  // Initialize once document is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Create our sound player function
    const playMessageSound = createMessageSound();
    
    // Attach to send button
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
      sendButton.addEventListener('click', function() {
        if (!this.disabled) {
          playMessageSound();
        }
      });
    }
    
    // Attach to Enter key
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey && !sendButton.disabled) {
          playMessageSound();
        }
      });
    }
  });
})();
