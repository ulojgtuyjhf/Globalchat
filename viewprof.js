
// Profile Modal Enhancement
(function() {
  // Add modal styles with theme support
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

    .profile-content {
      background-color: #ffffff;
      color: #000000;
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

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .profile-content {
        background-color: #22303c;
        color: #ffffff;
      }
    }

    body.dark-theme .profile-content {
      background-color: #22303c;
      color: #ffffff;
    }

    .profile-modal.active .profile-content {
      transform: translateY(0);
    }

    .drag-indicator {
      width: 36px;
      height: 5px;
      background: #8899a6;
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
      color: #1da1f2;
      transition: background-color 0.2s;
    }

    .profile-close:hover {
      background-color: rgba(29, 161, 242, 0.1);
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

    .profile-handle {
      font-size: 1rem;
      color: #8899a6;
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

    .profile-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #8899a6;
      font-size: 0.9rem;
    }

    .profile-flag {
      width: 24px;
      height: 16px;
      border-radius: 2px;
      object-fit: cover;
    }

    .profile-stats {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #38444d;
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
      color: #8899a6;
      font-size: 0.9rem;
    }

    .profile-follow {
      margin-top: 1.5rem;
      background-color: #1da1f2;
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
      background-color: #1a91da;
    }

    .profile-follow.followed {
      background-color: transparent;
      color: #1da1f2;
      border: 1px solid #1da1f2;
    }

    .profile-follow.followed:hover {
      background-color: rgba(29, 161, 242, 0.1);
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
          <p class="profile-handle"></p>
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

  // Drag functionality variables
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  const content = profileModal.querySelector('.profile-content');
  const dragIndicator = profileModal.querySelector('.drag-indicator');

  // Touch event listeners for dragging
  dragIndicator.addEventListener('touchstart', handleDragStart);
  dragIndicator.addEventListener('mousedown', handleDragStart);
  
  function handleDragStart(e) {
    startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    currentY = startY;
    isDragging = true;
    content.style.transition = 'none';
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('mouseup', handleDragEnd);
    e.preventDefault();
  }
  
  function handleDragMove(e) {
    if (!isDragging) return;
    currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const delta = currentY - startY;
    
    if (delta > 0) {
      content.style.transform = `translateY(${delta}px)`;
      const opacity = Math.max(0.1, 0.75 - (delta / (window.innerHeight * 2)));
      profileModal.style.background = `rgba(0,0,0,${opacity})`;
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
    
    if (delta > 80) {
      closeProfileModal();
    } else {
      content.style.transform = 'translateY(0)';
      profileModal.style.background = 'rgba(0,0,0,0.75)';
      setTimeout(() => { content.style.transition = ''; }, 300);
    }
  }

  // Close the profile modal
  function closeProfileModal() {
    content.style.transform = 'translateY(100%)';
    profileModal.style.opacity = '0';
    setTimeout(() => {
      profileModal.classList.remove('active');
      profileModal.style.background = 'rgba(0,0,0,0.75)';
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
      const messageId = messageElement.getAttribute('data-message-id');
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
        document.querySelector('.profile-handle').textContent = `@user_${userId.substring(0, 8)}`;
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
