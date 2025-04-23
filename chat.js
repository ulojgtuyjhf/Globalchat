
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
let messagesLoaded = false;
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

      // Fix: Better handling of video previews
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

// Listen for new messages - Updated for top-down message flow
function listenForMessages() {
  // Show loading indicator when fetching messages
  loadingIndicator.style.display = 'flex';

  // Clear chat container
  chatContainer.innerHTML = '';

  // First load messages in reverse timestamp order (newest first)
  onChildAdded(chatRef, (snapshot) => {
    const message = snapshot.val();
    const messageId = snapshot.key;

    // Don't re-render existing messages
    if (document.querySelector(`[data-message-id="${messageId}"]`)) {
      return;
    }

    const messageElement = createMessageElement(message, messageId);

    // Always insert at the beginning for newest-first display
    if (chatContainer.firstChild) {
      chatContainer.insertBefore(messageElement, chatContainer.firstChild);
    } else {
      chatContainer.appendChild(messageElement);
    }

    // Hide loading indicator once messages are loaded
    loadingIndicator.style.display = 'none';
    messagesLoaded = true;
  });
}

// Create message element - Updated to return the element instead of appending
function createMessageElement(message, messageId) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);
  messageElement.setAttribute('data-timestamp', message.timestamp);

  const flagUrl = `https://flagcdn.com/w320/${message.country || 'unknown'}.png`;
  const messageTime = formatTimestamp(message.timestamp);
  const isFollowing = followedUsers.has(message.userId);
  const followBtnDisplay = message.userId === currentUser?.uid ? 'none' : 'inline-block';

  // Improved media handling
  let mediaHTML = '';
  if (message.media && message.media.length > 0) {
    mediaHTML = '<div class="media-container">';
    message.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          mediaHTML += `<img src="${media.url}" class="message-image" loading="lazy">`;
        } else if (media.type === 'video') {
          // Fix: Ensure video playback works with proper controls
          mediaHTML += `<video src="${media.url}" class="message-video" controls preload="metadata"></video>`;
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
        <img src="${flagUrl}" class="country-flag" alt="Flag" onerror="this.src='default-flag.png'">
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
        <button class="action-button reply-btn">
          <svg viewBox="0 0 24 24">
            <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.85.85 0 0 0 .12.403.744.744 0 0 0 1.034.229c.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67a.75.75 0 0 0-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path>
          </svg>
          ${message.replyCount || 0}
        </button>
      </div>
    </div>
  `;

  return messageElement;
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


// Upload media files - Fixed to better handle video uploads
async function uploadMedia(file) {
  try {
    // Create a unique filename
    const fileName = `${Date.now()}_${file.name}`;
    const fileType = file.type.split('/')[0]; // 'image' or 'video'
    
    // Fix: Correctly handle video file types
    const contentType = file.type;

    // Upload file to Firebase Storage via a Cloud Function proxy
    const uploadEndpoint = `https://us-central1-globalchat-2d669.cloudfunctions.net/uploadMedia`;
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUser.uid);
    formData.append('fileName', fileName);
    formData.append('contentType', contentType); // Add content type for proper handling

    // Log the upload attempt
    console.log(`Uploading ${fileType} file: ${fileName}, size: ${file.size} bytes`);

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Upload failed: ${errorText}`);
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Upload successful: ${result.url}`);
    
    return {
      url: result.url,
      type: fileType
    };

  } catch (error) {
    console.error('Media upload error:', error);

    // FALLBACK: If Cloud Function upload fails, use data URL approach
    console.log("Using data URL fallback for media");
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

// Send Message Function with improved handling of storing in Firestore
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
        const uploadResult = await uploadMedia(media.file);
        mediaUrls.push(uploadResult);
      }
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

    // Store the most recent message in the Realtime Database for real-time updates
    const newMessageRef = push(chatRef);
    await set(newMessageRef, messageData);
    const messageId = newMessageRef.key;

    // Also store the message in Firestore for persistence and better querying
    // This helps with historical message retrieval and analytics
    await addDoc(collection(db, 'messages'), {
      ...messageData,
      realtimeDbId: messageId, // Reference to the realtime DB entry
      createdAt: new Date().toISOString()
    });

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

// Initialize the app
initApp();
