
    (function() {
        // Define dark mode CSS variables without enabling dark mode
        const darkThemeStyles = document.createElement('style');
        darkThemeStyles.innerHTML = `
            .dark-mode {
                --todoist-bg: #15202b;
                --todoist-card: #192734;
                --todoist-line: #253341;
                --todoist-text: #ffffff;
                --todoist-secondary-text: #8899a6;
                --todoist-border: #38444d;
                --todoist-hover: rgba(255, 255, 255, 0.1);
                --todoist-button: #1da1f2;
                --todoist-button-hover: #0d8bd9;
                --todoist-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
                --todoist-inner-shadow: inset 0 0 5px rgba(255, 255, 255, 0.05);
            }
        `;
        document.head.appendChild(darkThemeStyles);
    })();
