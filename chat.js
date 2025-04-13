
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, onValue, update, get, onDisconnect, query as dbQuery, limitToLast, orderByChild } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// DOM elements - Use document.getElementById once to avoid repeated DOM lookups
const elements = {
  chatContainer: document.getElementById('chatContainer'),
  messageInput: document.getElementById('messageInput'),
  imageInput: document.getElementById('imageInput'),
  videoInput: document.getElementById('videoInput'),
  imageButton: document.getElementById('imageButton'),
  videoButton: document.getElementById('videoButton'),
  mediaPreview: document.getElementById('mediaPreview'),
  sendButton: document.getElementById('sendButton'),
  loadingIndicator: document.getElementById('loadingIndicator')
};

// Application state variables
let currentUser = null;
let selectedMedia = [];
let lastMessageTime = 0;
const followedUsers = new Set();
let typingTimeout = null;
const typingUsers = new Map();
let globalRateLimit = Date.now();
let isLoadingMoreMessages = false;
let allMessagesLoaded = false;
let lastVisibleMessageTimestamp = 0;

// Constants
const MAX_FIREBASE_MESSAGES = 100; // Increased message limit for better chat experience
const MESSAGES_PER_PAGE = 20; // Number of messages to load per page
const LOCAL_STORAGE_MESSAGES_KEY = 'localMessages';
const LOCAL_STORAGE_CONVERSATION_STATUS_KEY = 'conversationStatus';
const IMAGE_COMPRESSION_QUALITY = 0.7; // Image compression quality (0.0-1.0)
const MAX_IMAGE_DIMENSION = 1200; // Maximum image dimension for resizing
let conversationStatus = {};

// Virtual scrolling variables
const messageElementCache = new Map(); // Cache message DOM elements
const visibleMessageIds = new Set(); // Currently visible message IDs
const MESSAGE_THRESHOLD = 100; // Max number of message elements to keep in DOM

// Initialize app
function initApp() {
  // Create intersection observer for infinite scrolling
  createIntersectionObserver();
  
  // Load conversation status from local storage
  loadConversationStatus();
  
  // Initialize message input height adjustment
  initMessageInput();
  
  // Media upload event listeners
  elements.imageButton.addEventListener('click', () => elements.imageInput.click());
  elements.videoButton.addEventListener('click', () => elements.videoInput.click());
  elements.imageInput.addEventListener('change', handleMediaSelection);
  elements.videoInput.addEventListener('change', handleMediaSelection);
  
  // Send Button Event Listener - Use passive event listener for better performance
  elements.sendButton.addEventListener('click', sendMessage, { passive: true });
  
  // Enter key to send message (Shift+Enter for new line)
  elements.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!elements.sendButton.disabled) {
        sendMessage();
      }
    }
  });
  
  // Add scroll event listener for loading more messages
  elements.chatContainer.addEventListener('scroll', debounce(handleScroll, 100), { passive: true });
  
  // Listen for typing indicators
  listenForTypingIndicators();
  
  // Load messages from local storage first for immediate display
  loadLocalMessages();
  
  // Then load recent messages from Firebase with pagination
  loadInitialMessages();
  
  // Listen for global rate limit
  listenForRateLimit();
}

// Create intersection observer for lazy loading images and detecting visible messages
function createIntersectionObserver() {
  // Create observer for lazy loading images and videos
  const mediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const mediaElement = entry.target;
        if (mediaElement.dataset.src) {
          // Set the actual src when the element is visible
          mediaElement.src = mediaElement.dataset.src;
          delete mediaElement.dataset.src;
          mediaObserver.unobserve(mediaElement);
        }
      }
    });
  }, {
    rootMargin: '200px', // Load media 200px before they come into view
    threshold: 0.01
  });

  // Observer for tracking visible messages
  const messageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const messageId = entry.target.dataset.messageId;
      if (entry.isIntersecting) {
        visibleMessageIds.add(messageId);
      } else {
        visibleMessageIds.delete(messageId);
      }
    });
    
    // Clean up invisible messages if we have too many in the DOM
    if (document.querySelectorAll('.message').length > MESSAGE_THRESHOLD) {
      cleanupInvisibleMessages();
    }
  }, {
    rootMargin: '50px',
    threshold: 0.01
  });
  
  // Store observers in window to access them globally
  window.mediaObserver = mediaObserver;
  window.messageObserver = messageObserver;
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Handle scroll event for infinite scrolling
function handleScroll() {
  const { scrollTop } = elements.chatContainer;
  
  // If scrolled near top and not already loading more messages
  if (scrollTop < 100 && !isLoadingMoreMessages && !allMessagesLoaded) {
    loadMoreMessages();
  }
}

