// Add styles for about section modals
const aboutStyles = document.createElement('style');
aboutStyles.textContent = `
  .about-modal {
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

  .about-modal.active {
    right: 0;
  }

  .about-modal-header {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color, #eee);
    background: var(--primary-light, #ffffff);
    z-index: 1;
  }

  .about-modal-back {
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

  .about-modal-back:hover {
    background-color: var(--hover-color, #f5f5f5);
  }

  .about-modal-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-color, #333);
    flex-grow: 1;
  }

  .about-modal-content {
    padding: 20px;
    line-height: 1.6;
  }

  .about-section {
    margin-bottom: 30px;
  }

  .about-section h3 {
    font-size: 1.1rem;
    margin-bottom: 15px;
    color: var(--text-color, #333);
  }

  .about-section p {
    margin-bottom: 15px;
    color: var(--text-secondary, #666);
  }

  .about-section ul {
    margin-left: 20px;
    margin-bottom: 15px;
  }

  .about-section li {
    margin-bottom: 10px;
    color: var(--text-secondary, #666);
  }

  .dark-mode .about-modal {
    background: var(--primary-dark, #1b1b2f);
  }

  .dark-mode .about-modal-header {
    background: var(--primary-dark, #1b1b2f);
    border-bottom-color: var(--border-dark, #333);
  }

  .dark-mode .about-modal-back {
    color: var(--text-dark, #f3f3f3);
  }

  .dark-mode .about-modal-title {
    color: var(--text-dark, #f3f3f3);
  }

  .dark-mode .about-section h3 {
    color: var(--text-dark, #f3f3f3);
  }

  .dark-mode .about-section p,
  .dark-mode .about-section li {
    color: var(--text-secondary-dark, #aaa);
  }
`;

document.head.appendChild(aboutStyles);

// Create modal containers
const aboutContainer = document.createElement('div');
aboutContainer.innerHTML = `
  <div class="about-modal" id="termsModal">
    <div class="about-modal-header">
      <button class="about-modal-back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="about-modal-title">Terms of Service</h2>
    </div>
    <div class="about-modal-content">
      <div class="about-section">
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.</p>
      </div>
      <div class="about-section">
        <h3>2. User Account</h3>
        <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
      </div>
      <div class="about-section">
        <h3>3. Content Guidelines</h3>
        <p>Users agree not to post content that:</p>
        <ul>
          <li>Is unlawful, harmful, threatening, or harassing</li>
          <li>Infringes on any intellectual property rights</li>
          <li>Contains viruses or malicious code</li>
          <li>Violates the privacy of others</li>
        </ul>
      </div>
      <div class="about-section">
        <h3>4. Service Modifications</h3>
        <p>We reserve the right to modify or discontinue the service with or without notice to you.</p>
      </div>
    </div>
  </div>

  <div class="about-modal" id="privacyPolicyModal">
    <div class="about-modal-header">
      <button class="about-modal-back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="about-modal-title">Privacy Policy</h2>
    </div>
    <div class="about-modal-content">
      <div class="about-section">
        <h3>1. Information Collection</h3>
        <p>We collect information that you provide directly to us, including:</p>
        <ul>
          <li>Account information (name, email, profile picture)</li>
          <li>Communication data</li>
          <li>Usage information</li>
          <li>Device information</li>
        </ul>
      </div>
      <div class="about-section">
        <h3>2. Use of Information</h3>
        <p>We use the collected information to:</p>
        <ul>
          <li>Provide and maintain our services</li>
          <li>Improve user experience</li>
          <li>Send important notifications</li>
          <li>Detect and prevent fraud</li>
        </ul>
      </div>
      <div class="about-section">
        <h3>3. Data Security</h3>
        <p>We implement appropriate security measures to protect your personal information against unauthorized access or disclosure.</p>
      </div>
      <div class="about-section">
        <h3>4. Your Rights</h3>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Request corrections to your data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of marketing communications</li>
        </ul>
      </div>
    </div>
  </div>
`;

document.body.appendChild(aboutContainer);

// Get modal elements
const termsModal = document.getElementById('termsModal');
const privacyPolicyModal = document.getElementById('privacyPolicyModal');
const aboutModals = document.querySelectorAll('.about-modal');
const backButtons = document.querySelectorAll('.about-modal-back');

// Function to open modal
function openAboutModal(modalElement) {
  modalElement.classList.add('active');
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Function to close modal
function closeAboutModal() {
  aboutModals.forEach(modal => modal.classList.remove('active'));
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Event listeners
document.getElementById('termsBtn').addEventListener('click', () => openAboutModal(termsModal));
document.getElementById('privacyPolicyBtn').addEventListener('click', () => openAboutModal(privacyPolicyModal));

backButtons.forEach(button => {
  button.addEventListener('click', closeAboutModal);
});

// Handle dark mode for about modals
const aboutObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.target.classList.contains('dark-mode')) {
      aboutContainer.classList.add('dark-mode');
    } else {
      aboutContainer.classList.remove('dark-mode');
    }
  });
});

aboutObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['class']
});