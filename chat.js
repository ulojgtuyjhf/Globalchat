
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

// DOM Elements - Cache for performance
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const imageButton = document.getElementById('imageButton');
const videoButton = document.getElementById('videoButton');
const mediaPreview = document.getElementById('mediaPreview');
const sendButton = document.getElementById('sendButton');
const loadingIndicator = document.getElementById('loadingIndicator');

// Application state variables
let currentUser = null;
let selectedMedia = [];
let lastMessageTime = 0;
const followedUsers = new Set();
let typingTimeout = null;
const typingUsers = new Map();
let globalRateLimit = Date.now();

// Message management optimization variables
const MAX_FIREBASE_MESSAGES = 50; // Increased from 4 for better history
const LOCAL_STORAGE_MESSAGES_KEY = 'localMessages';
const LOCAL_STORAGE_CONVERSATION_STATUS_KEY = 'conversationStatus';
let conversationStatus = {};
const MESSAGE_BATCH_SIZE = 20; // Number of messages to load at once
let lastLoadedMessageTimestamp = 0;
let isLoadingMoreMessages = false;
let allMessagesLoaded = false;
let visibleMessages = new Map(); // Track which messages are rendered in DOM
const MESSAGE_RENDER_BUFFER = 50; // Keep this many messages in DOM

// Virtual scrolling variables
let scrollObserver;
let lastScrollPosition = 0;
let ticking = false;
let pendingMessageBatch = [];
let messageRenderQueue = [];
let isRendering = false;

// Initialize app
function initApp() {
  // Load conversation status from local storage
  loadConversationStatus();
  
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
  
  // Set up virtual scrolling
  setupVirtualScrolling();
  
  // Load messages from local storage first for instant display
  loadLocalMessages();
  
  // Then listen for new messages from Firebase
  listenForRecentMessages();
  
  // Listen for global rate limit
  listenForRateLimit();
  
  // Add scroll event listener for pagination
  chatContainer.addEventListener('scroll', handleScroll);
  
  // Update reaction icon in comment button
  updateCommentButtonIcon();
}

