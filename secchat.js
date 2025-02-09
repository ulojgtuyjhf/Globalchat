// Advanced Chat Security System
(function() {
    class ChatSecuritySystem {
        constructor() {
            this.initTime = Date.now();
            this.messageAttempts = new Map();
            this.securityViolations = new Map();
            this.maxViolations = 3;
            this.timeWindow = 60000; // 1 minute
            this.maxAttemptsPerWindow = 20;
            this.init();
        }

        init() {
            this.preventInspection();
            this.secureChatContainer();
            this.secureFirebaseData();
            this.preventMessageTampering();
            this.implementRateLimiting();
            this.secureUserInputs();
            this.preventCodeInjection();
            this.monitorUserBehavior();
            this.protectAgainstSpam();
        }

        preventInspection() {
            // Prevent right-click
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleViolation('inspection');
                return false;
            });

            // Prevent keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && 
                    ['u', 's', 'i', 'c', 'j'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    this.handleViolation('keyboard');
                    return false;
                }
            });

            // Prevent DevTools
            (() => {
                function detectDevTools() {
                    const widthThreshold = window.outerWidth - window.innerWidth > 160;
                    const heightThreshold = window.outerHeight - window.innerHeight > 160;
                    if (widthThreshold || heightThreshold) {
                        this?.handleViolation('devtools');
                    }
                }
                setInterval(detectDevTools.bind(this), 1000);
            })();
        }

        secureChatContainer() {
            const chatContainer = document.getElementById('chatContainer');
            if (chatContainer) {
                // Prevent drag and drop
                chatContainer.addEventListener('drop', (e) => {
                    e.preventDefault();
                    this.handleViolation('dragdrop');
                });
                
                chatContainer.addEventListener('dragover', (e) => {
                    e.preventDefault();
                });

                // Monitor for DOM mutations
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            this.validateMessageElements();
                        }
                    });
                });

                observer.observe(chatContainer, {
                    childList: true,
                    subtree: true
                });
            }
        }

        secureFirebaseData() {
            // Intercept and validate Firebase operations
            const originalPush = firebase.database.Reference.prototype.push;
            firebase.database.Reference.prototype.push = function(...args) {
                if (!this.validateFirebaseOperation('push', args)) {
                    throw new Error('Invalid Firebase operation detected');
                }
                return originalPush.apply(this, args);
            };

            // Add data validation rules
            const validateData = (data) => {
                if (!data) return false;
                if (typeof data !== 'object') return false;
                if (data.text && data.text.length > 1000) return false;
                return true;
            };

            this.validateFirebaseOperation = (operation, args) => {
                const data = args[0];
                return validateData(data);
            };
        }

        preventMessageTampering() {
            // Add integrity checks to messages
            const addIntegrityCheck = (message) => {
                const timestamp = Date.now();
                const signature = this.generateSignature(message, timestamp);
                return { ...message, _integrity: { timestamp, signature } };
            };

            // Verify message integrity
            const verifyMessageIntegrity = (message) => {
                if (!message._integrity) return false;
                const { timestamp, signature } = message._integrity;
                const expectedSignature = this.generateSignature(message, timestamp);
                return signature === expectedSignature;
            };

            this.generateSignature = (message, timestamp) => {
                // Simple hash function for demo - use more robust in production
                const content = JSON.stringify(message) + timestamp;
                return content.split('').reduce((hash, char) => {
                    return ((hash << 5) - hash) + char.charCodeAt(0);
                }, 0).toString(36);
            };
        }

        implementRateLimiting() {
            const now = Date.now();
            this.cleanupOldAttempts(now);

            window.sendMessage = (...args) => {
                if (!this.checkRateLimit()) {
                    this.handleViolation('ratelimit');
                    return false;
                }
                this.recordAttempt();
                return this.originalSendMessage.apply(null, args);
            };
        }

        checkRateLimit() {
            const now = Date.now();
            const userAttempts = this.messageAttempts.get(now - this.timeWindow) || 0;
            return userAttempts < this.maxAttemptsPerWindow;
        }

        cleanupOldAttempts(now) {
            for (const [timestamp] of this.messageAttempts) {
                if (now - timestamp > this.timeWindow) {
                    this.messageAttempts.delete(timestamp);
                }
            }
        }

        secureUserInputs() {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                // Sanitize input
                messageInput.addEventListener('input', (e) => {
                    const sanitized = this.sanitizeInput(e.target.value);
                    if (sanitized !== e.target.value) {
                        e.target.value = sanitized;
                        this.handleViolation('input');
                    }
                });
            }
        }

        sanitizeInput(input) {
            // Remove potentially dangerous characters and patterns
            return input
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/javascript:/gi, '') // Remove javascript: protocols
                .replace(/on\w+=/gi, '') // Remove event handlers
                .replace(/data:/gi, ''); // Remove data: URLs
        }

        preventCodeInjection() {
            // Override eval and Function constructors
            window.eval = () => {
                this.handleViolation('eval');
                throw new Error('Eval is disabled');
            };

            window.Function = () => {
                this.handleViolation('function');
                throw new Error('Function constructor is disabled');
            };
        }

        protectAgainstSpam() {
            let lastMessageContent = '';
            let duplicateCount = 0;

            window.sendMessage = (...args) => {
                const messageContent = args[0]?.text || '';
                
                if (messageContent === lastMessageContent) {
                    duplicateCount++;
                    if (duplicateCount >= 3) {
                        this.handleViolation('spam');
                        return false;
                    }
                } else {
                    duplicateCount = 0;
                    lastMessageContent = messageContent;
                }

                return this.originalSendMessage.apply(null, args);
            };
        }

        handleViolation(type) {
            const violationCount = (this.securityViolations.get(type) || 0) + 1;
            this.securityViolations.set(type, violationCount);

            if (violationCount >= this.maxViolations) {
                this.implementTemporaryBan();
            }

            // Log violation for monitoring
            console.warn(`Security violation detected: ${type}`);
        }

        implementTemporaryBan() {
            const banDuration = 300000; // 5 minutes
            localStorage.setItem('chatBanUntil', Date.now() + banDuration);
            
            // Disable chat functionality
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.disabled = true;
                messageInput.placeholder = 'Temporarily banned due to security violations';
            }

            setTimeout(() => {
                this.liftTemporaryBan();
            }, banDuration);
        }

        liftTemporaryBan() {
            localStorage.removeItem('chatBanUntil');
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.disabled = false;
                messageInput.placeholder = 'Type your message...';
            }
            this.securityViolations.clear();
        }
    }

    // Initialize security system after DOM content loads
    document.addEventListener('DOMContentLoaded', () => {
        window.chatSecurity = new ChatSecuritySystem();
    });
})();