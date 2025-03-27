import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, onValue, update, get, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
  authDomain: "globalchat-2d669.firebaseapp.com",
  projectId: "globalchat-2d669",
  messagingSenderId: "178714711978",
  appId: "1:178714711978:web:fb831188be23e62a4bbdd3",
  databaseURL: "https://globalchat-2d669-default-rtdb.firebaseio.com/"
};

// Appwrite Configuration
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "67d98c24003a405ab6a0"; 
const APPWRITE_BUCKET_ID = "67dba33e000399dc8641"; 
const APPWRITE_API_KEY = "standard_6f65a2d8e8c270ba9556f844789c1eae72c7fa71f64b95409ac20b6127c483454d1e4b9f8c13f82c09168ed1dfebd2d4e7e02494bee254252f9713675beea4d645a960879aaada1c6c98cb7651ec6c6bf4357e4c2c8b8d666c0166203ec43694b9a49ec8ee08161edf3fd5dea94e46c165316122f44f96c44933121be214b80c";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const chatRef = ref(database, 'messages');
const typingRef = ref(database, 'typing');
const rateLimitRef = ref(database, 'rateLimit');

const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const imageButton = document.getElementById('imageButton');
const videoButton = document.getElementById('videoButton');
const mediaPreview = document.getElementById('mediaPreview');
const sendButton = document.getElementById('sendButton');
const loadingIndicator = document.getElementById('loadingIndicator');

let currentUser = null;
let selectedMedia = [];
let lastMessageTime = 0;
const followedUsers = new Set();
let typingTimeout = null;
const typingUsers = new Map();
let globalRateLimit = Date.now(); // Global rate limit timestamp

// New variables for optimized message storage
const MAX_FIREBASE_MESSAGES = 5; // Store first 5 messages in Firebase
const LOCAL_STORAGE_MESSAGES_KEY = 'localMessages';
const LOCAL_STORAGE_CONVERSATION_STATUS_KEY = 'conversationStatus';
const LOCAL_STORAGE_LIKES_KEY = 'messageLikes';
let conversationStatus = {};
let activeReplySectionId = null; // Track which reply section is open
let messageLikes = {}; // Track liked messages

// Initialize app
function initApp() {
  // Load conversation status from local storage
  loadConversationStatus();
  
  // Load liked messages
  loadLikedMessages();
  
  // Initialize message input height adjustment
  initMessageInput();
  
  // Media upload event listeners
  imageButton.addEventListener('click', () => imageInput.click());
  videoButton.addEventListener('click', () => videoInput.click());
  imageInput.addEventListener('change', handleMediaSelection);
  videoInput.addEventListener('change', handleMediaSelection);
  
  // Send Button Event Listener
  sendButton.addEventListener('click', () => {
    sendMessage();
  });
  
  // Enter key to send message (Shift+Enter for new line)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendButton.disabled) {
        sendMessage();
      }
    }
  });
  
  // Listen for typing indicators
  listenForTypingIndicators();
  
  // Load messages from local storage first
  loadLocalMessages();
  
  // Then listen for new messages from Firebase
  listenForMessages();
  
  // Listen for global rate limit
  listenForRateLimit();
  
  // Add support for GIFs
  initGifSupport();
  
  // Add event listener for closing reply sections when clicking outside
  document.addEventListener('click', (e) => {
    if (activeReplySectionId && !e.target.closest('.reply-section') && !e.target.closest('.reply-btn')) {
      closeReplySection();
    }
  });
}

// Initialize GIF support
function initGifSupport() {
  // Create GIF button
  const gifButton = document.createElement('button');
  gifButton.id = 'gifButton';
  gifButton.className = 'media-button';
  gifButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 10.5V8.8h-4.4v6.4h1.7v-2h2v-1.7h-2v-1H19zm-7.3-1.7h1.7v6.4h-1.7V8.8zm-3.6 1.6c.4 0 .9.2 1.2.5l1.2-1C9.9 9.2 9 8.8 8.1 8.8c-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2c1 0 1.8-.4 2.4-1.1v-2.5H7.7v1.2h1.2v.6c-.2.1-.5.2-.8.2-.9 0-1.6-.7-1.6-1.6 0-.8.7-1.6 1.6-1.6z"/></svg>';
  gifButton.title = 'Add GIF';
  
  // Insert GIF button after image button
  const buttonContainer = imageButton.parentElement;
  buttonContainer.insertBefore(gifButton, videoButton);
  
  // GIF button click event
  gifButton.addEventListener('click', openGifSelector);
}

