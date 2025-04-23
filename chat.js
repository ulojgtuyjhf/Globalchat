import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onChildAdded, onValue, update, get, onDisconnect, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
  authDomain: "globalchat-2d669.firebaseapp.com",
  projectId: "globalchat-2d669",
  messagingSenderId: "178714711978",
  appId: "1:178714711978:web:fb831188be23e62a4bbdd3",
  databaseURL: "https://globalchat-2d669-default-rtdb.firebaseio.com/"
};

// Supabase Configuration
const SUPABASE_URL = 'https://wvfvggkzpplsmswbdpzq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZnZnZ2t6cHBsc21zd2JkcHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDkwMjcsImV4cCI6MjA2MDk4NTAyN30.WIHfh63FM-YaTheu9oYlqu2QnCVaya3GSK5zeN25r3o';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const chatRef = ref(database, 'messages');
const typingRef = ref(database, 'typing');
const rateLimitRef = ref(database, 'rateLimit');
const recenceCollection = collection(db, 'recence');

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const imageButton = document.getElementById('imageButton');
const videoButton = document.getElementById('videoButton');
const mediaPreview = document.getElementById('mediaPreview');
const sendButton = document.getElementById('sendButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const inputProfileImage = document.getElementById('inputProfileImage');
const totalUsersCount = document.getElementById('totalUsersCount');
const suggestedUsersContainer = document.getElementById('suggestedUsersContainer');
const showMoreSuggested = document.getElementById('showMoreSuggested');
const suggestedBtnSpinner = document.getElementById('suggestedBtnSpinner');
const topFollowedUsersContainer = document.getElementById('topFollowedUsersContainer');
const showMoreTopFollowed = document.getElementById('showMoreTopFollowed');
const topFollowedBtnSpinner = document.getElementById('topFollowedBtnSpinner');
const headerSpinner = document.getElementById('headerSpinner');

// State variables
let currentUser = null;
let selectedMedia = [];
let lastMessageTime = 0;
const followedUsers = new Set();
let typingTimeout = null;
const typingUsers = new Map();
let globalRateLimit = Date.now();
let isLoadingMore = false;
let lastVisibleMessage = null;
let noMoreMessages = false;
const MESSAGES_PER_PAGE = 10; // Changed from 110 to 10 for better pagination
const MAX_REALTIME_MESSAGES = 1;
const DEBOUNCE_DELAY = 150;
const SCROLL_TRIGGER_OFFSET = 1000;
let lastSuggestedUserDoc = null;
let lastTopFollowedUserDoc = null;

// Initialize app
function initApp() {
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

  // Listen for messages
  listenForMessages();

  // Listen for global rate limit
  listenForRateLimit();

  // Initialize social section
  initSocialSection();

  // Set up message archiving
  setupMessageArchiving();

  // Enable virtual scrolling for better performance
  setupVirtualScrolling();
}

// Initialize social section with user count and suggested/top followed users
function initSocialSection() {
  // Load total user count
  loadTotalUserCount();

  // Load initial suggested users
  loadSuggestedUsers();

  // Load initial top followed users
  loadTopFollowedUsers();

  // Set up "Show More" button event listeners
  showMoreSuggested.addEventListener('click', () => {
    loadMoreSuggestedUsers();
  });

  showMoreTopFollowed.addEventListener('click', () => {
    loadMoreTopFollowedUsers();
  });
}

// Load total user count from Firestore
async function loadTotalUserCount() {
  try {
    headerSpinner.style.display = 'inline-block';
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    totalUsersCount.textContent = snapshot.size;
  } catch (error) {
    console.error('Error loading user count:', error);
    totalUsersCount.textContent = '0';
  } finally {
    headerSpinner.style.display = 'none';
  }
}

// Load suggested users with pagination
async function loadSuggestedUsers() {
  try {
    suggestedBtnSpinner.style.display = 'inline-block';
    showMoreSuggested.classList.add('loading');
    
    // Query to get suggested users (random sample for demo)
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const snapshot = await getDocs(usersQuery);
    suggestedUsersContainer.innerHTML = '';
    
    if (snapshot.empty) {
      suggestedUsersContainer.innerHTML = '<div class="empty-state">No suggested users found</div>';
      showMoreSuggested.style.display = 'none';
      return;
    }

    snapshot.forEach(doc => {
      const user = doc.data();
      suggestedUsersContainer.appendChild(createUserCard(user, doc.id));
    });

    // Store last document for pagination
    lastSuggestedUserDoc = snapshot.docs[snapshot.docs.length - 1];

  } catch (error) {
    console.error('Error loading suggested users:', error);
    suggestedUsersContainer.innerHTML = '<div class="empty-state">Error loading users</div>';
  } finally {
    suggestedBtnSpinner.style.display = 'none';
    showMoreSuggested.classList.remove('loading');
  }
}

// Load more suggested users
async function loadMoreSuggestedUsers() {
  try {
    suggestedBtnSpinner.style.display = 'inline-block';
    showMoreSuggested.classList.add('loading');
    
    if (!lastSuggestedUserDoc) {
      await loadSuggestedUsers();
      return;
    }

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      startAfter(lastSuggestedUserDoc),
      limit(3)
    );

    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      showMoreSuggested.style.display = 'none';
      return;
    }

    snapshot.forEach(doc => {
      const user = doc.data();
      suggestedUsersContainer.appendChild(createUserCard(user, doc.id));
    });

    // Update last document for pagination
    lastSuggestedUserDoc = snapshot.docs[snapshot.docs.length - 1];

  } catch (error) {
    console.error('Error loading more suggested users:', error);
  } finally {
    suggestedBtnSpinner.style.display = 'none';
    showMoreSuggested.classList.remove('loading');
  }
}