// Clean up invisible messages to reduce DOM size
function cleanupInvisibleMessages() {
  const messages = document.querySelectorAll('.message');
  const messagesToRemove = [];
  
  // Find messages that are outside the visible area and not recently visible
  messages.forEach(msg => {
    const messageId = msg.dataset.messageId;
    if (!visibleMessageIds.has(messageId) && messageElementCache.has(messageId)) {
      messagesToRemove.push(msg);
    }
  });
  
  // Keep most recent invisible messages
  messagesToRemove.slice(0, -20).forEach(msg => {
    const messageId = msg.dataset.messageId;
    // Store the message element in the cache before removing from DOM
    messageElementCache.set(messageId, msg.cloneNode(true));
    msg.remove();
  });
}

// Load initial batch of messages
async function loadInitialMessages() {
  try {
    isLoadingMoreMessages = true;
    // Query to get the most recent MESSAGES_PER_PAGE messages
    const messagesQuery = dbQuery(chatRef, orderByChild('timestamp'), limitToLast(MESSAGES_PER_PAGE));
    
    // Clear any existing messages first
    const existingMessages = document.querySelectorAll('.message:not(.locally-stored)');
    existingMessages.forEach(msg => msg.remove());
    
    // Get messages
    const snapshot = await get(messagesQuery);
    if (!snapshot.exists()) {
      allMessagesLoaded = true;
      isLoadingMoreMessages = false;
      return;
    }
    
    let messages = [];
    snapshot.forEach((child) => {
      messages.push({
        id: child.key,
        ...child.val()
      });
    });
    
    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Update lastVisibleMessageTimestamp for pagination
    if (messages.length > 0) {
      lastVisibleMessageTimestamp = messages[0].timestamp;
    }
    
    // Create message elements
    let fragment = document.createDocumentFragment();
    messages.forEach(message => {
      if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
        const messageElement = createMessageElement(message, message.id);
        // Save to local storage for future retrieval
        saveMessageToLocalStorage(message, message.id);
        fragment.appendChild(messageElement);
      }
    });
    
    // Add to chat container
    elements.chatContainer.appendChild(fragment);
    
    // Scroll to bottom after initial load
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    
    // Start listening for new messages
    listenForNewMessages();
    
  } catch (error) {
    console.error('Error loading initial messages:', error);
  } finally {
    isLoadingMoreMessages = false;
  }
}

