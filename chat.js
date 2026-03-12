(function() {
  // ═══════════════════════════════════════════════════════════════
  //  Media App — Global Theme Manager  (save as: chat.js)
  //
  //  Reads + writes the SAME 'twitter-theme' localStorage key as
  //  SocialConnectionsThemeManager — zero conflicts, perfect sync.
  //  Same storage listener. Same 2-second periodic check.
  //  Just drop:  <script src="chat.js"></script>  into your HTML.
  // ═══════════════════════════════════════════════════════════════

  const MediaAppThemeManager = {

    themeConfig: {

      // ── LIGHT ─────────────────────────────────────────────────
      light: {
        pageBg:               '#f5f5f5',
        desktopBg:            '#efefef',
        surfacePrimary:       '#ffffff',
        surfaceSecondary:     '#f8f8f8',
        surfaceHover:         '#f0f0f0',
        textPrimary:          '#0f0f0f',
        textSecondary:        '#555555',
        textTertiary:         '#aaaaaa',
        border:               '#ebebeb',
        borderMid:            '#f2f2f2',
        borderFocus:          '#d0d0d0',
        // bottom nav  ← ID is #bottom-nav
        navBg:                'rgba(255,255,255,0.92)',
        navBorder:            'rgba(0,0,0,0.08)',
        navIcon:              'rgba(0,0,0,0.35)',
        navIconActive:        '#111111',
        navIndicator:         '#111111',
        navUploadBg:          '#111111',
        navUploadIcon:        '#ffffff',
        // sheets
        sheetBg:              '#ffffff',
        sheetHandle:          '#e0e0e0',
        sheetBorder:          '#f2f2f2',
        inputBg:              '#f5f5f5',
        inputBorder:          'transparent',
        inputFocusBg:         '#ffffff',
        inputFocusBorder:     '#e0e0e0',
        inputText:            '#111111',
        inputPh:              '#c0c0c0',
        // comment items
        commentText:          '#1c1c1c',
        commentAuthor:        '#111111',
        commentDate:          '#bbbbbb',
        commentTime:          '#cccccc',
        commentLike:          '#d0d0d0',
        replyBtn:             '#bbbbbb',
        replyBtnHover:        '#888888',
        repliesBorder:        '#f0f0f0',
        avatarBorder:         '#f0f0f0',
        typingDot:            '#cccccc',
        typingText:           '#aaaaaa',
        newPillBg:            '#111111',
        newPillText:          '#ffffff',
        creatorBadgeBg:       '#111111',
        creatorBadgeText:     '#ffffff',
        guestBadgeBg:         '#f5f5f5',
        guestBadgeText:       '#aaaaaa',
        guestBadgeBorder:     '#eeeeee',
        closeBtnBg:           '#f2f2f2',
        closeBtnIcon:         '#555555',
        emojiRowBorder:       '#f2f2f2',
        shimmerBase:          '#f0f0f0',
        shimmerShine:         '#f8f8f8',
        // share sheet
        shareTitle:           '#111111',
        shareUrlBg:           '#f5f5f5',
        shareUrlBorder:       '#eeeeee',
        shareUrlText:         '#777777',
        shareOptionLabel:     '#555555',
        // overlay
        overlayBg:            '#ffffff',
        overlayTitle:         '#111111',
        overlayBackBtn:       'rgba(0,0,0,0.08)',
        overlayBackIcon:      '#111111',
        // following panel
        fpBg:                 '#ffffff',
        fpBorder:             '#ebebeb',
        fpTitle:              '#111111',
        fpEmpty:              '#888888',
        // social connections widget
        statusOnline:         '#31a24c',
        statusOffline:        '#e0e0e0',
        followedGradient:     'linear-gradient(135deg,#0f0f0f 0%,#1c1c1c 15%,#3a3a3a 30%,#4d4d4d 45%,#626262 60%,#787878 75%,#8f8f8f 90%,#a6a6a6 100%)',
        followedText:         '#ffffff',
        // ── DESKTOP sidebar ──
        sidebarBg:            '#ffffff',
        dsNavIconBg:          '#f2f2f2',
        dsNavIconStroke:      '#777777',
        dsNavColor:           '#999999',
        dsNavActiveColor:     '#111111',
        dsNavActiveBg:        '#f2f2f2',
        dsNavHoverBg:         '#f7f7f7',
        dsNavHoverColor:      '#222222',
        dsDivider:            '#f2f2f2',
        dsSectionLabel:       '#bbbbbb',
        dsPersonHoverBg:      '#f7f7f7',
        dsPersonAvBorder:     '#f0f0f0',
        dsPersonName:         '#111111',
        dsPersonMeta:         '#aaaaaa',
        dsFollowingBg:        '#f0f0f0',
        dsFollowingText:      '#888888',
        dsSectionEmpty:       '#cccccc',
        dsCardBg:             '#f9f9f9',
        dsCardBorder:         '#f0f0f0',
        dsCardHoverBg:        '#f2f2f2',
        dsCardCreator:        '#111111',
        dsCardMeta:           '#888888',
        dsCardBadgeBg:        '#111111',
        dsCardBadgeText:      '#ffffff',
        dsSkelBase:           '#f0f0f0',
        dsSkelShine:          '#f8f8f8',
        // ── DESKTOP right panel ──
        dcBg:                 '#ffffff',
        dcBorder:             '#ebebeb',
        dcHeadBorder:         '#f2f2f2',
        dcCreatorName:        '#111111',
        dcCreatorDate:        '#c0c0c0',
        dcProfText:           '#999999',
        dcProfIcon:           '#bbbbbb',
        dcCaption:            '#555555',
        dcCaptionToggle:      '#aaaaaa',
        dcMusicText:          '#bbbbbb',
        dcCmtLabelColor:      '#111111',
        dcCmtLabelBorder:     '#f5f5f5',
        dcTypingText:         '#bbbbbb',
        dcTypingDot:          '#cccccc',
        dcListBg:             '#ffffff',
        dcListScrollbar:      '#eeeeee',
        dcListText:           '#333333',
        dcListAuthor:         '#111111',
        dcListTime:           '#cccccc',
        dcListLike:           '#dddddd',
        dcListReply:          '#cccccc',
        dcListViewReplies:    '#aaaaaa',
        dcListVRBefore:       '#eeeeee',
        dcSkelBase:           '#f0f0f0',
        dcSkelShine:          '#f8f8f8',
        dcGifSelectorBg:      '#ffffff',
        dcGifSelectorBorder:  '#f0f0f0',
        dcGifSearchBg:        '#fafafa',
        dcGifSearchBorder:    '#eeeeee',
        dcGifSearchText:      '#111111',
        dcGifPreviewBorder:   '#f5f5f5',
        dcGifCloseBg:         '#eeeeee',
        dcGifCloseText:       '#888888',
        dcReplyBg:            '#fafafa',
        dcReplyBorder:        '#f0f0f0',
        dcReplyIcon:          '#bbbbbb',
        dcReplyText:          '#777777',
        dcReplyCloseBg:       '#efefef',
        dcReplyCloseText:     '#aaaaaa',
        dcInputRowBg:         '#ffffff',
        dcInputRowBorder:     '#f2f2f2',
        dcInputBg:            '#f5f5f5',
        dcInputBorder:        'transparent',
        dcInputFocusBg:       '#ffffff',
        dcInputFocusBorder:   '#e0e0e0',
        dcInputText:          '#111111',
        dcInputPh:            '#bbbbbb',
        dcGifBtnBg:           '#ebebeb',
        dcGifBtnText:         '#888888',
        dcGifBtnHoverBg:      '#e0e0e0',
        dcGifBtnHoverText:    '#444444',
        dcShareRowBg:         '#ffffff',
        dcShareBg:            '#f5f5f5',
        dcShareBorder:        '#ebebeb',
        dcShareText:          '#555555',
        dcShareHoverBg:       '#eeeeee',
        dcShareHoverText:     '#222222',
        dcArrowBg:            '#ffffff',
        dcArrowStroke:        '#333333',
        // ── slide-up panels (upload / profile / liked) ──
        panelBg:              '#ffffff',
        panelHeaderBg:        '#ffffff',
        panelHeaderBorder:    '#efefef',
        panelTitle:           '#111111',
        panelBackIcon:        '#111111',
      },

      // ── DIM ───────────────────────────────────────────────────
      dim: {
        pageBg:               '#0d1821',
        desktopBg:            '#0d1821',
        surfacePrimary:       '#15202b',
        surfaceSecondary:     '#1e2732',
        surfaceHover:         '#22303c',
        textPrimary:          '#ffffff',
        textSecondary:        '#8899a6',
        textTertiary:         '#536471',
        border:               '#38444d',
        borderMid:            '#2e3a45',
        borderFocus:          '#4a5a68',
        navBg:                'rgba(21,32,43,0.95)',
        navBorder:            '#38444d',
        navIcon:              'rgba(255,255,255,0.3)',
        navIconActive:        '#ffffff',
        navIndicator:         '#ffffff',
        navUploadBg:          '#ffffff',
        navUploadIcon:        '#000000',
        sheetBg:              '#1e2732',
        sheetHandle:          '#38444d',
        sheetBorder:          '#38444d',
        inputBg:              '#15202b',
        inputBorder:          'transparent',
        inputFocusBg:         '#0d1821',
        inputFocusBorder:     '#38444d',
        inputText:            '#ffffff',
        inputPh:              '#536471',
        commentText:          '#e7e9ea',
        commentAuthor:        '#ffffff',
        commentDate:          '#536471',
        commentTime:          '#536471',
        commentLike:          '#536471',
        replyBtn:             '#536471',
        replyBtnHover:        '#8899a6',
        repliesBorder:        '#38444d',
        avatarBorder:         '#38444d',
        typingDot:            '#38444d',
        typingText:           '#536471',
        newPillBg:            '#f7f9f9',
        newPillText:          '#0f1419',
        creatorBadgeBg:       '#f7f9f9',
        creatorBadgeText:     '#0f1419',
        guestBadgeBg:         '#1e2732',
        guestBadgeText:       '#8899a6',
        guestBadgeBorder:     '#38444d',
        closeBtnBg:           '#38444d',
        closeBtnIcon:         '#8899a6',
        emojiRowBorder:       '#38444d',
        shimmerBase:          '#1e2732',
        shimmerShine:         '#253240',
        shareTitle:           '#ffffff',
        shareUrlBg:           '#15202b',
        shareUrlBorder:       '#38444d',
        shareUrlText:         '#8899a6',
        shareOptionLabel:     '#8899a6',
        overlayBg:            '#15202b',
        overlayTitle:         '#ffffff',
        overlayBackBtn:       'rgba(255,255,255,0.10)',
        overlayBackIcon:      '#ffffff',
        fpBg:                 '#15202b',
        fpBorder:             '#38444d',
        fpTitle:              '#ffffff',
        fpEmpty:              '#8899a6',
        statusOnline:         '#31a24c',
        statusOffline:        '#536471',
        followedGradient:     'linear-gradient(135deg,#f8f8f8 0%,#e8e8e8 15%,#d8d8d8 30%,#c8c8c8 45%,#b8b8b8 60%,#a8a8a8 75%,#989898 90%,#888888 100%)',
        followedText:         '#000000',
        sidebarBg:            '#15202b',
        dsNavIconBg:          '#1e2732',
        dsNavIconStroke:      '#8899a6',
        dsNavColor:           '#8899a6',
        dsNavActiveColor:     '#ffffff',
        dsNavActiveBg:        '#1e2732',
        dsNavHoverBg:         '#1e2732',
        dsNavHoverColor:      '#ffffff',
        dsDivider:            '#38444d',
        dsSectionLabel:       '#536471',
        dsPersonHoverBg:      '#22303c',
        dsPersonAvBorder:     '#38444d',
        dsPersonName:         '#ffffff',
        dsPersonMeta:         '#8899a6',
        dsFollowingBg:        '#1e2732',
        dsFollowingText:      '#8899a6',
        dsSectionEmpty:       '#536471',
        dsCardBg:             '#1e2732',
        dsCardBorder:         '#38444d',
        dsCardHoverBg:        '#22303c',
        dsCardCreator:        '#ffffff',
        dsCardMeta:           '#8899a6',
        dsCardBadgeBg:        '#f7f9f9',
        dsCardBadgeText:      '#0f1419',
        dsSkelBase:           '#1e2732',
        dsSkelShine:          '#253240',
        dcBg:                 '#1e2732',
        dcBorder:             '#38444d',
        dcHeadBorder:         '#38444d',
        dcCreatorName:        '#ffffff',
        dcCreatorDate:        '#536471',
        dcProfText:           '#8899a6',
        dcProfIcon:           '#536471',
        dcCaption:            '#8899a6',
        dcCaptionToggle:      '#536471',
        dcMusicText:          '#536471',
        dcCmtLabelColor:      '#ffffff',
        dcCmtLabelBorder:     '#38444d',
        dcTypingText:         '#536471',
        dcTypingDot:          '#38444d',
        dcListBg:             '#1e2732',
        dcListScrollbar:      '#38444d',
        dcListText:           '#e7e9ea',
        dcListAuthor:         '#ffffff',
        dcListTime:           '#536471',
        dcListLike:           '#536471',
        dcListReply:          '#536471',
        dcListViewReplies:    '#8899a6',
        dcListVRBefore:       '#38444d',
        dcSkelBase:           '#1e2732',
        dcSkelShine:          '#253240',
        dcGifSelectorBg:      '#1e2732',
        dcGifSelectorBorder:  '#38444d',
        dcGifSearchBg:        '#15202b',
        dcGifSearchBorder:    '#38444d',
        dcGifSearchText:      '#ffffff',
        dcGifPreviewBorder:   '#38444d',
        dcGifCloseBg:         '#38444d',
        dcGifCloseText:       '#8899a6',
        dcReplyBg:            '#15202b',
        dcReplyBorder:        '#38444d',
        dcReplyIcon:          '#536471',
        dcReplyText:          '#8899a6',
        dcReplyCloseBg:       '#38444d',
        dcReplyCloseText:     '#8899a6',
        dcInputRowBg:         '#1e2732',
        dcInputRowBorder:     '#38444d',
        dcInputBg:            '#15202b',
        dcInputBorder:        'transparent',
        dcInputFocusBg:       '#0d1821',
        dcInputFocusBorder:   '#38444d',
        dcInputText:          '#ffffff',
        dcInputPh:            '#536471',
        dcGifBtnBg:           '#273340',
        dcGifBtnText:         '#8899a6',
        dcGifBtnHoverBg:      '#38444d',
        dcGifBtnHoverText:    '#ffffff',
        dcShareRowBg:         '#1e2732',
        dcShareBg:            '#15202b',
        dcShareBorder:        '#38444d',
        dcShareText:          '#8899a6',
        dcShareHoverBg:       '#0d1821',
        dcShareHoverText:     '#ffffff',
        dcArrowBg:            '#1e2732',
        dcArrowStroke:        '#8899a6',
        // ── slide-up panels ──
        panelBg:              '#15202b',
        panelHeaderBg:        '#15202b',
        panelHeaderBorder:    '#38444d',
        panelTitle:           '#ffffff',
        panelBackIcon:        '#ffffff',
      },

      // ── DARK ──────────────────────────────────────────────────
      dark: {
        pageBg:               '#000000',
        desktopBg:            '#000000',
        surfacePrimary:       '#080808',
        surfaceSecondary:     '#111111',
        surfaceHover:         '#1a1a1a',
        textPrimary:          '#ffffff',
        textSecondary:        '#a6a6a6',
        textTertiary:         '#555555',
        border:               '#2f3336',
        borderMid:            '#1e1e1e',
        borderFocus:          '#3a3a3a',
        navBg:                'rgba(8,8,8,0.97)',
        navBorder:            '#2f3336',
        navIcon:              'rgba(255,255,255,0.28)',
        navIconActive:        '#ffffff',
        navIndicator:         '#ffffff',
        navUploadBg:          '#ffffff',
        navUploadIcon:        '#000000',
        sheetBg:              '#080808',
        sheetHandle:          '#2f3336',
        sheetBorder:          '#2f3336',
        inputBg:              '#111111',
        inputBorder:          'transparent',
        inputFocusBg:         '#000000',
        inputFocusBorder:     '#2f3336',
        inputText:            '#ffffff',
        inputPh:              '#555555',
        commentText:          '#e7e9ea',
        commentAuthor:        '#ffffff',
        commentDate:          '#555555',
        commentTime:          '#555555',
        commentLike:          '#555555',
        replyBtn:             '#555555',
        replyBtnHover:        '#a6a6a6',
        repliesBorder:        '#2f3336',
        avatarBorder:         '#2f3336',
        typingDot:            '#2f3336',
        typingText:           '#555555',
        newPillBg:            '#ffffff',
        newPillText:          '#000000',
        creatorBadgeBg:       '#ffffff',
        creatorBadgeText:     '#000000',
        guestBadgeBg:         '#111111',
        guestBadgeText:       '#555555',
        guestBadgeBorder:     '#2f3336',
        closeBtnBg:           '#1a1a1a',
        closeBtnIcon:         '#a6a6a6',
        emojiRowBorder:       '#2f3336',
        shimmerBase:          '#111111',
        shimmerShine:         '#1a1a1a',
        shareTitle:           '#ffffff',
        shareUrlBg:           '#111111',
        shareUrlBorder:       '#2f3336',
        shareUrlText:         '#a6a6a6',
        shareOptionLabel:     '#a6a6a6',
        overlayBg:            '#000000',
        overlayTitle:         '#ffffff',
        overlayBackBtn:       'rgba(255,255,255,0.08)',
        overlayBackIcon:      '#ffffff',
        fpBg:                 '#080808',
        fpBorder:             '#2f3336',
        fpTitle:              '#ffffff',
        fpEmpty:              '#555555',
        statusOnline:         '#31a24c',
        statusOffline:        '#4d4d4d',
        followedGradient:     'linear-gradient(135deg,#0f0f0f 0%,#1c1c1c 15%,#3a3a3a 30%,#4d4d4d 45%,#626262 60%,#787878 75%,#8f8f8f 90%,#a6a6a6 100%)',
        followedText:         '#ffffff',
        sidebarBg:            '#080808',
        dsNavIconBg:          '#111111',
        dsNavIconStroke:      '#a6a6a6',
        dsNavColor:           '#a6a6a6',
        dsNavActiveColor:     '#ffffff',
        dsNavActiveBg:        '#111111',
        dsNavHoverBg:         '#111111',
        dsNavHoverColor:      '#ffffff',
        dsDivider:            '#2f3336',
        dsSectionLabel:       '#555555',
        dsPersonHoverBg:      '#1a1a1a',
        dsPersonAvBorder:     '#2f3336',
        dsPersonName:         '#ffffff',
        dsPersonMeta:         '#a6a6a6',
        dsFollowingBg:        '#111111',
        dsFollowingText:      '#a6a6a6',
        dsSectionEmpty:       '#555555',
        dsCardBg:             '#111111',
        dsCardBorder:         '#2f3336',
        dsCardHoverBg:        '#1a1a1a',
        dsCardCreator:        '#ffffff',
        dsCardMeta:           '#555555',
        dsCardBadgeBg:        '#ffffff',
        dsCardBadgeText:      '#000000',
        dsSkelBase:           '#111111',
        dsSkelShine:          '#1a1a1a',
        dcBg:                 '#080808',
        dcBorder:             '#2f3336',
        dcHeadBorder:         '#2f3336',
        dcCreatorName:        '#ffffff',
        dcCreatorDate:        '#555555',
        dcProfText:           '#a6a6a6',
        dcProfIcon:           '#555555',
        dcCaption:            '#a6a6a6',
        dcCaptionToggle:      '#555555',
        dcMusicText:          '#555555',
        dcCmtLabelColor:      '#ffffff',
        dcCmtLabelBorder:     '#2f3336',
        dcTypingText:         '#555555',
        dcTypingDot:          '#2f3336',
        dcListBg:             '#080808',
        dcListScrollbar:      '#2f3336',
        dcListText:           '#e7e9ea',
        dcListAuthor:         '#ffffff',
        dcListTime:           '#555555',
        dcListLike:           '#555555',
        dcListReply:          '#555555',
        dcListViewReplies:    '#a6a6a6',
        dcListVRBefore:       '#2f3336',
        dcSkelBase:           '#111111',
        dcSkelShine:          '#1a1a1a',
        dcGifSelectorBg:      '#080808',
        dcGifSelectorBorder:  '#2f3336',
        dcGifSearchBg:        '#111111',
        dcGifSearchBorder:    '#2f3336',
        dcGifSearchText:      '#ffffff',
        dcGifPreviewBorder:   '#2f3336',
        dcGifCloseBg:         '#1a1a1a',
        dcGifCloseText:       '#a6a6a6',
        dcReplyBg:            '#111111',
        dcReplyBorder:        '#2f3336',
        dcReplyIcon:          '#555555',
        dcReplyText:          '#a6a6a6',
        dcReplyCloseBg:       '#1a1a1a',
        dcReplyCloseText:     '#a6a6a6',
        dcInputRowBg:         '#080808',
        dcInputRowBorder:     '#2f3336',
        dcInputBg:            '#111111',
        dcInputBorder:        'transparent',
        dcInputFocusBg:       '#000000',
        dcInputFocusBorder:   '#2f3336',
        dcInputText:          '#ffffff',
        dcInputPh:            '#555555',
        dcGifBtnBg:           '#1a1a1a',
        dcGifBtnText:         '#a6a6a6',
        dcGifBtnHoverBg:      '#222222',
        dcGifBtnHoverText:    '#ffffff',
        dcShareRowBg:         '#080808',
        dcShareBg:            '#111111',
        dcShareBorder:        '#2f3336',
        dcShareText:          '#a6a6a6',
        dcShareHoverBg:       '#000000',
        dcShareHoverText:     '#ffffff',
        dcArrowBg:            '#111111',
        dcArrowStroke:        '#a6a6a6',
        // ── slide-up panels ──
        panelBg:              '#000000',
        panelHeaderBg:        '#080808',
        panelHeaderBorder:    '#2f3336',
        panelTitle:           '#ffffff',
        panelBackIcon:        '#ffffff',
      }
    },

    styleElementId: 'media-app-theme-styles',
    currentTheme:   'light',

    initialize: function() {
      this.createStyleElement();
      // ← exact same key as SocialConnectionsThemeManager
      this.currentTheme = localStorage.getItem('twitter-theme') || 'light';
      this.applyTheme(this.currentTheme);
      this.setupEventListeners();
    },

    createStyleElement: function() {
      const existing = document.getElementById(this.styleElementId);
      if (existing) existing.remove();
      const el = document.createElement('style');
      el.id = this.styleElementId;
      document.head.appendChild(el);
    },

    applyTheme: function(themeName) {
      const validThemes = ['light', 'dim', 'dark'];
      const theme = validThemes.includes(themeName) ? themeName : 'light';
      this.currentTheme = theme;
      localStorage.setItem('twitter-theme', theme);   // ← same key, keeps sync

      const t = this.themeConfig[theme];
      const styleEl = document.getElementById(this.styleElementId);
      if (!styleEl) { this.createStyleElement(); return this.applyTheme(theme); }

      styleEl.textContent = `

        /* ══════════════════════════════════════
           MOBILE
        ══════════════════════════════════════ */

        body {
          background: ${t.pageBg} !important;
          color: ${t.textPrimary};
        }

        /* bottom nav — ID is #bottom-nav */
        #bottom-nav {
          background: ${t.navBg} !important;
          border-top: 1px solid ${t.navBorder} !important;
        }
        .nav-btn { color: ${t.navIcon}; }
        .nav-btn.active { color: ${t.navIconActive}; }
        .nav-btn .nav-icon-wrap svg { stroke: ${t.navIcon}; }
        .nav-btn.active .nav-icon-wrap svg { stroke: ${t.navIconActive}; }
        .nav-btn.active .nav-icon-wrap svg.fill-icon { fill: ${t.navIconActive}; stroke: none; }
        .nav-btn.active .nav-icon-wrap::after { background: ${t.navIndicator}; }
        .nav-upload-pill { background: ${t.navUploadBg} !important; }
        .nav-upload-pill svg { stroke: ${t.navUploadIcon}; }

        /* section overlay */
        #section-overlay { background: ${t.overlayBg} !important; }
        #section-overlay-loader { background: ${t.overlayBg}; }
        #section-overlay-back { background: ${t.overlayBackBtn}; }
        #section-overlay-back svg { stroke: ${t.overlayBackIcon}; }
        #section-overlay-title { color: ${t.overlayTitle}; }
        #mob-profile-panel { background: ${t.surfaceSecondary} !important; }
        #mob-upload-panel { background: ${t.overlayBg} !important; }

        /* comment sheet */
        .comment-sheet { background: ${t.sheetBg} !important; }
        .cs-handle { background: ${t.sheetHandle}; }
        .cs-head { background: ${t.sheetBg}; border-bottom: 1px solid ${t.sheetBorder}; }
        .cs-head-title { color: ${t.textPrimary}; }
        .cs-close { background: ${t.closeBtnBg}; }
        .cs-close svg { stroke: ${t.closeBtnIcon}; }
        .cs-emoji-row { background: ${t.sheetBg}; border-bottom: 1px solid ${t.emojiRowBorder}; }
        .typing-indicator { background: ${t.sheetBg}; color: ${t.typingText}; }
        .typing-dots span { background: ${t.typingDot}; }
        #commentsList { background: ${t.sheetBg}; }
        .comment-author-name { color: ${t.commentAuthor}; }
        .comment-author-name:hover { color: ${t.textSecondary}; }
        .comment-author-date { color: ${t.commentDate}; }
        .comment-text { color: ${t.commentText}; }
        .comment-avatar { border-color: ${t.avatarBorder}; }
        .comment-time { color: ${t.commentTime}; }
        .like-button svg { stroke: ${t.commentLike}; }
        .like-count { color: ${t.commentLike}; }
        .reply-btn { color: ${t.replyBtn}; }
        .reply-btn:hover { color: ${t.replyBtnHover}; }
        .reply-btn:active { background: ${t.surfaceHover}; }
        .replies-container { border-left-color: ${t.repliesBorder}; }
        .view-replies-btn { color: ${t.replyBtn}; }
        .view-replies-btn::before { background: ${t.repliesBorder}; }
        .new-cmt-pill { background: ${t.newPillBg}; color: ${t.newPillText}; }
        .comment-creator-badge { background: ${t.creatorBadgeBg}; color: ${t.creatorBadgeText}; }
        .comment-guest-badge { background: ${t.guestBadgeBg}; color: ${t.guestBadgeText}; border-color: ${t.guestBadgeBorder}; }
        .comments-empty { color: ${t.textTertiary}; }
        .comments-empty svg { stroke: ${t.border}; }
        .cmt-skel-avatar, .cmt-skel-line {
          background: linear-gradient(110deg, ${t.shimmerBase} 25%, ${t.shimmerShine} 50%, ${t.shimmerBase} 75%);
          background-size: 200% 100%;
        }
        .comment-form { background: ${t.sheetBg}; border-top: 1px solid ${t.sheetBorder}; }
        .cf-input-pill { background: ${t.inputBg}; border-color: ${t.inputBorder}; }
        .cf-input-pill:focus-within { background: ${t.inputFocusBg}; border-color: ${t.inputFocusBorder}; }
        .comment-input { color: ${t.inputText}; }
        .comment-input::placeholder { color: ${t.inputPh}; }
        .reply-preview-text { color: ${t.textSecondary}; }
        .reply-preview-close { background: ${t.surfaceHover}; color: ${t.textSecondary}; }
        .gif-selector { background: ${t.sheetBg}; border-top: 1px solid ${t.sheetBorder}; }
        .gif-search { background: ${t.surfaceSecondary}; border-color: ${t.border}; color: ${t.textPrimary}; }
        .gif-search:focus { border-color: ${t.borderFocus}; background: ${t.surfacePrimary}; }

        /* share sheet */
        .share-sheet { background: ${t.sheetBg} !important; }
        .share-sheet-handle { background: ${t.sheetHandle}; }
        .share-sheet-title { color: ${t.shareTitle}; }
        .share-sheet-close { background: ${t.closeBtnBg}; }
        .share-sheet-close svg { stroke: ${t.closeBtnIcon}; }
        .share-sheet-url { background: ${t.shareUrlBg}; border-color: ${t.shareUrlBorder}; }
        .share-sheet-url-text { color: ${t.shareUrlText}; }
        .share-option-label { color: ${t.shareOptionLabel}; }

        /* following panel */
        #followingPanel { background: ${t.fpBg} !important; }
        .fp-head { background: ${t.fpBg}; border-bottom: 1px solid ${t.fpBorder}; }
        .fp-title { color: ${t.fpTitle}; }
        .fp-back { background: ${t.closeBtnBg}; }
        .fp-back svg { stroke: ${t.closeBtnIcon}; }
        .fp-empty-feed { color: ${t.fpEmpty}; }

        /* ── slide-up panels: upload, profile, liked ── */
        #upload-panel, #profile-panel, #liked-panel {
          background: ${t.panelBg} !important;
        }
        #upload-panel > div:first-child,
        #profile-panel > div:first-child {
          background: ${t.panelHeaderBg} !important;
          border-bottom: 1px solid ${t.panelHeaderBorder} !important;
        }
        #upload-panel > div:first-child span,
        #profile-panel > div:first-child span {
          color: ${t.panelTitle} !important;
        }
        #uploadPanelBack svg, #profilePanelBack svg {
          stroke: ${t.panelBackIcon} !important;
        }
        /* liked panel header */
        #liked-panel > div[style*="absolute"] span {
          color: ${t.panelTitle} !important;
        }

        /* social connections widget */
        .container { background-color: ${t.surfacePrimary}; }
        .header { border-bottom: 1px solid ${t.border}; }
        .user-count { color: ${t.textSecondary}; }
        .user-count strong { color: ${t.textPrimary}; }
        .user-card { background-color: ${t.surfacePrimary}; border: 1px solid transparent; }
        .user-card:hover { background-color: ${t.surfaceHover}; border-color: ${t.border}; }
        .user-card:active { background-color: ${t.surfaceHover}; }
        .user-pic { border: 1px solid ${t.border}; }
        .user-name { color: ${t.textPrimary}; }
        .user-info { color: ${t.textPrimary}; }
        .status-dot { border: 2px solid ${t.surfacePrimary}; }
        .status-online { background-color: ${t.statusOnline}; }
        .status-offline { background-color: ${t.statusOffline}; }
        .follow-btn { color: ${t.textSecondary}; border: 1px solid ${t.border}; }
        .follow-btn:hover { background-color: ${t.surfaceHover}; }
        .follow-btn.followed { background: ${t.followedGradient}; color: ${t.followedText}; border: 1px solid transparent; }
        .show-more { background-color: ${t.surfacePrimary}; color: ${t.textSecondary}; border: 1px solid ${t.border}; }
        .show-more:hover { background-color: ${t.surfaceHover}; color: ${t.textPrimary}; }
        .loading-spinner { border: 3px solid ${t.border}; border-top-color: ${t.textSecondary}; }
        .section-title { color: ${t.textPrimary}; border-bottom: 1px solid ${t.border}; }
        .section-title::after { background-color: ${t.textSecondary}; }
        .empty-state { color: ${t.textSecondary}; }

        /* ══════════════════════════════════════
           DESKTOP  (min-width: 900px)
           Overrides the hardcoded #efefef on
           html, body AND #desktop-wrapper
        ══════════════════════════════════════ */
        @media (min-width: 900px) {

          html, body { background: ${t.desktopBg} !important; }
          #desktop-wrapper { background: ${t.desktopBg} !important; }

          /* sidebar */
          #desktop-sidebar { background: ${t.sidebarBg} !important; }
          .ds-nav-item { color: ${t.dsNavColor}; }
          .ds-nav-item:hover { background: ${t.dsNavHoverBg} !important; color: ${t.dsNavHoverColor}; }
          .ds-nav-item.active { color: ${t.dsNavActiveColor}; background: ${t.dsNavActiveBg} !important; }
          .ds-nav-icon { background: ${t.dsNavIconBg} !important; }
          .ds-nav-icon svg { stroke: ${t.dsNavIconStroke}; }
          .ds-divider { background: ${t.dsDivider} !important; }
          .ds-section-label { color: ${t.dsSectionLabel}; }
          .ds-person-row:hover { background: ${t.dsPersonHoverBg}; }
          .ds-person-av { border-color: ${t.dsPersonAvBorder}; }
          .ds-person-name { color: ${t.dsPersonName}; }
          .ds-person-meta { color: ${t.dsPersonMeta}; }
          .ds-follow-btn-sm.following { background: ${t.dsFollowingBg}; color: ${t.dsFollowingText}; }
          .ds-section-empty { color: ${t.dsSectionEmpty}; }
          .ds-logo-name { color: ${t.textPrimary}; }
          .ds-top-post-card { background: ${t.dsCardBg}; border-color: ${t.dsCardBorder}; }
          .ds-top-post-card:hover { background: ${t.dsCardHoverBg}; }
          .ds-top-post-creator { color: ${t.dsCardCreator}; }
          .ds-top-post-meta { color: ${t.dsCardMeta}; }
          .ds-top-post-badge { background: ${t.dsCardBadgeBg}; color: ${t.dsCardBadgeText}; }
          .ds-skel-av, .ds-skel-line {
            background: linear-gradient(110deg, ${t.dsSkelBase} 25%, ${t.dsSkelShine} 50%, ${t.dsSkelBase} 75%) !important;
            background-size: 200% 100% !important;
          }

          /* right panel */
          #desktop-comments { background: ${t.dcBg} !important; }
          .dc-head { background: ${t.dcBg}; border-bottom: 1px solid ${t.dcHeadBorder}; }
          .dc-creator-name { color: ${t.dcCreatorName}; }
          .dc-creator-upload-date { color: ${t.dcCreatorDate}; }
          .dc-creator-profession { color: ${t.dcProfText}; }
          .dc-creator-profession svg { stroke: ${t.dcProfIcon}; }
          .dc-caption { color: ${t.dcCaption}; }
          .dc-caption-toggle { color: ${t.dcCaptionToggle}; }
          .dc-caption-toggle svg { stroke: ${t.dcCaptionToggle}; }
          .dc-music-row { color: ${t.dcMusicText}; }
          .dc-music-row svg { stroke: ${t.dcMusicText}; }
          .dc-comments-label { color: ${t.dcCmtLabelColor}; border-bottom: 1px solid ${t.dcCmtLabelBorder}; }
          .dc-typing { color: ${t.dcTypingText}; }
          .dc-typing .typing-dots span { background: ${t.dcTypingDot}; }
          #dc-list { background: ${t.dcListBg} !important; scrollbar-color: ${t.dcListScrollbar} transparent; }
          #dc-list::-webkit-scrollbar-thumb { background: ${t.dcListScrollbar}; }
          #dc-list .comment-text { color: ${t.dcListText}; }
          #dc-list .comment-author-name { color: ${t.dcListAuthor}; }
          #dc-list .comment-time { color: ${t.dcListTime}; }
          #dc-list .like-button svg { stroke: ${t.dcListLike}; }
          #dc-list .like-count { color: ${t.dcListLike}; }
          #dc-list .reply-btn { color: ${t.dcListReply}; }
          #dc-list .view-replies-btn { color: ${t.dcListViewReplies}; }
          #dc-list .view-replies-btn::before { background: ${t.dcListVRBefore}; }
          .dc-comment-skeleton .dc-skel-line {
            background: linear-gradient(110deg, ${t.dcSkelBase} 25%, ${t.dcSkelShine} 50%, ${t.dcSkelBase} 75%);
            background-size: 200% 100%;
          }
          #dc-gif-selector { background: ${t.dcGifSelectorBg}; border-top: 1px solid ${t.dcGifSelectorBorder}; }
          #dc-gif-search { background: ${t.dcGifSearchBg}; border-color: ${t.dcGifSearchBorder}; color: ${t.dcGifSearchText}; }
          #dc-gif-search:focus { border-color: ${t.borderFocus}; background: ${t.surfacePrimary}; }
          #dc-gif-preview { border-top: 1px solid ${t.dcGifPreviewBorder}; }
          #dc-gif-preview-close { background: ${t.dcGifCloseBg}; color: ${t.dcGifCloseText}; }
          .dc-reply-preview { background: ${t.dcReplyBg}; border-top: 1px solid ${t.dcReplyBorder}; }
          .dc-reply-icon { color: ${t.dcReplyIcon}; }
          .dc-reply-text { color: ${t.dcReplyText}; }
          .dc-reply-close { background: ${t.dcReplyCloseBg}; color: ${t.dcReplyCloseText}; }
          .dc-input-row { background: ${t.dcInputRowBg} !important; border-top: 1px solid ${t.dcInputRowBorder}; }
          .dc-input-pill { background: ${t.dcInputBg}; border-color: ${t.dcInputBorder}; }
          .dc-input-pill:focus-within { background: ${t.dcInputFocusBg}; border-color: ${t.dcInputFocusBorder}; }
          .dc-input-pill textarea { color: ${t.dcInputText}; }
          .dc-input-pill textarea::placeholder { color: ${t.dcInputPh}; }
          .dc-gif-btn { background: ${t.dcGifBtnBg}; color: ${t.dcGifBtnText}; }
          .dc-gif-btn:hover { background: ${t.dcGifBtnHoverBg}; color: ${t.dcGifBtnHoverText}; }
          .dc-share-row { background: ${t.dcShareRowBg}; }
          .dc-share-btn { background: ${t.dcShareBg}; border: 1.5px solid ${t.dcShareBorder}; color: ${t.dcShareText}; }
          .dc-share-btn:hover { background: ${t.dcShareHoverBg}; color: ${t.dcShareHoverText}; }
          .dc-share-btn svg { stroke: ${t.dcShareText}; }
          .desktop-nav-arrow { background: ${t.dcArrowBg} !important; }
          .desktop-nav-arrow svg { stroke: ${t.dcArrowStroke}; }
          .desktop-card-video-wrap.loading::before {
            background: linear-gradient(110deg, ${t.shimmerBase} 25%, ${t.shimmerShine} 50%, ${t.shimmerBase} 75%);
            background-size: 200% 100%;
          }

          /* ── desktop upload slide-up overlay ── */
          #ds-upload-overlay {
            background: ${t.panelBg} !important;
          }
          #ds-upload-overlay > div:first-child {
            background: ${t.panelHeaderBg} !important;
            border-bottom: 1px solid ${t.panelHeaderBorder} !important;
          }
          #ds-upload-overlay > div:first-child span {
            color: ${t.panelTitle} !important;
          }
          #ds-upload-overlay button svg {
            stroke: ${t.panelBackIcon} !important;
          }

          /* ── desktop iframe section panel ── */
          #ds-section-panel { background: ${t.panelBg} !important; }
          .ds-panel-loader  { background: ${t.panelBg} !important; }

          /* ── desktop comment panel follow button ── */
          .dc-follow-btn {
            background: var(--brand-gradient) !important;
            color: #fff !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.14) !important;
          }
          .dc-follow-btn.following {
            background: ${t.dsFollowingBg} !important;
            color: ${t.dsFollowingText} !important;
            box-shadow: none !important;
          }
          .dc-creator-avatar { border-color: ${t.dsPersonAvBorder} !important; }
          .dc-creator-name   { color: ${t.dcCreatorName} !important; }
        }
      `;

      document.body.classList.remove('theme-light', 'theme-dim', 'theme-dark');
      document.body.classList.add(`theme-${theme}`);
    },

    setupEventListeners: function() {
      // Same storage listener as SocialConnectionsThemeManager
      window.addEventListener('storage', (e) => {
        if (e.key === 'twitter-theme') {
          this.applyTheme(e.newValue || 'light');
        }
      });
      // Same 2-second periodic check as SocialConnectionsThemeManager
      this.setupPeriodicCheck();
      this.setupThemeSwitchers();
    },

    setupThemeSwitchers: function() {
      document.querySelectorAll('[data-theme-switch]').forEach(button => {
        button.addEventListener('click', (e) => {
          const theme = e.currentTarget.getAttribute('data-theme-switch');
          if (theme) this.applyTheme(theme);
        });
      });
    },

    setupPeriodicCheck: function() {
      setInterval(() => {
        const stored = localStorage.getItem('twitter-theme') || 'light';
        if (stored !== this.currentTheme) {
          this.applyTheme(stored);
        }
      }, 2000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      MediaAppThemeManager.initialize();
    });
  } else {
    MediaAppThemeManager.initialize();
  }

})();