// Load top followed users with pagination
async function loadTopFollowedUsers() {
  try {
    topFollowedBtnSpinner.style.display = 'inline-block';
    showMoreTopFollowed.classList.add('loading');
    
    // Query to get top followed users (for demo, we'll just get recent users)
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const snapshot = await getDocs(usersQuery);
    topFollowedUsersContainer.innerHTML = '';
    
    if (snapshot.empty) {
      topFollowedUsersContainer.innerHTML = '<div class="empty-state">No users found</div>';
      showMoreTopFollowed.style.display = 'none';
      return;
    }

    snapshot.forEach(doc => {
      const user = doc.data();
      topFollowedUsersContainer.appendChild(createUserCard(user, doc.id));
    });

    // Store last document for pagination
    lastTopFollowedUserDoc = snapshot.docs[snapshot.docs.length - 1];

  } catch (error) {
    console.error('Error loading top followed users:', error);
    topFollowedUsersContainer.innerHTML = '<div class="empty-state">Error loading users</div>';
  } finally {
    topFollowedBtnSpinner.style.display = 'none';
    showMoreTopFollowed.classList.remove('loading');
  }
}

// Load more top followed users
async function loadMoreTopFollowedUsers() {
  try {
    topFollowedBtnSpinner.style.display = 'inline-block';
    showMoreTopFollowed.classList.add('loading');
    
    if (!lastTopFollowedUserDoc) {
      await loadTopFollowedUsers();
      return;
    }

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      startAfter(lastTopFollowedUserDoc),
      limit(3)
    );

    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      showMoreTopFollowed.style.display = 'none';
      return;
    }

    snapshot.forEach(doc => {
      const user = doc.data();
      topFollowedUsersContainer.appendChild(createUserCard(user, doc.id));
    });

    // Update last document for pagination
    lastTopFollowedUserDoc = snapshot.docs[snapshot.docs.length - 1];

  } catch (error) {
    console.error('Error loading more top followed users:', error);
  } finally {
    topFollowedBtnSpinner.style.display = 'none';
    showMoreTopFollowed.classList.remove('loading');
  }
}