// Load more messages when scrolling up
async function loadMoreMessages() {
  try {
    if (isLoadingMoreMessages || allMessagesLoaded) return;
    
    isLoadingMoreMessages = true;
    
    // Show loading indicator at top of chat
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-more-indicator';
    loadingIndicator.textContent = 'Loading more messages...';
    elements.chatContainer.prepend(loadingIndicator);
    
    // Query messages before the oldest one we have
    const messagesQuery = dbQuery(
      chatRef, 
      orderByChild('timestamp'), 
      // Use endAt to get messages older than the oldest visible message
      lastVisibleMessageTimestamp > 0 ? dbQuery.endAt(lastVisibleMessageTimestamp - 1) : null,
      limitToLast(MESSAGES_PER_PAGE)
    );
    
    const snapshot = await get(messagesQuery);
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    if (!snapshot.exists() || snapshot.size === 0) {
      allMessagesLoaded = true;
      isLoadingMoreMessages = false;
      return;
    }
    
    let messages = [];
    snapshot.forEach((child) => {
      messages.push({
        id: child.key,
        ...child.val()
      });
    });
    
    // Sort by timestamp (oldest first)
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    if (messages.length > 0) {
      // Update last visible timestamp for next pagination
      lastVisibleMessageTimestamp = messages[0].timestamp;
      
      // Create message elements
      let fragment = document.createDocumentFragment();
      
      // Remember scroll height and first child
      const oldScrollHeight = elements.chatContainer.scrollHeight;
      const oldFirstChild = elements.chatContainer.firstChild;
      
      messages.forEach(message => {
        if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
          // Check if we have this message in cache
          let messageElement;
          if (messageElementCache.has(message.id)) {
            messageElement = messageElementCache.get(message.id);
            messageElementCache.delete(message.id);
          } else {
            messageElement = createMessageElement(message, message.id);
            // Save to local storage
            saveMessageToLocalStorage(message, message.id);
          }
          fragment.appendChild(messageElement);
        }
      });
      
      // Insert at the top of the chat container
      elements.chatContainer.prepend(fragment);
      
      // Maintain scroll position
      const newScrollHeight = elements.chatContainer.scrollHeight;
      const scrollDiff = newScrollHeight - oldScrollHeight;
      elements.chatContainer.scrollTop = scrollDiff;
    } else {
      allMessagesLoaded = true;
    }
  } catch (error) {
    console.error('Error loading more messages:', error);
  } finally {
    isLoadingMoreMessages = false;
  }
}

// Listen for new messages in real-time
function listenForNewMessages() {
  // Use the timestamp of the most recent message as a starting point
  const recentMessagesQuery = dbQuery(chatRef, orderByChild('timestamp'), limitToLast(1));
  
  onChildAdded(recentMessagesQuery, (snapshot) => {
    const message = snapshot.val();
    const messageId = snapshot.key;
    
    // Don't re-render existing messages
    if (document.querySelector(`[data-message-id="${messageId}"]`)) {
      return;
    }
    
    // Only show messages that came after our initial load
    if (message.timestamp && message.timestamp > lastMessageTime) {
      // Create the message element
      const messageElement = createMessageElement(message, messageId);
      elements.chatContainer.appendChild(messageElement);
      
      // Save message to local storage for future retrieval
      saveMessageToLocalStorage(message, messageId);
      
      // Scroll to bottom if user was already near bottom
      const isNearBottom = elements.chatContainer.scrollHeight - elements.chatContainer.scrollTop - elements.chatContainer.clientHeight < 200;
      if (isNearBottom) {
        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
      } else {
        // Show a "new message" indicator
        showNewMessageIndicator();
      }
    }
  });
}

// Show a visual indicator when new messages arrive but user is scrolled up
function showNewMessageIndicator() {
  let indicator = document.getElementById('newMessageIndicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'newMessageIndicator';
    indicator.className = 'new-message-indicator';
    indicator.innerHTML = 'New messages ↓';
    indicator.addEventListener('click', () => {
      elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
      indicator.style.display = 'none';
    });
    document.body.appendChild(indicator);
  }
  
  indicator.style.display = 'block';
  
  // Hide indicator when user scrolls to bottom
  const checkScrollBottom = () => {
    const isAtBottom = elements.chatContainer.scrollHeight - elements.chatContainer.scrollTop - elements.chatContainer.clientHeight < 20;
    if (isAtBottom && indicator.style.display !== 'none') {
      indicator.style.display = 'none';
    }
  };
  
  elements.chatContainer.addEventListener('scroll', debounce(checkScrollBottom, 100), { passive: true });
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

// Load messages from local storage
function loadLocalMessages() {
  try {
    const localMessages = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    if (localMessages) {
      const messages = JSON.parse(localMessages);
      
      // Create a document fragment for batch DOM operation
      const fragment = document.createDocumentFragment();
      
      messages.forEach(message => {
        if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
          const messageEl = createMessageElement(message, message.id);
          messageEl.classList.add('locally-stored');
          fragment.appendChild(messageEl);
        }
      });
      
      // Add all messages at once
      elements.chatContainer.appendChild(fragment);
      
      // Scroll to bottom
      elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    }
  } catch (error) {
    console.error('Error loading local messages:', error);
  }
}