// Update the comment button icon to show emoji icon
function updateCommentButtonIcon() {
  // Find all reply buttons and update their inner SVG to emoji icon
  const replyButtons = document.querySelectorAll('.reply-btn');
  
  replyButtons.forEach(button => {
    // Keep the count text
    const countText = button.textContent.trim();
    
    // Replace with emoji SVG
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M12 22.75C6.072 22.75 1.25 17.928 1.25 12S6.072 1.25 12 1.25 22.75 6.072 22.75 12 17.928 22.75 12 22.75zm0-20C6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25s9.25-4.15 9.25-9.25S17.1 2.75 12 2.75z"></path>
        <path d="M12 17.115c-2.83 0-5.12-2.3-5.12-5.13s2.29-5.13 5.12-5.13c2.82 0 5.12 2.3 5.12 5.13s-2.3 5.13-5.12 5.13zm-3.07-5.13c0 1.7 1.38 3.09 3.07 3.09s3.06-1.39 3.06-3.09c0-1.71-1.37-3.09-3.06-3.09s-3.07 1.38-3.07 3.09z"></path>
        <path d="M8.93 13.8c-.53 0-.95-.42-.95-.95s.42-.95.95-.95.95.42.95.95-.42.95-.95.95zm6.18 0c-.53 0-.95-.42-.95-.95s.42-.95.95-.95.95.42.95.95-.42.95-.95.95z"></path>
      </svg>
      ${countText}
    `;
  });
}

// Set up virtual scrolling with Intersection Observer
function setupVirtualScrolling() {
  // Clean up existing observer if any
  if (scrollObserver) {
    scrollObserver.disconnect();
  }
  
  // Create new IntersectionObserver
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const messageId = entry.target.getAttribute('data-message-id');
      
      if (entry.isIntersecting) {
        // Mark message as visible
        visibleMessages.set(messageId, true);
      } else {
        // Mark message as not visible
        visibleMessages.set(messageId, false);
      }
    });
    
    // Clean up invisible messages beyond buffer
    scheduleCleanupInvisibleMessages();
  }, {
    root: chatContainer,
    rootMargin: '300px 0px', // Load messages before they come into view
    threshold: 0.1
  });
}

// Schedule cleanup of invisible messages to prevent too frequent DOM updates
let cleanupTimeout = null;
function scheduleCleanupInvisibleMessages() {
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
  }
  
  cleanupTimeout = setTimeout(() => {
    cleanupInvisibleMessages();
  }, 1000); // Cleanup every second at most
}

// Clean up messages that are far from viewport to reduce DOM nodes
function cleanupInvisibleMessages() {
  // Count visible messages
  let visibleCount = 0;
  const visibleIds = [];
  
  visibleMessages.forEach((isVisible, id) => {
    if (isVisible) {
      visibleCount++;
      visibleIds.push(id);
    }
  });
  
  // If we have more than our buffer limit, remove some far ones
  if (document.querySelectorAll('.message').length > MESSAGE_RENDER_BUFFER) {
    const allMessages = Array.from(document.querySelectorAll('.message'));
    
    // Sort messages by position in chat
    allMessages.sort((a, b) => {
      const aPos = a.offsetTop;
      const bPos = b.offsetTop;
      return aPos - bPos;
    });
    
    // Get scroll position
    const scrollPos = chatContainer.scrollTop;
    
    // Find messages far from viewport
    const messagesToRemove = allMessages.filter(msg => {
      const msgId = msg.getAttribute('data-message-id');
      const msgPos = msg.offsetTop;
      const distance = Math.abs(msgPos - scrollPos);
      
      // Keep messages close to viewport and recent messages
      return distance > 2000 && !visibleIds.includes(msgId);
    });
    
    // Remove furthest messages but keep at least min number
    if (allMessages.length - messagesToRemove.length >= MESSAGE_RENDER_BUFFER / 2) {
      messagesToRemove.slice(0, messagesToRemove.length / 2).forEach(msg => {
        msg.remove();
        visibleMessages.delete(msg.getAttribute('data-message-id'));
      });
    }
  }
}

// Efficiently handle scroll events for pagination
function handleScroll() {
  lastScrollPosition = chatContainer.scrollTop;
  
  // Use requestAnimationFrame to limit scroll event handling
  if (!ticking) {
    window.requestAnimationFrame(() => {
      // If user scrolls near top and we're not already loading, load more messages
      if (lastScrollPosition < 200 && !isLoadingMoreMessages && !allMessagesLoaded) {
        loadMoreMessages();
      }
      ticking = false;
    });
    ticking = true;
  }
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

// Load messages from local storage with optimization
function loadLocalMessages() {
  try {
    const localMessages = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    if (localMessages) {
      const messages = JSON.parse(localMessages);
      
      // Sort messages by timestamp
      messages.sort((a, b) => b.timestamp - a.timestamp);
      
      // Take only the most recent batch
      const recentMessages = messages.slice(0, MESSAGE_BATCH_SIZE);
      
      // Track the oldest message timestamp for pagination
      if (recentMessages.length > 0) {
        lastLoadedMessageTimestamp = recentMessages[recentMessages.length - 1].timestamp;
      }
      
      // Batch render messages for performance
      batchRenderMessages(recentMessages);
    }
  } catch (error) {
    console.error('Error loading local messages:', error);
  }
}

// Batch render messages for better performance
function batchRenderMessages(messages) {
  // Sort messages by timestamp (newest last for chat display)
  messages.sort((a, b) => a.timestamp - b.timestamp);
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  // Process messages in batches
  for (const message of messages) {
    if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
      const messageElement = createMessageElementOffscreen(message, message.id);
      fragment.appendChild(messageElement);
    }
  }
  
  // Add all messages to DOM at once
  chatContainer.appendChild(fragment);
  
  // Observe all new messages for virtual scrolling
  document.querySelectorAll('.message:not([data-observed="true"])').forEach(element => {
    scrollObserver.observe(element);
    element.setAttribute('data-observed', 'true');
  });
  
  // Update emoji icon in comment buttons
  updateCommentButtonIcon();
  
  // Scroll to bottom for new messages if user was at bottom
  if (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 200) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Process message render queue to avoid UI blocking
function processRenderQueue() {
  if (isRendering || messageRenderQueue.length === 0) return;
  
  isRendering = true;
  
  // Get a batch of messages to render
  const batch = messageRenderQueue.splice(0, 5);
  
  // Create a document fragment
  const fragment = document.createDocumentFragment();
  
  // Add each message to the fragment
  batch.forEach(item => {
    const { message, messageId } = item;
    if (!document.querySelector(`[data-message-id="${messageId}"]`)) {
      const element = createMessageElementOffscreen(message, messageId);
      fragment.appendChild(element);
    }
  });
  
  // Add fragment to DOM
  chatContainer.appendChild(fragment);
  
  // Observe new elements
  batch.forEach(item => {
    const element = document.querySelector(`[data-message-id="${item.messageId}"]`);
    if (element && !element.hasAttribute('data-observed')) {
      scrollObserver.observe(element);
      element.setAttribute('data-observed', 'true');
    }
  });
  
  // Update emoji icon in comment buttons
  updateCommentButtonIcon();
  
  isRendering = false;
  
  // If more messages in queue, continue processing
  if (messageRenderQueue.length > 0) {
    setTimeout(processRenderQueue, 10);
  }
}

// Queue message for rendering
function queueMessageForRendering(message, messageId) {
  messageRenderQueue.push({ message, messageId });
  
  // Start processing queue if not already processing
  if (!isRendering) {
    processRenderQueue();
  }
}

// Save message to local storage with optimization
function saveMessageToLocalStorage(message, messageId) {
  try {
    // Get existing messages
    const localMessages = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    let messages = localMessages ? JSON.parse(localMessages) : [];
    
    // Add message ID to the message object
    const messageWithId = { ...message, id: messageId };
    
    // Check if message already exists (avoid duplicates)
    const existingIndex = messages.findIndex(m => m.id === messageId);
    if (existingIndex >= 0) {
      messages[existingIndex] = messageWithId;
    } else {
      // Add new message to the array
      messages.push(messageWithId);
    }
    
    // Sort by timestamp (newest first)
    messages.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit the number of messages in localStorage to prevent exceeding quota
    if (messages.length > 200) {
      messages = messages.slice(0, 200);
    }
    
    // Store in local storage
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving message to local storage:', error);
    
    // If quota exceeded, clear some old messages
    if (error.name === 'QuotaExceededError') {
      try {
        const localMessages = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
        if (localMessages) {
          let messages = JSON.parse(localMessages);
          // Keep only recent messages
          messages = messages.slice(0, 50);
          localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messages));
        }
      } catch (clearError) {
        console.error('Failed to clear message storage:', clearError);
      }
    }
  }
}

// Initialize message input with typing indicator
function initMessageInput() {
  // Use a more efficient approach for input height adjustment
  let inputResizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      if (entry.target === messageInput) {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
      }
    }
  });
  
  inputResizeObserver.observe(messageInput);
  
  // Use debounced input handler for better performance
  let inputDebounceTimer;
  messageInput.addEventListener('input', function() {
    // Clear previous timer
    clearTimeout(inputDebounceTimer);
    
    // Enable/disable send button based on content
    const hasText = this.value.trim().length > 0;
    const hasMedia = selectedMedia.length > 0;
    sendButton.disabled = !(hasText || hasMedia);
    
    // Use debounce for typing indicator to reduce network calls
    inputDebounceTimer = setTimeout(() => {
      updateTypingStatus();
    }, 300);
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

// Listen for typing indicators with optimization
function listenForTypingIndicators() {
  // Use value event with throttling
  let lastTypingUpdate = 0;
  
  onValue(typingRef, (snapshot) => {
    const now = Date.now();
    // Throttle updates to once per 500ms for better performance
    if (now - lastTypingUpdate < 500) return;
    lastTypingUpdate = now;
    
    const data = snapshot.val() || {};
    
    // Clear old typists
    typingUsers.clear();
    
    // Update typing users map
    Object.entries(data).forEach(([userId, userData]) => {
      // Don't show current user typing
      if (userId === currentUser?.uid) return;
      
      // Only show recent typing (last 3 seconds)
      if (now - userData.timestamp < 3000) {
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

// Optimized media selection handler
function handleMediaSelection(e) {
  const files = e.target.files;
  if (!files.length) return;

  // Use image compression before preview to save memory
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

    // Create optimized preview
    if (fileType === 'image') {
      createOptimizedImagePreview(file, selectedMedia.length);
    } else if (fileType === 'video') {
      createVideoPreview(file, selectedMedia.length);
    }
    
    // Add to selected media array
    selectedMedia.push({
      file: file,
      type: fileType
    });
  }

  // Enable send button if there's media
  if (selectedMedia.length > 0) {
    sendButton.disabled = false;
  }

  // Reset the file input
  e.target.value = '';
}

// Create optimized image preview
function createOptimizedImagePreview(file, index) {
  // Create a new image element
  const img = new Image();
  
  // Create URL for the file
  const url = URL.createObjectURL(file);
  
  // Set up onload handler
  img.onload = function() {
    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate new dimensions (max 800px width)
    let width = img.width;
    let height = img.height;
    const maxWidth = 800;
    
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Draw image on canvas
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to optimized data URL
    const optimizedUrl = canvas.toDataURL('image/jpeg', 0.7);
    
    // Create preview element
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.innerHTML = `
      <img src="${optimizedUrl}" class="preview-image">
      <button class="remove-media" data-index="${index}">×</button>
    `;
    mediaPreview.appendChild(previewItem);
    
    // Add event listener to remove button
    previewItem.querySelector('.remove-media').addEventListener('click', function() {
      removeMedia(parseInt(this.getAttribute('data-index')));
    });
    
    // Revoke the original object URL to free memory
    URL.revokeObjectURL(url);
  };
  
  img.src = url;
}

// Create video preview
function createVideoPreview(file, index) {
  const url = URL.createObjectURL(file);
  
  const previewItem = document.createElement('div');
  previewItem.className = 'preview-item';
  previewItem.innerHTML = `
    <video src="${url}" class="preview-video"></video>
    <button class="remove-media" data-index="${index}">×</button>
  `;
  mediaPreview.appendChild(previewItem);
  
  // Add event listener to remove button
  previewItem.querySelector('.remove-media').addEventListener('click', function() {
    const index = parseInt(this.getAttribute('data-index'));
    removeMedia(index);
    URL.revokeObjectURL(url);
  });
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

// Update media preview after removal - Optimized
function updateMediaPreview() {
  // Clear preview container
  mediaPreview.innerHTML = '';
  
  selectedMedia.forEach((media, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    if (media.type === 'image') {
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
      // Use smaller chunk size for progressive loading
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
    // Cache the country code in localStorage to reduce API calls
    const cachedCountry = localStorage.getItem('userCountry');
    if (cachedCountry) {
      return cachedCountry;
    }
    
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code.toLowerCase();
    
    // Cache for future use
    localStorage.setItem('userCountry', countryCode);
    
    return countryCode;
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

// Listen for new messages - Optimized for pagination and performance
function listenForRecentMessages() {
  // Query only the most recent messages
  const messagesQuery = ref(database, 'messages');
  
  // Use onChildAdded to efficiently get only new messages
  onChildAdded(messagesQuery, (snapshot) => {
    const message = snapshot.val();
    const messageId = snapshot.key;
    
    // Don't re-render existing messages
    if (document.querySelector(`[data-message-id="${messageId}"]`)) {
      return;
    }
    
    // Add to pending batch for efficient rendering
    pendingMessageBatch.push({ message, messageId });
    
    // If this is first message in batch, schedule batch processing
    if (pendingMessageBatch.length === 1) {
      setTimeout(processPendingMessageBatch, 100);
    }
    
    // Save message to local storage for future retrieval
    saveMessageToLocalStorage(message, messageId);
  });
}

// Process pending message batch
function processPendingMessageBatch() {
  if (pendingMessageBatch.length === 0) return;
  
  const batch = [...pendingMessageBatch];
  pendingMessageBatch = [];
  
  // Sort by timestamp (oldest first for chat display)
  batch.sort((a, b) => a.message.timestamp - b.message.timestamp);
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  batch.forEach(({ message, messageId }) => {
    if (!document.querySelector(`[data-message-id="${messageId}"]`)) {
      const messageElement = createMessageElementOffscreen(message, messageId);
      fragment.appendChild(messageElement);
    }
  });
  
  // Append all messages at once
  chatContainer.appendChild(fragment);
  
  // Observe new messages for virtual scrolling
  batch.forEach(({ messageId }) => {
    const element = document.querySelector(`[data-message-id="${messageId}"]`);
    
    
    if (element && !element.hasAttribute('data-observed')) {
      scrollObserver.observe(element);
      element.setAttribute('data-observed', 'true');
    }
  });
  
  // Update emoji icon in comment buttons
  updateCommentButtonIcon();
  
  // Check if user is near bottom to auto-scroll
  const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 200;
  if (isNearBottom) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Load more messages (pagination) when scrolling up
async function loadMoreMessages() {
  if (isLoadingMoreMessages || allMessagesLoaded) return;
  
  isLoadingMoreMessages = true;
  
  try {
    // Get local messages first
    const localMessages = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    const messages = localMessages ? JSON.parse(localMessages) : [];
    
    // Find messages older than lastLoadedMessageTimestamp
    const olderMessages = messages.filter(msg => msg.timestamp < lastLoadedMessageTimestamp);
    olderMessages.sort((a, b) => b.timestamp - a.timestamp);
    
    // Get next batch
    const nextBatch = olderMessages.slice(0, MESSAGE_BATCH_SIZE);
    
    if (nextBatch.length > 0) {
      // Update last loaded timestamp
      lastLoadedMessageTimestamp = nextBatch[nextBatch.length - 1].timestamp;
      
      // Remember current scroll height
      const oldScrollHeight = chatContainer.scrollHeight;
      
      // Render older messages at the top
      const fragment = document.createDocumentFragment();
      nextBatch.sort((a, b) => a.timestamp - b.timestamp); // Oldest first for chronological order
      
      nextBatch.forEach(message => {
        if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
          const messageElement = createMessageElementOffscreen(message, message.id);
          fragment.appendChild(messageElement);
        }
      });
      
      // Insert at the beginning
      chatContainer.insertBefore(fragment, chatContainer.firstChild);
      
      // Maintain scroll position so it doesn't jump
      chatContainer.scrollTop = chatContainer.scrollHeight - oldScrollHeight;
      
      // Observe new messages
      nextBatch.forEach(message => {
        const element = document.querySelector(`[data-message-id="${message.id}"]`);
        if (element && !element.hasAttribute('data-observed')) {
          scrollObserver.observe(element);
          element.setAttribute('data-observed', 'true');
        }
      });
      
      // Update emoji icons
      updateCommentButtonIcon();
    } else {
      // If no more local messages, try to load from Firebase
      await loadOlderMessagesFromFirebase();
    }
  } catch (error) {
    console.error('Error loading more messages:', error);
  } finally {
    isLoadingMoreMessages = false;
  }
}

// Load older messages from Firebase when local storage is exhausted
async function loadOlderMessagesFromFirebase() {
  try {
    // Create query for older messages
    const messagesRef = ref(database, 'messages');
    const snapshot = await get(messagesRef);
    
    if (snapshot.exists()) {
      const firebaseMessages = [];
      snapshot.forEach(childSnapshot => {
        const message = childSnapshot.val();
        const messageId = childSnapshot.key;
        firebaseMessages.push({ ...message, id: messageId });
      });
      
      // Filter for messages older than what we already have
      const olderMessages = firebaseMessages.filter(msg => 
        msg.timestamp < lastLoadedMessageTimestamp && 
        !document.querySelector(`[data-message-id="${msg.id}"]`)
      );
      
      // Sort by timestamp (newest first)
      olderMessages.sort((a, b) => b.timestamp - a.timestamp);
      
      // Take the next batch
      const nextBatch = olderMessages.slice(0, MESSAGE_BATCH_SIZE);
      
      if (nextBatch.length > 0) {
        // Update last loaded timestamp
        const oldestInBatch = nextBatch[nextBatch.length - 1];
        lastLoadedMessageTimestamp = oldestInBatch.timestamp;
        
        // Remember current scroll height
        const oldScrollHeight = chatContainer.scrollHeight;
        
        // Add to local storage
        nextBatch.forEach(message => {
          saveMessageToLocalStorage(message, message.id);
        });
        
        // Sort for display (oldest first)
        nextBatch.sort((a, b) => a.timestamp - b.timestamp);
        
        // Create fragment
        const fragment = document.createDocumentFragment();
        nextBatch.forEach(message => {
          if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
            const messageElement = createMessageElementOffscreen(message, message.id);
            fragment.appendChild(messageElement);
          }
        });
        
        // Insert at the beginning
        chatContainer.insertBefore(fragment, chatContainer.firstChild);
        
        // Maintain scroll position
        chatContainer.scrollTop = chatContainer.scrollHeight - oldScrollHeight;
        
        // Observe new messages
        nextBatch.forEach(message => {
          const element = document.querySelector(`[data-message-id="${message.id}"]`);
          if (element && !element.hasAttribute('data-observed')) {
            scrollObserver.observe(element);
            element.setAttribute('data-observed', 'true');
          }
        });
        
        // Update emoji icons
        updateCommentButtonIcon();
      } else {
        // No more messages to load
        allMessagesLoaded = true;
      }
    } else {
      // No messages in Firebase
      allMessagesLoaded = true;
    }
  } catch (error) {
    console.error('Error loading older messages from Firebase:', error);
  }
}

// Create message element without adding to DOM (for better performance)
function createMessageElementOffscreen(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);

  const flagUrl = `https://flagcdn.com/w40/${message.country || 'unknown'}.png`;
  const messageTime = formatTimestamp(message.timestamp);
  const isFollowing = followedUsers.has(message.userId);
  const followBtnDisplay = message.userId === currentUser?.uid ? 'none' : 'inline-block';
  
  // Check if conversation is marked as "full" (followed)
  const isConversationFull = conversationStatus[message.userId] === 'full';

  // Optimized media handling - lazy load images and videos
  let mediaHTML = '';
  if (message.media && message.media.length > 0) {
    mediaHTML = '<div class="media-container">';
    message.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          mediaHTML += `<img src="${media.url}" class="message-image" loading="lazy" onclick="showFullImage('${media.url}')">`;
        } else if (media.type === 'video') {
          mediaHTML += `<video src="${media.url}" class="message-video" preload="metadata" controls></video>`;
        }
      }
    });
    mediaHTML += '</div>';
  }

  messageElement.innerHTML = `
    <img src="${message.photoURL}" class="profile-image" alt="Profile" loading="lazy">
    <div class="message-content">
      <div class="message-header">
        <span class="user-name">${message.name}</span>
        <img src="${flagUrl}" class="country-flag" alt="Flag" loading="lazy" onerror="this.src='default-flag.png'">
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
        <button class="action-button reply-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 22.75C6.072 22.75 1.25 17.928 1.25 12S6.072 1.25 12 1.25 22.75 6.072 22.75 12 17.928 22.75 12 22.75zm0-20C6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25s9.25-4.15 9.25-9.25S17.1 2.75 12 2.75z"></path>
            <path d="M12 17.115c-2.83 0-5.12-2.3-5.12-5.13s2.29-5.13 5.12-5.13c2.82 0 5.12 2.3 5.12 5.13s-2.3 5.13-5.12 5.13zm-3.07-5.13c0 1.7 1.38 3.09 3.07 3.09s3.06-1.39 3.06-3.09c0-1.71-1.37-3.09-3.06-3.09s-3.07 1.38-3.07 3.09z"></path>
            <path d="M8.93 13.8c-.53 0-.95-.42-.95-.95s.42-.95.95-.95.95.42.95.95-.42.95-.95.95zm6.18 0c-.53 0-.95-.42-.95-.95s.42-.95.95-.95.95.42.95.95-.42.95-.95.95z"></path>
          </svg>
          ${message.replyCount || 0}
        </button>
      </div>
    </div>
  `;

  return messageElement;
}

