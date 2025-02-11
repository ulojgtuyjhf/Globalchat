// Add styles for help and support modals
const helpSupportStyles = document.createElement('style');
helpSupportStyles.textContent = `
  .help-modal {
    position: fixed;
    top: 0;
    right: -100%;
    width: 100%;
    max-width: 600px;
    height: 100vh;
    background: var(--primary-light, #ffffff);
    box-shadow: -5px 0 15px rgba(0,0,0,0.1);
    transition: right 0.3s ease-in-out;
    z-index: 1000;
    overflow-y: auto;
  }

  .help-modal.active {
    right: 0;
  }

  .help-modal-header {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color, #eee);
    background: var(--primary-light, #ffffff);
    z-index: 1;
  }

  .help-modal-back {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text-color, #333);
    margin-right: 15px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s;
  }

  .help-modal-back:hover {
    background-color: var(--hover-color, #f5f5f5);
  }

  .help-modal-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-color, #333);
    flex-grow: 1;
  }

  .help-modal-content {
    padding: 20px;
  }

  .help-section {
    margin-bottom: 25px;
  }

  .help-section h3 {
    font-size: 1.1rem;
    margin-bottom: 15px;
    color: var(--text-color, #333);
  }

  .help-card {
    background: var(--bg-light, #f3f0fa);
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .help-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .contact-iframe-container {
    width: 100%;
    height: calc(100vh - 81px); /* Subtract header height */
    border: none;
  }

  .contact-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .dark-mode .help-modal {
    background: var(--primary-dark, #1b1b2f);
  }

  .dark-mode .help-modal-header {
    background: var(--primary-dark, #1b1b2f);
    border-bottom-color: var(--border-dark, #333);
  }

  .dark-mode .help-card {
    background: var(--primary-dark, #232334);
  }
`;

document.head.appendChild(helpSupportStyles);

// Create modal containers
const helpContainer = document.createElement('div');
helpContainer.innerHTML = `
  <div class="help-modal" id="helpCenterModal">
    <div class="help-modal-header">
      <button class="help-modal-back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="help-modal-title">Help Center</h2>
    </div>
    <div class="help-modal-content">
      <div class="help-section">
        <h3>Popular Topics</h3>
        <div class="help-card">
          <h4>Account & Privacy</h4>
          <p>Learn about account settings and privacy options</p>
        </div>
        <div class="help-card">
          <h4>Messages & Communication</h4>
          <p>Get help with messaging and communication features</p>
        </div>
        <div class="help-card">
          <h4>Troubleshooting</h4>
          <p>Find solutions to common problems</p>
        </div>
      </div>
      <div class="help-section">
        <h3>FAQs</h3>
        <div class="help-card">
          <h4>How do I reset my password?</h4>
          <p>Click on "Forgot Password" on the login screen and follow the instructions</p>
        </div>
        <div class="help-card">
          <h4>How do I change my email?</h4>
          <p>Go to Settings > Account > Email to update your email address</p>
        </div>
      </div>
    </div>
  </div>

  <div class="help-modal" id="contactSupportModal">
    <div class="help-modal-header">
      <button class="help-modal-back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="help-modal-title">Contact Support</h2>
    </div>
    <div class="help-modal-content">
      <div class="contact-iframe-container">
        <iframe src="/contact.html" class="contact-iframe" title="Contact Support Form"></iframe>
      </div>
    </div>
  </div>
`;

document.body.appendChild(helpContainer);

// Get modal elements
const helpCenterModal = document.getElementById('helpCenterModal');
const contactSupportModal = document.getElementById('contactSupportModal');
const helpModals = document.querySelectorAll('.help-modal');
const helpBackButtons = document.querySelectorAll('.help-modal-back');

// Function to open modal
function openHelpModal(modalElement) {
  modalElement.classList.add('active');
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Function to close modal
function closeHelpModal() {
  helpModals.forEach(modal => modal.classList.remove('active'));
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Event listeners
document.getElementById('helpBtn').addEventListener('click', () => openHelpModal(helpCenterModal));
document.getElementById('contactBtn').addEventListener('click', () => openHelpModal(contactSupportModal));

helpBackButtons.forEach(button => {
  button.addEventListener('click', closeHelpModal);
});

// Handle dark mode for help modals
const helpObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.target.classList.contains('dark-mode')) {
      helpContainer.classList.add('dark-mode');
    } else {
      helpContainer.classList.remove('dark-mode');
    }
  });
});

helpObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['class']
});