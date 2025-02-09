// Add styles forhelp and support modals
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

  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .form-group label {
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
  }

  .form-input {
    padding: 12px;
    border: 1px solid var(--border-color, #eee);
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--accent-color, #2c2c2c);
    box-shadow: 0 0 0 2px rgba(44, 44, 44, 0.1);
  }

  .form-input.error {
    border-color: #ff4444;
  }

  .error-message {
    color: #ff4444;
    font-size: 0.8rem;
    margin-top: 4px;
  }

  .submit-button {
    background: var(--accent-color, #2c2c2c);
    color: white;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .submit-button:hover {
    opacity: 0.9;
  }

  .submit-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .success-message {
    background: #4CAF50;
    color: white;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    display: none;
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

  .dark-mode .form-input {
    background: var(--primary-dark, #232334);
    border-color: var(--border-dark, #333);
    color: var(--text-dark, #f3f3f3);
  }

  .dark-mode .form-input:focus {
    border-color: var(--accent-color, #2c2c2c);
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
      <div class="success-message" id="successMessage">
        Your support request has been submitted successfully!
      </div>
      <form id="contactForm" class="contact-form">
        <div class="form-group">
          <label for="supportPhone">Phone Number*</label>
          <input type="tel" id="supportPhone" class="form-input" required
                 pattern="^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$"
                 placeholder="+1 (234) 567-8900">
          <span class="error-message" id="phoneError"></span>
        </div>
        <div class="form-group">
          <label for="supportWhatsapp">WhatsApp Number (Optional)</label>
          <input type="tel" id="supportWhatsapp" class="form-input"
                 pattern="^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$"
                 placeholder="+1 (234) 567-8900">
        </div>
        <div class="form-group">
          <label for="supportBusiness">Business Name (Optional)</label>
          <input type="text" id="supportBusiness" class="form-input"
                 placeholder="Your business name">
        </div>
        <div class="form-group">
          <label for="supportIssue">Description of Issue*</label>
          <textarea id="supportIssue" class="form-input" required
                    rows="4" placeholder="Please describe your issue"></textarea>
          <span class="error-message" id="issueError"></span>
        </div>
        <button type="submit" class="submit-button" id="submitSupport">
          Submit Support Request
        </button>
      </form>
    </div>
  </div>
`;

document.body.appendChild(helpContainer);

// Initialize Firebase contact support functionality
function initializeContactSupport(auth, db) {
  const contactForm = document.getElementById('contactForm');
  const successMessage = document.getElementById('successMessage');
  const submitButton = document.getElementById('submitSupport');

  async function checkExistingContact(phone, uid) {
    const contactsRef = collection(db, 'support_contacts');
    const q = query(contactsRef, 
      where('phone', '==', phone),
      where('userId', '==', uid)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const phone = document.getElementById('supportPhone').value;
      const whatsapp = document.getElementById('supportWhatsapp').value;
      const business = document.getElementById('supportBusiness').value;
      const issue = document.getElementById('supportIssue').value;

      // Check for existing contact
      const exists = await checkExistingContact(phone, user.uid);
      if (exists) {
        document.getElementById('phoneError').textContent = 
          'You already have a support request with this phone number';
        submitButton.disabled = false;
        return;
      }

      // Create support contact
      const contactData = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userEmail: user.email,
        phone: phone,
        whatsapp: whatsapp || null,
        business: business || null,
        issue: issue,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      await addDoc(collection(db, 'support_contacts'), contactData);

      // Show success message
      successMessage.style.display = 'block';
      contactForm.reset();

      // Hide success message after 5 seconds
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 5000);

    } catch (error) {
      console.error('Error submitting support request:', error);
      alert('Failed to submit support request. Please try again.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

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

// Initialize contact support with Firebase
onAuthStateChanged(auth, (user) => {
  if (user) {
    initializeContactSupport(auth, db);
  }
});