// Open GIF selector
function openGifSelector() {
  // Create a simple GIF picker modal
  const modal = document.createElement('div');
  modal.className = 'gif-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  modal.style.zIndex = '1000';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  
  // Add search input and results container
  modal.innerHTML = `
    <div style="width: 90%; max-width: 600px; background: #15202b; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: white;">Select a GIF</h3>
        <button id="closeGifModal" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
      </div>
      <input type="text" id="gifSearch" placeholder="Search GIFs..." style="padding: 10px; border-radius: 20px; border: none; background: #253341; color: white;">
      <div id="gifResults" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-height: 400px; overflow-y: auto;"></div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal event
  document.getElementById('closeGifModal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Search input event
  const searchInput = document.getElementById('gifSearch');
  searchInput.focus();
  
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchGifs(searchInput.value);
    }, 500);
  });
  
  // Load trending GIFs initially
  searchGifs('trending');
  
  // Function to search GIFs using Tenor API
  async function searchGifs(query) {
    const resultsContainer = document.getElementById('gifResults');
    resultsContainer.innerHTML = '<div style="grid-column: span 3; text-align: center; color: white;">Loading GIFs...</div>';
    
    try {
      // Using a proxy to handle the API request
      const response = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULELA&limit=15`);
      const data = await response.json();
      
      resultsContainer.innerHTML = '';
      
      if (data.results && data.results.length > 0) {
        data.results.forEach(gif => {
          const gifItem = document.createElement('div');
          gifItem.style.cursor = 'pointer';
          gifItem.style.borderRadius = '8px';
          gifItem.style.overflow = 'hidden';
          
          const gifImg = document.createElement('img');
          gifImg.src = gif.media[0].tinygif.url;
          gifImg.style.width = '100%';
          gifImg.style.height = 'auto';
          
          gifItem.appendChild(gifImg);
          resultsContainer.appendChild(gifItem);
          
          // Click event to select this GIF
          gifItem.addEventListener('click', () => {
            // Add the GIF to selected media
            addGifToSelectedMedia(gif.media[0].gif.url);
            document.body.removeChild(modal);
          });
        });
      } else {
        resultsContainer.innerHTML = '<div style="grid-column: span 3; text-align: center; color: white;">No GIFs found</div>';
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      resultsContainer.innerHTML = '<div style="grid-column: span 3; text-align: center; color: white;">Error loading GIFs</div>';
    }
  }
}

// Add GIF to selected media
function addGifToSelectedMedia(gifUrl) {
  // Create a preview of the selected GIF
  const previewItem = document.createElement('div');
  previewItem.className = 'preview-item';
  
  previewItem.innerHTML = `
    <img src="${gifUrl}" class="preview-image">
    <button class="remove-media" data-index="${selectedMedia.length}">×</button>
  `;
  
  mediaPreview.appendChild(previewItem);
  
  // Add event listener to remove button
  const removeButton = previewItem.querySelector('.remove-media');
  removeButton.addEventListener('click', function() {
    const index = parseInt(this.getAttribute('data-index'));
    removeMedia(index);
  });
  
  // Add GIF to selected media
  selectedMedia.push({
    type: 'image',
    isGif: true,
    url: gifUrl
  });
  
  // Enable send button
  sendButton.disabled = false;
}

// Load conversation status from local storage
function loadConversationStatus() {
  try {
    const storedStatus = localStorage.getItem(LOCAL_STORAGE_CONVERSATION_STATUS_KEY);
    if (storedStatus) {
      conversationStatus = JSON.parse(storedStatus);
    }
  } catch (error) {
    console.error('Error loading conversation status:', error);
    conversationStatus = {};
  }
}

// Save conversation status to local storage
function saveConversationStatus() {
  try {
    localStorage.setItem(LOCAL_STORAGE_CONVERSATION_STATUS_KEY, JSON.stringify(conversationStatus));
  } catch (error) {
    console.error('Error saving conversation status:', error);
  }
}

// Load liked messages from local storage
function loadLikedMessages() {
  try {
    const storedLikes = localStorage.getItem(LOCAL_STORAGE_LIKES_KEY);
    if (storedLikes) {
      messageLikes = JSON.parse(storedLikes);
    }
  } catch (error) {
    console.error('Error loading liked messages:', error);
    messageLikes = {};
  }
}

// Save liked messages to local storage
function saveLikedMessages() {
  try {
    localStorage.setItem(LOCAL_STORAGE_LIKES_KEY, JSON.stringify(messageLikes));
  } catch (error) {
    console.error('Error saving liked messages:', error);
  }
}

// Load messages from local storage
function loadLocalMessages() {
  try {
    const localMessages = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    if (localMessages) {
      const messages = JSON.parse(localMessages);
      messages.forEach(message => {
        if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
          createMessageElement(message, message.id);
        }
      });
    }
  } catch (error) {
    console.error('Error loading local messages:', error);
  }
}

// Save message to local storage
function saveMessageToLocalStorage(message, messageId) {
  try {
    const localMessages = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    let messages = localMessages ? JSON.parse(localMessages) : [];
    
    // Add the message ID to the message object
    const messageWithId = { ...message, id: messageId };
    
    // Add new message to the array
    messages.push(messageWithId);
    
    // Store in local storage
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving message to local storage:', error);
  }
}

// Initialize message input with typing indicator
function initMessageInput() {
  messageInput.addEventListener('input', function() {
    // Adjust height
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Enable/disable send button based on content
    const hasText = this.value.trim().length > 0;
    const hasMedia = selectedMedia.length > 0;
    sendButton.disabled = !(hasText || hasMedia);
    
    // Update typing indicator
    updateTypingStatus();
  });
  
  // When user stops typing
  messageInput.addEventListener('blur', function() {
    if (currentUser) {
      const userTypingRef = ref(database, `typing/${currentUser.uid}`);
      set(userTypingRef, null);
      clearTimeout(typingTimeout);
    }
  });
}

// Update user typing status
function updateTypingStatus() {
  if (!currentUser) return;
  
  // Clear previous timeout
  clearTimeout(typingTimeout);
  
  // Update typing status in database
  const userTypingRef = ref(database, `typing/${currentUser.uid}`);
  set(userTypingRef, {
    name: currentUser.displayName,
    timestamp: Date.now()
  });
  
  // Set timeout to clear typing status after 3 seconds of inactivity
  typingTimeout = setTimeout(() => {
    set(userTypingRef, null);
  }, 3000);
}

