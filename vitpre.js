
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
const rateLimitRef = ref(database, 'rateLimit');

// Firestore references
const recenceCollection = collection(db, 'recence');

// DOM Elements - Main UI
const postInput = document.getElementById('postInput');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const imageButton = document.getElementById('imageButton');
const videoButton = document.getElementById('videoButton');
const mediaPreview = document.getElementById('mediaPreview');
const postButton = document.getElementById('postButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const successMessage = document.getElementById('successMessage');
const profileImage = document.getElementById('profileImage');
const userName = document.getElementById('userName');

// DOM Elements - Menu
const menuButton = document.getElementById('menuButton');
const menuDropdown = document.getElementById('menuDropdown');
const viewDraftsButton = document.getElementById('viewDraftsButton');
const scheduleButton = document.getElementById('scheduleButton');

// DOM Elements - Panels
const draftsPanel = document.getElementById('draftsPanel');
const schedulePanel = document.getElementById('schedulePanel');
const draftsList = document.getElementById('draftsList');
const scheduledList = document.getElementById('scheduledList');
const closeDraftsButton = document.getElementById('closeDraftsButton');
const closeScheduleButton = document.getElementById('closeScheduleButton');

// DOM Elements - Schedule
const scheduleDate = document.getElementById('scheduleDate');
const scheduleTime = document.getElementById('scheduleTime');
const saveScheduleButton = document.getElementById('saveScheduleButton');

// DOM Elements - Exit Modal
const exitModal = document.getElementById('exitModal');
const discardButton = document.getElementById('discardButton');
const saveDraftButton = document.getElementById('saveDraftButton');

// State
let currentUser = null;
let selectedMedia = [];
let drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
let scheduledPosts = JSON.parse(localStorage.getItem('scheduledPosts') || '[]');
let lastPostTime = 0;
let menuOpen = false;
let isContentChanged = false;
let isLeavingPage = false;
let currentEditingDraftId = null;
let currentScheduledPostId = null;

// Get minimum date (today) for scheduling
const today = new Date();
const minDate = today.toISOString().split('T')[0];
if (scheduleDate) {
  scheduleDate.min = minDate;
}

// Get country code from IP
async function getCountryFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code.toLowerCase();
  } catch (error) {
    console.error('Error getting country:', error);
    return 'unknown';
  }
}

// Initialize app
function init() {
  // Event listeners - Media handling
  imageButton.addEventListener('click', () => imageInput.click());
  videoButton.addEventListener('click', () => videoInput.click());
  imageInput.addEventListener('change', handleMediaSelection);
  videoInput.addEventListener('change', handleMediaSelection);
  postButton.addEventListener('click', handlePostButtonClick);
  postInput.addEventListener('input', () => {
    updatePostButtonState();
    isContentChanged = true;
  });
  
  // Event listeners - Menu
  menuButton.addEventListener('click', toggleMenu);
  document.addEventListener('click', (e) => {
    if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
      closeMenu();
    }
  });
  
  viewDraftsButton.addEventListener('click', () => {
    closeMenu();
    openDraftsPanel();
  });
  
  scheduleButton.addEventListener('click', () => {
    closeMenu();
    openSchedulePanel();
  });
  
  // Event listeners - Panels
  closeDraftsButton.addEventListener('click', closeDraftsPanel);
  closeScheduleButton.addEventListener('click', closeSchedulePanel);
  saveScheduleButton.addEventListener('click', saveScheduledPost);
  
  // Event listeners - Exit handling
  discardButton.addEventListener('click', handleDiscard);
  saveDraftButton.addEventListener('click', handleSaveDraft);
  
  // Listen for page unload/navigation
  window.addEventListener('beforeunload', (e) => {
    if (isContentChanged && !isLeavingPage) {
      showExitConfirmation();
      e.preventDefault();
      e.returnValue = '';
    }
  });
  
  // Set up auth state observer
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

        // Update UI
        profileImage.src = currentUser.photoURL;
        userName.textContent = currentUser.displayName;

        // Create user in database if not exists
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            createdAt: new Date().toISOString()
          });
        }

        // Load drafts and scheduled posts
        loadDraftsFromLocalStorage();
        loadScheduledPostsFromLocalStorage();
        renderDrafts();
        renderScheduledPosts();
        
        // Check for scheduled posts to publish
        checkScheduledPosts();
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    } else {
      // Sign in anonymously if no user
      signInAnonymously(auth).catch(error => {
        console.error('Anonymous auth error:', error);
      });
    }
  });
}