// Save message to local storage with LRU caching (Least Recently Used)
function saveMessageToLocalStorage(message, messageId) {
  try {
    const localMessages = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    let messages = localMessages ? JSON.parse(localMessages) : [];
    
    // Add the message ID to the message object
    const messageWithId = { ...message, id: messageId };
    
    // Add new message to the array
    messages.push(messageWithId);
    
    // Keep only the most recent 50 messages in local storage
    if (messages.length > 50) {
      messages = messages.slice(-50);
    }
    
    // Store in local storage
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving message to local storage:', error);
  }
}

// Initialize message input with typing indicator
function initMessageInput() {
  // Use ResizeObserver instead of the input event for height adjustment
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const target = entry.target;
      target.style.height = 'auto';
      target.style.height = (target.scrollHeight) + 'px';
    }
  });
  
  resizeObserver.observe(elements.messageInput);
  
  elements.messageInput.addEventListener('input', function() {
    // Enable/disable send button based on content
    const hasText = this.value.trim().length > 0;
    const hasMedia = selectedMedia.length > 0;
    elements.sendButton.disabled = !(hasText || hasMedia);
    
    // Update typing indicator
    updateTypingStatus();
  });
  
  // When user stops typing
  elements.messageInput.addEventListener('blur', function() {
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

// Function to handle media selection with image optimization
async function handleMediaSelection(e) {
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

    try {
      // Optimize images before preview
      if (fileType === 'image' && file.type !== 'image/gif') {
        const optimizedImage = await optimizeImage(file);
        addMediaPreview(optimizedImage, fileType, selectedMedia.length);
        selectedMedia.push({
          file: optimizedImage,
          type: fileType
        });
      } else {
        // For videos and GIFs, use original file
        addMediaPreview(file, fileType, selectedMedia.length);
        selectedMedia.push({
          file: file,
          type: fileType
        });
      }
    } catch (error) {
      console.error('Error processing media:', error);
      // Fallback to original file
      addMediaPreview(file, fileType, selectedMedia.length);
      selectedMedia.push({
        file: file,
        type: fileType
      });
    }
    
    // Enable send button if there's media
    elements.sendButton.disabled = false;
  }

  // Reset the file input
  e.target.value = '';
}

// Create and add media preview
function addMediaPreview(file, fileType, index) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    if (fileType === 'image') {
      previewItem.innerHTML = `
        <img src="${e.target.result}" class="preview-image">
        <button class="remove-media" data-index="${index}">×</button>
      `;
    } else if (fileType === 'video') {
      previewItem.innerHTML = `
        <video src="${e.target.result}" class="preview-video"></video>
        <button class="remove-media" data-index="${index}">×</button>
      `;
    }
    
    elements.mediaPreview.appendChild(previewItem);
    
    // Add event listener to remove button
    const removeButton = previewItem.querySelector('.remove-media');
    if (removeButton) {
      removeButton.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        removeMedia(index);
      });
    }
  };
  
  reader.readAsDataURL(file);
}

// Optimize images before upload using canvas
async function optimizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_IMAGE_DIMENSION / width));
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round(width * (MAX_IMAGE_DIMENSION / height));
          height = MAX_IMAGE_DIMENSION;
        }
      }
      
      // Create canvas and resize image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to Blob with reduced quality
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a new File object from the Blob
          const optimizedFile = new File(
            [blob], 
            file.name, 
            { type: file.type }
          );
          resolve(optimizedFile);
        } else {
          reject(new Error('Image optimization failed'));
        }
      }, file.type, IMAGE_COMPRESSION_QUALITY);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    img.src = URL.createObjectURL(file);
  });
}

