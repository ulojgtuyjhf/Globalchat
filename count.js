import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getFirestore, collection, query, where, getDocs, getDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
    authDomain: "globalchat-2d669.firebaseapp.com",
    projectId: "globalchat-2d669",
    storageBucket: "globalchat-2d669.firebasestorage.app",
    messagingSenderId: "178714711978",
    appId: "1:178714711978:web:fb831188be23e62a4bbdd3",
    measurementId: "G-LYZP41ZJ46"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // DOM Elements
  const userSearchInput = document.getElementById('userSearchInput');
  const userList = document.getElementById('userList');
  const userCount = document.getElementById('userCount');

  // Create Bio Modal Elements
  const bioModal = document.createElement('div');
  bioModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

  const bioModalContent = document.createElement('div');
  bioModalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    position: relative;
`;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    right: 10px;
    top: 10px;
    border: none;
    background: none;
    font-size: 24px;
    cursor: pointer;
`;

  const bioContent = document.createElement('div');
  bioContent.style.cssText = `
    margin-top: 20px;
`;

  bioModalContent.appendChild(closeButton);
  bioModalContent.appendChild(bioContent);
  bioModal.appendChild(bioModalContent);
  document.body.appendChild(bioModal);

  // Close modal events
  closeButton.onclick = () => bioModal.style.display = 'none';
  bioModal.onclick = (e) => {
    if (e.target === bioModal) bioModal.style.display = 'none';
  };

  // Fetch and Display Available Users
  async function fetchAvailableUsers() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        window.location.href = 'login.html';
        return;
      }

      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      userList.innerHTML = ''; // Clear existing users
      let availableUsers = 0;

      // Include current user
      const currentUserData = await getCurrentUserData(currentUser.uid);
      const currentUserCard = createUserCard(currentUserData, true);
      userList.appendChild(currentUserCard);
      availableUsers++;

      snapshot.forEach((doc) => {
        const userData = doc.data();

        // Skip the current user if not already added
        if (doc.id === currentUser.uid) return;

        // Filter based on search input
        const searchTerm = userSearchInput.value.toLowerCase();
        if (searchTerm &&
          !userData.username.toLowerCase().includes(searchTerm) &&
          !(userData.country || '').toLowerCase().includes(searchTerm))
          return;

        const userCard = createUserCard({ ...userData, uid: doc.id });
        userList.appendChild(userCard);
        availableUsers++;
      });

      userCount.textContent = `Available Users: ${availableUsers - 1}`;
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  // Get Current User Data
  async function getCurrentUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data() || {};
      return {
        uid: uid,
        username: auth.currentUser.displayName || 'Current User',
        photoURL: auth.currentUser.photoURL || 'https://via.placeholder.com/50',
        country: userData.country || 'us',
        youtubeChannel: userData.youtubeChannel || 'My Channel',
        bio: userData.bio || 'No bio available',
        isOnline: true
      };
    } catch (error) {
      console.error("Error fetching current user:", error);
      return {
        uid: uid,
        username: 'Current User',
        photoURL: 'https://via.placeholder.com/50',
        country: 'us',
        youtubeChannel: 'My Channel',
        bio: 'No bio available',
        isOnline: true
      };
    }
  }

  // Show Bio Modal
  async function showBioModal(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      bioContent.innerHTML = `
            <h2 style="margin-bottom: 15px;">${userData.username || 'User'}'s Bio</h2>
            <p style="line-height: 1.6;">${userData.bio || 'No bio available'}</p>
        `;

      bioModal.style.display = 'flex';
    } catch (error) {
      console.error("Error fetching user bio:", error);
    }
  }

  // Create User Card
  function createUserCard(userData, isCurrentUser = false) {
    const card = document.createElement('div');
    card.className = 'user-card';

    const avatar = document.createElement('img');
    avatar.src = userData.photoURL || 'https://via.placeholder.com/50';
    avatar.alt = userData.username;
    avatar.className = 'user-avatar';

    const details = document.createElement('div');
    details.className = 'user-details';

    const username = document.createElement('div');
    username.className = 'user-name';
    username.textContent = isCurrentUser ? 'My Profile' : userData.username;

    const youtubeChannel = document.createElement('div');
    youtubeChannel.className = 'user-youtube';
    youtubeChannel.textContent = isCurrentUser ? 'View My Profile' : (userData.youtubeChannel || 'No YouTube Channel');

    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-container';

    const statusDot = document.createElement('div');
    statusDot.className = `status-dot ${isCurrentUser || userData.isOnline ? 'online' : 'offline'}`;

    const countryFlag = document.createElement('div');
    countryFlag.className = `fp fp-${(userData.country || 'us').toLowerCase()} country-flag`;

    statusContainer.appendChild(statusDot);
    statusContainer.appendChild(countryFlag);

    details.appendChild(username);
    details.appendChild(youtubeChannel);

    card.appendChild(avatar);
    card.appendChild(details);
    card.appendChild(statusContainer);

    // Add click event to show bio
    card.addEventListener('click', () => showBioModal(userData.uid));

    return card;
  }

  // Real-time Search
  userSearchInput.addEventListener('input', fetchAvailableUsers);

  // Authentication State Listener
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Initialize users on page load
      fetchAvailableUsers();
    } else {
      // Redirect to login if not authenticated
      window.location.href = 'login.html';
    }
  });