// Create user card element
function createUserCard(user, userId) {
  const isFollowing = followedUsers.has(userId);
  const followBtnDisplay = userId === currentUser?.uid ? 'none' : 'inline-block';

  const userCard = document.createElement('div');
  userCard.className = 'user-card fade-in';
  userCard.innerHTML = `
    <div class="user-pic-container">
      <img src="${user.photoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}" class="user-pic" alt="Profile">
      <div class="status-dot ${user.status === 'online' ? 'status-online' : 'status-offline'}"></div>
    </div>
    <div class="user-info">
      <div class="user-name">${user.displayName || 'User'}</div>
      <button class="follow-btn ${isFollowing ? 'followed' : ''}" 
              data-user-id="${userId}" 
              onclick="toggleFollow('${userId}', '${user.displayName || 'User'}')" 
              style="display: ${followBtnDisplay}">
        ${isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  `;
  return userCard;
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

    // Insert after input container for top-down layout
    const inputContainer = document.querySelector('.input-container');
    inputContainer.parentNode.insertBefore(typingIndicator, inputContainer.nextSibling);
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

      // Better handling of video previews
      if (fileType === 'image') {
        previewItem.innerHTML = `
          <img src="${e.target.result}" class="preview-image">
          <button class="remove-media" data-index="${selectedMedia.length}">×</button>
        `;
      } else if (fileType === 'video') {
        previewItem.innerHTML = `
          <video src="${e.target.result}" class="preview-video" controls></video>
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
    selectedMedia.push({ file: file, type: fileType });
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
      reader.readAsDataURL(media.file);
    } else if (media.type === 'video') {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewItem.innerHTML = `
          <video src="${e.target.result}" class="preview-video" controls></video>
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

// Listen for new messages with real-time updates
function listenForMessages() {
  // Clear chat container but keep loading indicator visible
  while (chatContainer.firstChild && chatContainer.firstChild.id !== 'loadingIndicator') {
    chatContainer.removeChild(chatContainer.firstChild);
  }
  loadingIndicator.style.display = 'flex';
  
  // Listen for new messages being added from realtime database
  onChildAdded(chatRef, async (snapshot) => {
    const message = snapshot.val();
    const messageId = snapshot.key;
    
    // Don't re-render existing messages
    if (document.querySelector(`[data-message-id="${messageId}"]`)) {
      return;
    }
    
    // Create message element
    const messageElement = createMessageElement(message, messageId);
    
    // Always insert at the beginning for newest-first display
    if (chatContainer.firstChild) {
      chatContainer.insertBefore(messageElement, chatContainer.firstChild);
    } else {
      chatContainer.appendChild(messageElement);
    }
    
    // Archive message to Firestore immediately (since we're only keeping one)
    archiveMessage(messageId, message);
    
    // Reset pagination state when new messages arrive
    resetPaginationState();
    
    // Load initial archived messages after getting real-time message
    loadInitialArchivedMessages();
  });
  
  // If no real-time messages come in after 1 second, try loading archived messages
  setTimeout(() => {
    if (chatContainer.childElementCount <= 1) { // Only loading indicator
      loadInitialArchivedMessages();
    }
  }, 1000);
}

// Reset pagination state when new messages arrive
function resetPaginationState() {
  lastVisibleMessage = null;
  noMoreMessages = false;
}

// Load initial archived messages with performance optimizations
async function loadInitialArchivedMessages() {
  try {
    // Hide any existing end-of-feed message when loading initial messages
    const existingEndOfFeed = document.getElementById('end-of-feed');
    if (existingEndOfFeed) {
      existingEndOfFeed.remove();
    }
    
    const messagesQuery = query(
      recenceCollection,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    
    if (querySnapshot.empty) {
      // No archived messages found
      loadingIndicator.style.display = 'none';
      showEndOfFeed();
      return;
    }
    
    // Track the last visible document for pagination
    lastVisibleMessage = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Create a document fragment to batch DOM updates
    const fragment = document.createDocumentFragment();
    let messagesAdded = 0;
    
    // Process messages
    querySnapshot.forEach(doc => {
      const message = doc.data();
      const messageId = doc.id;
      
      // Don't re-render existing messages
      if (document.querySelector(`[data-message-id="${messageId}"]`)) {
        return;
      }
      
      const messageElement = createMessageElement(message, messageId);
      fragment.appendChild(messageElement);
      messagesAdded++;
    });
    
    // Add all messages to the DOM at once
    chatContainer.appendChild(fragment);
    
    // Only hide loading indicator if we actually added messages
    if (messagesAdded > 0 || chatContainer.childElementCount > 1) {
      loadingIndicator.style.display = 'none';
    }
    
    // Set up sentinel for infinite scrolling
    updateScrollSentinel();
    
    // If we got fewer messages than requested, we're at the end
    if (querySnapshot.docs.length < MESSAGES_PER_PAGE) {
      noMoreMessages = true;
      showEndOfFeed();
    }
    
  } catch (error) {
    console.error('Error loading archived messages:', error);
    loadingIndicator.style.display = 'none';
  }
}

// Create scroll sentinel for infinite scrolling
function updateScrollSentinel() {
  // Remove existing sentinel if any
  const existingSentinel = document.getElementById('scroll-sentinel');
  if (existingSentinel) {
    existingSentinel.remove();
  }
  
  // Don't add a new sentinel if we've reached the end
  if (noMoreMessages) {
    return;
  }
  
  // Create new sentinel
  const sentinel = document.createElement('div');
  sentinel.id = 'scroll-sentinel';
  sentinel.style.height = '20px';
  sentinel.style.width = '100%';
  sentinel.style.visibility = 'hidden';
  
  // Add sentinel at the end of chat container
  chatContainer.appendChild(sentinel);
}

// Show end of feed message
function showEndOfFeed() {
  // Create "end of feed" element if it doesn't exist
  if (!document.getElementById('end-of-feed')) {
    const endOfFeed = document.createElement('div');
    endOfFeed.id = 'end-of-feed';
    endOfFeed.className = 'end-of-feed';
    endOfFeed.innerHTML = `
      <div class="end-of-feed-content">
        <svg viewBox="0 0 24 24" class="end-of-feed-icon">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"></path>
        </svg>
        <p>You've reached the end</p>
        <p class="end-of-feed-subtitle">No more messages to load</p>
      </div>
    `;
    chatContainer.appendChild(endOfFeed);
  }
}

// Load more archived messages when scrolling with pagination and performance optimizations
async function loadMoreMessages() {
  if (isLoadingMore || noMoreMessages) return;
  
  isLoadingMore = true;
  
  // Add loading indicator at the bottom of chat container
  const bottomLoader = document.createElement('div');
  bottomLoader.className = 'loading-dots bottom-loader';
  bottomLoader.id = 'bottom-loader';
  bottomLoader.innerHTML = `
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
  `;
  chatContainer.appendChild(bottomLoader);
  
  try {
    // Check if we have a starting point for pagination
    if (!lastVisibleMessage) {
      console.log('No last visible message reference, starting from beginning');
      await loadInitialArchivedMessages();
      return;
    }
    
    console.log('Loading more messages after:', lastVisibleMessage.id);
    
    const messagesQuery = query(
      recenceCollection,
      orderBy('timestamp', 'desc'),
      startAfter(lastVisibleMessage),
      limit(MESSAGES_PER_PAGE)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    
    // Remove bottom loader
    const loader = document.getElementById('bottom-loader');
    if (loader) loader.remove();
    
    if (querySnapshot.empty) {
      console.log('No more messages to load');
      isLoadingMore = false;
      noMoreMessages = true;
      showEndOfFeed();
      return;
    }
    
    console.log(`Loaded ${querySnapshot.docs.length} more messages`);
    
    // Update last visible message
    lastVisibleMessage = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Create a document fragment to batch DOM updates
    const fragment = document.createDocumentFragment();
    
    // Process messages
    querySnapshot.forEach(doc => {
      const message = doc.data();
      const messageId = doc.id;
      
      // Don't re-render existing messages
      if (document.querySelector(`[data-message-id="${messageId}"]`)) {
        return;
      }
      
      const messageElement = createMessageElement(message, messageId);
      fragment.appendChild(messageElement);
    });
    
    // Add all messages to the DOM at once
    chatContainer.appendChild(fragment);
    
    // Update sentinel position for infinite scrolling
    updateScrollSentinel();
    
    // If we got fewer messages than requested, we're at the end
    if (querySnapshot.docs.length < MESSAGES_PER_PAGE) {
      console.log('Reached end of messages (fewer than requested)');
      noMoreMessages = true;
      showEndOfFeed();
    }
    
  } catch (error) {
    console.error('Error loading more messages:', error);
    // Remove bottom loader on error too
    const loader = document.getElementById('bottom-loader');
    if (loader) loader.remove();
  } finally {
    isLoadingMore = false;
  }
}
// Create message element with performance optimizations
function createMessageElement(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);
  messageElement.setAttribute('data-timestamp', message.timestamp);
  
  const flagUrl = `https://flagcdn.com/w320/${message.country || 'unknown'}.png`;
  const messageTime = formatTimestamp(message.timestamp);
  const isFollowing = followedUsers.has(message.userId);
  const followBtnDisplay = message.userId === currentUser?.uid ? 'none' : 'inline-block';
  
  // Use lightweight placeholder before loading actual media
  let mediaHTML = '';
  if (message.media && message.media.length > 0) {
    mediaHTML = '<div class="media-container">';
    message.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          // Use data-src for lazy loading
          mediaHTML += `<div class="image-placeholder">
            <img data-src="${media.url}" class="message-image" loading="lazy" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E">
          </div>`;
        } else if (media.type === 'video') {
          // Fixed video handling with proper poster and controls
          mediaHTML += `<div class="video-placeholder">
            <video data-src="${media.url}" class="message-video" controls preload="none" poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E">
              <source data-src="${media.url}" type="${media.mimeType || 'video/mp4'}">
              Your browser does not support the video tag.
            </video>
          </div>`;
        }
      }
    });
    mediaHTML += '</div>';
  }
  
  messageElement.innerHTML = `
    <img src="${message.photoURL}" class="profile-image" alt="Profile" loading="lazy" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'">
    <div class="message-content">
      <div class="message-header">
        <span class="user-name">${message.name}</span>
        <img src="${flagUrl}" class="country-flag" alt="Flag" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E'" loading="lazy">
        <span class="message-time">${messageTime}</span>
        <button class="follow-btn ${isFollowing ? 'followed' : ''}" 
          data-user-id="${message.userId}" 
          onclick="toggleFollow('${message.userId}', '${message.name}')"
          style="display: ${followBtnDisplay}">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
      <div class="message-text">${message.text || ''}</div>
      ${mediaHTML}
      <div class="action-buttons">
        <!-- Reply Button -->
        <button class="action-button reply-btn">
          <svg viewBox="0 0 24 24" class="action-icon">
            <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.85.85 0 0 0 .12.403.744.744 0 0 0 1.034.229c.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67a.75.75 0 0 0-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"/>
          </svg>
          <span class="action-count">${message.replyCount || 0}</span>
        </button>
        
        <!-- Like Button -->
        <button class="action-button like-btn">
          <svg viewBox="0 0 24 24" class="action-icon">
            <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.813-1.148 2.353-2.73 4.644-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z" fill="none" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span class="action-count">${message.likeCount || 0}</span>
        </button>
        
        <!-- Retweet/Share Button -->
        <button class="action-button share-btn">
          <svg viewBox="0 0 24 24" class="action-icon">
            <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/>
          </svg>
          <span class="action-count">${message.shareCount || 0}</span>
        </button>
        
        <!-- Bookmark Button -->
        <button class="action-button bookmark-btn">
          <svg viewBox="0 0 24 24" class="action-icon">
            <path d="M19.9 23.5c-.2 0-.3 0-.4-.1L12 17.9l-7.5 5.4c-.2.2-.5.2-.8.1-.2-.1-.4-.4-.4-.7V5.6c0-1.2 1-2.2 2.2-2.2h12.8c1.2 0 2.2 1 2.2 2.2v17.1c0 .3-.2.5-.4.7-.1.1-.2.1-.4.1z"/>
          </svg>
          <span class="action-count">${message.bookmarkCount || 0}</span>
        </button>
        
        <!-- Viewers Count Button -->
        <button class="action-button viewers-btn">
          <svg viewBox="0 0 24 24" class="action-icon">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span class="action-count">${message.viewCount || 0}</span>
        </button>
      </div>
    </div>
  `;
  
  // Set it to not loaded initially (for virtual scrolling)
  messageElement.setAttribute('data-loaded', 'false');
  
  return messageElement;
}

