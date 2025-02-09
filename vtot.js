(function() {
    // Universal speech synthesis support
    const synth = window.speechSynthesis ||
      window.webkitSpeechSynthesis ||
      window.mozSpeechSynthesis ||
      window.msSpeechSynthesis;

    // Create a speech manager to handle multiple states
    class SpeechManager {
      constructor() {
        this.currentUtterance = null;
        this.isPlaying = false;
      }

      speak(text) {
        // Stop any ongoing speech
        this.cancel();

        if (!synth) {
          console.warn('Speech synthesis not supported');
          return false;
        }

        try {
          // Create utterance
          this.currentUtterance = new SpeechSynthesisUtterance(text);

          // Voice selection
          const voices = synth.getVoices();
          const preferredVoice = voices.find(voice =>
            voice.lang.includes('en-') && !voice.name.includes('Google')
          ) || voices[0];

          if (preferredVoice) {
            this.currentUtterance.voice = preferredVoice;
          }

          // Configure utterance
          this.currentUtterance.rate = 1;
          this.currentUtterance.pitch = 1;

          // Event listeners for tracking state
          this.currentUtterance.onstart = () => {
            this.isPlaying = true;
          };

          this.currentUtterance.onend = () => {
            this.isPlaying = false;
            this.currentUtterance = null;
          };

          // Speak
          synth.speak(this.currentUtterance);
          return true;
        } catch (error) {
          console.error('Speech synthesis error:', error);
          return false;
        }
      }

      cancel() {
        if (synth && this.isPlaying) {
          synth.cancel();
          this.isPlaying = false;
          this.currentUtterance = null;
        }
      }
    }

    // Global speech manager
    const speechManager = new SpeechManager();

    // Create advanced SVG icon with state management
    function createSpeechIcon(messageText) {
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");

      // Base SVG attributes
      svg.setAttribute("xmlns", svgNS);
      svg.setAttribute("width", "24");
      svg.setAttribute("height", "24");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");

      // Container for paths
      const volumeGroup = document.createElementNS(svgNS, "g");
      volumeGroup.setAttribute("class", "volume-icon");

      // Base volume icon
      const basePath = document.createElementNS(svgNS, "path");
      basePath.setAttribute("d", "M11 5L6 9H2v6h4l5 4V5z");
      volumeGroup.appendChild(basePath);

      // Volume wave paths
      const wavePath1 = document.createElementNS(svgNS, "path");
      wavePath1.setAttribute("d", "M15.54 8.46a5 5 0 0 1 0 7.07");
      volumeGroup.appendChild(wavePath1);

      const wavePath2 = document.createElementNS(svgNS, "path");
      wavePath2.setAttribute("d", "M19.07 4.93a10 10 0 0 1 0 14.14");
      volumeGroup.appendChild(wavePath2);

      // Cross for inactive state
      const crossGroup = document.createElementNS(svgNS, "g");
      crossGroup.setAttribute("class", "cross-icon");
      crossGroup.style.display = 'none';

      const crossPath1 = document.createElementNS(svgNS, "line");
      crossPath1.setAttribute("x1", "1");
      crossPath1.setAttribute("y1", "1");
      crossPath1.setAttribute("x2", "23");
      crossPath1.setAttribute("y2", "23");
      crossPath1.setAttribute("stroke", "red");
      crossPath1.setAttribute("stroke-width", "3");

      const crossPath2 = document.createElementNS(svgNS, "line");
      crossPath2.setAttribute("x1", "23");
      crossPath2.setAttribute("y1", "1");
      crossPath2.setAttribute("x2", "1");
      crossPath2.setAttribute("y2", "23");
      crossPath2.setAttribute("stroke", "red");
      crossPath2.setAttribute("stroke-width", "3");

      crossGroup.appendChild(crossPath1);
      crossGroup.appendChild(crossPath2);

      svg.appendChild(volumeGroup);
      svg.appendChild(crossGroup);

      // Styling
      svg.style.cssText = `
      cursor: pointer;
      width: 20px;
      height: 20px;
      margin-left: 8px;
      vertical-align: middle;
      transition: transform 0.2s ease;
    `;

      // Track state
      let isActive = false;

      // Click event handler
      svg.addEventListener('click', (e) => {
        e.stopPropagation();

        // Toggle between active and inactive states
        if (!isActive) {
          // Start speaking
          const success = speechManager.speak(messageText);
          if (success) {
            isActive = true;
            volumeGroup.style.display = 'block';
            crossGroup.style.display = 'none';
            svg.style.transform = 'scale(1.2)';
          }
        } else {
          // Stop speaking
          speechManager.cancel();
          isActive = false;
          volumeGroup.style.display = 'none';
          crossGroup.style.display = 'block';
          svg.style.transform = 'scale(1)';
        }

        // Reset after a short delay
        setTimeout(() => {
          svg.style.transform = 'scale(1)';
        }, 200);
      });

      return svg;
    }

    // Initialization function
    function initTextToSpeech() {
      try {
        const messages = document.querySelectorAll('.message');

        messages.forEach(message => {
          // Prevent duplicate icons
          if (message.querySelector('.speech-icon')) return;

          const messageContent = message.querySelector('.message-content p');
          const flagElement = message.querySelector('.message-flag');

          if (flagElement && messageContent) {
            const speechIcon = createSpeechIcon(messageContent.textContent);
            speechIcon.classList.add('speech-icon');
            flagElement.insertAdjacentElement('afterend', speechIcon);
          }
        });
      } catch (error) {
        console.error('Text-to-speech initialization error:', error);
      }
    }

    // Ensure compatibility across different loading states
    function safeInitTextToSpeech() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTextToSpeech);
      } else {
        initTextToSpeech();
      }
    }

    // Mutation observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = mutations.some(
        mutation => mutation.type === 'childList'
      );

      if (shouldUpdate) {
        safeInitTextToSpeech();
      }
    });

    // Start observing
    observer.observe(document.getElementById('chatContainer'), {
      childList: true,
      subtree: true
    });

    // Initial setup
    safeInitTextToSpeech();
  })();