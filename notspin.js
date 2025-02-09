  // Create the styles for the notification spinner
  const style = document.createElement('style');
  style.textContent = `
  .logout-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ffffff;
    padding: 15px 25px;
    border-radius: 12px;
    display: none;
    align-items: center;
    gap: 12px;
    box-shadow: 
      6px 6px 12px rgba(0, 0, 0, 0.1),
      -6px -6px 12px rgba(255, 255, 255, 0.8);
    z-index: 9999;
  }

  .small-spinner {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #f0f0f0;
    border-top: 2px solid #2c2c2c;
    animation: spinNotification 1s linear infinite;
  }

  .notification-text {
    color: #2c2c2c;
    font-weight: 500;
  }

  @keyframes spinNotification {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

  document.head.appendChild(style);

  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'logout-notification';
  notification.innerHTML = `
  <div class="small-spinner"></div>
  <span class="notification-text">Logging out...</span>
`;

  document.body.appendChild(notification);

  // Add click event listener to logout button
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    notification.style.display = 'flex';
  });