// Archive message to Firestore
async function archiveMessage(messageId, message) {
  try {
    // Ensure media data is properly formatted before archiving
    if (message.media && message.media.length > 0) {
      // Make sure each media item has required properties
      message.media = message.media.map(media => {
        if (!media.type) {
          // Try to determine type from URL or set default
          if (media.url) {
            const url = media.url.toLowerCase();
            if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || 
                url.endsWith('.avi') || url.includes('video')) {
              media.type = 'video';
              if (!media.mimeType) {
                // Set default mime type based on extension
                if (url.endsWith('.mp4')) media.mimeType = 'video/mp4';
                else if (url.endsWith('.webm')) media.mimeType = 'video/webm';
                else if (url.endsWith('.mov')) media.mimeType = 'video/quicktime';
                else if (url.endsWith('.avi')) media.mimeType = 'video/x-msvideo';
                else media.mimeType = 'video/mp4'; // Default
              }
            } else {
              media.type = 'image';
            }
          }
        }
        return media;
      });
    }
    
    // Add to Firestore archive
    await setDoc(doc(recenceCollection, messageId), {
      ...message,
      archivedAt: Date.now()
    });
    
    // After successful archiving, ensure we only keep one message in realtime DB
    await ensureOnlyOneMessageInRealtime();
  } catch (error) {
    console.error('Error archiving message:', error);
  }
}