// Show full image in modal - optimized version
window.showFullImage = function(url) {
  // Check if modal already exists to prevent duplicates
  let modal = document.getElementById('image-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'image-modal';
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
    
    document.body.appendChild(modal);
    
    // Add close handler
    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  } else {
    // Clear existing content
    modal.innerHTML = '';
  }
  
  // Create loading indicator
  const loader = document.createElement('div');
  loader.style.color = 'white';
  loader.style.fontSize = '20px';
  loader.textContent = 'Loading...';
  modal.appendChild(loader);
  
  // Create image with loading handling
  const img = new Image();
  img.style.maxWidth = '90%';
  img.style.maxHeight = '90%';
  img.style.objectFit = 'contain';
  img.style.display = 'none'; // Hide until loaded
  
  img.onload = () => {
    // Remove loader and show image
    modal.removeChild(loader);
    img.style.display = 'block';
  };
  
  img.onerror = () => {
    loader.textContent = 'Failed to load image';
  };
  
  img.src = url;
  modal.appendChild(img);
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

// Set up user presence - Optimized
function setupPresence(userId) {
  const userStatusRef = ref(database, `presence/${userId}`);
  
  // Set user as online
  const onlineData = {
    status: 'online',
    lastSeen: Date.now()
  };
  
  // Use a more efficient approach with connection monitoring
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
  
  // Update lastSeen periodically to keep presence fresh, but not too often
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      update(userStatusRef, { lastSeen: Date.now() });
    }
  }, 60000); // Update every minute when visible
}