// Function to remove selected media
function removeMedia(index) {
  selectedMedia.splice(index, 1);
  updateMediaPreview();
  
  // Disable send button if no content
  if (selectedMedia.length === 0 && elements.messageInput.value.trim() === '') {
    elements.sendButton.disabled = true;
  }
}

// Update media preview after removal
function updateMediaPreview() {
  elements.mediaPreview.innerHTML = '';
  
  selectedMedia.forEach((media, index) => {
    addMediaPreview(media.file, media.type, index);
  });
}

// Geolocation and Flag Service
async function getCountryFromIP() {
  try {
    // Use a cached version if available
    const cachedCountry = localStorage.getItem('userCountry');
    const cachedTimestamp = localStorage.getItem('userCountryTimestamp');
    
    // If we have a cached value that's less than 24 hours old, use it
    if (cachedCountry && cachedTimestamp && (Date.now() - cachedTimestamp < 24 * 60 * 60 * 1000)) {
      return cachedCountry;
    }
    
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code.toLowerCase();
    
    // Cache the result
    localStorage.setItem('userCountry', countryCode);
    localStorage.setItem('userCountryTimestamp', Date.now().toString());
    
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

// Create message element with performance optimization
function createMessageElement(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);

  const flagUrl = `https://flagcdn.com/w40/${message.country || 'unknown'}.png`;
  const messageTime = formatTimestamp(message.timestamp);
  const isFollowing = followedUsers.has(message.userId);
  const followBtnDisplay = message.userId === currentUser?.uid ? 'none' : 'inline-block';
  
  // Check if conversation is marked as "full" (followed)
  const isConversationFull = conversationStatus[message.userId] === 'full';

  // Improved media handling with lazy loading
  let mediaHTML = '';
  if (message.media && message.media.length > 0) {
    mediaHTML = '<div class="media-container">';
    message.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          // Use data-src for lazy loading
          mediaHTML += `<img class="message-image" data-src="${media.url}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" onclick="showFullImage('${media.url}')">`;
        } else if (media.type === 'video') {
          
          mediaHTML += `<video class="message-video" data-src="${media.url}" controls preload="none" poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"></video>`;
        }
      }
    });
    mediaHTML += '</div>';
  }

  messageElement.innerHTML = `
    <img src="${message.photoURL}" class="profile-image" alt="Profile">
    <div class="message-content">
      <div class="message-header">
        <span class="user-name">${message.name}</span>
        <img data-src="${flagUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" class="country-flag" alt="Flag" onerror="this.src='default-flag.png'">
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
          <svg viewBox="0 0 24 24">
            <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.85.85 0 0 0 .12.403.744.744 0 0 0 1.034.229c.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67a.75.75 0 0 0-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path>
          </svg>
          ${message.replyCount || 0}
        </button>
      </div>
    </div>
  `;

  // Observe the message element to track visibility
  if (window.messageObserver) {
    window.messageObserver.observe(messageElement);
  }
  
  // Observe media elements for lazy loading
  if (window.mediaObserver) {
    const mediaElements = messageElement.querySelectorAll('[data-src]');
    mediaElements.forEach(element => {
      window.mediaObserver.observe(element);
    });
  }

  return messageElement;
}

// Show full image in modal with memory leak prevention
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
  
  const img = new Image();
  
  // Set up loading placeholder
  const placeholder = document.createElement('div');
  placeholder.style.color = 'white';
  placeholder.style.textAlign = 'center';
  placeholder.textContent = 'Loading image...';
  modal.appendChild(placeholder);
  
  // Listen for image load
  img.onload = function() {
    modal.removeChild(placeholder);
    modal.appendChild(img);
  };
  
  img.src = url;
  img.style.maxWidth = '90%';
  img.style.maxHeight = '90%';
  img.style.objectFit = 'contain';
  
  document.body.appendChild(modal);
  
  // Remove modal when clicked
  modal.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Memory cleanup when modal is closed
  modal.addEventListener('remove', () => {
    img.src = '';
    URL.revokeObjectURL(url);
  });
};

