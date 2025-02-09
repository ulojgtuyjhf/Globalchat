// Create an audio object with a subtle message sent sound
const messageSentSound = new Audio('https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3');

// Set the volume to be subtle
messageSentSound.volume = 0.5;

// Function to request audio permissions
async function requestAudioPermission() {
  try {
    // Request permission to play audio
    const result = await navigator.permissions.query({ name: 'notifications' });

    if (result.state === 'granted') {
      return true;
    } else if (result.state === 'prompt') {
      // Show permission request dialog
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  } catch (error) {
    console.log('Permission request failed:', error);
    return false;
  }
}

// Function to play sound with permission check
async function playMessageSound() {
  try {
    // First check/request permission
    const hasPermission = await requestAudioPermission();

    if (hasPermission) {
      await messageSentSound.play();
    } else {
      console.log('Audio permission not granted');
    }
  } catch (error) {
    console.log('Audio playback failed:', error);
  }
}

// Get the send button
const sendButton = document.querySelector('.input-container button');

// Add click event listener to play sound
sendButton.addEventListener('click', () => {
  playMessageSound();
});

// Also trigger sound when Enter key is pressed (without Shift)
document.getElementById('messageInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    playMessageSound();
  }
});

// Preload the audio and request initial permission on page load
document.addEventListener('DOMContentLoaded', async () => {
  messageSentSound.load();
  // Request permission when page loads
  await requestAudioPermission();
});