// Fetch Followed Users - Optimized with caching
async function fetchFollowedUsers() {
  if (!currentUser) return;

  try {
    // Try to get from cache first
    const cachedFollows = localStorage.getItem(`followedUsers_${currentUser.uid}`);
    if (cachedFollows) {
      const parsedFollows = JSON.parse(cachedFollows);
      
      // Check if cache is fresh (less than 5 minutes old)
      if (parsedFollows.timestamp && Date.now() - parsedFollows.timestamp < 300000) {
        parsedFollows.userIds.forEach(id => followedUsers.add(id));
        
        // Update conversation status
        parsedFollows.userIds.forEach(id => {
          conversationStatus[id] = 'full';
        });
        
        updateFollowButtons();
        return;
      }
    }

    // If no cache or it's stale, fetch from Firestore
    const followQuery = query(
      collection(db, 'follows'),
      where('followerUserId', '==', currentUser.uid)
    );

    const followSnapshot = await getDocs(followQuery);
    followedUsers.clear();
    const followedUserIds = [];
    
    followSnapshot.docs.forEach(doc => {
      const followedUserId = doc.data().followedUserId;
      followedUsers.add(followedUserId);
      followedUserIds.push(followedUserId);
      
      // Mark this conversation as "full" in local storage
      conversationStatus[followedUserId] = 'full';
    });
    
    // Save updated conversation status
    saveConversationStatus();
    
    // Cache the follows data
    localStorage.setItem(`followedUsers_${currentUser.uid}`, JSON.stringify({
      userIds: followedUserIds,
      timestamp: Date.now()
    }));

    updateFollowButtons();
  } catch (error) {
    console.error('Error fetching followed users:', error);
  }
}