// Set up message archiving system with optimizations
function setupMessageArchiving() {
  // Periodically check and ensure we only have one message
  setInterval(ensureOnlyOneMessageInRealtime, 5000); // Check less frequently
}

// Ensure only one message in realtime database
async function ensureOnlyOneMessageInRealtime() {
  try {
    // Get all messages
    const snapshot = await get(chatRef);
    const messages = [];
    
    snapshot.forEach(childSnapshot => {
      messages.push({
        key: childSnapshot.key,
        timestamp: childSnapshot.val().timestamp
      });
    });
    
    // If there's more than one message
    if (messages.length > MAX_REALTIME_MESSAGES) {
      // Sort by timestamp (newest first)
      messages.sort((a, b) => b.timestamp - a.timestamp);
      
      // Keep only the most recent message
      const messagesToDelete = messages.slice(MAX_REALTIME_MESSAGES);
      
      // Delete older messages from realtime DB
      for (const message of messagesToDelete) {
        // Make sure message exists in Firestore before deleting from realtime
        const docRef = doc(recenceCollection, message.key);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // It's safely archived, delete from realtime
          await remove(ref(database, `messages/${message.key}`));
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring only one message in realtime:', error);
  }
}

// Debounce function for scroll events
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Set up infinite scroll with performance optimizations
function setupInfiniteScroll() {
  // Use Intersection Observer for better performance
  const observerOptions = {
    root: null,
    rootMargin: '500px', // Larger margin to start loading earlier
    threshold: 0.1
  };
  
  const sentinelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoadingMore && lastVisibleMessage && !noMoreMessages) {
        loadMoreMessages();
      }
    });
  }, observerOptions);
  
  // Create and observe sentinel element initially
  updateScrollSentinel();
  
  // Re-observe sentinel whenever it's updated
  const observeSentinel = () => {
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      sentinelObserver.observe(sentinel);
    }
  };
  
  // Initial observation
  observeSentinel();
  
  // Periodically check for sentinel to handle dynamic content
  const sentinelInterval = setInterval(observeSentinel, 1000);
  
  // Also handle scroll events (as backup) with improved debouncing
  const scrollHandler = debounce(() => {
    if (isLoadingMore || !lastVisibleMessage || noMoreMessages) return;
    
    // Check if we're near the bottom of the page
    const scrollPosition = window.innerHeight + window.pageYOffset;
    const bodyHeight = document.body.offsetHeight;
    
    if (bodyHeight - scrollPosition < SCROLL_TRIGGER_OFFSET) {
      loadMoreMessages();
    }
  }, DEBOUNCE_DELAY);
  
  window.addEventListener('scroll', scrollHandler, { passive: true });
}

