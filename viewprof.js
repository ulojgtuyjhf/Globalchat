  // Add modal styles with improved animations and UI
  const profileModalStyle = document.createElement('style');
  profileModalStyle.textContent = `
  .profile-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease-in-out;
  }

  .profile-modal.active {
    opacity: 1;
    visibility: visible;
  }

  .profile-content {
    background: linear-gradient(145deg, #f0f5fc, #e6eaf3);
    border-radius: 30px 30px 0 0;
    padding: 2rem;
    width: 100%;
    height: 50vh; /* Starts at half screen */
    transform: translateY(100%);
    transition: transform 0.3s ease-out;
    box-shadow: 0 -20px 40px rgba(0,0,0,0.2);
    touch-action: pan-y;
  }

  .profile-modal.active .profile-content {
    transform: translateY(0);
  }

  .drag-indicator {
    width: 50px;
    height: 6px;
    background: #aaa;
    border-radius: 3px;
    margin: 0 auto 10px auto;
  }

  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .profile-close {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: white;
    border: none;
    box-shadow: 4px 4px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: bold;
    color: black;
  }

  .profile-body {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .profile-image {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background-size: cover;
    box-shadow: 8px 8px 16px rgba(0,0,0,0.2);
  }

  .profile-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .profile-name {
    font-size: 1.4rem;
    font-weight: 600;
    color: #000;
  }

  .profile-meta {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .profile-flag {
    width: 32px;
    height: 20px;
    border-radius: 4px;
    box-shadow: 3px 3px 6px rgba(0,0,0,0.2);
  }

  .profile-follow {
    margin-left: auto;
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
      <button class="profile-close">✕</button>
    </div>
    <div class="profile-body">
      <div class="profile-image"></div>
      <div class="profile-info">
        <h3 class="profile-name"></h3>
        <p id="profileBioPreview">Loading bio...</p>
        <div class="profile-meta">
          <img class="profile-flag">
          <button class="follow-btn profile-follow"></button>
        </div>
      </div>
    </div>
  </div>
`;
  document.body.appendChild(profileModal);

  // Drag interaction variables
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  const content = profileModal.querySelector('.profile-content');

  // Improved dragging functionality
  profileModal.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
    currentY = startY;
    isDragging = true;
    content.style.transition = 'none';
  });

  profileModal.addEventListener('touchmove', e => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const delta = currentY - startY;

    if (delta > 0) {
      content.style.transform = `translateY(${delta}px)`;
      profileModal.style.background = `rgba(0,0,0,${0.9 - (delta / window.innerHeight)})`;
    }
  });

  profileModal.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const delta = currentY - startY;

    if (delta > 100) {
      content.style.transition = 'transform 0.3s ease-out';
      profileModal.classList.remove('active');
      content.style.transform = 'translateY(100%)';
      setTimeout(() => {
        content.style.transition = 'none';
        profileModal.style.background = 'rgba(0,0,0,0.9)';
      }, 300);
    } else {
      content.style.transition = 'transform 0.3s ease-out';
      content.style.transform = 'translateY(0)';
      profileModal.style.background = 'rgba(0,0,0,0.9)';
      setTimeout(() => content.style.transition = 'none', 300);
    }
  });

  // Fetching the bio using Firebase
  async function fetchProfileBio(userId) {
    try {
      const db = firebase.firestore();
      const userDoc = await db.collection('users').doc(userId).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        document.getElementById("profileBioPreview").textContent = userData.bio || "No bio available.";
      } else {
        document.getElementById("profileBioPreview").textContent = "No bio available.";
      }
    } catch (error) {
      console.error("Error fetching profile bio:", error);
      document.getElementById("profileBioPreview").textContent = "Failed to load bio.";
    }
  }

  // Profile click handler
  document.addEventListener('click', (e) => {
    const profile = e.target.closest('.profile');
    if (!profile) return;

    const message = profile.closest('.message');
    if (!message) return;

    const profileImage = profile.style.backgroundImage;
    const userName = message.querySelector('h4').textContent.trim();
    const countryFlag = message.querySelector('.message-flag').src;
    const userId = message.querySelector('.follow-btn').dataset.userId;

    profileModal.querySelector('.profile-image').style.backgroundImage = profileImage;
    profileModal.querySelector('.profile-name').textContent = userName;
    profileModal.querySelector('.profile-flag').src = countryFlag;

    fetchProfileBio(userId);

    profileModal.classList.add('active');
  });

  // Close modal handlers
  profileModal.querySelector('.profile-close').addEventListener('click', () => {
    profileModal.classList.remove('active');
  });

  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      profileModal.classList.remove('active');
    }
  });