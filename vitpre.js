
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
    import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

    // Supabase Configuration
    const SUPABASE_URL = "https://wvfvggkzpplsmswbdpzq.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZnZnZ2t6cHBsc21zd2JkcHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDkwMjcsImV4cCI6MjA2MDk4NTAyN30.WIHfh63FM-YaTheu9oYlqu2QnCVaya3GSK5zeN25r3o";
    const SUPABASE_STORAGE_URL = `${SUPABASE_URL}/storage/v1/object`;
    const SUPABASE_BUCKET = "global-pictures";

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const database = getDatabase(app);
    const messagesRef = ref(database, 'messages');
    const rateLimitRef = ref(database, 'rateLimit');
    
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
            if (profileImage) profileImage.src = currentUser.photoURL;
            if (userName) userName.textContent = currentUser.displayName;

            // Create user in database if not exists
            if (!userDoc.exists()) {
              await setDoc(doc(db, 'users', user.uid), {
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                createdAt: new Date().toISOString()
              });
            }

            // Load drafts and scheduled posts
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

    // Handle media selection
    function handleMediaSelection(e) {
      const files = e.target.files;
      if (!files.length) return;
      
      const isVideoInput = e.target.id === 'videoInput';

      // Check if any video already exists if current selection is video
      if (isVideoInput && selectedMedia.some(media => media.type === 'video')) {
        alert('Only one video file can be uploaded at a time');
        e.target.value = '';
        return;
      }

      // Check if trying to add video when one already exists
      if (isVideoInput && selectedMedia.length > 0 && selectedMedia.some(media => media.type === 'video')) {
        alert('Only one video file can be uploaded at a time');
        e.target.value = '';
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type.split('/')[0]; // 'image' or 'video'
        
        // Enforce one video limit
        if (fileType === 'video') {
          if (selectedMedia.some(media => media.type === 'video')) {
            alert('Only one video file can be uploaded at a time');
            continue;
          }
        }
        
        if (selectedMedia.length >= 4) {
          alert('You can only attach up to 4 media files');
          break;
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert('File size exceeds 10MB limit');
          continue;
        }

        // Create preview
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
        
        reader.readAsDataURL(file);
        selectedMedia.push({
          file: file,
          type: fileType,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          contentType: file.type
        });
        
        isContentChanged = true;
      }

      // Reset file input and update button state
      e.target.value = '';
      updatePostButtonState();
    }

    // Remove media
    function removeMedia(index) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(selectedMedia[index].previewUrl);
      
      selectedMedia.splice(index, 1);
      updateMediaPreview();
      updatePostButtonState();
      isContentChanged = true;
    }

    // Update media preview
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
          removeMedia(index);
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

    // Upload media to Supabase
    async function uploadMedia(file) {
      try {
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.uid}_${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.uid}/${fileName}`;
        const fileType = file.type.split('/')[0]; // 'image' or 'video'
        
        // Upload to Supabase Storage
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filePath}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': file.type
          },
          body: file
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        // Get the file URL
        const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;
        
        return {
          url: fileUrl,
          type: fileType
        };
      } catch (error) {
        console.error('Media upload error:', error);
        
        // Fallback to data URL if upload fails
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              url: event.target.result,
              type: file.type.split('/')[0]
            });
          };
          reader.readAsDataURL(file);
        });
      }
    }

    // Create post
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
        
        // Upload all media files
        const mediaUrls = [];
        if (hasMedia) {
          for (const media of selectedMedia) {
            if (media.file) {
              const uploadResult = await uploadMedia(media.file);
              mediaUrls.push(uploadResult);
            } else if (media.url) {
              // For already uploaded media (from drafts or scheduled posts)
              mediaUrls.push({
                url: media.url,
                type: media.type
              });
            } else if (media.previewUrl) {
              // For media with only previewUrl (failed uploads or data URLs)
              mediaUrls.push({
                url: media.previewUrl,
                type: media.type
              });
            }
          }
        }

        // Create new post
        const newPostRef = push(messagesRef);
        await set(newPostRef, {
          userId: currentUser.uid,
          name: currentUser.displayName,
          photoURL: currentUser.photoURL,
          text: postText,
          media: mediaUrls,
          timestamp: currentTime,
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
      }
    }
    
    // Reset post form
    function resetPostForm() {
      postInput.value = '';
      selectedMedia.forEach(m => {
        if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
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

    // Convert File objects to storable format for drafts/scheduled posts
    async function fileToStorableMedia(mediaItem) {
      // If it already has a URL but no file, keep as is
      if (mediaItem.url && !mediaItem.file) {
        return {
          type: mediaItem.type,
          url: mediaItem.url,
          previewUrl: mediaItem.previewUrl || mediaItem.url
        };
      }
      
      // If it has a previewUrl but no file, keep as is
      if (mediaItem.previewUrl && !mediaItem.file) {
        return {
          type: mediaItem.type,
          previewUrl: mediaItem.previewUrl
        };
      }
      
      // If it has a file, create a data URL for storage
      if (mediaItem.file) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              type: mediaItem.type,
              dataUrl: event.target.result,
              previewUrl: mediaItem.previewUrl,
              name: mediaItem.file.name,
              size: mediaItem.file.size,
              contentType: mediaItem.file.type
            });
          };
          reader.readAsDataURL(mediaItem.file);
        });
      }
      
      return mediaItem;
    }
    
    // Convert storable media format back to usable format
    function storableMediaToFile(mediaItem) {
      // If it has a dataUrl, convert back to a file-like object
      if (mediaItem.dataUrl) {
        // Create a blob from the dataUrl
        const byteString = atob(mediaItem.dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mediaItem.contentType || 'application/octet-stream' });
        
        // Create a File-like object
        const file = new File([blob], mediaItem.name || 'file', { 
          type: mediaItem.contentType || 'application/octet-stream',
          lastModified: new Date().getTime()
        });
        
        return {
          file: file,
          type: mediaItem.type,
          previewUrl: mediaItem.previewUrl || URL.createObjectURL(file),
          name: mediaItem.name,
          size: mediaItem.size,
          contentType: mediaItem.contentType
        };
      }
      
      // If it has a url or previewUrl but no dataUrl
      if (mediaItem.url || mediaItem.previewUrl) {
        return {
          type: mediaItem.type,
          url: mediaItem.url,
          previewUrl: mediaItem.previewUrl
        };
      }
      
      return mediaItem;
    }

    // Draft functions
    async function saveDraft(autoSave = false) {
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
      
      // Convert media for storage
      const storableMedia = [];
      for (const media of selectedMedia) {
        const storable = await fileToStorableMedia(media);
        storableMedia.push(storable);
      }
      
      const draft = {
        id: draftId,
        text: postText,
        media: storableMedia,
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
    }
    
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
        
        draftItem.innerHTML = `
          <div class="draft-content">
            <div class="draft-text">${draft.text || '(No text)'}</div>
            <div class="draft-info">
              <span class="draft-time">${timeAgo}</span>
              <span class="draft-media-count">${draft.media?.length || 0} media</span>
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
    
    function loadDraft(draftId) {
      const draft = drafts.find(d => d.id === draftId);
      if (!draft) return;
      
      // Clear current form
      resetPostForm();
      
      // Load draft content
      postInput.value = draft.text || '';
      
      // Load media if available
      if (draft.media && draft.media.length > 0) {
        selectedMedia = draft.media.map(m => storableMediaToFile(m));
        updateMediaPreview();
      }
      
      // Set current editing draft
      currentEditingDraftId = draftId;
      currentScheduledPostId = null;
      postButton.textContent = 'Post';
      
      // Update button state
      updatePostButtonState();
    }
    
    function removeDraft(draftId) {
      const index = drafts.findIndex(d => d.id === draftId);
      if (index === -1) return;
      
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
    async function saveScheduledPost() {
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
      
      // Convert media for storage
      const storableMedia = [];
      for (const media of selectedMedia) {
        const storable = await fileToStorableMedia(media);
        storableMedia.push(storable);
      }
      
      const scheduledPost = {
        id: postId,
        text: postText,
        media: storableMedia,
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
        
        postItem.innerHTML = `
          <div class="scheduled-content">
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
      
      // Load media if available
      if (post.media && post.media.length > 0) {
        selectedMedia = post.media.map(m => storableMediaToFile(m));
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
    
    // Check scheduled posts to publish
    function checkScheduledPosts() {
      const now = Date.now();
      let hasPublished = false;
      
      // Find posts to publish
      const postsToPublish = scheduledPosts.filter(post => post.scheduledTimestamp <= now);
      
      if (postsToPublish.length > 0) {
        postsToPublish.forEach(async post => {
          try {
            // Prepare media for publishing
            const mediaUrls = [];
            if (post.media && post.media.length > 0) {
              for (const mediaItem of post.media) {
                // Convert stored media back to usable format
                const usableMedia = storableMediaToFile(mediaItem);
                
                if (usableMedia.file) {
                  // Upload media to Supabase if it has a file
                  const uploadResult = await uploadMedia(usableMedia.file);
                  mediaUrls.push(uploadResult);
                } else if (usableMedia.url) {
                  // Use existing URL if available
                  mediaUrls.push({
                    url: usableMedia.url,
                    type: usableMedia.type
                  });
                } else if (usableMedia.dataUrl) {
                  // Create a blob from dataUrl and upload
                  const response = await fetch(usableMedia.dataUrl);
                  const blob = await response.blob();
                  const file = new File([blob], usableMedia.name || "file", { 
                    type: usableMedia.contentType || 'application/octet-stream' 
                  });
                  
                  const uploadResult = await uploadMedia(file);
                  mediaUrls.push(uploadResult);
                } else if (usableMedia.previewUrl) {
                  // Use previewUrl as fallback
                  mediaUrls.push({
                    url: usableMedia.previewUrl,
                    type: usableMedia.type
                  });
                }
              }
            }
            
            // Create post in Firebase
            const newPostRef = push(messagesRef);
            await set(newPostRef, {
              userId: post.userId,
              name: post.userName,
              photoURL: post.photoURL,
              text: post.text || '',
              media: mediaUrls,
              timestamp: now,
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
