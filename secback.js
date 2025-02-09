// Keep track of modal state
let isModalOpen = false;
let currentModalType = null;

// Function to handle modal state in browser history
const handleModalState = (type) => {
  if (type) {
    // Opening modal
    isModalOpen = true;
    currentModalType = type;
    // Add modal state to history without changing URL
    const stateObj = { modalOpen: true, modalType: type };
    history.pushState(stateObj, '', window.location.pathname);
  } else {
    // Closing modal
    isModalOpen = false;
    currentModalType = null;
  }
};

// Enhanced open modal function
const enhancedOpenModal = (type) => {
  const content = modalContents[type];
  if (content) {
    modalTitle.textContent = content.title;
    modalContent.innerHTML = '';
    
    content.sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'settings-section';
      
      const title = document.createElement('h3');
      title.textContent = section.title;
      title.style.marginBottom = '15px';
      sectionDiv.appendChild(title);
      
      section.items.forEach(item => {
        sectionDiv.appendChild(createSettingsItem(item));
      });
      
      modalContent.appendChild(sectionDiv);
    });
    
    settingsModal.classList.add('active');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Update modal state in history
    handleModalState(type);
  }
};

// Enhanced close modal function
const enhancedCloseModal = (useHistory = true) => {
  settingsModal.classList.remove('active');
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  
  if (useHistory) {
    // Go back in history if modal was open
    if (isModalOpen) {
      history.back();
    }
  }
  
  // Update modal state
  handleModalState(null);
};

// Handle popstate event (back/forward navigation)
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.modalOpen) {
    // Re-open modal if navigating forward
    enhancedOpenModal(event.state.modalType);
  } else if (isModalOpen) {
    // Close modal if navigating backward
    enhancedCloseModal(false); // Pass false to prevent additional history entry
  }
});

// Handle hardware back button (mainly for mobile devices)
document.addEventListener('backbutton', () => {
  if (isModalOpen) {
    enhancedCloseModal();
    event.preventDefault(); // Prevent default back behavior
  }
}, false);

// Update existing event listeners
modalBack.addEventListener('click', () => enhancedCloseModal());
modalOverlay.addEventListener('click', () => enhancedCloseModal());

// Update click handlers for menu items
document.getElementById('privacyBtn').addEventListener('click', () => enhancedOpenModal('privacy'));
document.getElementById('securityBtn').addEventListener('click', () => enhancedOpenModal('security'));

// Handle Android back button via Cordova (if applicable)
if (window.navigator.userAgent.match(/Android/i)) {
  document.addEventListener('deviceready', () => {
    document.addEventListener('backbutton', (event) => {
      if (isModalOpen) {
        enhancedCloseModal();
        event.preventDefault();
      }
    }, false);
  }, false);
}

// Keyboard event listener for Escape key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isModalOpen) {
    enhancedCloseModal();
  }
});