// Load drafts with blob URLs recreated
function loadDraftsFromLocalStorage() {
  try {
    const storedDrafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    
    // Process each draft to handle media
    drafts = storedDrafts.map(draft => {
      // Check if media exists and convert stored data URLs to blob URLs if needed
      if (draft.media && draft.media.length > 0) {
        draft.media = draft.media.map(media => {
          // If media has a data URL, convert it to a blob URL for better performance
          if (media.previewUrl && media.previewUrl.startsWith('data:')) {
            try {
              const blob = dataURLtoBlob(media.previewUrl);
              media.previewUrl = URL.createObjectURL(blob);
            } catch (e) {
              console.error('Error converting data URL to blob:', e);
            }
          }
          return media;
        });
      }
      return draft;
    });
  } catch (error) {
    console.error('Error loading drafts:', error);
    drafts = [];
  }
}

// Load scheduled posts with blob URLs recreated
function loadScheduledPostsFromLocalStorage() {
  try {
    const storedPosts = JSON.parse(localStorage.getItem('scheduledPosts') || '[]');
    
    // Process each scheduled post to handle media
    scheduledPosts = storedPosts.map(post => {
      // Check if media exists and convert stored data URLs to blob URLs if needed
      if (post.media && post.media.length > 0) {
        post.media = post.media.map(media => {
          // If media has a data URL, convert it to a blob URL for better performance
          if (media.previewUrl && media.previewUrl.startsWith('data:')) {
            try {
              const blob = dataURLtoBlob(media.previewUrl);
              media.previewUrl = URL.createObjectURL(blob);
            } catch (e) {
              console.error('Error converting data URL to blob:', e);
            }
          }
          return media;
        });
      }
      return post;
    });
  } catch (error) {
    console.error('Error loading scheduled posts:', error);
    scheduledPosts = [];
  }
}

// Convert data URL to Blob
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

// Menu functions
function toggleMenu() {
  menuOpen = !menuOpen;
  menuDropdown.style.display = menuOpen ? 'block' : 'none';
}

function closeMenu() {
  menuOpen = false;
  menuDropdown.style.display = 'none';
}

// Panel functions
function openDraftsPanel() {
  draftsPanel.classList.add('open');
  renderDrafts();
}

function closeDraftsPanel() {
  draftsPanel.classList.remove('open');
}

function openSchedulePanel() {
  schedulePanel.classList.add('open');
  renderScheduledPosts();
}

function closeSchedulePanel() {
  schedulePanel.classList.remove('open');
}