// Update Follow Buttons - More efficient implementation
function updateFollowButtons() {
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
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
  });
}

// Follow/Unfollow User - Optimized
window.toggleFollow = async function(userId, userName) {
  if (!currentUser) {
    alert('Please log in to follow users');
    return;
  }

  try {
    // Update UI immediately for responsiveness
    const isCurrentlyFollowing = followedUsers.has(userId);
    
    if (!isCurrentlyFollowing) {
      // Optimistically add to followed set
      followedUsers.add(userId);
      conversationStatus[userId] = 'full';
      saveConversationStatus();
    } else {
      // Optimistically remove from followed set
      followedUsers.delete(userId);
      delete conversationStatus[userId];
      saveConversationStatus();
    }
    
    // Update UI immediately
    updateFollowButtons();

    // Then perform the actual database operation
    const followQuery = query(
      collection(db, 'follows'),
      where('followerUserId', '==', currentUser.uid),
      where('followedUserId', '==', userId)
    );

    const followSnapshot = await getDocs(followQuery);

    if (followSnapshot.empty && !isCurrentlyFollowing) {
      // Follow the user
      await addDoc(collection(db, 'follows'), {
        followerUserId: currentUser.uid,
        followedUserId: userId,
        followedUserName: userName,
        timestamp: Date.now()
      });
      
      // Update cached follows data
      const cachedFollows = localStorage.getItem(`followedUsers_${currentUser.uid}`);
      if (cachedFollows) {
        const parsedFollows = JSON.parse(cachedFollows);
        parsedFollows.userIds.push(userId);
        localStorage.setItem(`followedUsers_${currentUser.uid}`, JSON.stringify({
          userIds: parsedFollows.userIds,
          timestamp: Date.now()
        }));
      }
    } else if (!followSnapshot.empty && isCurrentlyFollowing) {
      // Unfollow the user
      for (const doc of followSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // Update cached follows data
      const cachedFollows = localStorage.getItem(`followedUsers_${currentUser.uid}`);
      if (cachedFollows) {
        const parsedFollows = JSON.parse(cachedFollows);
        parsedFollows.userIds = parsedFollows.userIds.filter(id => id !== userId);
        localStorage.setItem(`followedUsers_${currentUser.uid}`, JSON.stringify({
          userIds: parsedFollows.userIds,
          timestamp: Date.now()
        }));
      }
    }
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
    // Revert UI changes if the operation failed
    if (followedUsers.has(userId)) {
      followedUsers.delete(userId);
      delete conversationStatus[userId];
    } else {
      followedUsers.add(userId);
      conversationStatus[userId] = 'full';
    }
    saveConversationStatus();
    updateFollowButtons();
  }
};

// Optimized media upload with compression
async function uploadMedia(file) {
  try {
    // Compress image files before upload
    let fileToUpload = file;
    
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    }
    
    // Create a unique filename
    const fileName = `${Date.now()}_${file.name}`;
    const fileType = file.type.split('/')[0]; // 'image' or 'video'
    
    // Upload file to Firebase Storage via a Cloud Function proxy
    const uploadEndpoint = `https://us-central1-globalchat-2d669.cloudfunctions.net/uploadMedia`;
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', fileToUpload);
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
    
    return {
      url: result.url,
      type: fileType
    };
  } catch (error) {
    console.error('Media upload error:', error);
    
    // FALLBACK: If Cloud Function upload fails, compress and use data URL
    return await createOptimizedDataUrl(file);
  }
}

