// Modal Navigation Handler
const modalNavigationHandler = {
  isModalOpen: false,
  modalStateKey: 'modalState',

  initialize() {
    // Initialize modal state in history
    const initialState = { modalOpen: false };
    history.replaceState(initialState, '', window.location.href);

    // Listen for history changes (back/forward navigation)
    window.addEventListener('popstate', (event) => {
      const state = event.state || { modalOpen: false };
      this.handleNavigationChange(state);
    });

    // Add listeners to modal triggers
    this.setupModalListeners();
  },

  setupModalListeners() {
    // When opening modal
    document.addEventListener('click', (e) => {
      const profile = e.target.closest('.profile');
      if (!profile) return;

      this.openModal();
    });

    // When closing modal via close button
    const closeButton = document.querySelector('.profile-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // When closing modal via backdrop click
    const modal = document.querySelector('.profile-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
  },

  openModal() {
    const modal = document.querySelector('.profile-modal');
    if (!modal || this.isModalOpen) return;

    // Add state to history
    const newState = { modalOpen: true };
    history.pushState(newState, '', window.location.href);
    
    // Open modal
    modal.classList.add('active');
    this.isModalOpen = true;
  },

  closeModal() {
    const modal = document.querySelector('.profile-modal');
    if (!modal || !this.isModalOpen) return;

    // If modal was opened via history push, go back
    if (history.state?.modalOpen) {
      history.back();
    } else {
      // Otherwise just close the modal
      this.handleModalClose();
    }
  },

  handleNavigationChange(state) {
    const modal = document.querySelector('.profile-modal');
    if (!modal) return;

    if (state.modalOpen) {
      // Open modal without pushing state
      modal.classList.add('active');
      this.isModalOpen = true;
    } else {
      // Close modal without history manipulation
      this.handleModalClose();
    }
  },

  handleModalClose() {
    const modal = document.querySelector('.profile-modal');
    if (!modal) return;

    modal.classList.remove('active');
    this.isModalOpen = false;
  }
};

// Initialize the navigation handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  modalNavigationHandler.initialize();
});