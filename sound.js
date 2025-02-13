// Create an audio object with a subtle message sent sound
const messageSentSound = new Audio('https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3');

// Set the volume to be subtle
messageSentSound.volume = 0.5;

// Get the send button
const sendButton = document.querySelector('.input-container button');

// Add click event listener to play sound
sendButton.addEventListener('click', () => {
  // Play the sound
  messageSentSound.play().catch(error => {
    console.log('Audio playback failed:', error);
  });
});

// Also trigger sound when Enter key is pressed (without Shift)
document.getElementById('messageInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    messageSentSound.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }
});

// Preload the audio to prevent delay on first play
document.addEventListener('DOMContentLoaded', () => {
  messageSentSound.load();
});