// Listen for typing indicators
function listenForTypingIndicators() {
  onValue(typingRef, (snapshot) => {
    const data = snapshot.val() || {};
    
    // Clear old typists
    typingUsers.clear();
    
    // Update typing users map
    Object.entries(data).forEach(([userId, userData]) => {
      // Don't show current user typing
      if (userId === currentUser?.uid) return;
      
      // Only show recent typing (last 3 seconds)
      if (Date.now() - userData.timestamp < 3000) {
        typingUsers.set(userId, userData.name);
      }
    });
    
    // Update typing indicator UI
    updateTypingIndicatorUI();
  });
}

// Update typing indicator UI
function updateTypingIndicatorUI() {
  const typingIndicator = document.getElementById('typingIndicator') || createTypingIndicator();
  
  if (typingUsers.size > 0) {
    let message = '';
    if (typingUsers.size === 1) {
      message = `${Array.from(typingUsers.values())[0]} is typing...`;
    } else if (typingUsers.size === 2) {
      message = `${Array.from(typingUsers.values()).join(' and ')} are typing...`;
    } else {
      message = 'Several people are typing...';
    }
    
    typingIndicator.textContent = message;
    typingIndicator.style.display = 'block';
  } else {
    typingIndicator.style.display = 'none';
  }
}

// Create typing indicator element
function createTypingIndicator() {
  let typingIndicator = document.getElementById('typingIndicator');
  
  if (!typingIndicator) {
    typingIndicator = document.createElement('div');
    typingIndicator.id = 'typingIndicator';
    typingIndicator.className = 'typing-indicator';
    typingIndicator.style.display = 'none';
    typingIndicator.style.padding = '8px 15px';
    typingIndicator.style.color = '#8899a6';
    typingIndicator.style.fontSize = '14px';
    typingIndicator.style.fontStyle = 'italic';
    
    // Insert before input container
    const inputContainer = document.querySelector('.input-container');
    document.body.insertBefore(typingIndicator, inputContainer);
  }
  
  return typingIndicator;
}

// Listen for global rate limit
function listenForRateLimit() {
  onValue(rateLimitRef, (snapshot) => {
    const timestamp = snapshot.val() || 0;
    globalRateLimit = timestamp;
  });
}

// Function to handle media selection
function handleMediaSelection(e) {
  const files = e.target.files;
  if (!files.length) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileType = file.type.split('/')[0]; // 'image' or 'video'
    
    if (selectedMedia.length >= 4) {
      alert('You can only attach up to 4 media files');
      break;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      continue;
    }

    // Create a preview of the selected media
    const reader = new FileReader();
    reader.onload = function(e) {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      
      if (fileType === 'image') {
        previewItem.innerHTML = `
          <img src="${e.target.result}" class="preview-image">
          <button class="remove-media" data-index="${selectedMedia.length}">×</button>
        `;
      } else if (fileType === 'video') {
        previewItem.innerHTML = `
          <video src="${e.target.result}" class="preview-video"></video>
          <button class="remove-media" data-index="${selectedMedia.length}">×</button>
        `;
      }
      
      mediaPreview.appendChild(previewItem);
      
      // Add event listener to remove button
      const removeButton = previewItem.querySelector('.remove-media');
      if (removeButton) {
        removeButton.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          removeMedia(index);
        });
      }
      
      // Enable send button if there's media
      sendButton.disabled = false;
    };
    
    reader.readAsDataURL(file);
    selectedMedia.push({
      file: file,
      type: fileType
    });
  }

  // Reset the file input
  e.target.value = '';
}

// Function to remove selected media
function removeMedia(index) {
  selectedMedia.splice(index, 1);
  updateMediaPreview();
  
  // Disable send button if no content
  if (selectedMedia.length === 0 && messageInput.value.trim() === '') {
    sendButton.disabled = true;
  }
}

// Update media preview after removal
function updateMediaPreview() {
  mediaPreview.innerHTML = '';
  
  selectedMedia.forEach((media, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    if (media.isGif) {
      // For GIFs that were added directly
      previewItem.innerHTML = `
        <img src="${media.url}" class="preview-image">
        <button class="remove-media" data-index="${index}">×</button>
      `;
      mediaPreview.appendChild(previewItem);
      
      // Add event listener to remove button
      previewItem.querySelector('.remove-media').addEventListener('click', function() {
        removeMedia(index);
      });
    } else if (media.type === 'image') {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewItem.innerHTML = `
          <img src="${e.target.result}" class="preview-image">
          <button class="remove-media" data-index="${index}">×</button>
        `;
        mediaPreview.appendChild(previewItem);
        
        // Add event listener to remove button
        previewItem.querySelector('.remove-media').addEventListener('click', function() {
          removeMedia(index);
        });
      };
      reader.readAsDataURL(media.file);
    } else if (media.type === 'video') {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewItem.innerHTML = `
          <video src="${e.target.result}" class="preview-video"></video>
          <button class="remove-media" data-index="${index}">×</button>
        `;
        mediaPreview.appendChild(previewItem);
        
        // Add event listener to remove button
        previewItem.querySelector('.remove-media').addEventListener('click', function() {
          removeMedia(index);
        });
      };
      reader.readAsDataURL(media.file);
    }
  });
}

// Geolocation and Flag Service
async function getCountryFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code.toLowerCase();
  } catch (error) {
    console.error('Failed to fetch country:', error);
    return 'unknown';
  }
}

// Format timestamp - Updated to only show time without date or weekday
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Listen for new messages
function listenForMessages() {
  // Set a limit on the number of messages to fetch from Firebase
  const messagesQuery = ref(database, 'messages');
  
  onChildAdded(messagesQuery, (snapshot) => {
    const message = snapshot.val();
    const messageId = snapshot.key;
    
    // Don't re-render existing messages
    if (document.querySelector(`[data-message-id="${messageId}"]`)) {
      return;
    }
    
    // Create the message element
    createMessageElement(message, messageId);
    
    // Save message to local storage for future retrieval
    saveMessageToLocalStorage(message, messageId);
  });
}

// Create message element
function createMessageElement(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);

  const flagUrl = `https://flagcdn.com/w320/${message.country || 'unknown'}.png`;
  const messageTime = formatTimestamp(message.timestamp);
  const isFollowing = followedUsers.has(message.userId);
  const followBtnDisplay = message.userId === currentUser?.uid ? 'none' : 'inline-block';
  
  // Check if conversation is marked as "full" (followed)
  const isConversationFull = conversationStatus[message.userId] === 'full';

  // Improved media handling
  let mediaHTML = '';
  if (message.media && message.media.length > 0) {
    mediaHTML = '<div class="media-container">';
    message.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          mediaHTML += `<img src="${media.url}" class="message-image" onclick="showFullImage('${media.url}')">`;
        } else if (media.type === 'video') {
          mediaHTML += `<video src="${media.url}" class="message-video" controls></video>`;
        }
      }
    });
    mediaHTML += '</div>';
  }

  // Check if message is liked by current user
  const isLiked = messageLikes[messageId] || false;
  
  messageElement.innerHTML = `
    <img src="${message.photoURL}" class="profile-image" alt="Profile">
    <div class="message-content">
      <div class="message-header">
        <span class="user-name">${message.name}</span>
        <img src="${flagUrl}" class="country-flag" alt="Flag" onerror="this.src='default-flag.png'">
        <span class="message-time">${messageTime}</span>
        <button class="follow-btn ${isFollowing || isConversationFull ? 'followed' : ''}" 
          data-user-id="${message.userId}" 
          onclick="toggleFollow('${message.userId}', '${message.name}')"
          style="display: ${followBtnDisplay}">
          ${isFollowing || isConversationFull ? 'Following' : 'Follow'}
        </button>
      </div>
      <div class="message-text">${message.text || ''}</div>
      ${mediaHTML}
      <div class="action-buttons">
        <button class="action-button like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${messageId}')">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="${isLiked ? '#f91880' : 'currentColor'}" d="${isLiked ? 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z' : 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z'}"></path>
          </svg>
          <span class="like-count">${message.likeCount || 0}</span>
        </button>
        <button class="action-button reply-btn" onclick="toggleReplySection('${messageId}')">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.85.85 0 0 0 .12.403.744.744 0 0 0 1.034.229c.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67a.75.75 0 0 0-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path>
          </svg>
          <span class="reply-count">${message.replyCount || 0}</span>
        </button>
      </div>
    </div>
  `;

  // Append message to chat container
  chatContainer.appendChild(messageElement);
  
  // Scroll to bottom if near bottom
  const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 200;
  if (isNearBottom) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Toggle like on a message
window.toggleLike = async function(messageId) {
  if (!currentUser) {
    alert('Please log in to like messages');
    return;
  }

  try {
    // Check if we already liked this message
    const isLiked = messageLikes[messageId] || false;
    
    // Update local storage first for instant feedback
    messageLikes[messageId] = !isLiked;
    saveLikedMessages();
    
    // Update the UI
    const likeButton = document.querySelector(`[data-message-id="${messageId}"] .like-btn`);
    const likeCountElement = document.querySelector(`[data-message-id="${messageId}"] .like-count`);
    
    if (likeButton && likeCountElement) {
      const currentCount = parseInt(likeCountElement.textContent) || 0;
      const newCount = isLiked ? currentCount - 1 : currentCount + 1;
      
      likeButton.classList.toggle('liked', !isLiked);
      likeCountElement.textContent = newCount;
      
      // Update the heart icon color
      const heartPath = likeButton.querySelector('path');
      if (heartPath) {
        heartPath.setAttribute('fill', !isLiked ? '#f91880' : 'currentColor');
        heartPath.setAttribute('d', !isLiked ? 
          'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z' : 
          'M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z');
      }
    }
    
    // Update the like count in Firebase
    const messageRef = ref(database, `messages/${messageId}`);
    const snapshot = await get(messageRef);
    
    if (snapshot.exists()) {
      const currentLikeCount = snapshot.val().likeCount || 0;
      const newLikeCount = isLiked ? currentLikeCount - 1 : currentLikeCount + 1;
      
      await update(messageRef, {
        likeCount: newLikeCount
      });
    }
    
  } catch (error) {
    console.error('Error toggling like:', error);
    // Revert the UI change if there was an error
    const isLiked = messageLikes[messageId] || false;
    messageLikes[messageId] = isLiked;
    saveLikedMessages();
    
    const likeButton = document.querySelector(`[data-message-id="${messageId}"] .like-btn`);
    if (likeButton) {
      likeButton.classList.toggle('liked', isLiked);
    }
  }
};

// Show reply section (slides up from bottom)
window.toggleReplySection = function(messageId) {
  // If this is already the active section, close it
  if (messageId === activeReplySectionId) {
    closeReplySection();
    return;
  }
  
  // Close any existing reply section
  if (activeReplySectionId) {
    closeReplySection();
  }
  
  // Create the reply section container if it doesn't exist
  let replySection = document.getElementById(`reply-section-${messageId}`);
  
  if (!replySection) {
    replySection = document.createElement('div');
    replySection.id = `reply-section-${messageId}`;
    replySection.className = 'reply-section';
    replySection.style.position = 'fixed';
    replySection.style.bottom = '0';
    replySection.style.left = '0';
    replySection.style.right = '0';
    replySection.style.height = '60vh';
    replySection.style.backgroundColor = '#15202b';
    replySection.style.borderTopLeftRadius = '16px';
    replySection.style.borderTopRightRadius = '16px';
    replySection.style.boxShadow = '0 -5px 15px rgba(0, 0, 0, 0.3)';
    replySection.style.zIndex = '1000';
    replySection.style.transform = 'translateY(100%)';
    replySection.style.transition = 'transform 0.3s ease-out';
    replySection.style.padding = '15px';
    replySection.style.display = 'flex';
    replySection.style.flexDirection = 'column';
    
    // Create header with close button
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    
    const title = document.createElement('h3');
    title.textContent = 'Replies';
    title.style.margin = '0';
    title.style.color = 'white';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closeReplySection);
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create replies container
    const repliesContainer = document.createElement('div');
    repliesContainer.id = `reply-messages-${messageId}`;
    repliesContainer.style.flex = '1';
    repliesContainer.style.overflowY = 'auto';
    repliesContainer.style.marginBottom = '15px';
    
    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.alignItems = 'center';
    inputContainer.style.backgroundColor = '#253341';
    inputContainer.style.borderRadius = '20px';
    inputContainer.style.padding = '8px 15px';
    
    const replyInput = document.createElement('textarea');
    replyInput.id = `reply-input-${messageId}`;
    replyInput.className = 'reply-input';
    replyInput.placeholder = 'Write a reply...';
    replyInput.style.flex = '1';
    replyInput.style.background = 'none';
    replyInput.style.border = 'none';
    replyInput.style.color = 'white';
    replyInput.style.resize = 'none';
    replyInput.style.outline = 'none';
    replyInput.style.minHeight = '40px';
    replyInput.style.maxHeight = '100px';
    
    // Handle input height adjustment
    replyInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Handle Enter key to send
    replyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendReply(messageId);
      }
    });
    
    const sendButton = document.createElement('button');
    sendButton.className = 'reply-send-btn';
    sendButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="#1da1f2" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
      </svg>
    `;
    sendButton.style.background = 'none';
    sendButton.style.border = 'none';
    sendButton.style.marginLeft = '10px';
    sendButton.style.cursor = 'pointer';
    sendButton.addEventListener('click', () => sendReply(messageId));
    
    inputContainer.appendChild(replyInput);
    inputContainer.appendChild(sendButton);
    
    // Add drag handle for closing
    const dragHandle = document.createElement('div');
    dragHandle.style.width = '50px';
    dragHandle.style.height = '5px';
    dragHandle.style.backgroundColor = '#38444d';
    dragHandle.style.borderRadius = '5px';
    dragHandle.style.margin = '0 auto 15px auto';
    dragHandle.style.cursor = 'grab';
    
    // Add touch events for swipe to close
    let startY = 0;
    let currentY = 0;
    
    dragHandle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      currentY = startY;
    });
    
    dragHandle.addEventListener('touchmove', (e) => {
      const y = e.touches[0].clientY;
      const diff = y - currentY;
      currentY = y;
      
      if (diff > 0) { // Only allow dragging down
        const newY = Math.min(100, replySection.offsetTop + diff);
        replySection.style.transform = `translateY(${newY}px)`;
      }
    });
    
    dragHandle.addEventListener('touchend', () => {
      if (currentY - startY > 50) {
        closeReplySection();
      } else {
        replySection.style.transform = 'translateY(0)';
      }
    });
    
    // Add all elements to the reply section
    replySection.appendChild(dragHandle);
    replySection.appendChild(header);
    replySection.appendChild(repliesContainer);
    replySection.appendChild(inputContainer);
    
    // Add to document
    document.body.appendChild(replySection);
  }
  
  // Set as active section
  activeReplySectionId = messageId;
  
  // Show the reply section with animation
  setTimeout(() => {
    replySection.style.transform = 'translateY(0)';
  }, 10);
  
  // Load replies for this message
  loadReplies(messageId);
  
  // Focus the input
  setTimeout(() => {
    const replyInput = document.getElementById(`reply-input-${messageId}`);
    if (replyInput) {
      replyInput.focus();
    }
  }, 300);
};

// Close the active reply section
function closeReplySection() {
  if (!activeReplySectionId) return;
  
  const replySection = document.getElementById(`reply-section-${activeReplySectionId}`);
  if (replySection) {
    replySection.style.transform = 'translateY(100%)';
    
    // Remove after animation completes
    setTimeout(() => {
      if (replySection.parentNode) {
        replySection.parentNode.removeChild(replySection);
      }
    }, 300);
  }
  
  activeReplySectionId = null;
}

// Load replies for a message
function loadReplies(parentMessageId) {
  // Get the replies container
  const repliesContainer = document.getElementById(`reply-messages-${parentMessageId}`);
  if (!repliesContainer) return;
  
  repliesContainer.innerHTML = '<div class="loading-replies">Loading replies...</div>';
  
  // Query for replies in Firebase
  const repliesRef = ref(database, 'replies');
  const parentRef = ref(database, `messages/${parentMessageId}`);
  
  // First check if parent message exists
  get(parentRef).then((snapshot) => {
    if (!snapshot.exists()) {
      repliesContainer.innerHTML = '<div class="no-replies">This message no longer exists</div>';
      return;
    }
    
    // Now get replies
    get(repliesRef).then((snapshot) => {
      repliesContainer.innerHTML = '';
      
      if (snapshot.exists()) {
        const replies = snapshot.val();
        let hasReplies = false;
        
        // Filter replies for this parent message
        Object.entries(replies).forEach(([replyId, reply]) => {
          if (reply.parentMessageId === parentMessageId) {
            hasReplies = true;
            createReplyElement(reply, replyId, repliesContainer);
          }
        });
        
        if (!hasReplies) {
          repliesContainer.innerHTML = '<div class="no-replies">No replies yet</div>';
        }
      } else {
        repliesContainer.innerHTML = '<div class="no-replies">No replies yet</div>';
      }
      
      // Scroll to bottom
      setTimeout(() => {
        repliesContainer.scrollTop = repliesContainer.scrollHeight;
      }, 100);
    }).catch((error) => {
      console.error('Error fetching replies:', error);
      repliesContainer.innerHTML = '<div class="no-replies">Error loading replies</div>';
    });
  }).catch((error) => {
    console.error('Error checking parent message:', error);
    repliesContainer.innerHTML = '<div class="no-replies">Error loading message</div>';
  });
}

// Create a reply element
function createReplyElement(reply, replyId, container) {
  const replyElement = document.createElement('div');
  replyElement.classList.add('reply-message');
  replyElement.setAttribute('data-reply-id', replyId);
  
  const messageTime = formatTimestamp(reply.timestamp);
  
  // Media handling for replies
  let mediaHTML = '';
  if (reply.media && reply.media.length > 0) {
    mediaHTML = '<div class="reply-media-container">';
    reply.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          mediaHTML += `<img src="${media.url}" class="reply-image" onclick="showFullImage('${media.url}')">`;
        } else if (media.type === 'video') {
          mediaHTML += `<video src="${media.url}" class="reply-video" controls></video>`;
        }
      }
    });
    mediaHTML += '</div>';
  }
  
  replyElement.innerHTML = `
    <div class="reply-header">
      <img src="${reply.photoURL}" class="reply-profile-image">
      <span class="reply-user-name">${reply.name}</span>
      <span class="reply-time">${messageTime}</span>
    </div>
    <div class="reply-text">${reply.text || ''}</div>
    ${mediaHTML}
  `;
  
  container.appendChild(replyElement);
}

// Send a reply to a message
window.sendReply = function(parentMessageId) {
  if (!currentUser) {
    alert('You must log in to reply');
    return;
  }
  
  const replyInput = document.getElementById(`reply-input-${parentMessageId}`);
  const replyText = replyInput.value.trim();
  
  if (!replyText) {
    return; // Don't send empty replies
  }
  
  // Current time
  const currentTime = Date.now();
  
  // Check personal rate limit (3 seconds between messages)
  if (currentTime - lastMessageTime < 3000) {
    alert('Please wait a few seconds before sending another message');
    return;
  }
  
  try {
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    
    // Create new reply
    const repliesRef = ref(database, 'replies');
    const newReplyRef = push(repliesRef);
    const replyData = {
      userId: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      text: replyText,
      timestamp: currentTime,
      parentMessageId: parentMessageId
    };
    
    // Add reply to database
    set(newReplyRef, replyData).then(() => {
      // Clear reply input
      replyInput.value = '';
      replyInput.style.height = 'auto';
      
      // Update the reply count on the parent message
      const parentMessageRef = ref(database, `messages/${parentMessageId}`);
      get(parentMessageRef).then((snapshot) => {
        if (snapshot.exists()) {
          const currentCount = snapshot.val().replyCount || 0;
          update(parentMessageRef, {
            replyCount: currentCount + 1
          });
          
          // Update the UI
          const replyCountElement = document.querySelector(`[data-message-id="${parentMessageId}"] .reply-count`);
          if (replyCountElement) {
            replyCountElement.textContent = currentCount + 1;
          }
        }
      });
      
      // Create the reply element
      const repliesContainer = document.getElementById(`reply-messages-${parentMessageId}`);
      if (repliesContainer.querySelector('.no-replies')) {
        repliesContainer.innerHTML = ''; // Clear "No replies yet" message
      }
      createReplyElement(replyData, newReplyRef.key, repliesContainer);
      
      // Scroll to bottom
      setTimeout(() => {
        repliesContainer.scrollTop = repliesContainer.scrollHeight;
      }, 100);
      
      // Set last message time
      lastMessageTime = currentTime;
      
    }).catch((error) => {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    }).finally(() => {
      loadingIndicator.style.display = 'none';
    });
    
  } catch (error) {
    console.error('Error sending reply:', error);
    alert('Failed to send reply. Please try again.');
    loadingIndicator.style.display = 'none';
  }
};

// Show full image in modal
window.showFullImage = function(url) {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';
  modal.style.cursor = 'pointer';
  
  const img = document.createElement('img');
  img.src = url;
  img.style.maxWidth = '90%';
  img.style.maxHeight = '90%';
  img.style.objectFit = 'contain';
  
  modal.appendChild(img);
  document.body.appendChild(modal);
  
  modal.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
};

// Authentication State Observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data() || {};
      const countryCode = await getCountryFromIP();

      currentUser = {
        uid: user.uid,
        displayName: user.displayName || userData?.displayName || "User" + Math.floor(Math.random() * 10000),
        photoURL: user.photoURL || userData?.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
        country: countryCode
      };

      // Create user in database if not exists
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: new Date().toISOString()
        });
      }

      // Fetch followed users
      await fetchFollowedUsers();
      
      // Set up presence system
      setupPresence(user.uid);
      
      // Hide loading indicator once auth is complete
      loadingIndicator.style.display = 'none';
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      loadingIndicator.style.display = 'none';
    }
  } else {
    // Sign in anonymously if no user
    signInAnonymously(auth)
      .catch((error) => {
        console.error('Anonymous auth error:', error);
        loadingIndicator.style.display = 'none';
      });
  }
});

// Set up user presence
function setupPresence(userId) {
  const userStatusRef = ref(database, `presence/${userId}`);
  
  // Set user as online
  const onlineData = {
    status: 'online',
    lastSeen: Date.now()
  };
  
  // Set user as offline when disconnected
  const connectedRef = ref(database, '.info/connected');
  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      // User is connected
      set(userStatusRef, onlineData);
      
      // Clear presence on disconnect
      onDisconnect(userStatusRef).set({
        status: 'offline',
        lastSeen: Date.now()
      });
    }
  });
}

// Fetch Followed Users
async function fetchFollowedUsers() {
  if (!currentUser) return;

  try {
    const followQuery = query(
      collection(db, 'follows'),
      where('followerUserId', '==', currentUser.uid)
    );

    const followSnapshot = await getDocs(followQuery);
    followedUsers.clear();
    followSnapshot.docs.forEach(doc => {
      const followedUserId = doc.data().followedUserId;
      followedUsers.add(followedUserId);
      
      // Mark this conversation as "full" in local storage
      conversationStatus[followedUserId] = 'full';
    });
    
    // Save updated conversation status
    saveConversationStatus();

    updateFollowButtons();
  } catch (error) {
    console.error('Error fetching followed users:', error);
  }
}

// Update Follow Buttons
function updateFollowButtons() {
  document.querySelectorAll('.follow-btn').forEach(btn => {
    const userId = btn.getAttribute('data-user-id');
    const isFollowed = followedUsers.has(userId) || conversationStatus[userId] === 'full';
    
    if (userId === currentUser?.uid) {
      btn.style.display = 'none'; // Hide follow button for own messages
    } else {
      btn.textContent = isFollowed ? 'Following' : 'Follow';
      btn.classList.toggle('followed', isFollowed);
    }
  });
}

// Follow/Unfollow User
window.toggleFollow = async function(userId, userName) {
  if (!currentUser) {
    alert('Please log in to follow users');
    return;
  }

  try {
    const followQuery = query(
      collection(db, 'follows'),
      where('followerUserId', '==', currentUser.uid),
      where('followedUserId', '==', userId)
    );

    const followSnapshot = await getDocs(followQuery);

    if (followSnapshot.empty) {
      // Follow the user
      await addDoc(collection(db, 'follows'), {
        followerUserId: currentUser.uid,
        followedUserId: userId,
        followedUserName: userName,
        timestamp: Date.now()
      });
      followedUsers.add(userId);
      
      // Mark conversation as "full" in local storage
      conversationStatus[userId] = 'full';
      saveConversationStatus();
    } else {
      // Unfollow the user
      followSnapshot.docs.forEach(async (followDoc) => {
        await deleteDoc(doc(db, 'follows', followDoc.id));
      });
      followedUsers.delete(userId);
      
      // Remove "full" status
      delete conversationStatus[userId];
      saveConversationStatus();
    }

    updateFollowButtons();
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
  }
};

// Simplified media upload function that uses Firebase for storage
async function uploadMedia(file) {
  try {
    // If the media is already a URL (like a GIF), just return it
    if (typeof file === 'string' || file.url) {
      return {
        url: file.url || file,
        type: 'image'
      };
    }
    
    // Create a unique filename
    const fileName = `${Date.now()}_${file.name}`;
    const fileType = file.type.split('/')[0]; // 'image' or 'video'
    
    // Create a temporary URL for the file
    const objectURL = URL.createObjectURL(file);
    
    // Upload file to Firebase Storage via a Cloud Function proxy
    const uploadEndpoint = `https://us-central1-globalchat-2d669.cloudfunctions.net/uploadMedia`;
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUser.uid);
    formData.append('fileName', fileName);
    
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(objectURL);
    
    return {
      url: result.url,
      type: fileType
    };
  } catch (error) {
    console.error('Media upload error:', error);
    
    // FALLBACK: If Cloud Function upload fails, use data URL approach
    // This is less efficient but will work as a fallback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve({
          url: event.target.result, // Use data URL as fallback
          type: file.type.split('/')[0]
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

// Manage messages in Firebase (limit to MAX_FIREBASE_MESSAGES)
async function manageFirebaseMessages() {
  try {
    const messagesRef = ref(database, 'messages');
    const snapshot = await get(messagesRef);
    
    if (snapshot.exists()) {
      const messages = snapshot.val();
      const messageEntries = Object.entries(messages);
      
      // If we have more than MAX_FIREBASE_MESSAGES, remove the oldest ones
      if (messageEntries.length > MAX_FIREBASE_MESSAGES) {
        // Sort by timestamp (oldest first)
        messageEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Keep only the newest MAX_FIREBASE_MESSAGES
        const messagesToRemove = messageEntries.slice(0, messageEntries.length - MAX_FIREBASE_MESSAGES);
        
        // Remove the oldest messages
        for (const [messageId] of messagesToRemove) {
          await set(ref(database, `messages/${messageId}`), null);
        }
      }
    }
  } catch (error) {
    console.error('Error managing Firebase messages:', error);
  }
}

// Send Message Function with Media Support
async function sendMessage(parentMessageId = null) {
  if (!currentUser) {
    alert('You must log in to continue');
    return;
  }

  const messageText = messageInput.value.trim();
  const currentTime = Date.now();
  const hasMedia = selectedMedia.length > 0;

  // Check if content exists
  if (!messageText && !hasMedia) return;

  // Check personal rate limit (3 seconds between messages)
  if (currentTime - lastMessageTime < 3000) {
    alert('Please wait a few seconds before sending another message');
    return;
  }

  // Check global rate limit (3 seconds for any user)
  if (currentTime - globalRateLimit < 3000) {
    const waitTime = Math.ceil((3000 - (currentTime - globalRateLimit)) / 1000);
    alert(`The chat is busy. Please wait ${waitTime} seconds before sending.`);
    return;
  }

  try {
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    
    // Update global rate limit timestamp
    await set(rateLimitRef, currentTime);
    
    // Clear typing status
    const userTypingRef = ref(database, `typing/${currentUser.uid}`);
    set(userTypingRef, null);
    
    // Upload all media files
    const mediaUrls = [];
    if (hasMedia) {
      for (const media of selectedMedia) {
        if (media.isGif) {
          // GIFs are already URLs, no need to upload
          mediaUrls.push({
            url: media.url,
            type: 'image',
            isGif: true
          });
        } else {
          const uploadResult = await uploadMedia(media.file);
          mediaUrls.push(uploadResult);
        }
      }
    }

    // Create new message
    const newMessageRef = push(chatRef);
    const messageData = {
      userId: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      text: messageText,
      media: mediaUrls,
      timestamp: currentTime,
      country: currentUser.country,
      parentMessageId: parentMessageId,
      replyCount: 0,
      likeCount: 0
    };

    // Check if this conversation should be marked as "full"
    const conversationPartnerId = parentMessageId ? null : null; // For direct replies
    if (conversationPartnerId && conversationStatus[conversationPartnerId] === 'full') {
      // This is a reply in a "full" conversation, inherit the status
      messageData.fullConversation = true;
    }

    // Add message to database
    await set(newMessageRef, messageData);
    
    // Save message to local storage
    saveMessageToLocalStorage(messageData, newMessageRef.key);
    
    // Manage Firebase messages (keep only MAX_FIREBASE_MESSAGES)
    await manageFirebaseMessages();
    
    // Update parent message reply count if this is a reply
    if (parentMessageId) {
      const parentRef = ref(database, `messages/${parentMessageId}`);
      const snapshot = await get(parentRef);
      if (snapshot.exists()) {
        await update(parentRef, {
          replyCount: (snapshot.val().replyCount || 0) + 1
        });
      }
    }

    // Reset UI
    messageInput.value = '';
    messageInput.style.height = 'auto';
    selectedMedia = [];
    mediaPreview.innerHTML = '';
    sendButton.disabled = true;
    lastMessageTime = currentTime;
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

// Add CSS for Twitter-like styling
function addTwitterStyleCSS() {
  const style = document.createElement('style');
  style.textContent = `
    
    
    .profile-image {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin-right: 12px;
      object-fit: cover;
    }
    
   
   
    
    /* Action buttons (like, reply) */
    .action-buttons {
      display: flex;
      margin-top: 4px;
    }
    
    .action-button {
      display: flex;
      align-items: center;
      background: none;
      border: none;
      color: #8899a6;
      cursor: pointer;
      padding: 5px 8px;
      border-radius: 20px;
    }
    
    .action-button svg {
      width: 18px;
      height: 18px;
      margin-right: 6px;
    }
    
    /* Like button */
    .like-btn.liked {
      color: #f91880;
    }
    
    .like-count, .reply-count {
      margin-left: 4px;
      font-size: 14px;
    }
    
    /* Reply section */
    .reply-section {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60vh;
      background-color: #15202b;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      transform: translateY(100%);
      transition: transform 0.3s ease-out;
      padding: 15px;
      display: flex;
      flex-direction: column;
    }
    
    .reply-messages {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 15px;
    }
    
    .reply-message {
      padding: 12px 16px;
      border-bottom: 1px solid #38444d;
    }
    
    .reply-header {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .reply-profile-image {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      margin-right: 8px;
      object-fit: cover;
    }
    
    .reply-input-container {
      display: flex;
      align-items: center;
      background-color: #253341;
      border-radius: 20px;
      padding: 8px 15px;
    }
    
    /* Loading indicator */
    #loadingIndicator {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .profile-image {
        width: 40px;
        height: 40px;
      }
      
      .media-container {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

// Add the Twitter-like styling
addTwitterStyleCSS();

// Initialize the app
initApp();