// Set up virtual scrolling for better performance with large message counts
function setupVirtualScrolling() {
  // Use Intersection Observer for efficient visibility detection
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const messageElement = entry.target;
      
      if (entry.isIntersecting) {
        // Element is visible, load its content if not already loaded
        if (messageElement.getAttribute('data-loaded') !== 'true') {
          // Load any lazy images or other content
          const lazyImages = messageElement.querySelectorAll('img[data-src]');
          lazyImages.forEach(img => {
            if (img.dataset.src) {
              img.src = img.dataset.src;
              delete img.dataset.src;
            }
          });
          
          // Load lazy videos - FIXED VIDEO HANDLING
          const lazyVideos = messageElement.querySelectorAll('video[data-src]');
          lazyVideos.forEach(video => {
            if (video.dataset.src) {
              video.src = video.dataset.src;
              
              // Also update source elements if present
              const sources = video.querySelectorAll('source[data-src]');
              sources.forEach(source => {
                if (source.dataset.src) {
                  source.src = source.dataset.src;
                  delete source.dataset.src;
                }
              });
              
              delete video.dataset.src;
              
              // Add event listeners for video
              video.addEventListener('loadedmetadata', () => {
                // Video metadata loaded successfully
                video.classList.add('video-loaded');
              });
              
              video.addEventListener('error', (e) => {
                console.error('Video load error:', e);
                // Add fallback message or placeholder
                const fallbackMsg = document.createElement('div');
                fallbackMsg.className = 'video-error';
                fallbackMsg.textContent = 'Video could not be loaded';
                video.parentNode.appendChild(fallbackMsg);
              });
            }
          });
          
          messageElement.setAttribute('data-loaded', 'true');
        }
      } else {
        // Element is out of view, could potentially unload heavy content
        // This is optional and depends on memory constraints
        if (messageElement.getAttribute('data-loaded') === 'true' && 
            Math.abs(entry.boundingClientRect.y) > 2000) {
          // Far out of view, pause videos to save resources
          const videos = messageElement.querySelectorAll('video');
          videos.forEach(video => {
            if (!video.paused) {
              video.pause();
            }
          });
        }
      }
    });
  }, {
    root: null,
    rootMargin: '500px', // Load content before it comes into view
    threshold: 0.01
  });
  
  // Function to observe new messages
  const observeMessages = debounce(() => {
    // Observe all messages that aren't already being observed
    document.querySelectorAll('.message:not([data-observed="true"])').forEach(message => {
      visibilityObserver.observe(message);
      message.setAttribute('data-observed', 'true');
    });
  }, 100);
  
  // Observe existing messages
  observeMessages();
  
  // Set up mutation observer to detect new messages
  const mutationObserver = new MutationObserver((mutations) => {
    let hasNewMessages = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        hasNewMessages = true;
      }
    });
    
    if (hasNewMessages) {
      observeMessages();
    }
  });
  
  // Start observing the chat container for added messages
  mutationObserver.observe(chatContainer, { 
    childList: true,
    subtree: false
  });
}