// Handle media selection with better video handling
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

    // Create preview with better video handling
    if (fileType === 'image' || fileType === 'video') {
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
            <video src="${e.target.result}" class="preview-video" controls></video>
            <button class="remove-media" data-index="${selectedMedia.length}">×</button>
          `;
        }
        
        mediaPreview.appendChild(previewItem);
        
        // Add remove event
        previewItem.querySelector('.remove-media').addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          removeMedia(index);
        });
      };
      
      // Use readAsDataURL for consistent handling
      reader.readAsDataURL(file);
      
      // Store original file for upload and create a preview URL
      selectedMedia.push({
        file: file,
        type: fileType,
        previewUrl: URL.createObjectURL(file),
        contentType: file.type // Store full content type for proper handling
      });
      
      isContentChanged = true;
    } else {
      alert('Unsupported file type. Please upload images or videos.');
    }
  }

  // Reset file input and update button state
  e.target.value = '';
  updatePostButtonState();
}

// Remove media
function removeMedia(index) {
  if (index < 0 || index >= selectedMedia.length) return;
  
  // Revoke object URL to free memory
  URL.revokeObjectURL(selectedMedia[index].previewUrl);
  
  // Remove the media from array
  selectedMedia.splice(index, 1);
  
  // Update preview and button state
  updateMediaPreview();
  updatePostButtonState();
  isContentChanged = true;
}

// Update media preview with proper video handling
function updateMediaPreview() {
  mediaPreview.innerHTML = '';
  
  selectedMedia.forEach((media, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    if (media.type === 'image') {
      previewItem.innerHTML = `
        <img src="${media.previewUrl}" class="preview-image">
        <button class="remove-media" data-index="${index}">×</button>
      `;
    } else if (media.type === 'video') {
      previewItem.innerHTML = `
        <video src="${media.previewUrl}" class="preview-video" controls></video>
        <button class="remove-media" data-index="${index}">×</button>
      `;
    }
    
    mediaPreview.appendChild(previewItem);
    
    // Add remove event
    previewItem.querySelector('.remove-media').addEventListener('click', function() {
      removeMedia(parseInt(this.getAttribute('data-index')));
    });
  });
}

// Update post button state
function updatePostButtonState() {
  const hasText = postInput.value.trim().length > 0;
  const hasMedia = selectedMedia.length > 0;
  postButton.disabled = !(hasText || hasMedia);
}

// Handle post button click - either post directly or check for schedule
function handlePostButtonClick() {
  if (currentScheduledPostId) {
    // If editing a scheduled post, update it
    updateScheduledPost(currentScheduledPostId);
  } else {
    // Otherwise create a new post
    createPost();
  }
}

// Upload media to Appwrite with proper handling for all content types
async function uploadMedia(file) {
  try {
    // Generate unique filename with extension
    const fileExtension = file.name.split('.').pop();
    const fileName = `${currentUser.uid}_${Date.now()}.${fileExtension}`;
    const fileType = file.type.split('/')[0]; // 'image' or 'video'
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('fileId', 'unique_' + Date.now());
    formData.append('file', file);
    
    // Upload to Appwrite using proper headers
    const response = await fetch(`${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload error details:', errorData);
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Get the proper file URL with view parameter
    const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${result.$id}/view?project=${APPWRITE_PROJECT_ID}`;
    
    return {
      url: fileUrl,
      type: fileType,
      contentType: file.type,
      fileId: result.$id // Store file ID for potential future management
    };
  } catch (error) {
    console.error('Media upload error:', error);
    
    // Upload failed - create blob URL as fallback for storage in Firestore
    // This is not ideal, but allows us to at least save the media in the draft
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        resolve({
          url: dataUrl,
          type: file.type.split('/')[0],
          contentType: file.type,
          isDataUrl: true // Flag to indicate this is a data URL, not an Appwrite URL
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

// Create post with proper media handling
async function createPost() {
  if (!currentUser) {
    alert('Please wait while we authenticate you');
    return;
  }

  const postText = postInput.value.trim();
  const currentTime = Date.now();
  const hasMedia = selectedMedia.length > 0;

  // Check if content exists
  if (!postText && !hasMedia) return;

  // Check rate limit (3 seconds between posts)
  if (currentTime - lastPostTime < 3000) {
    alert('Please wait a few seconds before posting again');
    return;
  }

  try {
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    postButton.disabled = true;
    
    // Update global rate limit
    await set(rateLimitRef, currentTime);
    
    // Upload all media files with improved handling
    const mediaUrls = [];
    if (hasMedia) {
      for (const media of selectedMedia) {
        // Only upload if we have the actual file (not just a preview URL)
        if (media.file) {
          const uploadResult = await uploadMedia(media.file);
          mediaUrls.push(uploadResult);
        } else if (media.previewUrl) {
          // Handle case where we have a preview URL but no file (from drafts/scheduled)
          mediaUrls.push({
            url: media.previewUrl,
            type: media.type,
            contentType: media.contentType || `${media.type}/*`
          });
        }
      }
    }

    // Create new post in Firestore's recence collection
    await addDoc(recenceCollection, {
      userId: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      text: postText,
      media: mediaUrls,
      timestamp: currentTime,
      serverTimestamp: serverTimestamp(), // Add server timestamp for sorting
      country: currentUser.country,
      replyCount: 0
    });

    // Reset UI
    resetPostForm();
    lastPostTime = currentTime;
    
    // Show success message
    successMessage.style.display = 'block';
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 3000);
  } catch (error) {
    console.error('Error creating post:', error);
    alert('Failed to create post. Please try again.');
  } finally {
    loadingIndicator.style.display = 'none';
    postButton.disabled = false;
  }
}

// Reset post form
function resetPostForm() {
  postInput.value = '';
  selectedMedia.forEach(m => {
    if (m.previewUrl) {
      URL.revokeObjectURL(m.previewUrl);
    }
  });
  selectedMedia = [];
  mediaPreview.innerHTML = '';
  postButton.disabled = true;
  isContentChanged = false;
  currentEditingDraftId = null;
  currentScheduledPostId = null;
  
  // Reset post button text
  postButton.textContent = 'Post';
}

// Save draft with proper media handling
function saveDraft(autoSave = false) {
  const postText = postInput.value.trim();
  const hasMedia = selectedMedia.length > 0;
  
  if (!postText && !hasMedia) {
    if (currentEditingDraftId) {
      // If editing an empty draft, remove it
      removeDraft(currentEditingDraftId);
      currentEditingDraftId = null;
    }
    return;
  }
  
  const draftId = currentEditingDraftId || Date.now().toString();
  
  // Save media as data URLs for reliable storage in localStorage
  const mediaToSave = selectedMedia.map(m => {
    // Create object to store in draft
    const mediaObj = {
      type: m.type,
      contentType: m.contentType || m.file?.type || `${m.type}/*`
    };
    
    // If we have a file, we need to create a data URL for storage
    if (m.file) {
      // Create a new FileReader to convert the file to a data URL
      const reader = new FileReader();
      // Store promise in an array to wait for all conversions
      reader.readAsDataURL(m.file);
      
      // We'll set this immediately so the draft renders while we save the file
      mediaObj.previewUrl = m.previewUrl;
      
      // Create a promise that resolves when the FileReader is done
      mediaObj._dataUrlPromise = new Promise(resolve => {
        reader.onload = e => {
          mediaObj.previewUrl = e.target.result;
          resolve();
        };
      });
    } else {
      // If we don't have a file, just use the existing preview URL
      mediaObj.previewUrl = m.previewUrl;
    }
    
    return mediaObj;
  });
  
  // Wait for all data URL conversions to complete
  Promise.all(mediaToSave.map(m => m._dataUrlPromise || Promise.resolve()))
    .then(() => {
      // Remove temporary promises before saving
      mediaToSave.forEach(m => {
        delete m._dataUrlPromise;
      });
      
      const draft = {
        id: draftId,
        text: postText,
        media: mediaToSave,
        timestamp: Date.now()
      };
      
      // Check if draft exists
      const existingIndex = drafts.findIndex(d => d.id === draftId);
      
      if (existingIndex !== -1) {
        // Update existing draft
        drafts[existingIndex] = draft;
      } else {
        // Add new draft
        drafts.push(draft);
      }
      
      // Save to localStorage
      localStorage.setItem('postDrafts', JSON.stringify(drafts));
      
      if (!autoSave) {
        // Show confirmation only if not auto-saving
        alert('Draft saved successfully');
        renderDrafts();
        isContentChanged = false;
      }
    });
}

// Render drafts with proper media preview
function renderDrafts() {
  if (!draftsList) return;
  
  draftsList.innerHTML = '';
  
  if (drafts.length === 0) {
    draftsList.innerHTML = '<div class="empty-state">No drafts saved</div>';
    return;
  }
  
  // Sort drafts by timestamp (newest first)
  const sortedDrafts = [...drafts].sort((a, b) => b.timestamp - a.timestamp);
  
  sortedDrafts.forEach(draft => {
    const draftItem = document.createElement('div');
    draftItem.className = 'draft-item';
    
    const timeAgo = getTimeAgo(draft.timestamp);
    let mediaPreviewHTML = '';
    
    // Generate media preview thumbnails
    if (draft.media && draft.media.length > 0) {
      const firstMedia = draft.media[0];
      if (firstMedia.type === 'image') {
        mediaPreviewHTML = `<div class="draft-media-preview"><img src="${firstMedia.previewUrl}" alt="Media preview"></div>`;
      } else if (firstMedia.type === 'video') {
        mediaPreviewHTML = `<div class="draft-media-preview"><video src="${firstMedia.previewUrl}" muted></video></div>`;
      }
    }
    
    draftItem.innerHTML = `
      <div class="draft-content">
        ${mediaPreviewHTML}
        <div class="draft-text-container">
          <div class="draft-text">${draft.text || '(No text)'}</div>
          <div class="draft-info">
            <span class="draft-time">${timeAgo}</span>
            <span class="draft-media-count">${draft.media?.length || 0} media</span>
          </div>
        </div>
      </div>
      <div class="draft-actions">
        <button class="action-button edit-draft" data-id="${draft.id}">Edit</button>
        <button class="action-button delete-draft" data-id="${draft.id}">Delete</button>
      </div>
    `;
    
    draftsList.appendChild(draftItem);
  });
  
  // Add event listeners
  document.querySelectorAll('.edit-draft').forEach(button => {
    button.addEventListener('click', function() {
      const draftId = this.getAttribute('data-id');
      loadDraft(draftId);
      closeDraftsPanel();
    });
  });
  
  document.querySelectorAll('.delete-draft').forEach(button => {
    button.addEventListener('click', function() {
      const draftId = this.getAttribute('data-id');
      removeDraft(draftId);
    });
  });
}

// Load draft with proper media handling
function loadDraft(draftId) {
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return;
  
  // Clear current form
  resetPostForm();
  
  // Load draft content
  postInput.value = draft.text || '';
  
  // Load media if available with proper handling for videos
  if (draft.media && draft.media.length > 0) {
    selectedMedia = draft.media.map(m => {
      // For data URLs in drafts, convert to blob URLs for better performance
      let previewUrl = m.previewUrl;
      
      // If the preview URL is a data URL, convert it to a blob URL
      if (previewUrl && previewUrl.startsWith('data:')) {
        try {
          const blob = dataURLtoBlob(previewUrl);
          previewUrl = URL.createObjectURL(blob);
        } catch (e) {
          console.error('Error converting data URL to blob:', e);
        }
      }
      
      return {
        type: m.type,
        previewUrl: previewUrl,
        contentType: m.contentType || `${m.type}/*`,
        file: null // File object is not preserved in drafts
      };
    });
    
    updateMediaPreview();
  }
  
  // Set current editing draft
  currentEditingDraftId = draftId;
  currentScheduledPostId = null;
  postButton.textContent = 'Post';
  
  // Update button state
  updatePostButtonState();
}

// Remove draft
function removeDraft(draftId) {
  const index = drafts.findIndex(d => d.id === draftId);
  if (index === -1) return;
  
  // Clean up any blob URLs
  const draft = drafts[index];
  if (draft.media) {
    draft.media.forEach(m => {
      if (m.previewUrl && m.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(m.previewUrl);
      }
    });
  }
  
  // Remove draft
  drafts.splice(index, 1);
  localStorage.setItem('postDrafts', JSON.stringify(drafts));
  
  // Update UI
  renderDrafts();
  
  // Clear current editing if removing the active draft
  if (currentEditingDraftId === draftId) {
    currentEditingDraftId = null;
  }
}

// Scheduled posts functions
function saveScheduledPost() {
  const postText = postInput.value.trim();
  const hasMedia = selectedMedia.length > 0;
  const scheduleDateVal = scheduleDate.value;
  const scheduleTimeVal = scheduleTime.value;
  
  if (!postText && !hasMedia) {
    alert('Please add some content to schedule a post');
    return;
  }
  
  if (!scheduleDateVal || !scheduleTimeVal) {
    alert('Please select both date and time for scheduling');
    return;
  }
  
  // Create scheduled timestamp
  const scheduledDateTime = new Date(`${scheduleDateVal}T${scheduleTimeVal}`);
  const now = new Date();
  
  if (scheduledDateTime <= now) {
    alert('Please select a future date and time');
    return;
  }
  
  const scheduledTimestamp = scheduledDateTime.getTime();
  const postId = currentScheduledPostId || Date.now().toString();

  // Save media as data URLs for reliable storage in localStorage
  const mediaToSave = selectedMedia.map(m => {
    // Create object to store
    const mediaObj = {
      type: m.type,
      contentType: m.contentType || m.file?.type || `${m.type}/*`
    };
    
    // If we have a file, we need to create a data URL for storage
    if (m.file) {
      // Create a new FileReader to convert the file to a data URL
      const reader = new FileReader();
      reader.readAsDataURL(m.file);
      
      // We'll set this immediately so the UI updates while saving
      mediaObj.previewUrl = m.previewUrl;
      
      // Create a promise that resolves when the FileReader is done
      mediaObj._dataUrlPromise = new Promise(resolve => {
        reader.onload = e => {
          mediaObj.previewUrl = e.target.result;
          resolve();
        };
      });
    } else {
      // If we don't have a file, just use the existing preview URL
      mediaObj.previewUrl = m.previewUrl;
    }
    
    return mediaObj;
  });
  
  // Wait for all data URL conversions to complete
  Promise.all(mediaToSave.map(m => m._dataUrlPromise || Promise.resolve()))
    .then(() => {
      // Remove temporary promises before saving
      mediaToSave.forEach(m => {
        delete m._dataUrlPromise;
      });
      
      const scheduledPost = {
        id: postId,
        text: postText,
        media: mediaToSave,
        createdTimestamp: Date.now(),
        scheduledTimestamp: scheduledTimestamp,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        country: currentUser.country
      };
      
      // Check if post exists
      const existingIndex = scheduledPosts.findIndex(p => p.id === postId);
      
      if (existingIndex !== -1) {
        // Update existing post
        scheduledPosts[existingIndex] = scheduledPost;
      } else {
        // Add new post
        scheduledPosts.push(scheduledPost);
      }
      
      // Save to localStorage
      localStorage.setItem('scheduledPosts', JSON.stringify(scheduledPosts));
      
      // Reset form
      resetPostForm();
      
      // Update UI
      renderScheduledPosts();
      alert('Post scheduled successfully!');
      
      // Close panel
      closeSchedulePanel();
    });
}

function renderScheduledPosts() {
  if (!scheduledList) return;
  
  scheduledList.innerHTML = '';
  
  if (scheduledPosts.length === 0) {
    scheduledList.innerHTML = '<div class="empty-state">No scheduled posts</div>';
    return;
  }
  
  // Sort by scheduled time (earliest first)
  const sortedPosts = [...scheduledPosts].sort((a, b) => a.scheduledTimestamp - b.scheduledTimestamp);
  
  sortedPosts.forEach(post => {
    const postDate = new Date(post.scheduledTimestamp);
    const formattedDate = postDate.toLocaleDateString();
    const formattedTime = postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const postItem = document.createElement('div');
    postItem.className = 'scheduled-item';
    
    let mediaPreviewHTML = '';
    
    // Generate media preview thumbnails
    if (post.media && post.media.length > 0) {
      const firstMedia = post.media[0];
      if (firstMedia.type === 'image') {
        mediaPreviewHTML = `<div class="scheduled-media-preview"><img src="${firstMedia.previewUrl}" alt="Media preview"></div>`;
      } else if (firstMedia.type === 'video') {
        mediaPreviewHTML = `<div class="scheduled-media-preview"><video src="${firstMedia.previewUrl}" muted></video></div>`;
      }
    }
    
    postItem.innerHTML = `
      <div class="scheduled-content">
        ${mediaPreviewHTML}
        <div class="scheduled-text-container">
          <div class="scheduled-text">${post.text || '(No text)'}</div>
          <div class="scheduled-info">
            <span class="scheduled-time">
              <svg viewBox="0 0 24 24" width="12" height="12">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="currentColor"/>
                <path d="M12.5 7H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" fill="currentColor"/>
              </svg>
              ${formattedDate} at ${formattedTime}
            </span>
            <span class="scheduled-media-count">${post.media?.length || 0} media</span>
          </div>
        </div>
      </div>
      <div class="scheduled-actions">
        <button class="action-button edit-scheduled" data-id="${post.id}">Edit</button>
        <button class="action-button delete-scheduled" data-id="${post.id}">Cancel</button>
      </div>
    `;
    
    scheduledList.appendChild(postItem);
  });
  
  // Add event listeners
  document.querySelectorAll('.edit-scheduled').forEach(button => {
    button.addEventListener('click', function() {
      const postId = this.getAttribute('data-id');
      loadScheduledPost(postId);
      closeSchedulePanel();
    });
  });
  
  document.querySelectorAll('.delete-scheduled').forEach(button => {
    button.addEventListener('click', function() {
      const postId = this.getAttribute('data-id');
      removeScheduledPost(postId);
    });
  });
}

function loadScheduledPost(postId) {
  const post = scheduledPosts.find(p => p.id === postId);
  if (!post) return;
  
  // Clear current form
  resetPostForm();
  
  // Load content
  postInput.value = post.text || '';
  
  // Load media if available with proper handling for videos
  if (post.media && post.media.length > 0) {
    selectedMedia = post.media.map(m => {
      // For data URLs, convert to blob URLs for better performance
      let previewUrl = m.previewUrl;
      
      // If the preview URL is a data URL, convert it to a blob URL
      if (previewUrl && previewUrl.startsWith('data:')) {
        try {
          const blob = dataURLtoBlob(previewUrl);
          previewUrl = URL.createObjectURL(blob);
        } catch (e) {
          console.error('Error converting data URL to blob:', e);
        }
      }
      
      return {
        type: m.type,
        previewUrl: previewUrl,
        contentType: m.contentType || `${m.type}/*`,
        file: null // File object is not preserved in scheduled posts
      };
    });
    
    updateMediaPreview();
  }
  
  // Set current editing scheduled post
  currentScheduledPostId = postId;
  currentEditingDraftId = null;
  
  // Change button text
  postButton.textContent = 'Post Now';
  
  // Update button state
  updatePostButtonState();
}

function updateScheduledPost(postId) {
  // If user clicks "Post Now" for a scheduled post, post it immediately
  createPost();
  removeScheduledPost(postId);
}

function removeScheduledPost(postId) {
  const index = scheduledPosts.findIndex(p => p.id === postId);
  if (index === -1) return;
  
  // Clean up any blob URLs
  const post = scheduledPosts[index];
  if (post.media) {
    post.media.forEach(m => {
      if (m.previewUrl && m.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(m.previewUrl);
      }
    });
  }
  
  // Remove scheduled post
  scheduledPosts.splice(index, 1);
  localStorage.setItem('scheduledPosts', JSON.stringify(scheduledPosts));
  
  // Update UI
  renderScheduledPosts();
  
  // Clear current editing if removing the active scheduled post
  if (currentScheduledPostId === postId) {
    currentScheduledPostId = null;
    postButton.textContent = 'Post';
  }
}

// Check scheduled posts to publish - now with better media handling
function checkScheduledPosts() {
  const now = Date.now();
  let hasPublished = false;
  
  // Find posts to publish
  const postsToPublish = scheduledPosts.filter(post => post.scheduledTimestamp <= now);
  
  if (postsToPublish.length > 0) {
    postsToPublish.forEach(async post => {
      try {
        // Process media for posting to Firestore
        const mediaUrls = [];
        
        if (post.media && post.media.length > 0) {
          for (const media of post.media) {
            let mediaUrl = media.previewUrl;
            let mediaType = media.type;
            let contentType = media.contentType || `${media.type}/*`;
            
            // If the preview is a data URL, we should try to upload it to Appwrite
            if (mediaUrl && mediaUrl.startsWith('data:')) {
              try {
                // Convert data URL to blob for upload
                const blob = dataURLtoBlob(mediaUrl);
                const file = new File([blob], `scheduled_${Date.now()}.${contentType.split('/')[1] || 'png'}`, { type: contentType });
                
                // Upload to Appwrite
                const uploadResult = await uploadMedia(file);
                
                // Use the uploaded URL
                mediaUrl = uploadResult.url;
                mediaType = uploadResult.type;
                contentType = uploadResult.contentType;
              } catch (error) {
                console.error('Error uploading scheduled media:', error);
                // Keep the data URL if upload fails
              }
            }
            
            mediaUrls.push({
              url: mediaUrl,
              type: mediaType,
              contentType: contentType
            });
          }
        }
        
        // Create post in Firestore recence collection
        await addDoc(recenceCollection, {
          userId: post.userId,
          name: post.userName,
          photoURL: post.photoURL,
          text: post.text || '',
          media: mediaUrls,
          timestamp: now,
          serverTimestamp: serverTimestamp(),
          country: post.country,
          replyCount: 0,
          scheduledPost: true
        });
        
        // Remove from scheduled posts
        removeScheduledPost(post.id);
        hasPublished = true;
      } catch(error) {
        console.error('Error publishing scheduled post:', error);
      }
    });
    
    if (hasPublished) {
      // Show notification
      alert('Your scheduled post(s) have been published!');
    }
  }
  
  // Set interval to check again (every minute)
  setTimeout(checkScheduledPosts, 60000);
}

// Exit confirmation handling
function showExitConfirmation() {
  exitModal.style.display = 'flex';
}

function hideExitConfirmation() {
  exitModal.style.display = 'none';
}

function handleSaveDraft() {
  saveDraft();
  isLeavingPage = true;
  hideExitConfirmation();
}

function handleDiscard() {
  isLeavingPage = true;
  hideExitConfirmation();
}

// Helper function for time formatting
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  // Convert to minutes
  const minutes = Math.floor(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  // Convert to hours
  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  // Convert to days
  const days = Math.floor(hours / 24);
  
  if (days < 7) {
    return `${days}d ago`;
  }
  
  // Format date
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

// Initialize the app
init();