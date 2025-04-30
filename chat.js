// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, orderBy, limit, startAfter, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
const friendRequestsCollection = collection(db, 'friendRequests');
const usersCollection = collection(db, 'users');

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
const friendRequestsContainer = document.getElementById('friendRequestsContainer');
const showMoreRequests = document.getElementById('showMoreRequests');
const requestsBtnSpinner = document.getElementById('requestsBtnSpinner');
const profileScroller = document.getElementById('profileScroller');
const commentModal = document.getElementById('commentModal');
const modalCommentContent = document.getElementById('modalCommentContent');
const modalCommentInput = document.getElementById('modalCommentInput');
const modalCommentSubmit = document.getElementById('modalCommentSubmit');
const closeCommentModal = document.getElementById('closeCommentModal');
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
const MESSAGES_PER_PAGE = 10;
const MAX_REALTIME_MESSAGES = 1;
const DEBOUNCE_DELAY = 150;
const SCROLL_TRIGGER_OFFSET = 1000;
let lastSuggestedUserDoc = null;
let lastFriendRequestDoc = null;
let currentOpenMessageId = null;
const likedMessages = new Set();
const friendRequests = new Map();

// Initialize app based on which page we're on
function initApp() {
  // Common initialization for all pages
  loadingIndicator.style.display = 'flex';
  
  // Initialize features based on which elements exist
  if (chatContainer) {
    // Chat page specific initialization
    listenForMessages();
    setupInfiniteScroll();
    setupMessageArchiving();
    setupVirtualScrolling();
    
    if (messageInput) {
      // Full chat page with input
      initMessageInput();
      initMediaHandlers();
      listenForTypingIndicators();
      listenForRateLimit();
    }
  }
  
  if (suggestedUsersContainer || friendRequestsContainer) {
    // Social features initialization
    initSocialSection();
  }
  
  if (profileScroller) {
    loadProfileScroller();
  }
  
  if (commentModal) {
    initCommentModal();
  }
  
  // Initialize auth state observer
  initAuthStateObserver();
}

// Initialize auth state observer
function initAuthStateObserver() {
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
        
        // Update the input profile image if it exists
        if (inputProfileImage) {
          inputProfileImage.src = currentUser.photoURL;
        }
        
        // Create user in database if not exists
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
            status: 'online'
          });
        } else {
          // Update user status to online
          await updateDoc(doc(db, 'users', user.uid), {
            lastSeen: serverTimestamp(),
            status: 'online'
          });
        }
        
        // Fetch followed users and friend requests
        await fetchFollowedUsers();
        await fetchFriendRequests();
        await fetchLikedMessages();
        
        // Set up presence system
        setupPresence(user.uid);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
      }
    } else {
      // Sign in anonymously if no user
      signInAnonymously(auth)
        .catch((error) => {
          console.error('Anonymous auth error:', error);
          if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
    }
  });
}

// Initialize social section with user count and suggested/friend requests
function initSocialSection() {
  // Load total user count if the element exists
  if (totalUsersCount) {
    loadTotalUserCount();
  }
  
  // Load initial suggested users if the container exists
  if (suggestedUsersContainer) {
    loadSuggestedUsers();
  }
  
  // Load initial friend requests if the container exists
  if (friendRequestsContainer) {
    loadFriendRequests();
  }
  
  // Set up "Show More" button event listeners if they exist
  if (showMoreSuggested) {
    showMoreSuggested.addEventListener('click', () => {
      loadMoreSuggestedUsers();
    });
  }
  
  if (showMoreRequests) {
    showMoreRequests.addEventListener('click', () => {
      loadMoreFriendRequests();
    });
  }
}

// Initialize message input with typing indicator
function initMessageInput() {
  if (!messageInput) return;
  
  messageInput.addEventListener('input', function() {
    // Adjust height
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';

    // Enable/disable send button based on content
    const hasText = this.value.trim().length > 0;
    const hasMedia = selectedMedia.length > 0;
    if (sendButton) {
      sendButton.disabled = !(hasText || hasMedia);
    }

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

// Initialize media handlers
function initMediaHandlers() {
  if (!imageButton || !videoButton || !imageInput || !videoInput) return;
  
  imageButton.addEventListener('click', () => imageInput.click());
  videoButton.addEventListener('click', () => videoInput.click());
  imageInput.addEventListener('change', handleMediaSelection);
  videoInput.addEventListener('change', handleMediaSelection);
  
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      sendMessage();
    });
  }

  // Enter key to send message (Shift+Enter for new line)
  if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (sendButton && !sendButton.disabled) {
          sendMessage();
        }
      }
    });
  }
}

// Initialize comment modal
function initCommentModal() {
  if (!commentModal) return;
  
  // Close modal when clicking outside
  commentModal.addEventListener('click', (e) => {
    if (e.target === commentModal) {
      closeModal();
    }
  });
  
  // Close button
  closeCommentModal.addEventListener('click', closeModal);
  
  // Handle comment submission
  modalCommentSubmit.addEventListener('click', () => {
    if (currentOpenMessageId && modalCommentInput.value.trim()) {
      sendComment(currentOpenMessageId, modalCommentInput.value.trim());
      modalCommentInput.value = '';
      modalCommentInput.style.height = 'auto';
    }
  });
  
  // Auto-resize textarea
  modalCommentInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
  
  // Submit on Enter (Shift+Enter for new line)
  modalCommentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      modalCommentSubmit.click();
    }
  });
}

// Open comment modal for a specific message
function openCommentModal(messageId, messageData) {
  if (!commentModal || !modalCommentContent) return;
  
  currentOpenMessageId = messageId;
  
  // Set message content at top of modal
  modalCommentContent.innerHTML = `
    <div class="message-preview">
      ${createMessageElement(messageData, messageId).outerHTML}
    </div>
    <div class="comments-list" id="commentsList"></div>
  `;
  
  // Show modal
  commentModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Load comments
  loadComments(messageId);
}

// Close comment modal
function closeModal() {
  if (!commentModal) return;
  
  commentModal.classList.remove('active');
  document.body.style.overflow = '';
  currentOpenMessageId = null;
}

// Load comments for a message
async function loadComments(messageId) {
  if (!messageId || !modalCommentContent) return;
  
  const commentsList = modalCommentContent.querySelector('#commentsList');
  if (!commentsList) return;
  
  commentsList.innerHTML = '<div class="loading-spinner"></div>';
  
  try {
    const commentsQuery = query(
      collection(db, 'recence', messageId, 'comments'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    commentsList.innerHTML = '';
    
    if (querySnapshot.empty) {
      commentsList.innerHTML = '<div class="empty-state">No comments yet</div>';
      return;
    }
    
    querySnapshot.forEach(doc => {
      const comment = doc.data();
      commentsList.appendChild(createCommentElement(comment));
    });
    
    // Set up real-time listener for new comments
    listenForNewComments(messageId, commentsList);
    
  } catch (error) {
    console.error('Error loading comments:', error);
    commentsList.innerHTML = '<div class="empty-state">Error loading comments</div>';
  }
}

// Create comment element
function createCommentElement(comment) {
  const commentElement = document.createElement('div');
  commentElement.className = 'comment-item';
  
  commentElement.innerHTML = `
    <img src="${comment.userPhotoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}" 
         class="comment-avatar" alt="Profile">
    <div class="comment-content">
      <div class="comment-header">
        <span class="comment-author">${comment.userName}</span>
        <span class="comment-time">${formatTimestamp(comment.timestamp)}</span>
      </div>
      <div class="comment-text">${comment.text}</div>
    </div>
  `;
  
  return commentElement;
}

// Listen for new comments in real-time
function listenForNewComments(messageId, commentsList) {
  if (!messageId || !commentsList) return;
  
  const commentsQuery = query(
    collection(db, 'recence', messageId, 'comments'),
    orderBy('timestamp', 'desc')
  );
  
  // This would be better with onSnapshot, but we're using getDocs for consistency
  // In a production app, consider using onSnapshot for real-time updates
}

// Send comment to a message
async function sendComment(messageId, commentText) {
  if (!currentUser || !messageId || !commentText) return;
  
  try {
    const commentData = {
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userPhotoURL: currentUser.photoURL,
      text: commentText,
      timestamp: serverTimestamp()
    };
    
    // Add comment to Firestore
    await addDoc(collection(db, 'recence', messageId, 'comments'), commentData);
    
    // Update comment count in message
    const messageRef = doc(db, 'recence', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (messageSnap.exists()) {
      const currentCount = messageSnap.data().commentCount || 0;
      await updateDoc(messageRef, {
        commentCount: currentCount + 1
      });
    }
    
  } catch (error) {
    console.error('Error sending comment:', error);
  }
}

// Load profile scroller with suggested users
async function loadProfileScroller() {
  if (!profileScroller) return;
  
  try {
    // Query to get suggested users (random sample for demo)
    const usersQuery = query(
      usersCollection,
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const snapshot = await getDocs(usersQuery);
    profileScroller.innerHTML = '';
    
    if (snapshot.empty) {
      return;
    }

    snapshot.forEach(doc => {
      const user = doc.data();
      profileScroller.appendChild(createProfileScrollItem(user, doc.id));
    });

  } catch (error) {
    console.error('Error loading profile scroller:', error);
  }
}

// Create profile scroll item
function createProfileScrollItem(user, userId) {
  const isFollowing = followedUsers.has(userId);
  
  const item = document.createElement('div');
  item.className = 'profile-scroll-item';
  item.innerHTML = `
    <img src="${user.photoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}" 
         class="profile-scroll-img" alt="Profile" loading="lazy">
    <span class="profile-scroll-name">${user.displayName || 'User'}</span>
  `;
  
  item.addEventListener('click', () => {
    // In a real app, this would open the user's profile
    console.log('Opening profile for user:', userId);
  });
  
  return item;
}

// Load total user count from Firestore
async function loadTotalUserCount() {
  try {
    if (headerSpinner) headerSpinner.style.display = 'inline-block';
    const snapshot = await getDocs(usersCollection);
    if (totalUsersCount) totalUsersCount.textContent = snapshot.size;
  } catch (error) {
    console.error('Error loading user count:', error);
    if (totalUsersCount) totalUsersCount.textContent = '0';
  } finally {
    if (headerSpinner) headerSpinner.style.display = 'none';
  }
}

// Load suggested users with pagination
async function loadSuggestedUsers() {
  try {
    if (suggestedBtnSpinner) suggestedBtnSpinner.style.display = 'inline-block';
    if (showMoreSuggested) showMoreSuggested.classList.add('loading');
    
    // Query to get suggested users (excluding current user and already followed)
    const usersQuery = query(
      usersCollection,
      where('uid', '!=', currentUser?.uid),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const snapshot = await getDocs(usersQuery);
    if (suggestedUsersContainer) suggestedUsersContainer.innerHTML = '';
    
    if (snapshot.empty) {
      if (suggestedUsersContainer) suggestedUsersContainer.innerHTML = '<div class="empty-state">No suggested users found</div>';
      if (showMoreSuggested) showMoreSuggested.style.display = 'none';
      return;
    }

    snapshot.forEach(doc => {
      const user = doc.data();
      if (suggestedUsersContainer) {
        suggestedUsersContainer.appendChild(createUserCard(user, doc.id));
      }
    });

    // Store last document for pagination
    lastSuggestedUserDoc = snapshot.docs[snapshot.docs.length - 1];

  } catch (error) {
    console.error('Error loading suggested users:', error);
    if (suggestedUsersContainer) suggestedUsersContainer.innerHTML = '<div class="empty-state">Error loading users</div>';
  } finally {
    if (suggestedBtnSpinner) suggestedBtnSpinner.style.display = 'none';
    if (showMoreSuggested) showMoreSuggested.classList.remove('loading');
  }
}

// Load more suggested users
async function loadMoreSuggestedUsers() {
  try {
    if (suggestedBtnSpinner) suggestedBtnSpinner.style.display = 'inline-block';
    if (showMoreSuggested) showMoreSuggested.classList.add('loading');
    
    if (!lastSuggestedUserDoc) {
      await loadSuggestedUsers();
      return;
    }

    const usersQuery = query(
      usersCollection,
      where('uid', '!=', currentUser?.uid),
      orderBy('createdAt', 'desc'),
      startAfter(lastSuggestedUserDoc),
      limit(3)
    );

    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      if (showMoreSuggested) showMoreSuggested.style.display = 'none';
      return;
    }

    snapshot.forEach(doc => {
      const user = doc.data();
      if (suggestedUsersContainer) {
        suggestedUsersContainer.appendChild(createUserCard(user, doc.id));
      }
    });

    // Update last document for pagination
    lastSuggestedUserDoc = snapshot.docs[snapshot.docs.length - 1];

  } catch (error) {
    console.error('Error loading more suggested users:', error);
  } finally {
    if (suggestedBtnSpinner) suggestedBtnSpinner.style.display = 'none';
    if (showMoreSuggested) showMoreSuggested.classList.remove('loading');
  }
}

// Load friend requests
async function loadFriendRequests() {
  try {
    if (requestsBtnSpinner) requestsBtnSpinner.style.display = 'inline-block';
    if (showMoreRequests) showMoreRequests.classList.add('loading');
    
    // Query to get pending friend requests for current user
    const requestsQuery = query(
      friendRequestsCollection,
      where('toUserId', '==', currentUser?.uid),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc'),
      limit(2)
    );

    const snapshot = await getDocs(requestsQuery);
    if (friendRequestsContainer) friendRequestsContainer.innerHTML = '';
    
    if (snapshot.empty) {
      if (friendRequestsContainer) friendRequestsContainer.innerHTML = '<div class="empty-state">No friend requests</div>';
      if (showMoreRequests) showMoreRequests.style.display = 'none';
      return;
    }

    // Clear and update friend requests map
    friendRequests.clear();
    snapshot.forEach(doc => {
      const request = doc.data();
      friendRequests.set(doc.id, request);
      if (friendRequestsContainer) {
        friendRequestsContainer.appendChild(createFriendRequestItem(request, doc.id));
      }
    });

    // Store last document for pagination
    lastFriendRequestDoc = snapshot.docs[snapshot.docs.length - 1];

  } catch (error) {
    console.error('Error loading friend requests:', error);
    if (friendRequestsContainer) friendRequestsContainer.innerHTML = '<div class="empty-state">Error loading requests</div>';
  } finally {
    if (requestsBtnSpinner) requestsBtnSpinner.style.display = 'none';
    if (showMoreRequests) showMoreRequests.classList.remove('loading');
  }
}

// Load more friend requests
async function loadMoreFriendRequests() {
  try {
    if (requestsBtnSpinner) requestsBtnSpinner.style.display = 'inline-block';
    if (showMoreRequests) showMoreRequests.classList.add('loading');
    
    if (!lastFriendRequestDoc) {
      await loadFriendRequests();
      return;
    }

    const requestsQuery = query(
      friendRequestsCollection,
      where('toUserId', '==', currentUser?.uid),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc'),
      startAfter(lastFriendRequestDoc),
      limit(2)
    );

    const snapshot = await getDocs(requestsQuery);
    
    if (snapshot.empty) {
      if (showMoreRequests) showMoreRequests.style.display = 'none';
      return;
    }

    snapshot.forEach(doc => {
      const request = doc.data();
      friendRequests.set(doc.id, request);
      if (friendRequestsContainer) {
        friendRequestsContainer.appendChild(createFriendRequestItem(request, doc.id));
      }
    });

    // Update last document for pagination
    lastFriendRequestDoc = snapshot.docs[snapshot.docs.length - 1];

  } catch (error) {
    console.error('Error loading more friend requests:', error);
  } finally {
    if (requestsBtnSpinner) requestsBtnSpinner.style.display = 'none';
    if (showMoreRequests) showMoreRequests.classList.remove('loading');
  }
}

// Create friend request item
function createFriendRequestItem(request, requestId) {
  const item = document.createElement('div');
  item.className = 'user-card';
  
  item.innerHTML = `
    <div class="user-pic-container">
      <img src="${request.fromUserPhotoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}" 
           class="user-pic" alt="Profile">
      <div class="status-dot ${request.fromUserStatus === 'online' ? 'status-online' : 'status-offline'}"></div>
    </div>
    <div class="user-info">
      <div class="user-name">${request.fromUserName}</div>
      <div class="user-actions">
        <button class="request-btn accept-btn" onclick="handleFriendRequest('${requestId}', 'accept')">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
        </button>
        <button class="request-btn decline-btn" onclick="handleFriendRequest('${requestId}', 'decline')">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
        </button>
      </div>
    </div>
  `;
  
  return item;
}

// Handle friend request response
window.handleFriendRequest = async function(requestId, action) {
  if (!currentUser || !requestId || !friendRequests.has(requestId)) return;
  
  try {
    const requestRef = doc(db, 'friendRequests', requestId);
    
    if (action === 'accept') {
      // Update request status to accepted
      await updateDoc(requestRef, {
        status: 'accepted',
        respondedAt: serverTimestamp()
      });
      
      // Create friendship in both directions
      const request = friendRequests.get(requestId);
      
      await setDoc(doc(db, 'friendships', `${currentUser.uid}_${request.fromUserId}`), {
        userId1: currentUser.uid,
        userId2: request.fromUserId,
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'friendships', `${request.fromUserId}_${currentUser.uid}`), {
        userId1: request.fromUserId,
        userId2: currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      // Add to followed users set
      followedUsers.add(request.fromUserId);
      
    } else if (action === 'decline') {
      // Update request status to declined
      await updateDoc(requestRef, {
        status: 'declined',
        respondedAt: serverTimestamp()
      });
    }
    
    // Remove from local map and UI
    friendRequests.delete(requestId);
    const requestElement = document.querySelector(`[data-request-id="${requestId}"]`);
    if (requestElement) {
      requestElement.remove();
    }
    
    // Show feedback
    alert(`Request ${action === 'accept' ? 'accepted' : 'declined'}`);
    
  } catch (error) {
    console.error('Error handling friend request:', error);
    alert('Failed to process request. Please try again.');
  }
};

// Fetch friend requests
async function fetchFriendRequests() {
  if (!currentUser) return;
  
  try {
    const requestsQuery = query(
      friendRequestsCollection,
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(requestsQuery);
    friendRequests.clear();
    snapshot.forEach(doc => {
      friendRequests.set(doc.id, doc.data());
    });
    
    // Update UI if container exists
    if (friendRequestsContainer) {
      loadFriendRequests();
    }
    
  } catch (error) {
    console.error('Error fetching friend requests:', error);
  }
}

// Fetch liked messages
async function fetchLikedMessages() {
  if (!currentUser) return;
  
  try {
    const likesQuery = query(
      collection(db, 'userLikes'),
      where('userId', '==', currentUser.uid)
    );
    
    const snapshot = await getDocs(likesQuery);
    likedMessages.clear();
    snapshot.forEach(doc => {
      likedMessages.add(doc.data().messageId);
    });
    
    // Update like buttons in UI
    updateLikeButtons();
    
  } catch (error) {
    console.error('Error fetching liked messages:', error);
  }
}

// Update like buttons in UI
function updateLikeButtons() {
  document.querySelectorAll('.like-btn').forEach(btn => {
    const messageId = btn.closest('.message')?.getAttribute('data-message-id');
    if (messageId && likedMessages.has(messageId)) {
      btn.classList.add('liked');
      btn.querySelector('svg').style.fill = '#f91880';
    } else {
      btn.classList.remove('liked');
      btn.querySelector('svg').style.fill = '';
    }
  });
}

// Handle like action
window.toggleLike = async function(messageId) {
  if (!currentUser || !messageId) return;
  
  try {
    const likeRef = doc(db, 'userLikes', `${currentUser.uid}_${messageId}`);
    const messageRef = doc(db, 'recence', messageId);
    
    if (likedMessages.has(messageId)) {
      // Unlike
      await deleteDoc(likeRef);
      likedMessages.delete(messageId);
      
      // Decrement like count
      const messageSnap = await getDoc(messageRef);
      if (messageSnap.exists()) {
        const currentLikes = messageSnap.data().likeCount || 0;
        await updateDoc(messageRef, {
          likeCount: Math.max(0, currentLikes - 1)
        });
      }
      
    } else {
      // Like
      await setDoc(likeRef, {
        userId: currentUser.uid,
        messageId: messageId,
        timestamp: serverTimestamp()
      });
      likedMessages.add(messageId);
      
      // Increment like count
      const messageSnap = await getDoc(messageRef);
      if (messageSnap.exists()) {
        const currentLikes = messageSnap.data().likeCount || 0;
        await updateDoc(messageRef, {
          likeCount: currentLikes + 1
        });
      }
    }
    
    // Update UI
    updateLikeButtons();
    
  } catch (error) {
    console.error('Error toggling like:', error);
  }
};

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
    if (inputContainer) {
      inputContainer.parentNode.insertBefore(typingIndicator, inputContainer.nextSibling);
    }
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
  if (!files.length || !mediaPreview) return;

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
      if (sendButton) sendButton.disabled = false;
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
  if (selectedMedia.length === 0 && messageInput && messageInput.value.trim() === '' && sendButton) {
    sendButton.disabled = true;
  }
}

// Update media preview after removal
function updateMediaPreview() {
  if (!mediaPreview) return;
  
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
  if (!timestamp) return '';
  
  // Handle both Firestore Timestamp objects and regular numbers
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Listen for new messages with real-time updates
function listenForMessages() {
  if (!chatContainer) return;
  
  // Clear chat container but keep loading indicator visible
  while (chatContainer.firstChild && chatContainer.firstChild.id !== 'loadingIndicator') {
    chatContainer.removeChild(chatContainer.firstChild);
  }
  
  if (loadingIndicator) loadingIndicator.style.display = 'flex';
  
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
    if (chatContainer && chatContainer.childElementCount <= 1) { // Only loading indicator
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
    if (!chatContainer) return;
    
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
      if (loadingIndicator) loadingIndicator.style.display = 'none';
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
      if (loadingIndicator) loadingIndicator.style.display = 'none';
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
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

// Create scroll sentinel for infinite scrolling
function updateScrollSentinel() {
  if (!chatContainer) return;
  
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
  if (!chatContainer) return;
  
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
  if (isLoadingMore || noMoreMessages || !chatContainer) return;
  
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
      await loadInitialArchivedMessages();
      return;
    }
    
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
      isLoadingMore = false;
      noMoreMessages = true;
      showEndOfFeed();
      return;
    }
    
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
  const isLiked = likedMessages.has(messageId);
  const followBtnDisplay = message.userId === currentUser?.uid ? 'none' : 'inline-block';
  
  let mediaHTML = '';
  if (message.media && message.media.length > 0) {
    mediaHTML = '<div class="media-container">';
    message.media.forEach(media => {
      if (media && media.url) {
        if (media.type === 'image') {
          mediaHTML += `<div class="image-placeholder">
            <img data-src="${media.url}" class="message-image" loading="lazy" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E">
          </div>`;
        } else if (media.type === 'video') {
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
        <button class="action-button reply-btn" onclick="openComments('${messageId}')">
          <svg viewBox="0 0 24 24"><path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67c0-.414-.335-.75-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path></svg>
          <span class="action-count">${message.commentCount || 0}</span>
        </button>
        <button class="action-button like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${messageId}')">
          <svg viewBox="0 0 24 24"><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z"></path></svg>
          <span class="action-count">${message.likeCount || 0}</span>
        </button>
        <span class="viewers-count">
         
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
  if (!chatContainer) return;
  
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
  if (!chatContainer) return;
  
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

  const messageText = messageInput ? messageInput.value.trim() : '';
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
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (sendButton) sendButton.disabled = true;

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
      commentCount: 0,
      likeCount: 0,
      viewCount: 0
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
          commentCount: (snapshot.val().commentCount || 0) + 1
        });
      }
    }

    // Reset UI
    if (messageInput) {
      messageInput.value = '';
      messageInput.style.height = 'auto';
    }
    selectedMedia = [];
    if (mediaPreview) mediaPreview.innerHTML = '';
    if (sendButton) sendButton.disabled = true;
    lastMessageTime = currentTime;

    console.log('Message sent successfully with ID:', messageId);

  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
    if (sendButton) sendButton.disabled = false;
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

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
      collection(db, 'friendships'),
      where('userId1', '==', currentUser.uid)
    );
    
    const followSnapshot = await getDocs(followQuery);
    followedUsers.clear();
    followSnapshot.docs.forEach(doc => {
      const followedUserId = doc.data().userId2;
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
      collection(db, 'friendships'),
      where('userId1', '==', currentUser.uid),
      where('userId2', '==', userId)
    );
    
    const followSnapshot = await getDocs(followQuery);
    
    if (followSnapshot.empty) {
      // Follow the user
      await setDoc(doc(db, 'friendships', `${currentUser.uid}_${userId}`), {
        userId1: currentUser.uid,
        userId2: userId,
        userName: userName,
        timestamp: serverTimestamp()
      });
      
      // Also create the reverse relationship
      await setDoc(doc(db, 'friendships', `${userId}_${currentUser.uid}`), {
        userId1: userId,
        userId2: currentUser.uid,
        userName: currentUser.displayName,
        timestamp: serverTimestamp()
      });
      
      followedUsers.add(userId);
      
      // Send friend request notification
      await addDoc(friendRequestsCollection, {
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName,
        fromUserPhotoURL: currentUser.photoURL,
        fromUserStatus: 'online',
        toUserId: userId,
        status: 'accepted',
        timestamp: serverTimestamp()
      });
      
    } else {
      // Unfollow the user
      followSnapshot.docs.forEach(async (followDoc) => {
        await deleteDoc(doc(db, 'friendships', followDoc.id));
      });
      
      // Also delete the reverse relationship
      await deleteDoc(doc(db, 'friendships', `${userId}_${currentUser.uid}`));
      
      followedUsers.delete(userId);
    }
    
    updateFollowButtons();
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
  }
};

// Open comments modal
window.openComments = function(messageId) {
  if (!messageId || !commentModal) return;
  
  // Get message data
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageElement) return;
  
  const messageData = {
    userId: messageElement.getAttribute('data-user-id'),
    name: messageElement.querySelector('.user-name').textContent,
    photoURL: messageElement.querySelector('.profile-image').src,
    text: messageElement.querySelector('.message-text').textContent,
    timestamp: messageElement.getAttribute('data-timestamp'),
    commentCount: parseInt(messageElement.querySelector('.reply-btn .action-count').textContent) || 0,
    likeCount: parseInt(messageElement.querySelector('.like-btn .action-count').textContent) || 0
  };
  
  // Open modal with this message
  openCommentModal(messageId, messageData);
};

// Initialize the app
initApp();