// Authentication State Observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Get user data from cache first if available
      const cachedUserData = localStorage.getItem(`userData_${user.uid}`);
      let userData = null;
      
      if (cachedUserData) {
        userData = JSON.parse(cachedUserData);
      } else {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        userData = userDoc.data() || {};
        
        // Cache user data
        localStorage.setItem(`userData_${user.uid}`, JSON.stringify(userData));
      }
      
      const countryCode = await getCountryFromIP();

      currentUser = {
        uid: user.uid,
        displayName: user.displayName || userData?.displayName || "User" + Math.floor(Math.random() * 10000),
        photoURL: user.photoURL || userData?.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
        country: countryCode
      };

      // Create user in database if not exists
      if (!userData?.createdAt) {
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
      elements.loadingIndicator.style.display = 'none';
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      elements.loadingIndicator.style.display = 'none';
    }
  } else {
    // Sign in anonymously if no user
    signInAnonymously(auth)
      .catch((error) => {
        console.error('Anonymous auth error:', error);
        elements.loadingIndicator.style.display = 'none';
      });
  }
});

// Set up user presence with optimized write operations
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
    // Check local cache first
    const cachedFollows = localStorage.getItem(`follows_${currentUser.uid}`);
    if (cachedFollows) {
      const followData = JSON.parse(cachedFollows);
      
      // Check if cache is still valid (less than 5 minutes old)
      if (followData.timestamp && (Date.now() - followData.timestamp < 5 * 60 * 1000)) {
        followedUsers.clear();
        followData.users.forEach(userId => {
          followedUsers.add(userId);
          conversationStatus[userId] = 'full';
        });
        
        updateFollowButtons();
        saveConversationStatus();
        return;
      }
    }

    // Fetch from Firestore if no valid cache
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
    
    // Save to local cache
    localStorage.setItem(`follows_${currentUser.uid}`, JSON.stringify({
      users: followedUserIds,
      timestamp: Date.now()
    }));
    
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
    const isCurrentlyFollowing = followedUsers.has(userId);
    
    // Optimistic UI update
    if (isCurrentlyFollowing) {
      followedUsers.delete(userId);
      delete conversationStatus[userId];
    } else {
      followedUsers.add(userId);
      conversationStatus[userId] = 'full';
    }
    
    // Update buttons immediately
    updateFollowButtons();
    saveConversationStatus();
    
    // Update local cache
    const cachedFollows = localStorage.getItem(`follows_${currentUser.uid}`);
    let followData = cachedFollows ? JSON.parse(cachedFollows) : { users: [], timestamp: Date.now() };
    
    if (isCurrentlyFollowing) {
      followData.users = followData.users.filter(id => id !== userId);
    } else {
      followData.users.push(userId);
    }
    
    followData.timestamp = Date.now();
    localStorage.setItem(`follows_${currentUser.uid}`, JSON.stringify(followData));

    // Perform database operation
    const followQuery = query(
      collection(db, 'follows'),
      where('followerUserId', '==', currentUser.uid),
      where('followedUserId', '==', userId)
    );

    const followSnapshot = await getDocs(followQuery);

    if (isCurrentlyFollowing) {
      // Unfollow
      followSnapshot.docs.forEach(async (followDoc) => {
        await deleteDoc(doc(db, 'follows', followDoc.id));
      });
    } else {
      // Follow
      if (followSnapshot.empty) {
        await addDoc(collection(db, 'follows'), {
          followerUserId: currentUser.uid,
          followedUserId: userId,
          followedUserName: userName,
          timestamp: Date.now()
        });
      }
    }
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
    // Revert optimistic updates if there was an error
    alert('Error updating follow status. Please try again.');
    await fetchFollowedUsers(); // Refresh actual follow status
  }
};

