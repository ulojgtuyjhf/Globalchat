import { getAuth, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Get auth and firestore instances
const auth = getAuth();
const db = getFirestore();

// Function to ensure username is saved
async function ensureUsernameSaved(user) {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // If there's no displayName or username in Firestore but we have signup username
      if ((!userData.displayName || !userData.username) && userData.signupUsername) {
        // Auto-save the signup username as both displayName and username
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: userData.signupUsername,
          username: userData.signupUsername
        });

        // Update auth profile as well
        await updateProfile(user, {
          displayName: userData.signupUsername
        });

        return userData.signupUsername;
      }

      // If we have a username but no displayName, sync them
      if (!userData.displayName && userData.username) {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: userData.username
        });

        await updateProfile(user, {
          displayName: userData.username
        });

        return userData.username;
      }
    }

    return null;
  } catch (error) {
    console.error('Error ensuring username is saved:', error);
    return null;
  }
}

// Function to update profile display
async function updateProfileDisplay(user) {
  try {
    // First ensure username is saved
    const savedUsername = await ensureUsernameSaved(user);

    // Get fresh user document after potential updates
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Get all relevant DOM elements
      const profileName = document.getElementById('profileName');
      const profileUsername = document.getElementById('profileUsername');
      const editNameInput = document.getElementById('editNameInput');
      const editNameModal = document.getElementById('editNameModal');
      const saveNameBtn = document.getElementById('saveNameBtn');
      const cancelNameBtn = document.getElementById('cancelNameBtn');
      const editNameIcon = document.getElementById('editNameIcon');

      // Use saved username or fallback to existing data
      const displayName = savedUsername || userData.displayName || user.displayName || userData.username || 'User';

      // Update display name and username
      if (profileName) {
        profileName.textContent = displayName;
      }

      if (profileUsername) {
        profileUsername.textContent = `@${userData.username || displayName}`;
      }

      // Initialize edit functionality
      if (editNameIcon && editNameModal && saveNameBtn && cancelNameBtn) {
        // Remove any existing listeners to prevent duplicates
        const newEditNameIcon = editNameIcon.cloneNode(true);
        editNameIcon.parentNode.replaceChild(newEditNameIcon, editNameIcon);

        const newSaveNameBtn = saveNameBtn.cloneNode(true);
        saveNameBtn.parentNode.replaceChild(newSaveNameBtn, saveNameBtn);

        const newCancelNameBtn = cancelNameBtn.cloneNode(true);
        cancelNameBtn.parentNode.replaceChild(newCancelNameBtn, cancelNameBtn);

        // Edit name click handler
        newEditNameIcon.addEventListener('click', () => {
          editNameInput.value = displayName;
          editNameModal.style.display = 'flex';
        });

        // Save button click handler
        newSaveNameBtn.addEventListener('click', async () => {
          const newName = editNameInput.value.trim();
          if (newName) {
            try {
              // Update in Firebase Auth
              await updateProfile(user, { displayName: newName });

              // Update in Firestore
              await updateDoc(doc(db, 'users', user.uid), {
                displayName: newName,
                username: newName
              });

              // Update local display
              if (profileName) profileName.textContent = newName;
              if (profileUsername) profileUsername.textContent = `@${newName}`;

              // Close modal
              editNameModal.style.display = 'none';

              // Trigger update event
              window.dispatchEvent(new CustomEvent('userProfileUpdated', {
                detail: {
                  displayName: newName,
                  username: newName,
                  uid: user.uid
                }
              }));

              // Force refresh chat system if available
              if (window.refreshChatUserData) {
                window.refreshChatUserData();
              }
            } catch (error) {
              console.error('Error updating name:', error);
              alert('Failed to update name. Please try again.');
            }
          }
        });

        // Cancel button click handler
        newCancelNameBtn.addEventListener('click', () => {
          editNameModal.style.display = 'none';
        });
      }

      // Make user data available globally
      window.currentUserData = {
        displayName: displayName,
        username: userData.username || displayName,
        uid: user.uid
      };
    }
  } catch (error) {
    console.error('Error updating profile display:', error);
  }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    updateProfileDisplay(user);
  }
});

// Export functions for global use
window.updateProfileDisplay = updateProfileDisplay;

// Listen for profile updates
window.addEventListener('userProfileUpdated', (event) => {
  const user = auth.currentUser;
  if (user) {
    updateProfileDisplay(user);
  }
});

// Refresh function for chat system
window.refreshUserProfile = () => {
  const user = auth.currentUser;
  if (user) {
    updateProfileDisplay(user);
  }
};