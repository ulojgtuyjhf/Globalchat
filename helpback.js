// Track state of help modals
let activeHelpModal = null;
const MODAL_STATES = {
  HELP_CENTER: 'helpCenter',
  CONTACT_SUPPORT: 'contactSupport'
};

// Enhanced open modal function with history state
function openHelpModalWithState(modalElement, modalType) {
  // Close any other active modals first
  helpModals.forEach(modal => modal.classList.remove('active'));
  modalOverlay.classList.remove('active');
  
  // Open requested modal
  modalElement.classList.add('active');
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Update active modal tracking
  activeHelpModal = modalType;
  
  // Add state to browser history
  const stateObj = { modalType: modalType };
  history.pushState(stateObj, '', window.location.pathname);
}

// Enhanced close modal function
function closeHelpModalWithState(useHistory = true) {
  helpModals.forEach(modal => modal.classList.remove('active'));
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  
  if (useHistory && activeHelpModal) {
    history.back();
  }
  
  activeHelpModal = null;
  
  // Reset form if contact support was open
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.reset();
    document.getElementById('successMessage').style.display = 'none';
    document.querySelectorAll('.error-message').forEach(err => err.textContent = '');
  }
}

// Handle popstate event (browser back/forward)
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.modalType) {
    // Reopen appropriate modal
    switch (event.state.modalType) {
      case MODAL_STATES.HELP_CENTER:
        openHelpModalWithState(helpCenterModal, MODAL_STATES.HELP_CENTER);
        break;
      case MODAL_STATES.CONTACT_SUPPORT:
        openHelpModalWithState(contactSupportModal, MODAL_STATES.CONTACT_SUPPORT);
        break;
    }
  } else if (activeHelpModal) {
    // Close modal if navigating back with no modal state
    closeHelpModalWithState(false);
  }
});

// Handle hardware back button (mobile devices)
document.addEventListener('backbutton', (event) => {
  if (activeHelpModal) {
    event.preventDefault();
    closeHelpModalWithState();
  }
}, false);

// Update existing event listeners
document.getElementById('helpBtn').addEventListener('click', () => 
  openHelpModalWithState(helpCenterModal, MODAL_STATES.HELP_CENTER)
);

document.getElementById('contactBtn').addEventListener('click', () => 
  openHelpModalWithState(contactSupportModal, MODAL_STATES.CONTACT_SUPPORT)
);

helpBackButtons.forEach(button => {
  button.addEventListener('click', () => closeHelpModalWithState());
});

modalOverlay.addEventListener('click', () => {
  if (activeHelpModal) {
    closeHelpModalWithState();
  }
});

// Handle Android back button via Cordova (if applicable)
if (window.navigator.userAgent.match(/Android/i)) {
  document.addEventListener('deviceready', () => {
    document.addEventListener('backbutton', (event) => {
      if (activeHelpModal) {
        event.preventDefault();
        closeHelpModalWithState();
      }
    }, false);
  }, false);
}

// Keyboard event listener for Escape key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeHelpModal) {
    closeHelpModalWithState();
  }
});

// Handle navigation between help modals
const helpCards = document.querySelectorAll('.help-card');
helpCards.forEach(card => {
  card.addEventListener('click', () => {
    // Add your navigation logic here if help cards should navigate to different sections
    const cardTitle = card.querySelector('h4').textContent;
    // Example: Open specific content based on card title
    console.log(`Navigating to: ${cardTitle}`);
  });
});

// Form submission handler with navigation support
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = document.getElementById('submitSupport');
    submitButton.disabled = true;

    try {
      // Your existing form submission logic here
      
      // On successful submission, show success message and prepare for navigation
      const successMessage = document.getElementById('successMessage');
      successMessage.style.display = 'block';
      
      // Automatically close modal after success (optional)
      setTimeout(() => {
        closeHelpModalWithState();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      submitButton.disabled = false;
    }
  });
}