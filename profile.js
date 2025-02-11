import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
    import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
    import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDnPz8BWCaXJOazlFVO4Eap8VxdSR2oDFQ",
        authDomain: "globalchat-2d669.firebaseapp.com",
        projectId: "globalchat-2d669",
        storageBucket: "globalchat-2d669.appspot.com",
        messagingSenderId: "178714711978",
        appId: "1:178714711978:web:fb831188be23e62a4bbdd3"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // DOM Elements
    const profileImage = document.getElementById('profileImage');
    const changeProfilePicture = document.getElementById('changeProfilePicture');
    const profilePictureInput = document.getElementById('profilePictureInput');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const editNameIcon = document.getElementById('editNameIcon');
    const editNameModal = document.getElementById('editNameModal');
    const editNameInput = document.getElementById('editNameInput');
    const saveNameBtn = document.getElementById('saveNameBtn');
    const cancelNameBtn = document.getElementById('cancelNameBtn');

    // Bio Elements
    const profileBio = document.getElementById('profileBio');
    const editBioIcon = document.getElementById('editBioIcon');
    const editBioModal = document.getElementById('editBioModal');
    const editBioInput = document.getElementById('editBioInput');
    const saveBioBtn = document.getElementById('saveBioBtn');
    const cancelBioBtn = document.getElementById('cancelBioBtn');

    // Followers Elements
    const followersCount = document.getElementById('followersCount');
    const followingCount = document.getElementById('followingCount');
    const followersBtn = document.getElementById('followersBtn');
    const followingBtn = document.getElementById('followingBtn');
    const followersModal = document.getElementById('followersModal');
    const followersList = document.getElementById('followersList');
    const followersModalTitle = document.getElementById('followersModalTitle');

    // Dark Mode Toggle
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    const body = document.body;

    // Notifications Toggle
    const notificationsSwitch = document.getElementById('notificationsSwitch');

    // Other Buttons
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const privacyBtn = document.getElementById('privacyBtn');
    const securityBtn = document.getElementById('securityBtn');
    const helpBtn = document.getElementById('helpBtn');
    const contactBtn = document.getElementById('contactBtn');
    const termsBtn = document.getElementById('termsBtn');
    const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Dark Mode Functionality
    function initializeDarkMode() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            body.classList.add('dark-mode');
            darkModeSwitch.classList.add('active');
        }

        darkModeSwitch.addEventListener('click', function() {
            this.classList.toggle('active');
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.removeItem('darkMode');
            }
        });
    }

    // Name Editing Functionality
    function initializeNameEditing(user) {
        editNameIcon.addEventListener('click', () => {
            editNameModal.style.display = 'flex';
            editNameInput.value = user.displayName || '';
        });

        saveNameBtn.addEventListener('click', async () => {
            const newName = editNameInput.value.trim();
            if (newName) {
                try {
                    await updateProfile(user, { displayName: newName });
                    await updateDoc(doc(db, 'users', user.uid), {
                        displayName: newName
                    });
                    profileName.textContent = newName;
                    editNameModal.style.display = 'none';
                } catch (error) {
                    console.error('Error updating name:', error);
                    alert('Failed to update name. Please try again.');
                }
            }
        });

        cancelNameBtn.addEventListener('click', () => {
            editNameModal.style.display = 'none';
        });
    }

    // Bio Editing Functionality
    function initializeBioEditing(user) {
        editBioIcon.addEventListener('click', () => {
            editBioModal.style.display = 'flex';
            editBioInput.value = profileBio.textContent || '';
        });

        saveBioBtn.addEventListener('click', async () => {
            const newBio = editBioInput.value.trim();
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    bio: newBio
                });
                profileBio.textContent = newBio || 'Add a bio to tell people about yourself';
                editBioModal.style.display = 'none';
            } catch (error) {
                console.error('Error updating bio:', error);
                alert('Failed to update bio. Please try again.');
            }
        });

        cancelBioBtn.addEventListener('click', () => {
            editBioModal.style.display = 'none';
        });
    }

    // Profile Picture Change Functionality
    function initializeProfilePictureChange(user) {
        changeProfilePicture.addEventListener('click', () => {
            profilePictureInput.click();
        });

        profilePictureInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const storageRef = ref(storage, `profilePictures/${user.uid}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    const newPhotoURL = await getDownloadURL(snapshot.ref);

                    await updateProfile(user, { photoURL: newPhotoURL });
                    await updateDoc(doc(db, 'users', user.uid), {
                        photoURL: newPhotoURL
                    });

                    profileImage.src = newPhotoURL;
                } catch (error) {
                    console.error('Error updating profile picture:', error);
                    alert('Failed to update profile picture. Please try again.');
                }
            }
        });
    }

    // Followers/Following Functionality
    async function fetchFollowData(user) {
        try {
            // Fetch followers count
            const followersQuery = query(collection(db, 'follows'), 
                where('followedUserId', '==', user.uid)
            );
            const followersSnapshot = await getDocs(followersQuery);
            followersCount.textContent = followersSnapshot.size;

            // Fetch following count
            const followingQuery = query(collection(db, 'follows'), 
                where('followerUserId', '==', user.uid)
            );
            const followingSnapshot = await getDocs(followingQuery);
            followingCount.textContent = followingSnapshot.size;
        } catch (error) {
            console.error('Error fetching follow data:', error);
        }
    }

    function initializeFollowModal(user) {
        // Followers Modal
        followersBtn.addEventListener('click', async () => {
            followersModalTitle.textContent = 'Followers';
            followersList.innerHTML = ''; // Clear previous list
            
            try {
                const followersQuery = query(collection(db, 'follows'), 
                    where('followedUserId', '==', user.uid)
                );
                const followersSnapshot = await getDocs(followersQuery);
                
                for (const followDoc of followersSnapshot.docs) {
                    const followerData = followDoc.data();
                    const followerUserDoc = await getDoc(doc(db, 'users', followerData.followerUserId));
                    
                    if (followerUserDoc.exists()) {
                        const userData = followerUserDoc.data();
                        const listItem = document.createElement('div');
                        listItem.classList.add('followers-list-item');
                        listItem.innerHTML = `
                            <img src="${userData.photoURL || 'default-profile.png'}" alt="Profile">
                            <div class="followers-list-item-info">
                                <div class="followers-list-item-name">${userData.displayName}</div>
                            </div>
                        `;
                        followersList.appendChild(listItem);
                    }
                }
                
                followersModal.style.display = 'flex';
            } catch (error) {
                console.error('Error fetching followers:', error);
            }
        });

        // Following Modal
        followingBtn.addEventListener('click', async () => {
            followersModalTitle.textContent = 'Following';
            followersList.innerHTML = ''; // Clear previous list
            
            try {
                const followingQuery = query(collection(db, 'follows'), 
                    where('followerUserId', '==', user.uid)
                );
                const followingSnapshot = await getDocs(followingQuery);
                
                for (const followDoc of followingSnapshot.docs) {
                    const followingData = followDoc.data();
                    const followedUserDoc = await getDoc(doc(db, 'users', followingData.followedUserId));
                    
                    if (followedUserDoc.exists()) {
                        const userData = followedUserDoc.data();
                        const listItem = document.createElement('div');
                        listItem.classList.add('followers-list-item');
                        listItem.innerHTML = `
                            <img src="${userData.photoURL || 'default-profile.png'}" alt="Profile">
                            <div class="followers-list-item-info">
                                <div class="followers-list-item-name">${userData.displayName}</div>
                            </div>
                        `;
                        followersList.appendChild(listItem);
                    }
                }
                
                followersModal.style.display = 'flex';
            } catch (error) {
                console.error('Error fetching following:', error);
            }
        });

        // Close modal when clicking outside
        followersModal.addEventListener('click', (e) => {
            if (e.target === followersModal) {
                followersModal.style.display = 'none';
            }
        });
    }

    // Notifications Toggle Functionality
    function initializeNotificationsToggle() {
        notificationsSwitch.addEventListener('click', function() {
            this.classList.toggle('active');
            // TODO: Implement actual notification settings logic
            console.log('Notifications toggled');
        });
    }

    // Button Listeners
    function initializeButtonListeners() {
        changePasswordBtn.addEventListener('click', () => {
            // TODO: Implement change password functionality
            alert('Change Password feature coming soon');
        });

        privacyBtn.addEventListener('click', () => {
            // TODO: Implement privacy settings navigation
            
        });

        securityBtn.addEventListener('click', () => {
            // TODO: Implement security settings navigation
            
        });

        helpBtn.addEventListener('click', () => {
            // TODO: Implement help center navigation
            
        });

        contactBtn.addEventListener('click', () => {
            // TODO: Implement support contact navigation
            
        });

        termsBtn.addEventListener('click', () => {
            // TODO: Implement terms of service navigation
            
        });

        privacyPolicyBtn.addEventListener('click', () => {
            // TODO: Implement privacy policy navigation
            
        });

        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html'; // Redirect to login page
            } catch (error) {
                console.error('Logout error:', error);
                alert('Failed to log out. Please try again.');
            }
        });
    }

    // Authentication State Observer
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();

                // Set profile information
                profileName.textContent = user.displayName || userData.displayName || 'User';
                profileEmail.textContent = user.email;
                profileImage.src = user.photoURL || userData.photoURL || 'default-profile.png';
                
                // Set bio
                profileBio.textContent = userData.bio || 'Add a bio to tell people about yourself';

                // Initialize functionalities
                initializeDarkMode();
                initializeNameEditing(user);
                initializeProfilePictureChange(user);
                initializeBioEditing(user);
                initializeFollowModal(user);
                fetchFollowData(user);
                
                // Other initializations
                initializeNotificationsToggle();
                initializeButtonListeners();

            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
        }
    });