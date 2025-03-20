
// Profile Modal Enhancement
(function() {
  // Add modal styles with proper theme variables matching chats.html
  const profileModalStyle = document.createElement('style');
  profileModalStyle.textContent = `
    .profile-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.75);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .profile-modal.active {
      opacity: 1;
      visibility: visible;
    }

    /* Use specific theme values for each theme */
    [data-theme="light"] .profile-content {
      background-color: #ffffff;
      color: #0f1419;
      border: 1px solid #eff3f4;
    }

    [data-theme="dim"] .profile-content {
      background-color: #15202b;
      color: #ffffff;
      border: 1px solid #38444d;
    }

    [data-theme="dark"] .profile-content {
      background-color: #000000;
      color: #ffffff;
      border: 1px solid #2f3336;
    }

    .profile-content {
      border-radius: 20px 20px 0 0;
      padding: 1.5rem;
      width: 100%;
      max-height: 80vh;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
      overflow-y: auto;
      overscroll-behavior: contain;
      box-shadow: 0 -5px 25px rgba(0,0,0,0.2);
    }

    .profile-modal.active .profile-content {
      transform: translateY(0);
    }

    /* Theme-specific drag indicator */
    [data-theme="light"] .drag-indicator {
      background: #536471;
    }

    [data-theme="dim"] .drag-indicator {
      background: #8899a6;
    }

    [data-theme="dark"] .drag-indicator {
      background: #71767b;
    }

    .drag-indicator {
      width: 36px;
      height: 5px;
      border-radius: 3px;
      margin: 0 auto 15px auto;
      opacity: 0.8;
    }

    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .profile-header h2 {
      font-size: 1.2rem;
      font-weight: 800;
    }

    /* Theme-specific close button */
    [data-theme="light"] .profile-close {
      color: #1d9bf0;
    }

    [data-theme="dim"] .profile-close {
      color: #1d9bf0;
    }

    [data-theme="dark"] .profile-close {
      color: #1d9bf0;
    }

    .profile-close {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: background-color 0.2s;
    }

    /* Theme-specific hover states */
    [data-theme="light"] .profile-close:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }

    [data-theme="dim"] .profile-close:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }

    [data-theme="dark"] .profile-close:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }

    .profile-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .profile-avatar {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      margin-bottom: 0.5rem;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .profile-name {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0;
    }

    .profile-bio {
      line-height: 1.4;
      margin: 1rem 0;
    }

    .profile-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    /* Theme-specific secondary text */
    [data-theme="light"] .profile-location,
    [data-theme="light"] .stat-label {
      color: #536471;
    }

    [data-theme="dim"] .profile-location,
    [data-theme="dim"] .stat-label {
      color: #8899a6;
    }

    [data-theme="dark"] .profile-location,
    [data-theme="dark"] .stat-label {
      color: #71767b;
    }

    .profile-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .profile-flag {
      width: 24px;
      height: 16px;
      border-radius: 2px;
      object-fit: cover;
    }

    /* Theme-specific borders */
    [data-theme="light"] .profile-stats {
      border-top: 1px solid #eff3f4;
    }

    [data-theme="dim"] .profile-stats {
      border-top: 1px solid #38444d;
    }

    [data-theme="dark"] .profile-stats {
      border-top: 1px solid #2f3336;
    }

    .profile-stats {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .stat-value {
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.9rem;
    }

    /* Theme-specific follow button */
    .profile-follow {
      margin-top: 1.5rem;
      background-color: #1d9bf0;
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 0.6rem 1rem;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background-color 0.2s;
      width: 100%;
    }

    .profile-follow:hover {
      background-color: rgba(29, 155, 240, 0.9);
    }

    .profile-follow.followed {
      background-color: transparent;
      color: #1d9bf0;
      border: 1px solid #1d9bf0;
    }

    [data-theme="light"] .profile-follow.followed:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }

    [data-theme="dim"] .profile-follow.followed:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }

    [data-theme="dark"] .profile-follow.followed:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }
  `;
  document.head.appendChild(profileModalStyle);

  // Create modal structure
  const profileModal = document.createElement('div');
  profileModal.className = 'profile-modal';
  profileModal.innerHTML = `
    <div class="profile-content">
      <div class="drag-indicator"></div>
      <div class="profile-header">
        <h2>Profile</h2>
        <button class="profile-close">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M13.414 12l5.793-5.793a1 1 0 0 0-1.414-1.414L12 10.586 6.207 4.793a1 1 0 0 0-1.414 1.414L10.586 12l-5.793 5.793a1 1 0 0 0 1.414 1.414L12 13.414l5.793 5.793a1 1 0 0 0 1.414-1.414L13.414 12z"></path>
          </svg>
        </button>
      </div>
      <div class="profile-body">
        <img class="profile-avatar" src="" alt="Profile picture">
        <div class="profile-info">
          <h3 class="profile-name"></h3>
          <p class="profile-bio" id="profileBio">Loading profile information...</p>
          
          <div class="profile-meta">
            <div class="profile-location">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12 14.315c-2.088 0-3.787-1.698-3.787-3.786S9.913 6.74 12 6.74s3.787 1.7 3.787 3.787-1.7 3.785-3.787 3.785zm0-6.073c-1.26 0-2.287 1.026-2.287 2.287S10.74 12.814 12 12.814s2.287-1.025 2.287-2.286S13.26 8.24 12 8.24z"></path>
                <path fill="currentColor" d="M20.692 10.69C20.692 5.9 16.792 2 12 2s-8.692 3.9-8.692 8.69c0 1.902.603 3.708 1.743 5.223l.003-.002.007.015c1.628 2.07 6.278 5.757 6.475 5.912.138.11.302.163.465.163.163 0 .327-.053.465-.162.197-.155 4.847-3.84 6.475-5.912l.007-.014.002.002c1.14-1.516 1.742-3.32 1.742-5.223z"></path>
              </svg>
              <span class="profile-country"></span>
              <img class="profile-flag" src="" alt="Country flag">
            </div>
          </div>
          
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value" id="profilePosts">0</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="profileFollowers">0</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="profileFollowing">0</span>
              <span class="stat-label">Following</span>
            </div>
          </div>
          
          <button class="follow-btn profile-follow" id="profileFollowBtn">Follow</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(profileModal);

  // Apply theme from localStorage on load
  function applyCurrentTheme() {
    const savedTheme = localStorage.getItem('twitter-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
  
  // Apply theme initially
  applyCurrentTheme();

  // Listen for theme changes in localStorage
  window.addEventListener('storage', function(event) {
    if (event.key === 'twitter-theme') {
      document.documentElement.setAttribute('data-theme', event.newValue || 'light');
    }
  });

  // Also listen for custom theme change events
  window.addEventListener('themeChanged', function(event) {
    if (event.detail && event.detail.theme) {
      document.documentElement.setAttribute('data-theme', event.detail.theme);
    }
  });

  // Drag functionality
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  const content = profileModal.querySelector('.profile-content');
  
  // Make the entire content area draggable
  content.addEventListener('touchstart', handleDragStart, { passive: true });
  content.addEventListener('mousedown', handleDragStart);
  
  function handleDragStart(e) {
    if (e.target.closest('button') || e.target.closest('a')) return;
    
    startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    currentY = startY;
    isDragging = true;
    content.style.transition = 'none';
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('mouseup', handleDragEnd);
  }
  
  function handleDragMove(e) {
    if (!isDragging) return;
    currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const delta = currentY - startY;
    
    if (delta > 0) {
      content.style.transform = `translateY(${delta}px)`;
      e.preventDefault();
    }
  }
  
  function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    document.removeEventListener('mouseup', handleDragEnd);
    
    const delta = currentY - startY;
    
    content.style.transition = 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)';
    
    if (delta > 50) {
      closeProfileModal();
    } else {
      content.style.transform = 'translateY(0)';
      setTimeout(() => { content.style.transition = ''; }, 300);
    }
  }

  // Close the profile modal
  function closeProfileModal() {
    content.style.transform = 'translateY(100%)';
    profileModal.style.opacity = '0';
    setTimeout(() => {
      profileModal.classList.remove('active');
      content.style.transition = '';
    }, 300);
  }

  // Close modal with button or outside click
  profileModal.querySelector('.profile-close').addEventListener('click', closeProfileModal);
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      closeProfileModal();
    }
  });

  // Fetch profile data from Firebase
  async function fetchProfileData(userId) {
    try {
      // Get references to Firebase services from the existing Firebase instance
      const app = firebase.app();
      const db = firebase.firestore();
      const rtdb = firebase.database();
      
      // Show loading state
      document.getElementById('profileBio').textContent = "Loading profile information...";
      
      // Fetch user data from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Update basic profile info
        document.querySelector('.profile-bio').textContent = userData.bio || "No bio available";
        
        // Get follower count
        const followersQuery = await db.collection('follows')
          .where('followedUserId', '==', userId)
          .get();
        document.getElementById('profileFollowers').textContent = followersQuery.size;
        
        // Get following count
        const followingQuery = await db.collection('follows')
          .where('followerUserId', '==', userId)
          .get();
        document.getElementById('profileFollowing').textContent = followingQuery.size;
        
        // Get post count (assuming there's a messages collection with userId field)
        const messagesRef = rtdb.ref('messages');
        const messagesQuery = messagesRef.orderByChild('userId').equalTo(userId);
        messagesQuery.once('value', (snapshot) => {
          const messageCount = snapshot.numChildren();
          document.getElementById('profilePosts').textContent = messageCount;
        });
        
        // Check if current user is following this profile
        const currentUserId = firebase.auth().currentUser?.uid;
        if (currentUserId) {
          const isFollowingQuery = await db.collection('follows')
            .where('followerUserId', '==', currentUserId)
            .where('followedUserId', '==', userId)
            .get();
          
          const followBtn = document.getElementById('profileFollowBtn');
          if (!isFollowingQuery.empty) {
            followBtn.classList.add('followed');
            followBtn.textContent = 'Following';
          } else {
            followBtn.classList.remove('followed');
            followBtn.textContent = 'Follow';
          }
          
          // Hide follow button if viewing own profile
          if (currentUserId === userId) {
            followBtn.style.display = 'none';
          } else {
            followBtn.style.display = 'block';
          }
        }
      } else {
        document.querySelector('.profile-bio').textContent = "User profile not found";
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      document.querySelector('.profile-bio').textContent = "Error loading profile";
    }
  }

  // Follow/Unfollow functionality
  document.getElementById('profileFollowBtn').addEventListener('click', async function() {
    const userId = this.getAttribute('data-user-id');
    const userName = document.querySelector('.profile-name').textContent;
    
    if (!firebase.auth().currentUser) {
      alert('Please log in to follow users');
      return;
    }
    
    try {
      // Using the existing toggleFollow function from the main script
      if (window.toggleFollow) {
        window.toggleFollow(userId, userName);
        
        // Update button appearance based on current state
        if (this.classList.contains('followed')) {
          this.classList.remove('followed');
          this.textContent = 'Follow';
        } else {
          this.classList.add('followed');
          this.textContent = 'Following';
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  });

  // Attach click event to profile images in messages
  document.addEventListener('click', (e) => {
    // Check if clicked on profile image
    if (e.target.classList.contains('profile-image')) {
      const messageElement = e.target.closest('.message');
      if (!messageElement) return;
      
      // Extract data from message element
      const userId = messageElement.querySelector('.follow-btn')?.getAttribute('data-user-id');
      const userName = messageElement.querySelector('.user-name')?.textContent || 'User';
      const photoURL = e.target.src;
      const countryCode = messageElement.querySelector('.country-flag')?.getAttribute('alt') || 'unknown';
      const flagUrl = messageElement.querySelector('.country-flag')?.src || '';
      
      // If we have a valid userId, show the profile modal
      if (userId) {
        // Set data in profile modal
        document.querySelector('.profile-avatar').src = photoURL;
        document.querySelector('.profile-name').textContent = userName;
        document.querySelector('.profile-bio').textContent = "Loading...";
        document.querySelector('.profile-country').textContent = countryCode;
        document.querySelector('.profile-flag').src = flagUrl;
        document.getElementById('profileFollowBtn').setAttribute('data-user-id', userId);
        
        // Fetch more profile data
        fetchProfileData(userId);
        
        // Show the modal
        profileModal.classList.add('active');
        profileModal.style.opacity = '1';
        setTimeout(() => {
          content.style.transform = 'translateY(0)';
        }, 10);
      }
    }
  });
})();