// Optimized media upload function with retry logic
async function uploadMedia(file) {
  const MAX_RETRIES = 3;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Create a unique filename with timestamp and random string to avoid collisions
      const randomStr = Math.random().toString(36).substring(2, 10);
      const fileName = `${Date.now()}_${randomStr}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fileType = file.type.split('/')[0]; // 'image' or 'video'
      
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
      
      return {
        url: result.url,
        type: fileType
      };
    } catch (error) {
      console.error(`Media upload error (attempt ${retries + 1}):`, error);
      retries++;
      
      if (retries >= MAX_RETRIES) {
        // If all retries fail, use data URL as fallback
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            console.warn('Using data URL fallback for media');
            resolve({
              url: event.target.result,
              type: file.type.split('/')[0]
            });
          };
          reader.readAsDataURL(file);
        });
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
}

// Send Message Function with Media Support and rate limiting
async function sendMessage(parentMessageId = null) {
  if (!currentUser) {
    alert('You must log in to continue');
    return;
  }

  const messageText = elements.messageInput.value.trim();
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
    elements.loadingIndicator.style.display = 'flex';
    
    // Update global rate limit timestamp
    await set(rateLimitRef, currentTime);
    
    // Clear typing status
    const userTypingRef = ref(database, `typing/${currentUser.uid}`);
    set(userTypingRef, null);
    
    // Upload all media files with progress tracking
    const mediaUrls = [];
    if (hasMedia) {
      // Create progress indicator
      const progressContainer = document.createElement('div');
      progressContainer.className = 'upload-progress-container';
      progressContainer.innerHTML = '<div class="upload-progress-label">Uploading media: 0%</div><div class="upload-progress-bar"><div class="upload-progress-fill" style="width: 0%"></div></div>';
      elements.mediaPreview.appendChild(progressContainer);
      
      // Process uploads sequentially to avoid overwhelming the connection
      for (let i = 0; i < selectedMedia.length; i++) {
        const media = selectedMedia[i];
        
        // Update progress indicator
        const progressLabel = progressContainer.querySelector('.upload-progress-label');
        const progressFill = progressContainer.querySelector('.upload-progress-fill');
        progressLabel.textContent = `Uploading media ${i + 1}/${selectedMedia.length}`;
        
        // Upload the media
        const uploadResult = await uploadMedia(media.file);
        mediaUrls.push(uploadResult);
        
        // Update progress
        const progress = ((i + 1) / selectedMedia.length) * 100;
        progressFill.style.width = `${progress}%`;
      }
      
      // Remove progress indicator
      progressContainer.remove();
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
    
    // Optimistically render the message immediately
    const messageElement = createMessageElement(messageData, newMessageRef.key);
    elements.chatContainer.appendChild(messageElement);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    
    // Save message to local storage
    saveMessageToLocalStorage(messageData, newMessageRef.key);
    
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
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';
    selectedMedia = [];
    elements.mediaPreview.innerHTML = '';
    elements.sendButton.disabled = true;
    lastMessageTime = currentTime;
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    elements.loadingIndicator.style.display = 'none';
  }
}

// Add style element for new UI components
(function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .upload-progress-container {
      width: 100%;
      margin: 8px 0;
      padding: 8px;
      background: rgba(0,0,0,0.05);
      border-radius: 8px;
    }
    
    .upload-progress-label {
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .upload-progress-bar {
      height: 8px;
      background: #eee;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .upload-progress-fill {
      height: 100%;
      background: #1da1f2;
      width: 0%;
      transition: width 0.3s;
    }
    
    .new-message-indicator {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #1da1f2;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      cursor: pointer;
      display: none;
      z-index: 100;
      transition: all 0.3s;
    }
    
    .new-message-indicator:hover {
      background: #0c85d0;
    }
    
    .loading-more-indicator {
      text-align: center;
      padding: 10px;
      color: #657786;
      font-size: 14px;
    }
    
    .message {
      will-change: transform;
      contain: content;
    }
    
    .message-image, .message-video {
      contain: content;
      background-color: #eee;
    }
  `;
  document.head.appendChild(style);
})();

// Initialize the app
initApp();