// Compress image file
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = function() {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 1200px width for uploads)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with reduced quality
        canvas.toBlob(blob => {
          if (blob) {
            // Create a new file from the blob
            const newFile = new File([blob], file.name, { 
              type: 'image/jpeg', 
              lastModified: Date.now()
            });
            resolve(newFile);
          } else {
            // If compression fails, use original file
            resolve(file);
          }
        }, 'image/jpeg', 0.75); // 75% quality
      };
      
      img.onerror = function() {
        // If image loading fails, use original file
        resolve(file);
      };
    };
    
    reader.onerror = function() {
      reject(new Error('Failed to read file'));
    };
  });
}

// Create optimized data URL as fallback upload method
async function createOptimizedDataUrl(file) {
  return new Promise((resolve) => {
    const fileType = file.type.split('/')[0]; // 'image' or 'video'
    
    if (fileType === 'image') {
      // For images, compress using canvas
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize if needed
          let width = img.width;
          let height = img.height;
          const maxDimension = 800; // Limit size for data URLs
          
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({
            url: dataUrl,
            type: 'image'
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // For video, use data URL directly (might be large)
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve({
          url: event.target.result,
          type: 'video'
        });
      };
      reader.readAsDataURL(file);
    }
  });
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
        
        // Remove in batches for better performance
        const removePromises = [];
        for (let i = 0; i < messagesToRemove.length; i += 10) {
          const batch = messagesToRemove.slice(i, i + 10);
          for (const [messageId] of batch) {
            removePromises.push(set(ref(database, `messages/${messageId}`), null));
          }
          // Small pause between batches to avoid rate limiting
          if (i + 10 < messagesToRemove.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        await Promise.all(removePromises);
      }
    }
  } catch (error) {
    console.error('Error managing Firebase messages:', error);
  }
}

// Send Message Function with Media Support - Optimized
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
    
    // Upload all media files in parallel for better performance
    const mediaPromises = [];
    if (hasMedia) {
      for (const media of selectedMedia) {
        mediaPromises.push(uploadMedia(media.file));
      }
    }
    
    const mediaUrls = await Promise.all(mediaPromises);

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
      replyCount: 0
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
    // Run this in background without awaiting
    manageFirebaseMessages().catch(console.error);
    
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

// Add window event listeners for memory management
window.addEventListener('blur', () => {
  // When app loses focus, we can free up resources
  cleanupInvisibleMessages();
});

window.addEventListener('focus', () => {
  // When app gains focus, refresh data
  if (chatContainer.scrollTop < 200) {
    loadMoreMessages();
  }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp)