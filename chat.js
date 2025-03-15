import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, query, orderByChild, limitToLast, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query as firestoreQuery, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
  authDomain: "globalchat-2d669.firebaseapp.com",
  projectId: "globalchat-2d669",
  storageBucket: "globalchat-2d669.firebasestorage.app",
  messagingSenderId: "178714711978",
  appId: "1:178714711978:web:fb831188be23e62a4bbdd3",
  measurementId: "G-LYZP41ZJ46"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const mediaPreview = document.getElementById('mediaPreview');
const loadingIndicator = document.getElementById('loadingIndicator');

let currentUser = null;
let userDetails = null;
let mediaFile = null;
const followedUsers = new Set(); // Track followed users

// Auto-resize textarea and toggle send button
messageInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  if (this.value.trim() || mediaFile) {
    sendBtn.removeAttribute('disabled');
  } else {
    sendBtn.setAttribute('disabled', 'true');
  }
});

// Format timestamp and date for messages
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Get country flag from IP using SVG (for crisp rendering)
const getCountryFlag = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code.toLowerCase();
  } catch (error) {
    console.error("Error fetching country flag:", error);
    return 'unknown';
  }
};

// Load followed users from Firestore
const loadFollowedUsers = async () => {
  if (!currentUser) return;
  try {
    const followQuery = firestoreQuery(
      collection(firestore, 'follows'),
      where('followerUserId', '==', currentUser.uid)
    );
    const followSnapshot = await getDocs(followQuery);
    followSnapshot.forEach((doc) => {
      followedUsers.add(doc.data().followedUserId);
    });
  } catch (error) {
    console.error("Error loading followed users:", error);
  }
};

// Toggle follow/unfollow functionality
window.toggleFollow = async function(userId, userName) {
  if (!currentUser) {
    alert("Please log in to follow users.");
    return;
  }
  try {
    const followQuery = firestoreQuery(
      collection(firestore, 'follows'),
      where('followerUserId', '==', currentUser.uid),
      where('followedUserId', '==', userId)
    );
    const followSnapshot = await getDocs(followQuery);
    if (followSnapshot.empty) {
      // Follow the user
      await addDoc(collection(firestore, 'follows'), {
        followerUserId: currentUser.uid,
        followedUserId: userId,
        followedUserName: userName,
        timestamp: Date.now()
      });
      followedUsers.add(userId);
    } else {
      // Unfollow the user
      followSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      followedUsers.delete(userId);
    }
    // Update follow button appearance
    updateFollowButtons();
  } catch (error) {
    console.error("Error toggling follow:", error);
  }
};

// Update follow button styles for all buttons currently in the DOM
function updateFollowButtons() {
  document.querySelectorAll('.follow-btn').forEach(btn => {
    const userId = btn.getAttribute('data-user-id');
    if (userId === currentUser?.uid) {
      btn.style.display = 'none'; // Hide follow button for own messages
    } else {
      const isFollowing = followedUsers.has(userId);
      btn.textContent = isFollowing ? 'Following' : 'Follow';
      btn.classList.toggle('followed', isFollowing);
      btn.style.backgroundColor = isFollowing ? '#1DA1F2' : 'transparent';
      btn.style.color = isFollowing ? '#fff' : '#1DA1F2';
      btn.style.border = '1px solid #1DA1F2';
      btn.style.borderRadius = '15px';
      btn.style.padding = '2px 6px';
      btn.style.fontSize = '12px';
      btn.style.cursor = 'pointer';
      btn.style.outline = 'none';
      btn.style.marginLeft = '8px';
    }
  });
}

// Display a message with flag and follow button
const displayMessage = (message) => {
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('message-wrapper');
  
  const avatarDiv = document.createElement('div');
  avatarDiv.classList.add('message-avatar');
  
  const avatarImg = document.createElement('img');
  avatarImg.src = message.photoURL || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
  avatarImg.alt = 'Profile';
  avatarDiv.appendChild(avatarImg);
  
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');
  
  // Message header: username, flag, time, and follow button
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('message-header');
  
  const nameSpan = document.createElement('span');
  nameSpan.classList.add('message-name');
  nameSpan.textContent = message.username || 'Anonymous';
  headerDiv.appendChild(nameSpan);
  
  // Use SVG flag URL for a crisp image; you can adjust dimensions via CSS if needed.
  const flagImg = document.createElement('img');
  flagImg.src = `https://flagcdn.com/${(message.country || 'unknown').toLowerCase()}.svg`;
  flagImg.alt = 'Flag';
  flagImg.classList.add('country-flag');
  flagImg.style.width = '20px';
  flagImg.style.height = 'auto';
  headerDiv.appendChild(flagImg);
  
  const timeSpan = document.createElement('span');
  timeSpan.classList.add('message-time');
  timeSpan.textContent = `· ${formatDate(message.timestamp)}`;
  headerDiv.appendChild(timeSpan);
  
  // Only add follow button if the message is not from the current user
  if (message.userId !== currentUser?.uid) {
    const followButton = document.createElement('button');
    followButton.classList.add('follow-btn');
    followButton.textContent = followedUsers.has(message.userId) ? 'Following' : 'Follow';
    followButton.setAttribute('data-user-id', message.userId);
    followButton.setAttribute('onclick', `toggleFollow('${message.userId}', '${message.username}')`);
    followButton.style.padding = '2px 6px';
    followButton.style.fontSize = '12px';
    followButton.style.border = '1px solid #1DA1F2';
    followButton.style.borderRadius = '15px';
    followButton.style.backgroundColor = followedUsers.has(message.userId) ? '#1DA1F2' : 'transparent';
    followButton.style.color = followedUsers.has(message.userId) ? '#fff' : '#1DA1F2';
    followButton.style.cursor = 'pointer';
    followButton.style.outline = 'none';
    followButton.style.marginLeft = '8px';
    headerDiv.appendChild(followButton);
  }
  
  contentDiv.appendChild(headerDiv);
  
  // Message text
  if (message.text && message.text.trim()) {
    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    textDiv.textContent = message.text;
    contentDiv.appendChild(textDiv);
  }
  
  // Message media: image and/or video
  if (message.imageURL || message.videoURL) {
    const mediaDiv = document.createElement('div');
    mediaDiv.classList.add('message-media');
    if (message.imageURL) {
      const img = document.createElement('img');
      img.src = message.imageURL;
      img.alt = 'Shared image';
      img.loading = 'lazy';
      mediaDiv.appendChild(img);
    }
    if (message.videoURL) {
      // Create video element without controls, muted and playsinline
      const video = document.createElement('video');
      video.src = message.videoURL;
      video.muted = true;
      video.playsInline = true;
      // Do not add autoplay attribute here—playback is controlled via IntersectionObserver.
      video.classList.add('message-video');
      mediaDiv.appendChild(video);
    }
    contentDiv.appendChild(mediaDiv);
  }
  
  messageWrapper.appendChild(avatarDiv);
  messageWrapper.appendChild(contentDiv);
  
  chatMessages.appendChild(messageWrapper);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // For any video within this message, set up viewport autoplay
  const videos = messageWrapper.querySelectorAll('.message-video');
  videos.forEach(video => {
    if (videoObserver) {
      videoObserver.observe(video);
    }
  });
};

// ----- Video Autoplay Observer ----- //
let videoObserver;
if ('IntersectionObserver' in window) {
  videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.play().catch(() => {});
      } else {
        entry.target.pause();
      }
    });
  }, { threshold: 0.5 });
}

// ----- Upload and Preview Media ----- //
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    mediaFile = file;
    mediaPreview.innerHTML = '';
    const previewItem = document.createElement('div');
    previewItem.classList.add('media-preview-item');
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.classList.add('media-preview-image');
      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      previewItem.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      // Show a video icon preview (SVG) instead of the full video preview
      const videoIconSvg = `
        <svg viewBox="0 0 24 24" width="100" height="100" fill="#1DA1F2">
          <path d="M21 6.3c0-.7-.6-1.3-1.3-1.3H4.3C3.6 5 3 5.6 3 6.3v11.4c0 .7.6 1.3 1.3 1.3h15.4c.7 0 1.3-.6 1.3-1.3V6.3zm-2 0v11.4H5V6.3h14z"></path>
          <path d="M9.6 15l5.1-3-5.1-3v6z"></path>
        </svg>
      `;
      previewItem.innerHTML = videoIconSvg;
    }
    const removeBtn = document.createElement('button');
    removeBtn.classList.add('media-preview-remove');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      mediaPreview.innerHTML = '';
      mediaFile = null;
      if (!messageInput.value.trim()) {
        sendBtn.setAttribute('disabled', 'true');
      }
    });
    previewItem.appendChild(removeBtn);
    mediaPreview.appendChild(previewItem);
    mediaPreview.style.display = 'block';
    sendBtn.removeAttribute('disabled');
  }
});

// ----- Send Message ----- //
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text && !mediaFile) return;
  const originalBtnContent = sendBtn.innerHTML;
  sendBtn.innerHTML = '<div class="loading-spinner"></div>';
  sendBtn.setAttribute('disabled', 'true');
  try {
    let imageURL = null;
    let videoURL = null;
    if (mediaFile) {
      const fileRef = storageRef(storage, `imageSharing/${currentUser.uid}/${Date.now()}_${mediaFile.name}`);
      await uploadBytes(fileRef, mediaFile);
      const url = await getDownloadURL(fileRef);
      if (mediaFile.type.startsWith('image/')) {
        imageURL = url;
      } else if (mediaFile.type.startsWith('video/')) {
        videoURL = url;
      }
    }
    const messagesRef = ref(db, 'imageSharing');
    await push(messagesRef, {
      text,
      imageURL,
      videoURL,
      userId: currentUser.uid,
      username: userDetails?.username || currentUser.displayName || 'Anonymous',
      photoURL: userDetails?.photoURL || currentUser.photoURL,
      timestamp: Date.now(),
      country: await getCountryFlag()
    });
    // Reset UI
    messageInput.value = '';
    messageInput.style.height = 'auto';
    mediaPreview.innerHTML = '';
    mediaPreview.style.display = 'none';
    mediaFile = null;
    sendBtn.setAttribute('disabled', 'true');
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    sendBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M2.252 6.456l19.476 5.825c.53.159.53.928 0 1.088L2.252 19.194c-.43.129-.81-.303-.53-.604l4.309-4.672c.45-.487.45-1.256 0-1.742L1.722 7.06c-.28-.302.1-.733.53-.604z"></path>
      </svg>
    `;
  }
}

// ----- Load Messages ----- //
const loadMessages = () => {
  // Use 'imageSharing' as the current message collection
  const messagesRef = query(ref(db, 'imageSharing'), orderByChild('timestamp'), limitToLast(50));
  if (loadingIndicator) {
    loadingIndicator.style.display = 'flex';
  }
  onChildAdded(messagesRef, (snapshot) => {
    const message = snapshot.val();
    displayMessage(message);
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  });
};

// ----- Auth and User Data ----- //
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        userDetails = userDoc.data();
      }
      await loadFollowedUsers();
      loadMessages();
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    window.location.href = 'login.html';
  }
});