// Improved upload media to Supabase with better error handling and retry mechanism
async function uploadMedia(file) {
  try {
    // Create a unique filename with timestamp and random string to prevent collisions
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${Date.now()}_${randomString}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileType = file.type.split('/')[0]; // 'image' or 'video'
    const filePath = `media/${currentUser.uid}/${fileName}`;

    console.log(`Uploading ${fileType} file: ${fileName}`);

    // Upload to Supabase Storage with proper content type
    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    console.log('Supabase upload successful:', data);

    // Get public URL with proper CDN caching
    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    // Add cache-busting parameter to prevent browser caching issues
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    
    console.log(`Media URL generated: ${publicUrl}`);

    return {
      url: publicUrl,
      type: fileType,
      originalName: file.name,
      size: file.size,
      mimeType: file.type
    };

  } catch (error) {
    console.error('Media upload failed:', error);
    
    // Retry with alternative method or return a data URL as fallback
    console.log('Attempting fallback upload method...');
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('Created data URL as fallback for media');
        resolve({
          url: event.target.result,
          type: file.type.split('/')[0],
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          isDataUrl: true // Flag to indicate this is a fallback data URL
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

// Send Message Function with improved handling of storing in Firestore and media handling
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
    sendButton.disabled = true;

    // Update global rate limit timestamp
    await set(rateLimitRef, currentTime);

    // Clear typing status
    const userTypingRef = ref(database, `typing/${currentUser.uid}`);
    set(userTypingRef, null);

    // Upload all media files with progress tracking
    const mediaUrls = [];
    if (hasMedia) {
      console.log(`Uploading ${selectedMedia.length} media files...`);
      
      for (const media of selectedMedia) {
        console.log(`Processing ${media.type} file: ${media.file.name}`);
        const uploadResult = await uploadMedia(media.file);
        mediaUrls.push(uploadResult);
      }
      
      console.log('All media uploaded successfully:', mediaUrls);
    }

    // Create message data
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

    // Store the message in the Realtime Database for real-time updates
    const newMessageRef = push(chatRef);
    await set(newMessageRef, messageData);
    const messageId = newMessageRef.key;

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

    console.log('Message sent successfully with ID:', messageId);

  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
    sendButton.disabled = false;
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

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
      
      // Update the input profile image
      inputProfileImage.src = currentUser.photoURL;

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
    });
    
    updateFollowButtons();
  } catch (error) {
    console.error('Error fetching followed users:', error);
  }
}

// Update Follow Buttons
function updateFollowButtons() {
  document.querySelectorAll('.follow-btn').forEach(btn => {
    const userId = btn.getAttribute('data-user-id');
    if (userId === currentUser?.uid) {
      btn.style.display = 'none'; // Hide follow button for own messages
    } else {
      btn.textContent = followedUsers.has(userId) ? 'Following' : 'Follow';
      btn.classList.toggle('followed', followedUsers.has(userId));
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
    } else {
      // Unfollow the user
      followSnapshot.docs.forEach(async (followDoc) => {
        await deleteDoc(doc(db, 'follows', followDoc.id));
      });
      followedUsers.delete(userId);
    }
    
    updateFollowButtons();
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
  }
};

// Add styles for improved UX
const style = document.createElement('style');
style.textContent = `
  .bottom-loader {
    padding: 20px;
    display: flex;
    justify-content: center;
  }
  
  .end-of-feed {
    padding: 40px 20px;
    display: flex;
    justify-content: center;
    text-align: center;
    color: #626262;
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .end-of-feed-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .end-of-feed-icon {
    width: 48px;
    height: 48px;
    fill: #626262;
    margin-bottom: 12px;
    opacity: 0.7;
  }
  
  .end-of-feed p {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }
  
  .end-of-feed-subtitle {
    font-size: 14px !important;
    opacity: 0.7;
    margin-top: 4px !important;
  }
  
  .image-placeholder {
    background-color: #f0f2f5;
    position: relative;
    overflow: hidden;
    min-height: 100px;
    border-radius: 8px;
  }
  
  .message-image {
    transition: opacity 0.3s ease;
    max-width: 100%;
    border-radius: 8px;
  }
  
  /* Video container styling */
  .video-placeholder {
    background-color: #f0f2f5;
    position: relative;
    overflow: hidden;
    min-height: 150px;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  
  .message-video {
    max-width: 100%;
    border-radius: 8px;
    background-color: #000;
    width: 100%;
    transition: opacity 0.3s ease;
  }
  
  .video-loaded {
    opacity: 1;
  }
  
  .video-error {
    padding: 16px;
    background-color: rgba(0,0,0,0.03);
    color: #ff3b30;
    text-align: center;
    border-radius: 8px;
    font-size: 14px;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .loading-dot {
    width: 8px;
    height: 8px;
    margin: 0 4px;
    border-radius: 50%;
    background-color: #626262;
    display: inline-block;
    animation: waveAnimation 1.5s infinite ease-in-out;
  }
  
  .loading-dot:nth-child(1) { animation-delay: 0s; }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }
  .loading-dot:nth-child(4) { animation-delay: 0.6s; }
  .loading-dot:nth-child(5) { animation-delay: 0.8s; }
  
  @keyframes waveAnimation {
    0%, 100% { 
      transform: translateY(0) scale(0.8); 
      opacity: 0.5; 
    }
    20% { 
      transform: translateY(-10px) scale(1.1); 
      opacity: 1; 
    }
    40% { 
      transform: translateY(0) scale(0.8); 
      opacity: 0.5; 
    }
  }
  
  /* Twitter-like action buttons with improved visibility */
  .action-buttons {
    display: flex;
    flex-direction: row;
    margin-top: 12px;
    align-items: center;
    justify-content: space-between;
    max-width: 425px;
  }
  
  .action-button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 8px;
    margin-right: 6px;
    cursor: pointer;
    border-radius: 50%;
    color: #536471;
    transition: all 0.2s ease;
  }
  
  .action-icon {
    width: 20px; /* Increased from 18px */
    height: 20px; /* Increased from 18px */
    fill: currentColor;
    stroke-width: 1px;
    stroke: currentColor;
  }
  
  .action-count {
    margin-left: 4px;
    font-size: 13px;
    font-weight: 500; /* Added weight */
    color: #536471;
  }
  
  /* Button hover states with stronger effects */
  .like-btn:hover {
    color: #f91880;
    background-color: rgba(249, 24, 128, 0.15);
  }
  
  .reply-btn:hover {
    color: #1d9bf0;
    background-color: rgba(29, 155, 240, 0.15);
  }
  
  .share-btn:hover {
    color: #00ba7c;
    background-color: rgba(0, 186, 124, 0.15);
  }
  
  .bookmark-btn:hover {
    color: #1d9bf0;
    background-color: rgba(29, 155, 240, 0.15);
  }
  
  .viewers-btn:hover {
    color: #1d9bf0;
    background-color: rgba(29, 155, 240, 0.15);
  }
  
  /* New viewer icon styling */
  .viewers-btn .action-icon {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5px;
  }
  
  /* Center action buttons on large screens */
  @media (min-width: 768px) {
    .action-buttons {
      margin-left: auto;
      margin-right: auto;
    }
  }
`;
document.head.appendChild(style);

// Initialize the app
initApp();