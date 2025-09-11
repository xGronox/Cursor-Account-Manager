// Cursor Account Manager - Sidebar Script

class CursorAccountSidebar {
  constructor() {
    this.accounts = [];
    this.activeAccount = null;
    this.infoUpdated = false;
    this.paymentCards = [];
    this.currentTab = "accounts";
    this.selectedCards = new Set();
    this.cardFilters = {
      search: "",
      type: "",
    };
    this.accountFilters = {
      search: "",
      status: "",
    };
    // Rate limiting variables
    this.lastAccountInfoUpdate = 0;
    this.statusCheckInterval = null;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval);
      }
    });
    
    this.init();
  }

  async init() {
    // Load accounts and active account
    await this.loadAccounts();

    // Setup event listeners
    this.setupEventListeners();
    
    // Setup message listener for trial status
    this.setupMessageListener();
    
    // Initialize BIN history functionality
    this.initBinHistory();

    // Update UI
    this.updateUI();

    // Start periodic status checking
    this.startPeriodicStatusCheck();
  }

  setupEventListeners() {
    // Tab navigation
    document.getElementById("accountsTab").addEventListener("click", () => {
      this.switchTab("accounts");
    });

    document.getElementById("generatorTab").addEventListener("click", () => {
      this.switchTab("generator");
    });

    // Add account button
    document.getElementById("addAccountBtn").addEventListener("click", () => {
      this.showAddAccountModal();
    });

    // Export current button
    document
      .getElementById("exportCurrentBtn")
      .addEventListener("click", () => {
        this.exportCurrentAccount();
      });

    // Import from Downloads button
    document
      .getElementById("importFromDownloadsBtn")
      .addEventListener("click", () => {
        this.importFromDownloads();
      });

    // Import Folder button
    document.getElementById("importFolderBtn").addEventListener("click", () => {
      this.importFromFolder();
    });

    // Downloads file input change
    document
      .getElementById("downloadsFileInput")
      .addEventListener("change", (e) => {
        this.handleDownloadsImport(e.target.files);
      });

    // Folder input change
    document.getElementById("folderInput").addEventListener("change", (e) => {
      this.handleFolderImport(e.target.files);
    });

    // Advanced tools toggle
    document
      .getElementById("toggleAdvancedBtn")
      .addEventListener("click", () => {
        this.toggleAdvancedPanel();
      });

    // Refresh button (header)
    document
      .getElementById("refreshBtn")
      .addEventListener("click", () => {
        this.refreshAll();
      });

    // Dark mode toggle
    document.getElementById("darkModeToggle").addEventListener("click", () => {
      this.toggleDarkMode();
    });

    // Activate Pro Trial button
    document.getElementById("activateProTrialBtn").addEventListener("click", () => {
      this.activateProTrialWithDebounce();
    });

    // Modal controls
    document.getElementById("closeModal").addEventListener("click", () => {
      this.hideModal();
    });

    document.getElementById("cancelAddBtn").addEventListener("click", () => {
      this.hideModal();
    });

    document.getElementById("confirmAddBtn").addEventListener("click", () => {
      this.addAccountFromJSON();
    });

    // Capture current page cookies button
    document.getElementById("captureCurrentPageBtn").addEventListener("click", () => {
      this.captureCurrentPageCookies();
    });

    // Modal overlay click to close
    const modal = document.getElementById("addAccountModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideModal();
        }
      });
    }

    // Generator tab buttons
    document.getElementById("generateCardsBtn").addEventListener("click", () => {
      this.generateCards();
    });

    document.getElementById("generateAddressBtn").addEventListener("click", () => {
      this.generateAddress();
    });


    // Consolidate duplicates button
    document
      .getElementById("consolidateDuplicatesBtn")
      .addEventListener("click", () => {
        this.consolidateDuplicates();
      });

    // Cleanup account info button
    document
      .getElementById("cleanupAccountInfoBtn")
      .addEventListener("click", () => {
        this.cleanupAccountInfo();
      });

    // Clear all data button
    document.getElementById("clearAllDataBtn").addEventListener("click", () => {
      this.clearAllData();
    });

    // Account filter functionality - Fixed Event Listeners
    setTimeout(() => {
      const accountFilterInput = document.getElementById("accountFilterInput");
      if (accountFilterInput) {
        accountFilterInput.addEventListener("input", (e) => {
          this.accountFilters.search = e.target.value.toLowerCase();
          this.filterAccounts();
        });
        console.log("Account filter input listener added");
      } else {
        console.log("Account filter input not found");
      }

      const accountStatusFilter = document.getElementById(
        "accountStatusFilter"
      );
      if (accountStatusFilter) {
        accountStatusFilter.addEventListener("change", (e) => {
          this.accountFilters.status = e.target.value.toLowerCase();
          this.filterAccounts();
        });
        console.log("Account status filter listener added");
      } else {
        console.log("Account status filter not found");
      }
    }, 100);

    // Remove manual detect info button event listener if exists
    const detectInfoBtn = document.getElementById("detectAccountInfoBtn");
    if (detectInfoBtn) {
      detectInfoBtn.style.display = "none";
      detectInfoBtn.replaceWith(detectInfoBtn.cloneNode(true)); // Remove all listeners
    }

    // Card filter and selection functionality
    document
      .getElementById("cardFilterInput")
      .addEventListener("input", (e) => {
        this.cardFilters.search = e.target.value.toLowerCase();
        this.filterCards();
      });

    document
      .getElementById("cardTypeFilter")
      .addEventListener("change", (e) => {
        this.cardFilters.type = e.target.value.toLowerCase();
        this.filterCards();
      });

    document
      .getElementById("selectAllCards")
      .addEventListener("change", (e) => {
        this.selectAllCards(e.target.checked);
      });

    document
      .getElementById("deleteSelectedBtn")
      .addEventListener("click", () => {
        this.deleteSelectedCards();
      });

    document
      .getElementById("clearSelectionBtn")
      .addEventListener("click", () => {
        this.clearSelection();
      });

    // Cards modal controls
    document.getElementById("closeCardsModal").addEventListener("click", () => {
      this.hideImportCardsModal();
    });

    document
      .getElementById("cancelImportCardsBtn")
      .addEventListener("click", () => {
        this.hideImportCardsModal();
      });

    document
      .getElementById("confirmImportCardsBtn")
      .addEventListener("click", () => {
        this.importCardsFromText();
      });

    // Cards file input
    document
      .getElementById("cardsFileInput")
      .addEventListener("change", (e) => {
        this.handleCardsFileImport(e.target.files);
      });

    // Debug panel controls (enable with Ctrl+Shift+D)
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        this.toggleDebugPanel();
      }
    });

    document
      .getElementById("showStoredDataBtn")
      .addEventListener("click", () => {
        this.showStoredData();
      });

    // Account deletion functionality
    document
      .getElementById("deleteFreeAccountBtn")
      .addEventListener("click", () => {
        this.deleteFreeAccount();
      });

    document
      .getElementById("deleteProTrialAccountBtn")
      .addEventListener("click", () => {
        this.deleteProTrialAccount();
      });

  }

  async loadAccounts() {
    try {
      this.showLoading(true);

      // Check if background script is ready
      const ping = await chrome.runtime
        .sendMessage({ type: "ping" })
        .catch(() => null);
      if (!ping) {
        console.error("Background script not responding");
        setTimeout(() => this.loadAccounts(), 500);
        return;
      }

      // Get accounts from background
      const response = await chrome.runtime.sendMessage({
        type: "getAccounts",
      });

      if (response && response.success) {
        this.accounts = response.data || [];

        // Get active account
        const activeResponse = await chrome.runtime.sendMessage({
          type: "getActiveAccount",
        });
        this.activeAccount = activeResponse?.data || null;

        // Try to update account info if needed
        if (this.activeAccount) {
          this.updateAccountInfo();
        }

        this.updateUI();
      } else {
        this.showNotification("Failed to load accounts", "error");
        this.accounts = [];
        this.updateUI();
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      this.showNotification("Extension error", "error");
      this.accounts = [];
      this.updateUI();
      } finally {
        this.showLoading(false);
      }
  }

  async updateAccountInfo(force = false) {
    // Rate limiting - don't update more than once every 2 seconds unless forced
    const now = Date.now();
    if (!force && this.lastAccountInfoUpdate && (now - this.lastAccountInfoUpdate) < 2000) {
      return; // Skip if called too frequently
    }
    this.lastAccountInfoUpdate = now;
    
    try {
      const infoResponse = await chrome.runtime.sendMessage({
        type: "getAccountInfo",
      });

      if (infoResponse && infoResponse.success && infoResponse.data) {
        const { username, email, status, isLoggedOut } = infoResponse.data;
        
        // Handle logged out state
        if (isLoggedOut) {
          console.log("User logged out detected, clearing active account");
          this.activeAccount = null;
          this.updateUI();
          return;
        }

        // Handle logged in state - update account info if we have an active account
        if (this.activeAccount) {
          // Check if this account already has proper email info
          const currentAccount = this.accounts.find(
            (acc) => acc.name === this.activeAccount
          );

          // Skip if we already have proper account info (unless force refresh)
          if (
            !force &&
            currentAccount &&
            currentAccount.email &&
            currentAccount.email !== this.activeAccount &&
            (currentAccount.email.includes("@") || currentAccount.email.length > 10)
          ) {
            return;
          }

          // Use email for account info, or fallback to username if no email
          const accountEmail = email || username;
          if (accountEmail) {
            await chrome.runtime.sendMessage({
              type: "updateAccountInfo",
              account: this.activeAccount,
              email: accountEmail,
              status: status || "",
            });
            setTimeout(() => {
              this.infoUpdated = true;
              this.loadAccounts();
            }, 500);
          }
        }
      }
    } catch (error) {
      console.log("Could not update account info:", error);
    }
  }

  // Refresh all data (called by main refresh button)
  async refreshAll() {
    try {
      this.showLoading(true);
      this.showNotification("🔄 Refreshing all data...", "info");

      // Refresh accounts list
      await this.loadAccounts();
      
      // Refresh account status if active account exists
      if (this.activeAccount) {
        await this.updateAccountInfo(true);
      }
      
      // Update UI
      this.updateUI();
      
      this.showNotification("✅ All data refreshed successfully", "success");
    } catch (error) {
      console.error("Refresh all error:", error);
      this.showNotification("❌ Failed to refresh data", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // Force refresh account status (called by refresh button)
  async forceRefreshStatus() {
    if (!this.activeAccount) {
      this.showNotification("No active account to refresh", "warning");
      return;
    }

    try {
      this.showLoading(true);
      this.showNotification("Refreshing account status...", "info");

      // Force update account info (bypass skip condition)
      await this.updateAccountInfo(true);

      this.showNotification("Account status refreshed!", "success");
    } catch (error) {
      console.error("Error refreshing status:", error);
      this.showNotification("Failed to refresh status", "error");
    } finally {
      this.showLoading(false);
    }
  }

  updateUI() {
    // Update current account display
    this.updateCurrentAccount();

    // Update accounts list
    this.updateAccountsList();

    // Update accounts count
    document.getElementById(
      "accountsCount"
    ).textContent = `(${this.accounts.length})`;
  }

  updateCurrentAccount() {
    const currentAccountEl = document.getElementById("currentAccount");
    const activeAccount = this.accounts.find((acc) => acc.active);

    if (activeAccount) {
      // Use email if available and different from name, otherwise use name
      let displayName = activeAccount.email;
      if (!displayName || displayName === activeAccount.name) {
        displayName = activeAccount.name;
      }
      
      // Format status for display
      let statusDisplay = activeAccount.status;
      if (!statusDisplay) {
        statusDisplay = "checking...";
      }

      currentAccountEl.innerHTML = `
        <span class="account-icon">🟢</span>
        <div class="account-details">
          <span class="account-name">${this.escapeHtml(displayName)}</span>
          <span class="account-status">${statusDisplay}</span>
        </div>
      `;
    } else {
      currentAccountEl.innerHTML = `
        <span class="account-icon">🔴</span>
        <div class="account-details">
          <span class="account-name">Not logged in</span>
          <span class="account-status">Click an account to login</span>
        </div>
      `;
    }
  }

  updateAccountsList() {
    const listEl = document.getElementById("accountsList");
    const emptyEl = document.getElementById("noAccounts");
    const countEl = document.getElementById("accountsCount");

    if (this.accounts.length === 0) {
      listEl.style.display = "none";
      emptyEl.style.display = "block";
      if (countEl) countEl.textContent = "(0)";

      // Hide filters when no accounts
      const filtersElement = document.querySelector(".account-filters");
      if (filtersElement) {
        filtersElement.style.display = "none";
      }
      return;
    }

    // Show filters when accounts exist
    const filtersElement = document.querySelector(".account-filters");
    if (filtersElement) {
      filtersElement.style.display = "block";
    }

    listEl.style.display = "block";
    emptyEl.style.display = "none";
    listEl.innerHTML = "";

    // Ensure scrollable class is applied
    if (!listEl.classList.contains("scrollable")) {
      listEl.classList.add("scrollable");
    }

    // Sort accounts - active first
    const sortedAccounts = [...this.accounts].sort((a, b) => {
      if (a.active) return -1;
      if (b.active) return 1;
      return a.email.localeCompare(b.email);
    });

    sortedAccounts.forEach((account) => {
      const accountEl = this.createAccountElement(account);
      listEl.appendChild(accountEl);
    });

    if (countEl) countEl.textContent = `(${this.accounts.length})`;

    // Apply current filters after DOM update
    setTimeout(() => {
      if (this.filterAccounts) {
        this.filterAccounts();
      }
    }, 50);
  }

  createAccountElement(account) {
    const template = document.getElementById("sidebarAccountTemplate");
    const element = template.content.cloneNode(true);
    const container = element.querySelector(".sidebar-account-item");

    // Set account data - Fixed attribute name
    container.setAttribute("data-account-name", account.name);
    container.dataset.account = account.name;

    // Set email
    container.querySelector(".account-email").textContent = account.email;

    // Set status
    const statusEl = container.querySelector(".account-status");
    statusEl.textContent = account.status;
    statusEl.className = `account-status ${account.status}`;

    // Show/hide active indicator
    const activeIndicator = container.querySelector(".active-indicator");
    if (account.active) {
      activeIndicator.style.display = "block";
      container.classList.add("active");
    } else {
      activeIndicator.style.display = "none";

      // Make whole card clickable for switching
      container.addEventListener("click", (e) => {
        if (!e.target.closest(".delete-btn")) {
          this.switchAccount(account.name);
        }
      });
    }

    // Setup reveal button
    container.querySelector(".reveal-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.revealAccountFile(account.name);
    });

    // Setup delete button
    container.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.deleteAccount(account.name);
    });

    return container;
  }

  showAddAccountModal() {
    // Close advanced tools panel when opening modal
    const advancedPanel = document.getElementById("advancedPanel");
    if (advancedPanel) {
      advancedPanel.style.display = "none";
    }
    
    document.getElementById("addAccountModal").style.display = "block";
    document.getElementById("cookiesInput").value = "";
    document.getElementById("accountNameInput").value = "";
    
    // Clear capture info
    const captureInfo = document.getElementById("captureInfo");
    if (captureInfo) {
      captureInfo.style.display = "none";
      captureInfo.textContent = "";
    }

    // Reset capture button
    const captureBtn = document.getElementById("captureCurrentPageBtn");
    if (captureBtn) {
      captureBtn.disabled = false;
      captureBtn.textContent = "📄 Capture from Current Page";
    }

    // Clear any existing warnings
    const existingWarning = document.querySelector(".duplicate-warning");
    if (existingWarning) {
      existingWarning.remove();
    }

    // Focus on capture button as it's the recommended option
    if (captureBtn) {
      captureBtn.focus();
    }
  }

  hideModal() {
    document.getElementById("addAccountModal").style.display = "none";
    // Clear any duplicate warnings
    const existingWarning = document.querySelector(".duplicate-warning");
    if (existingWarning) {
      existingWarning.remove();
    }
  }

  // Show duplicate account warning inside modal with replace option
  showDuplicateWarning(existingAccount) {
    // Remove any existing warning
    const existingWarning = document.querySelector(".duplicate-warning");
    if (existingWarning) {
      existingWarning.remove();
    }

    // Create warning element with replace option
    const warning = document.createElement("div");
    warning.className = "duplicate-warning";
    warning.style.cssText = `
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
      color: #dc2626;
      font-size: 14px;
    `;
    warning.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>⚠️ Account Already Exists</strong><br>
        This account is already saved as: <strong>${
          existingAccount.email || existingAccount.name
        }</strong>
      </div>
      <button id="replaceAccountBtn" style="
        background: #dc2626;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-right: 8px;
      ">Replace Existing Account</button>
      <button id="cancelReplaceBtn" style="
        background: #6b7280;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">Cancel</button>
    `;

    // Insert warning after the textarea
    const textarea = document.getElementById("cookiesInput");
    textarea.parentNode.insertBefore(warning, textarea.nextSibling);

    // Add event listeners to the buttons
    warning
      .querySelector("#replaceAccountBtn")
      .addEventListener("click", () => {
        this.addAccountFromJSON(true); // Override existing
      });

    warning.querySelector("#cancelReplaceBtn").addEventListener("click", () => {
      warning.remove();
    });
  }

  // Check if account already exists - delegate to service
  async findExistingAccount(newCookies) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "checkDuplicateAccount",
        cookies: newCookies,
      });

      if (response.success && response.duplicate) {
        return response.duplicate.account;
      }
      return null;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return null;
    }
  }

  async addAccountFromJSON(overrideExisting = false) {
    const cookiesInput = document.getElementById("cookiesInput").value.trim();
    const accountName = document
      .getElementById("accountNameInput")
      .value.trim();

    if (!cookiesInput) {
      this.showNotification("Please paste cookies JSON", "error");
      return;
    }

    try {
      this.showLoading(true);

      // If not overriding, check for duplicates first
      if (!overrideExisting) {
        // Validate JSON
        const cookiesData = JSON.parse(cookiesInput);

        // Check if account already exists
        const existingAccount = await this.findExistingAccount(cookiesData);
        if (existingAccount) {
          this.showDuplicateWarning(existingAccount);
          return;
        }
      } else {
        // Remove duplicate warning when overriding
        const existingWarning = document.querySelector(".duplicate-warning");
        if (existingWarning) {
          existingWarning.remove();
        }
      }

      const response = await chrome.runtime.sendMessage({
        type: "importAccountJSON",
        jsonText: cookiesInput,
        customName: accountName || null,
        overrideExisting: overrideExisting,
      });

      if (response.success) {
        const actionText = overrideExisting ? "Updated" : "Added";
        this.showNotification(`${actionText}: ${response.data}`, "success");
        this.hideModal();
        await this.loadAccounts();
      } else {
        this.showNotification(response.error || "Failed to add", "error");
      }
    } catch (error) {
      console.error("Error adding account:", error);
      if (error.message && error.message.includes("JSON")) {
        this.showNotification("Invalid JSON format", "error");
      } else {
        this.showNotification("Error adding account", "error");
      }
    } finally {
      this.showLoading(false);
    }
  }

  // Capture cookies from current page automatically
  async captureCurrentPageCookies() {
    const captureBtn = document.getElementById("captureCurrentPageBtn");
    const captureInfo = document.getElementById("captureInfo");
    const accountNameInput = document.getElementById("accountNameInput");
    const cookiesInput = document.getElementById("cookiesInput");
    
    try {
      // Disable button and show loading
      captureBtn.disabled = true;
      captureBtn.textContent = "🔄 Capturing...";
      
      // Show info message
      captureInfo.style.display = "block";
      captureInfo.className = "capture-info info";
      captureInfo.textContent = "Getting cookies from current page...";

      // Send message to background script to get cookies
      const response = await chrome.runtime.sendMessage({
        type: "getCurrentPageCookies",
      });

      if (response.success) {
        const { cookies, url, domain, title } = response.data;
        
        // Validate domain - only allow Cursor-related domains
        if (!this.isValidCursorDomain(domain)) {
          throw new Error(`Cannot capture account from "${domain}". Only Cursor account dashboard pages are supported (cursor.com, cursor.sh). Authentication pages are not valid account sources.`);
        }
        
        // Filter out empty or invalid cookies
        const validCookies = cookies.filter(cookie => cookie.name && cookie.value);
        
        if (validCookies.length === 0) {
          throw new Error("No valid cookies found on this page");
        }

        // Auto-populate the cookies textarea
        cookiesInput.value = JSON.stringify(validCookies, null, 2);

        // Try to get email from current page first for better naming
        let generatedEmail = null;
        let generatedUsername = null;
        
        try {
          // Get account info from current page if on cursor.com
          if (domain.includes('cursor.com')) {
            const infoResponse = await chrome.runtime.sendMessage({
              type: "getAccountInfo"
            });
            
            if (infoResponse && infoResponse.success && infoResponse.data) {
              generatedEmail = infoResponse.data.email;
              generatedUsername = infoResponse.data.username;
            }
          }
        } catch (error) {
          console.log("Could not get account info for naming:", error);
        }

        // Auto-generate account name based on extracted info or domain
        if (!accountNameInput.value) {
          // Validate email format before using it
          const isValidEmail = (email) => {
            return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
          };
          
          if (isValidEmail(generatedEmail)) {
            // Use email as account name if found and valid
            accountNameInput.value = generatedEmail;
          } else if (generatedUsername && generatedUsername !== generatedEmail && generatedUsername.length > 0) {
            // Use username if different from email and not empty
            accountNameInput.value = generatedUsername;
          } else {
            // Fallback to domain + timestamp
            const siteName = domain.replace(/^www\./, '');
            const timestamp = new Date().getTime().toString().slice(-4);
            accountNameInput.value = `${siteName}_${timestamp}`;
          }
        }

        // Show success message
        captureInfo.className = "capture-info success";
        captureInfo.innerHTML = `
          ✅ Successfully captured ${validCookies.length} cookies from:<br>
          <strong>${title || domain}</strong><br>
          <em>${url}</em>
        `;

        // Focus on account name input for easy editing
        accountNameInput.focus();
        accountNameInput.select();

      } else {
        throw new Error(response.error || "Failed to capture cookies");
      }

    } catch (error) {
      console.error("Error capturing cookies:", error);
      captureInfo.style.display = "block";
      captureInfo.className = "capture-info error";
      captureInfo.textContent = `❌ Error: ${error.message}`;

      // Clear any partial data
      cookiesInput.value = "";
    } finally {
      // Re-enable button
      captureBtn.disabled = false;
      captureBtn.textContent = "📄 Capture from Current Page";
    }
  }

  // Validate if domain is valid for Cursor accounts
  isValidCursorDomain(domain) {
    // Explicitly exclude authenticator.cursor.sh - it's not a user account page
    if (domain.toLowerCase().includes('authenticator.cursor.sh')) {
      return false;
    }
    
    const validDomains = [
      'cursor.com',
      'www.cursor.com',
      'cursor.sh',
      'www.cursor.sh'
    ];
    
    // Check exact matches
    if (validDomains.includes(domain.toLowerCase())) {
      return true;
    }
    
    // Check if it's a subdomain of cursor.com or cursor.sh (but not authenticator)
    const cursorDomains = ['cursor.com', 'cursor.sh'];
    for (const cursorDomain of cursorDomains) {
      if (domain.toLowerCase().endsWith('.' + cursorDomain)) {
        return true;
      }
    }
    
    return false;
  }

  async exportCurrentAccount() {
    if (!this.activeAccount) {
      this.showNotification("No active account", "error");
      return;
    }

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "exportAccount",
        account: this.activeAccount,
      });

      if (response.success) {
        this.showNotification("Exported to Downloads", "success");
      } else {
        this.showNotification("Export failed", "error");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      this.showNotification("Export error", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async switchAccount(accountName) {
    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "switchAccount",
        account: accountName,
      });

      if (response.success) {
        // Check if this is an OAuth account
        const account = this.accounts.find(acc => acc.name === accountName);
        const isOAuth = account && account.cookies && 
          account.cookies.some(c => c.value && c.value.includes('google-oauth2'));
        
        if (isOAuth) {
          this.showNotification(
            `Switching to ${accountName}... (OAuth account - may redirect to login)`,
            "info",
            5000
          );
        } else {
          this.showNotification(`Switching to ${accountName}...`, "success");
        }
        
        // Let background script handle redirect
        setTimeout(() => this.loadAccounts(), 1000);
        
        // Auto-refresh account info after switching (single call with force)
        setTimeout(() => {
          this.updateAccountInfo(true); // Force update after account switch
        }, 3000);
        
      } else {
        this.showNotification("Switch failed", "error");
      }
    } catch (error) {
      console.error("Error switching account:", error);
      
      // More detailed error messages
      if (error.message && error.message.includes('nonce')) {
        this.showNotification(
          "OAuth authentication error. Please try refreshing the page.",
          "error",
          7000
        );
      } else if (error.message && error.message.includes('mismatch')) {
        this.showNotification(
          "Authentication state mismatch. Please try again in a few seconds.",
          "error",
          5000
        );
      } else {
        this.showNotification("Switch error", "error");
      }
    } finally {
      this.showLoading(false);
    }
  }

  async revealAccountFile(accountName) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "revealAccountFile",
        account: accountName,
      });

      if (response.success) {
        this.showNotification(response.message || "File revealed", "success");
      } else if (response.canExport) {
        // File not found, offer to export
        const shouldExport = confirm(
          `File not found in Downloads folder.\n\nWould you like to export "${accountName}" now?`
        );

        if (shouldExport) {
          await this.exportSpecificAccount(accountName);
        }
      } else {
        this.showNotification(response.error || "File not found", "error");
      }
    } catch (error) {
      console.error("Error revealing file:", error);
      this.showNotification("Reveal error", "error");
    }
  }

  // Export specific account (helper method)
  async exportSpecificAccount(accountName) {
    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "exportAccount",
        account: accountName,
      });

      if (response.success) {
        this.showNotification(`Account exported: ${accountName}`, "success");

        // Try to reveal the newly exported file after a short delay
        setTimeout(() => {
          this.revealAccountFile(accountName);
        }, 1000);
      } else {
        this.showNotification("Export failed", "error");
      }
    } catch (error) {
      console.error("Error exporting account:", error);
      this.showNotification("Export error", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async deleteAccount(accountName) {
    // First confirmation for basic deletion
    if (!confirm(`Delete account ${accountName}?`)) {
      return;
    }

    // Second confirmation for file deletion option
    const deleteFile = confirm(
      `Also delete the backup file in Downloads/cursor_accounts/?
      
✅ YES: Delete both account and file
❌ NO: Keep file, delete account only

Choose YES if you want complete removal.
Choose NO if you want to keep the backup file.`
    );

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "removeAccount",
        account: accountName,
        deleteFile: deleteFile,
      });

      if (response.success) {
        const message = deleteFile
          ? `Deleted account and file: ${accountName}`
          : `Deleted account: ${accountName} (file kept)`;
        this.showNotification(message, "success");
        await this.loadAccounts();
      } else {
        this.showNotification("Delete failed", "error");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      this.showNotification("Delete error", "error");
    } finally {
      this.showLoading(false);
    }
  }

  toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");

    // Save preference
    chrome.storage.local.set({ darkMode: isDark });

    // This is handled by the SVG update above
  }

  showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (show) {
      overlay.style.display = "flex";
      this.loadingTimeout = setTimeout(() => {
        overlay.style.display = "none";
      }, 2000);
    } else {
      overlay.style.display = "none";
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
      }
    }
  }

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    const text = document.getElementById("notificationText");

    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }

  // Toggle advanced panel
  toggleAdvancedPanel() {
    const panel = document.getElementById("advancedPanel");
    const button = document.getElementById("toggleAdvancedBtn");
    const isVisible = panel.style.display !== "none";

    panel.style.display = isVisible ? "none" : "block";
    button.textContent = isVisible ? "⚙️ Advanced Tools" : "⚙️ Hide Tools";
  }

  // Import from Downloads folder
  importFromDownloads() {
    document.getElementById("downloadsFileInput").click();
  }

  // Import from folder
  importFromFolder() {
    document.getElementById("folderInput").click();
  }

  // Handle multiple file import from Downloads
  async handleDownloadsImport(files) {
    await this.processFileImport(files, "downloadsFileInput");
  }

  // Handle folder import
  async handleFolderImport(files) {
    // Filter only JSON files from the folder
    const jsonFiles = Array.from(files).filter((file) =>
      file.name.toLowerCase().endsWith(".json")
    );

    if (jsonFiles.length === 0) {
      this.showNotification(
        "No JSON files found in the selected folder",
        "error"
      );
      return;
    }

    // Limit to prevent browser crash
    const maxFiles = 100;
    if (jsonFiles.length > maxFiles) {
      const confirmed = confirm(`Found ${jsonFiles.length} JSON files. This might cause browser issues. Import only the first ${maxFiles} files?`);
      if (!confirmed) return;
      jsonFiles.splice(maxFiles);
    }

    this.showNotification(
      `Found ${jsonFiles.length} JSON files in folder, importing...`,
      "info"
    );
    await this.processFileImport(jsonFiles, "folderInput");
  }

  // Process file import (shared by both methods)
  async processFileImport(files, inputId) {
    if (!files || files.length === 0) return;

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    this.showLoading(true);

    try {
      for (const file of files) {
        try {
          // Skip non-JSON files
          if (!file.name.toLowerCase().endsWith(".json")) {
            continue;
          }

          const text = await file.text();

          // Try to import - let the service handle duplicate detection
          const response = await chrome.runtime.sendMessage({
            type: "importAccountJSON",
            jsonText: text,
            customName: null,
          });

          if (response.success) {
            importedCount++;
            console.log(`Imported: ${file.name} as ${response.data}`);
          } else {
            // Check if error is due to duplicate
            if (response.error && response.error.includes("already exists")) {
              skippedCount++;
              console.log(
                `Skipped duplicate: ${file.name} - ${response.error}`
              );
            } else {
              errorCount++;
              console.error(`Failed to import: ${file.name}`, response.error);
            }
          }
        } catch (error) {
          console.error("Error importing file:", file.name, error);
          errorCount++;
        }
      }

      // Show detailed results
      let message = `Import: ${importedCount} added`;
      if (skippedCount > 0) {
        message += `, ${skippedCount} skipped`;
      }
      if (errorCount > 0) {
        message += `, ${errorCount} errors`;
      }

      this.showNotification(message, importedCount > 0 ? "success" : "info");

      if (importedCount > 0) {
        await this.loadAccounts();
      }
    } catch (error) {
      console.error("Error during bulk import:", error);
      this.showNotification("Error importing files", "error");
    } finally {
      this.showLoading(false);
      // Clear the file input
      document.getElementById(inputId).value = "";
    }
  }

  async clearAllData() {
    const confirmed = confirm(
      "⚠️ WARNING: Delete ALL accounts and data?\n\nThis cannot be undone!"
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      "🚨 FINAL CONFIRMATION\n\nDelete all:\n- Accounts\n- Cookies\n- Settings\n\nContinue?"
    );

    if (!doubleConfirm) return;

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "clearAllData",
      });

      if (response.success) {
        this.showNotification("All data cleared. Extension reset.", "success");

        // Reload the accounts
        setTimeout(() => {
          this.loadAccounts();
        }, 1000);
      } else {
        this.showNotification("Error clearing data", "error");
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      this.showNotification("Error clearing data", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async consolidateDuplicates() {
    const confirmed = confirm(
      "🔧 Fix Duplicate Accounts?\n\nThis will:\n- Find accounts with same session\n- Keep account with proper email\n- Remove duplicates\n\nContinue?"
    );

    if (!confirmed) return;

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "consolidateDuplicates",
      });

      if (response.success) {
        this.showNotification(
          `Fixed ${response.removed} duplicate accounts`,
          response.removed > 0 ? "success" : "info"
        );

        // Reload accounts if duplicates were removed
        if (response.removed > 0) {
          setTimeout(() => {
            this.loadAccounts();
          }, 1000);
        }
      } else {
        this.showNotification("Error consolidating duplicates", "error");
      }
    } catch (error) {
      console.error("Error consolidating duplicates:", error);
      this.showNotification("Error consolidating duplicates", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async cleanupAccountInfo() {
    const confirmed = confirm(
      "🧹 Fix Corrupted Account Info?\n\nThis will:\n- Clean up corrupted email addresses\n- Validate email formats\n\nContinue?"
    );

    if (!confirmed) return;

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "cleanupCorruptedAccountInfo",
      });

      if (response.success) {
        this.showNotification(
          `Fixed ${response.data.cleaned} corrupted account entries`,
          response.data.cleaned > 0 ? "success" : "info"
        );

        // Reload accounts if entries were fixed
        if (response.data.cleaned > 0) {
          setTimeout(() => {
            this.loadAccounts();
          }, 1000);
        }
      } else {
        this.showNotification("Error cleaning up account info", "error");
      }
    } catch (error) {
      console.error("Error cleaning up account info:", error);
      this.showNotification("Error cleaning up account info", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // Start periodic status checking to detect logout
  startPeriodicStatusCheck() {
    // Prevent multiple intervals
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    
    // Check every 30 seconds for logout state (reduced frequency)
    this.statusCheckInterval = setInterval(async () => {
      try {
        // Only check if we think we have an active account
        if (this.activeAccount) {
          await this.updateAccountInfo(false); // Don't force, respect rate limiting
        }
      } catch (error) {
        // Silent error handling to avoid spam
      }
    }, 30000); // Increased from 5 seconds to 30 seconds
  }

  // Switch between tabs
  switchTab(tabName) {
    this.currentTab = tabName;

    // Close advanced tools panel when switching tabs
    const advancedPanel = document.getElementById("advancedPanel");
    if (advancedPanel) {
      advancedPanel.style.display = "none";
    }

    // Update tab buttons
    document
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById(`${tabName}Tab`).classList.add("active");

    // Update content visibility
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.style.display = "none";
    });

    // Fix: use correct element ID
    const contentElement = document.getElementById(`${tabName}Content`);
    if (contentElement) {
      contentElement.style.display = "block";
    } else {
      console.error(`Tab content element not found: ${tabName}Content`);
    }

    // Load appropriate data
    if (tabName === "payments") {
      this.loadPaymentCards();
    }
  }

  // Load payment cards
  async loadPaymentCards() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "getPaymentCards",
      });

      if (response.success) {
        this.paymentCards = response.data || [];
        this.updatePaymentCardsUI();
      } else {
        this.showNotification("Failed to load payment cards", "error");
      }
    } catch (error) {
      console.error("Error loading payment cards:", error);
      this.showNotification("Error loading payment cards", "error");
    }
  }

  // Update payment cards UI
  updatePaymentCardsUI() {
    const listEl = document.getElementById("cardsList");
    const emptyEl = document.getElementById("noCards");
    const countEl = document.getElementById("cardsCount");

    countEl.textContent = `(${this.paymentCards.length})`;

    if (this.paymentCards.length === 0) {
      listEl.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }

    listEl.style.display = "block";
    emptyEl.style.display = "none";
    listEl.innerHTML = "";

    // Show/hide filters based on card count
    const filtersElement = document.querySelector(".card-filters");
    if (filtersElement) {
      filtersElement.style.display =
        this.paymentCards.length > 0 ? "block" : "none";
    }

    // Ensure scrollable class is applied to cards list
    if (!listEl.classList.contains("scrollable")) {
      listEl.classList.add("scrollable");
    }

    this.paymentCards.forEach((card) => {
      const cardEl = this.createCardElement(card);
      listEl.appendChild(cardEl);
    });

    // Apply current filters if they exist
    if (this.cardFilters) {
      this.filterCards();
    }

    // Update selection UI if it exists
    if (this.updateSelectionUI) {
      this.updateSelectionUI();
    }
  }

  // Create card element
  createCardElement(card) {
    const template = document.getElementById("sidebarCardTemplate");
    const element = template.content.cloneNode(true);
    const container = element.querySelector(".card-item");

    // Set card data
    container.dataset.cardId = card.id;

    // Card selection checkbox
    const cardSelect = container.querySelector(".card-select");
    if (cardSelect) {
      cardSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        this.toggleCardSelection(card.id, e.target.checked);
      });
    }

    // Set card icon based on type
    const iconEl = container.querySelector(".card-type-icon");
    switch (card.type) {
      case "Visa":
        iconEl.textContent = "💳";
        break;
      case "MasterCard":
        iconEl.textContent = "💳";
        break;
      default:
        iconEl.textContent = "💳";
    }

    // Set card number (masked)
    container.querySelector(".card-number").textContent = this.formatCardNumber(
      card.number
    );

    // Set expiry and type
    container.querySelector(".card-expiry").textContent = card.expiry;
    container.querySelector(".card-type").textContent = card.type;

    // Setup fill button
    container.querySelector(".fill-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.autoFillCard(card.id);
    });

    // Setup remove button
    container
      .querySelector(".remove-card-btn")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        this.removePaymentCard(card.id);
      });

    return container;
  }

  // Format card number for display
  formatCardNumber(cardNumber) {
    if (!cardNumber) return "";
    return `**** **** **** ${cardNumber.slice(-4)}`;
  }

  // Card filtering functionality
  filterCards() {
    if (!this.cardFilters) return;

    const cardsList = document.getElementById("cardsList");
    const cardItems = cardsList.querySelectorAll(".card-item");

    cardItems.forEach((cardItem) => {
      const cardId = cardItem.getAttribute("data-card-id");
      const card = this.paymentCards.find((c) => c.id === cardId);

      if (!card) {
        cardItem.style.display = "none";
        return;
      }

      const matchesSearch =
        !this.cardFilters.search ||
        card.number.includes(this.cardFilters.search) ||
        card.type.toLowerCase().includes(this.cardFilters.search) ||
        card.expiry.includes(this.cardFilters.search);

      const matchesType =
        !this.cardFilters.type ||
        card.type.toLowerCase() === this.cardFilters.type;

      const shouldShow = matchesSearch && matchesType;
      cardItem.style.display = shouldShow ? "flex" : "none";
    });
  }

  // Card selection functionality
  toggleCardSelection(cardId, selected) {
    if (!this.selectedCards) {
      this.selectedCards = new Set();
    }

    if (selected) {
      this.selectedCards.add(cardId);
    } else {
      this.selectedCards.delete(cardId);
    }

    // Update card visual state
    const cardItem = document.querySelector(`[data-card-id="${cardId}"]`);
    if (cardItem) {
      cardItem.classList.toggle("selected", selected);
    }

    this.updateSelectionUI();
  }

  selectAllCards(selectAll) {
    if (!this.selectedCards) {
      this.selectedCards = new Set();
    }

    const cardsList = document.getElementById("cardsList");
    const visibleCardItems = Array.from(
      cardsList.querySelectorAll(".card-item")
    ).filter((item) => item.style.display !== "none");

    visibleCardItems.forEach((cardItem) => {
      const cardId = cardItem.getAttribute("data-card-id");
      const checkbox = cardItem.querySelector(".card-select");

      if (checkbox) {
        checkbox.checked = selectAll;
        this.toggleCardSelection(cardId, selectAll);
      }
    });
  }

  updateSelectionUI() {
    if (!this.selectedCards) {
      this.selectedCards = new Set();
    }

    const selectedCount = this.selectedCards.size;
    const bulkActions = document.getElementById("bulkActions");
    const selectedCountSpan = document.getElementById("selectedCount");
    const selectAllCheckbox = document.getElementById("selectAllCards");

    if (bulkActions) {
      bulkActions.style.display = selectedCount > 0 ? "flex" : "none";
    }

    if (selectedCountSpan) {
      selectedCountSpan.textContent = selectedCount;
    }

    if (selectAllCheckbox) {
      const visibleCards = Array.from(
        document.querySelectorAll(".card-item")
      ).filter((item) => item.style.display !== "none").length;

      selectAllCheckbox.indeterminate =
        selectedCount > 0 && selectedCount < visibleCards;
      selectAllCheckbox.checked =
        selectedCount > 0 && selectedCount === visibleCards;
    }
  }

  clearSelection() {
    if (!this.selectedCards) {
      this.selectedCards = new Set();
    }

    this.selectedCards.clear();

    // Uncheck all checkboxes
    document.querySelectorAll(".card-select").forEach((checkbox) => {
      checkbox.checked = false;
    });

    // Remove selected class
    document.querySelectorAll(".card-item.selected").forEach((item) => {
      item.classList.remove("selected");
    });

    this.updateSelectionUI();
  }

  async deleteSelectedCards() {
    if (!this.selectedCards || this.selectedCards.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${this.selectedCards.size} selected card(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      this.showLoading(true);

      // Delete cards one by one
      const selectedArray = Array.from(this.selectedCards);
      for (const cardId of selectedArray) {
        await this.removePaymentCard(cardId, false); // Don't reload after each deletion
      }

      // Clear selection
      this.clearSelection();

      // Reload cards once
      await this.loadPaymentCards();

      this.showNotification(
        `Successfully deleted ${selectedArray.length} card(s)`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting selected cards:", error);
      this.showNotification("Error deleting selected cards", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // Account filtering functionality - FIXED
  filterAccounts() {
    console.log("filterAccounts called", this.accountFilters);

    if (!this.accountFilters) {
      console.log("No account filters initialized");
      return;
    }

    const accountsList = document.getElementById("accountsList");
    if (!accountsList) {
      console.log("Accounts list not found");
      return;
    }

    const accountItems = accountsList.querySelectorAll(".sidebar-account-item");
    console.log(`Found ${accountItems.length} account items to filter`);

    let visibleCount = 0;

    accountItems.forEach((accountItem) => {
      const accountName =
        accountItem.getAttribute("data-account-name") ||
        accountItem.getAttribute("data-account");
      const account = this.accounts.find((acc) => acc.name === accountName);

      console.log(
        `Processing account item with name: ${accountName}, found account:`,
        account
      );

      if (!account) {
        console.log(`Account not found for: ${accountName}`);
        accountItem.style.display = "none";
        return;
      }

      // Get account info from different sources
      const accountInfo = account.info || {};
      const accountStatus = (
        accountInfo.status ||
        account.status ||
        ""
      ).toLowerCase();
      const accountEmail = (
        accountInfo.email ||
        account.email ||
        account.name ||
        ""
      ).toLowerCase();

      console.log(
        `Filtering account: ${account.name}, status: ${accountStatus}, email: ${accountEmail}`
      );

      const matchesSearch =
        !this.accountFilters.search ||
        account.name.toLowerCase().includes(this.accountFilters.search) ||
        accountEmail.includes(this.accountFilters.search) ||
        accountStatus.includes(this.accountFilters.search);

      let matchesStatus = true;
      if (this.accountFilters.status && this.accountFilters.status !== "") {
        if (this.accountFilters.status === "empty") {
          // Filter for empty status
          matchesStatus = !accountStatus || accountStatus === "";
        } else {
          // Handle "pro plan" vs "pro" compatibility
          if (this.accountFilters.status === "pro plan") {
            matchesStatus =
              accountStatus === "pro plan" || accountStatus === "pro";
          } else {
            matchesStatus = accountStatus === this.accountFilters.status;
          }
        }
      }
      // If accountFilters.status is empty string (""), show all (matchesStatus = true)

      const shouldShow = matchesSearch && matchesStatus;
      accountItem.style.display = shouldShow ? "flex" : "none";

      console.log(
        `Account ${account.name}: matchesSearch=${matchesSearch}, matchesStatus=${matchesStatus}, shouldShow=${shouldShow}, display=${accountItem.style.display}`
      );

      if (shouldShow) {
        visibleCount++;
      }
    });

    // Update account count with filtered results
    const accountCount = document.getElementById("accountsCount");
    if (accountCount) {
      if (this.accountFilters.search || this.accountFilters.status) {
        accountCount.textContent = `(${visibleCount}/${this.accounts.length})`;
      } else {
        accountCount.textContent = `(${this.accounts.length})`;
      }
    }

    console.log(
      `Filter result: ${visibleCount}/${this.accounts.length} accounts visible`
    );
  }

  // Show import cards modal
  showImportCardsModal() {
    document.getElementById("importCardsModal").style.display = "block";
    document.getElementById("cardsInput").value = "";
    document.getElementById("replaceCardsCheck").checked = false;
    document.getElementById("cardsInput").focus();
  }

  // Hide import cards modal
  hideImportCardsModal() {
    document.getElementById("importCardsModal").style.display = "none";
  }

  // Import cards from text
  async importCardsFromText() {
    const cardsInput = document.getElementById("cardsInput").value.trim();
    const replaceCards = document.getElementById("replaceCardsCheck").checked;

    if (!cardsInput) {
      this.showNotification("Please paste card data", "error");
      return;
    }

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "importPaymentCards",
        cardData: cardsInput,
        replace: replaceCards,
      });

      if (response.success) {
        this.showNotification(`Imported ${response.data} cards`, "success");
        this.hideImportCardsModal();
        await this.loadPaymentCards();
      } else {
        this.showNotification("Failed to import cards", "error");
      }
    } catch (error) {
      console.error("Error importing cards:", error);
      this.showNotification("Error importing cards", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // Handle cards file import
  async handleCardsFileImport(files) {
    if (!files || files.length === 0) return;

    let importedTotal = 0;
    this.showLoading(true);

    try {
      for (const file of files) {
        const text = await file.text();

        const response = await chrome.runtime.sendMessage({
          type: "importPaymentCards",
          cardData: text,
          replace: false,
        });

        if (response.success) {
          importedTotal += response.data;
        }
      }

      this.showNotification(
        `Imported ${importedTotal} cards from ${files.length} files`,
        "success"
      );
      await this.loadPaymentCards();
    } catch (error) {
      console.error("Error importing card files:", error);
      this.showNotification("Error importing card files", "error");
    } finally {
      this.showLoading(false);
      document.getElementById("cardsFileInput").value = "";
    }
  }

  // Export cards to file
  async exportCards() {
    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "exportPaymentCards",
      });

      if (response.success) {
        if (response.data.length === 0) {
          this.showNotification("No cards to export", "warning");
          return;
        }

        // Create a blob with the card data
        const cardData = response.data.join("\n");
        const blob = new Blob([cardData], { type: "text/plain" });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cursor_payment_cards_${new Date()
          .toISOString()
          .slice(0, 10)}.txt`;

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(
          `Exported ${response.data.length} cards`,
          "success"
        );
      } else {
        this.showNotification("Failed to export cards", "error");
      }
    } catch (error) {
      console.error("Error exporting cards:", error);
      this.showNotification("Error exporting cards", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // Auto-fill payment card
  async autoFillCard(cardId) {
    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "autoFillPayment",
        cardId: cardId,
      });

      if (response.success) {
        const { filled, cardType } = response.data;
        this.showNotification(
          `Auto-filled ${filled} fields (${cardType})`,
          "success"
        );
      } else {
        this.showNotification("Auto-fill failed: " + response.error, "error");
      }
    } catch (error) {
      console.error("Error auto-filling card:", error);
      this.showNotification("Error auto-filling card", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // Find payment fields
  async findPaymentFields() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "findPaymentFields",
      });

      if (response.success) {
        const info = response.data;
        const infoEl = document.getElementById("paymentFormInfo");
        const fieldsEl = document.getElementById("formFieldsInfo");

        if (info.found > 0) {
          fieldsEl.innerHTML = `Found ${info.found} payment fields on this page`;
          infoEl.style.display = "block";
          this.showNotification(
            `Found ${info.found} payment fields`,
            "success"
          );
        } else {
          infoEl.style.display = "none";
          this.showNotification(
            "No payment fields detected on this page",
            "info"
          );
        }
      } else {
        this.showNotification("Could not scan page", "error");
      }
    } catch (error) {
      console.error("Error finding payment fields:", error);
      this.showNotification("Error scanning page", "error");
    }
  }

  // Remove card
  async removePaymentCard(cardId) {
    if (!confirm("Remove this payment card?")) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: "removePaymentCard",
        cardId: cardId,
      });

      if (response.success) {
        this.showNotification("Card removed", "success");
        await this.loadPaymentCards();
      } else {
        this.showNotification("Failed to remove card", "error");
      }
    } catch (error) {
      console.error("Error removing card:", error);
      this.showNotification("Error removing card", "error");
    }
  }

  // Clear all cards
  async clearAllCards() {
    if (!confirm("Clear all payment cards? This cannot be undone.")) {
      return;
    }

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "clearPaymentCards",
      });

      if (response.success) {
        this.showNotification("All cards cleared", "success");
        await this.loadPaymentCards();
      } else {
        this.showNotification("Failed to clear cards", "error");
      }
    } catch (error) {
      console.error("Error clearing cards:", error);
      this.showNotification("Error clearing cards", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // Debug Panel Methods
  toggleDebugPanel() {
    const debugBtn = document.getElementById("debugToggle");
    const debugPanel = document.getElementById("debugPanel");

    const isVisible = debugBtn.style.display !== "none";

    debugBtn.style.display = isVisible ? "none" : "inline-block";
    debugPanel.style.display = isVisible ? "none" : "block";

    if (!isVisible) {
      this.showNotification(
        "Debug mode enabled (Ctrl+Shift+D to toggle)",
        "info"
      );
    }
  }

  async showStoredData() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "getAllStoredData",
      });

      const debugOutput = document.getElementById("debugOutput");

      if (response.success) {
        debugOutput.textContent = JSON.stringify(response.data, null, 2);
        this.showNotification("Stored data loaded", "success");
      } else {
        debugOutput.textContent = "Error loading stored data";
        this.showNotification("Error loading stored data", "error");
      }
    } catch (error) {
      console.error("Error showing stored data:", error);
      this.showNotification("Error showing stored data", "error");
    }
  }

  // Account Deletion Methods
  async deleteFreeAccount() {
    const confirmed = confirm(
      "⚠️ DELETE FREE ACCOUNT\n\n" +
        "This will PERMANENTLY delete your Cursor account.\n" +
        "This action CANNOT be undone.\n\n" +
        "The process will:\n" +
        "1. Open Cursor dashboard settings\n" +
        "2. Automatically click delete\n" +
        "3. Fill confirmation text\n" +
        "4. Complete account deletion\n\n" +
        "Are you absolutely sure you want to continue?"
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      "🚨 FINAL WARNING\n\n" +
        "This will permanently delete your FREE Cursor account.\n" +
        "All your settings, preferences, and data will be lost.\n\n" +
        "Type YES in the next prompt if you're sure."
    );

    if (!doubleConfirm) return;

    const finalConfirm = prompt(
      "Type 'DELETE FREE ACCOUNT' to confirm permanent deletion:"
    );

    if (finalConfirm !== "DELETE FREE ACCOUNT") {
      this.showNotification("Account deletion cancelled", "info");
      return;
    }

    try {
      this.showLoading(true);
      this.showNotification("Initiating free account deletion...", "info");

      const response = await chrome.runtime.sendMessage({
        type: "deleteFreeAccount",
      });

      if (response.success) {
        this.showNotification(
          "Free account deletion initiated! Check the opened tab.",
          "success"
        );

        // Monitor deletion status
        this.monitorDeletionStatus();
      } else {
        this.showNotification(
          "Failed to initiate account deletion: " + response.error,
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting free account:", error);
      this.showNotification("Error initiating account deletion", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async deleteProTrialAccount() {
    const confirmed = confirm(
      "⚠️ DELETE PRO TRIAL ACCOUNT\n\n" +
        "This will PERMANENTLY delete your Cursor Pro Trial account.\n" +
        "This action CANNOT be undone.\n\n" +
        "The process will:\n" +
        "1. Open Cursor dashboard billing\n" +
        "2. Open Stripe billing portal\n" +
        "3. Cancel your subscription\n" +
        "4. Delete your account\n\n" +
        "Are you absolutely sure you want to continue?"
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      "🚨 FINAL WARNING\n\n" +
        "This will permanently delete your PRO TRIAL Cursor account.\n" +
        "Your subscription will be cancelled and account deleted.\n" +
        "All your settings, preferences, and data will be lost.\n\n" +
        "Type YES in the next prompt if you're sure."
    );

    if (!doubleConfirm) return;

    const finalConfirm = prompt(
      "Type 'DELETE PRO TRIAL ACCOUNT' to confirm permanent deletion:"
    );

    if (finalConfirm !== "DELETE PRO TRIAL ACCOUNT") {
      this.showNotification("Account deletion cancelled", "info");
      return;
    }

    try {
      this.showLoading(true);
      this.showNotification("Initiating pro trial account deletion...", "info");

      const response = await chrome.runtime.sendMessage({
        type: "deleteProTrialAccount",
      });

      if (response.success) {
        this.showNotification(
          "Pro trial account deletion initiated! Check the opened tabs.",
          "success"
        );

        // Monitor deletion status
        this.monitorDeletionStatus();
      } else {
        this.showNotification(
          "Failed to initiate account deletion: " + response.error,
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting pro trial account:", error);
      this.showNotification("Error initiating account deletion", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // Monitor deletion status
  async monitorDeletionStatus() {
    const maxChecks = 60; // Check for 1 minute
    let checks = 0;

    const checkStatus = async () => {
      checks++;

      try {
        const response = await chrome.runtime.sendMessage({
          type: "checkDeletionStatus",
        });

        if (response.success && response.inProgress) {
          if (checks < maxChecks) {
            setTimeout(checkStatus, 1000); // Check every second
          } else {
            this.showNotification(
              "Deletion process taking longer than expected. Please check manually.",
              "info"
            );
          }
        } else {
          this.showNotification(
            "Account deletion process completed.",
            "success"
          );
        }
      } catch (error) {
        console.error("Error checking deletion status:", error);
      }
    };

    setTimeout(checkStatus, 2000); // Start checking after 2 seconds
  }
  
  // Setup message listener for trial status updates
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'trialStatus') {
        this.handleTrialStatusUpdate(message);
        sendResponse({ success: true });
      } else if (message.type === 'refreshStatus') {
        this.refreshAccountStatus();
        sendResponse({ success: true });
      }
      return true;
    });
  }
  
  // Handle trial status updates from content script
  handleTrialStatusUpdate(message) {
    const { message: statusMessage, status } = message;
    
    let notificationType = 'info';
    let duration = 3000;
    
    switch (status) {
      case 'success':
        notificationType = 'success';
        duration = 5000;
        // Auto-refresh status after successful Pro Trial activation
        setTimeout(() => {
          this.refreshAccountStatus();
        }, 2000);
        break;
      case 'error':
        notificationType = 'error';
        duration = 5000;
        break;
      case 'warning':
        notificationType = 'warning';
        duration = 4000;
        break;
    }
    
    this.showNotification(statusMessage, notificationType, duration);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== BIN HISTORY FUNCTIONALITY =====
  
  // Initialize BIN history functionality
  initBinHistory() {
    const binInput = document.getElementById('binInput');
    const binDropdown = document.getElementById('binHistoryDropdown');
    
    if (!binInput || !binDropdown) {
      console.warn('BIN history elements not found');
      return;
    }
    
    // Show history on focus
    binInput.addEventListener('focus', () => {
      this.showBinHistory();
    });
    
    // Hide history on blur (with delay for clicks)
    binInput.addEventListener('blur', () => {
      setTimeout(() => {
        this.hideBinHistory();
      }, 200);
    });
    
    // Hide history when clicking outside
    document.addEventListener('click', (e) => {
      if (!binInput.contains(e.target) && !binDropdown.contains(e.target)) {
        this.hideBinHistory();
      }
    });
    
    // Load initial history
    this.loadBinHistory();
  }
  
  // Get BIN history from localStorage
  getBinHistory() {
    try {
      const history = localStorage.getItem('cursorBinHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading BIN history:', error);
      return [];
    }
  }
  
  // Save BIN history to localStorage
  saveBinHistory(history) {
    try {
      localStorage.setItem('cursorBinHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving BIN history:', error);
    }
  }
  
  // Add BIN to history
  addBinToHistory(binCode) {
    if (!binCode || binCode.length < 6) return;
    
    const history = this.getBinHistory();
    const cleanBin = binCode.trim();
    
    // Remove if already exists
    const filteredHistory = history.filter(item => item.bin !== cleanBin);
    
    // Add to beginning with metadata
    const binInfo = this.getBinInfo(cleanBin);
    filteredHistory.unshift({
      bin: cleanBin,
      name: binInfo.name,
      type: binInfo.type,
      added: new Date().toISOString()
    });
    
    // Keep only last 10 entries
    const limitedHistory = filteredHistory.slice(0, 10);
    
    // Save to localStorage
    this.saveBinHistory(limitedHistory);
    
    // Update UI if dropdown is visible
    const dropdown = document.getElementById('binHistoryDropdown');
    if (dropdown && dropdown.style.display !== 'none') {
      this.renderBinHistory();
    }
  }
  
  // Remove BIN from history
  removeBinFromHistory(binCode) {
    const history = this.getBinHistory();
    const filteredHistory = history.filter(item => item.bin !== binCode);
    this.saveBinHistory(filteredHistory);
    this.renderBinHistory();
  }
  
  // Get BIN information (basic card type detection)
  getBinInfo(bin) {
    const binStr = bin.toString();
    
    if (binStr.startsWith('4')) {
      return { name: 'Visa', type: 'visa' };
    } else if (binStr.startsWith('5') || binStr.startsWith('2')) {
      return { name: 'Mastercard', type: 'mastercard' };
    } else if (binStr.startsWith('3')) {
      return { name: 'American Express', type: 'amex' };
    } else if (binStr.startsWith('6')) {
      return { name: 'Discover', type: 'discover' };
    } else {
      return { name: 'Unknown', type: 'unknown' };
    }
  }
  
  // Load and display BIN history
  loadBinHistory() {
    this.renderBinHistory();
  }
  
  // Show BIN history dropdown
  showBinHistory() {
    const dropdown = document.getElementById('binHistoryDropdown');
    if (dropdown) {
      this.renderBinHistory();
      dropdown.style.display = 'block';
    }
  }
  
  // Hide BIN history dropdown
  hideBinHistory() {
    const dropdown = document.getElementById('binHistoryDropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }
  
  // Render BIN history in dropdown
  renderBinHistory() {
    const dropdown = document.getElementById('binHistoryDropdown');
    if (!dropdown) return;
    
    const history = this.getBinHistory();
    
    if (history.length === 0) {
      dropdown.innerHTML = '<div class="bin-history-empty">No BIN history yet</div>';
      return;
    }
    
    dropdown.innerHTML = history.map(item => `
      <div class="bin-history-item" data-bin="${item.bin}">
        <div style="flex: 1;">
          <div class="bin-code">${item.bin}</div>
          <div class="bin-desc">${item.name} • ${this.formatDate(item.added)}</div>
        </div>
        <button class="remove-bin" data-bin="${item.bin}" title="Remove from history">×</button>
      </div>
    `).join('');
    
    // Add event listeners
    dropdown.querySelectorAll('.bin-history-item').forEach(item => {
      const bin = item.dataset.bin;
      
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-bin')) {
          // Select BIN
          document.getElementById('binInput').value = bin;
          this.hideBinHistory();
        }
      });
      
      // Remove button
      const removeBtn = item.querySelector('.remove-bin');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeBinFromHistory(bin);
        });
      }
    });
  }
  
  // Format date for display
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Recently';
    }
  }

  // Pro Trial Activation with automatic card generation
  // Debounced version to prevent double clicks
  activateProTrialWithDebounce() {
    if (this.isActivatingTrial) {
      console.log('⚠️ Pro Trial activation already in progress, ignoring click');
      return;
    }
    
    this.isActivatingTrial = true;
    
    // Reset flag after 5 seconds even if something goes wrong
    setTimeout(() => {
      this.isActivatingTrial = false;
    }, 5000);
    
    this.activateProTrial();
  }

  async activateProTrial() {
    try {
      this.showNotification("🚀 Activating Pro Trial...", "info");
      
      // Generate cards for trial activation
      const cards = await this.generateCardsForTrial();
      if (!cards || cards.length === 0) {
        this.showNotification("❌ Failed to generate cards", "error");
        this.isActivatingTrial = false;
        return;
      }
      
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!currentTab.url.includes('cursor.com')) {
        // Create new tab with trial page first
        const newTab = await chrome.tabs.create({ url: 'https://cursor.com/trial' });
        
        // Wait for page to load and try to activate
        setTimeout(async () => {
          this.tryActivateWithCards(newTab.id, cards);
        }, 3000);
        
      } else if (currentTab.url.includes('checkout.stripe.com')) {
        // We're already on Stripe checkout - start activation directly
        this.showNotification(`🎯 Starting activation with ${cards.length} cards...`, "info");
        
        chrome.tabs.sendMessage(currentTab.id, {
          type: "startProTrialActivation",
          cards: cards
        }, (response) => {
          if (response && response.success) {
            this.showNotification("✅ Pro Trial activation started!", "success");
          } else {
            this.showNotification("❌ Failed to start activation", "error");
            this.isActivatingTrial = false;
          }
        });
        
      } else {
        // We're on cursor.com, try to navigate to trial/checkout
        this.tryActivateOnCurrentTab(currentTab, cards);
      }
      
    } catch (error) {
      console.error("Error activating Pro Trial:", error);
      this.showNotification("❌ Error activating Pro Trial", "error");
      this.isActivatingTrial = false;
    }
  }

  // Generate cards specifically for trial activation
  async generateCardsForTrial() {
    try {
      const binInput = document.getElementById("binInput");
      const cardQuantity = document.getElementById("cardQuantity");
      
      const bin = binInput ? binInput.value.trim() || "552461" : "552461";
      const quantity = cardQuantity ? parseInt(cardQuantity.value) || 5 : 5;
      
      const response = await chrome.runtime.sendMessage({
        type: "generateCards",
        bin: bin,
        quantity: quantity
      });
      
      if (response && response.success) {
        console.log(`Generated ${response.data.cards.length} cards for trial activation`);
        return response.data.cards;
      }
      
      return null;
    } catch (error) {
      console.error("Error generating cards for trial:", error);
      return null;
    }
  }
  
  // Helper method to try activation on current tab with cards
  async tryActivateOnCurrentTab(tab, cards) {
    console.log('Trying to activate on current tab:', tab.url);
    
    chrome.tabs.sendMessage(tab.id, {
      type: "activateProTrial"
    }, async (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready, reloading tab...');
        await chrome.tabs.reload(tab.id);
        setTimeout(() => this.tryActivateOnCurrentTab(tab, cards), 3000);
        return;
      }
      
      if (response && response.success) {
        this.showNotification("✅ Pro Trial button clicked, waiting for redirect...", "success");
        
        // Wait for redirect to Stripe and then start activation
        setTimeout(() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab && activeTab.url.includes('checkout.stripe.com')) {
              this.showNotification(`🎯 Redirected to Stripe! Starting activation with ${cards.length} cards...`, "info");
              
              this.tryActivateWithCards(activeTab.id, cards);
            }
          });
        }, 5000);
        
      } else {
        // If current page doesn't work, try different pages
        this.tryDifferentPages(tab, cards);
      }
    });
  }
  
  // Try different Cursor pages to find the trial button
  async tryDifferentPages(tab, cards) {
    const currentUrl = tab.url;
    
    if (currentUrl.includes('/trial')) {
      // Already on trial page, fallback to dashboard
      chrome.tabs.update(tab.id, { url: 'https://cursor.com/dashboard' });
      this.showNotification("🔄 Trying dashboard page...", "info");
      
      setTimeout(() => {
        this.tryActivateWithCards(tab.id, cards);
      }, 3000);
      
    } else if (currentUrl.includes('/dashboard')) {
      // Already on dashboard, try trial page
      chrome.tabs.update(tab.id, { url: 'https://cursor.com/trial' });
      this.showNotification("🔄 Trying trial page...", "info");
      
      setTimeout(() => {
        this.tryActivateWithCards(tab.id, cards);
      }, 3000);
      
    } else {
      // Not on trial or dashboard, go to trial first
      chrome.tabs.update(tab.id, { url: 'https://cursor.com/trial' });
      this.showNotification("🔄 Navigating to trial page...", "info");
      
      setTimeout(() => {
        this.tryActivateWithCards(tab.id, cards);
      }, 3000);
    }
  }
  
  // Try to activate with generated cards
  async tryActivateWithCards(tabId, cards) {
    chrome.tabs.sendMessage(tabId, {
      type: "activateProTrial"
    }, (response) => {
      if (response && response.success) {
        this.showNotification("🎯 Found trial button! Waiting for Stripe redirect...", "info");
        
        // Wait for redirect and start card activation
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            type: "startProTrialActivation",
            cards: cards
          }, (response2) => {
            if (response2 && response2.success) {
              this.showNotification(`✅ Pro Trial activation started with ${cards.length} cards!`, "success");
            } else {
              this.showNotification("⚠️ Activation started, monitor console for progress", "warning", 5000);
            }
          });
        }, 3000);
      } else {
        this.showNotification("⚠️ Could not find trial button. Try manually navigating to checkout.", "warning", 5000);
      }
    });
  }

  // Generate Cards
  async generateCards() {
    try {
      const binInput = document.getElementById("binInput").value.trim();
      const quantity = parseInt(document.getElementById("cardQuantity").value) || 10;
      
      // Save BIN to history if it's provided and valid
      if (binInput && binInput.length >= 6) {
        this.addBinToHistory(binInput);
      }
      
      this.showNotification("🎲 Generating cards...", "info");
      
      const response = await chrome.runtime.sendMessage({
        type: "generateCards",
        bin: binInput,
        quantity: quantity
      });
      
      if (response && response.success) {
        document.getElementById("cardOutput").value = response.data.formatted;
        const binText = binInput ? `with BIN ${binInput}` : 'randomly';
        this.showNotification(`✅ Generated ${quantity} cards ${binText}`, "success");
      } else {
        this.showNotification("❌ Error generating cards", "error");
      }
      
    } catch (error) {
      console.error("Error generating cards:", error);
      this.showNotification("❌ Error generating cards", "error");
    }
  }

  // Test Generator
  async testGenerator() {
    try {
      this.showNotification("🧪 Testing card generator...", "info");
      
      const response = await chrome.runtime.sendMessage({
        type: "generateCards",
        bin: "552461",
        quantity: 1
      });
      
      if (response && response.success) {
        const testCard = response.data.cards[0];
        const testOutput = `Test Card: ${testCard.number} | ${testCard.month}/${testCard.year} | ${testCard.cvv}`;
        document.getElementById("cardOutput").value = testOutput;
        this.showNotification("✅ Test card generated successfully", "success");
      }
      
    } catch (error) {
      console.error("Error testing generator:", error);
      this.showNotification("❌ Error testing generator", "error");
    }
  }

  // Generate Address
  async generateAddress() {
    try {
      const country = document.getElementById("countrySelect").value || "US";
      
      this.showNotification("🏠 Generating address...", "info");
      
      const response = await chrome.runtime.sendMessage({
        type: "generateAddress",
        country: country
      });
      
      if (response && response.success) {
        const personalData = `Address:\n${response.data.formatted}\n\nName:\n${response.data.name}`;
        document.getElementById("personalOutput").value = personalData;
        this.showNotification(`✅ Generated address for ${country}`, "success");
      } else {
        this.showNotification("❌ Error generating address", "error");
      }
      
    } catch (error) {
      console.error("Error generating address:", error);
      this.showNotification("❌ Error generating address", "error");
    }
  }

  // Test Address Generator
  async testAddress() {
    try {
      this.showNotification("🧪 Testing address generator...", "info");
      
      const response = await chrome.runtime.sendMessage({
        type: "generateAddress",
        country: "US"
      });
      
      if (response && response.success) {
        const testOutput = `Test Address:\n${response.data.formatted}\n\nTest Name: ${response.data.name}`;
        const personalData = `Address:\n${response.data.formatted}\n\nName:\n${response.data.name}`;
        document.getElementById("personalOutput").value = personalData;
        this.showNotification("✅ Test address generated successfully", "success");
      }
      
    } catch (error) {
      console.error("Error testing address generator:", error);
      this.showNotification("❌ Error testing address generator", "error");
    }
  }

  // Delete Free Account
  async deleteFreeAccount() {
    const freeAccounts = this.accounts.filter(acc => acc.status === 'free');
    
    if (freeAccounts.length === 0) {
      this.showNotification("No free accounts found", "warning");
      return;
    }

    const confirmed = confirm(`Delete ${freeAccounts.length} free account(s)?`);
    if (!confirmed) return;

    let deletedCount = 0;
    for (const account of freeAccounts) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "deleteAccount",
          account: account.name
        });
        
        if (response.success) {
          deletedCount++;
        }
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }

    await this.loadAccounts();
    this.showNotification(`✅ Deleted ${deletedCount} free account(s)`, "success");
  }

  // Delete Pro Trial Account
  async deleteProTrialAccount() {
    const proTrialAccounts = this.accounts.filter(acc => 
      acc.status === 'pro trial' || acc.status === 'pro_trial'
    );
    
    if (proTrialAccounts.length === 0) {
      this.showNotification("No Pro Trial accounts found", "warning");
      return;
    }

    const confirmed = confirm(`Delete ${proTrialAccounts.length} Pro Trial account(s)?`);
    if (!confirmed) return;

    let deletedCount = 0;
    for (const account of proTrialAccounts) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "deleteAccount",
          account: account.name
        });
        
        if (response.success) {
          deletedCount++;
        }
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }

    await this.loadAccounts();
    this.showNotification(`✅ Deleted ${deletedCount} Pro Trial account(s)`, "success");
  }

  // Consolidate Duplicates
  async consolidateDuplicates() {
    try {
      this.showNotification("🔧 Checking for duplicate accounts...", "info");
      
      const response = await chrome.runtime.sendMessage({
        type: "consolidateDuplicates"
      });
      
      if (response && response.success) {
        await this.loadAccounts();
        this.showNotification(`✅ Fixed ${response.duplicatesFound || 0} duplicate accounts`, "success");
      } else {
        this.showNotification("❌ Error fixing duplicates", "error");
      }
    } catch (error) {
      console.error("Error consolidating duplicates:", error);
      this.showNotification("❌ Error fixing duplicates", "error");
    }
  }

  // Cleanup Account Info
  async cleanupAccountInfo() {
    try {
      this.showNotification("🧹 Cleaning up account info...", "info");
      
      const response = await chrome.runtime.sendMessage({
        type: "cleanupAccountInfo"
      });
      
      if (response && response.success) {
        await this.loadAccounts();
        this.showNotification(`✅ Cleaned up ${response.cleanedCount || 0} account(s)`, "success");
      } else {
        this.showNotification("❌ Error cleaning up account info", "error");
      }
    } catch (error) {
      console.error("Error cleaning account info:", error);
      this.showNotification("❌ Error cleaning up account info", "error");
    }
  }

  // Clear All Data
  async clearAllData() {
    const confirmed = confirm("Are you sure you want to delete ALL accounts? This cannot be undone!");
    if (!confirmed) return;

    const doubleConfirm = confirm("This will permanently delete all account data. Are you absolutely sure?");
    if (!doubleConfirm) return;

    try {
      this.showNotification("🗑️ Clearing all data...", "info");
      
      const response = await chrome.runtime.sendMessage({
        type: "clearAllData"
      });
      
      if (response && response.success) {
        await this.loadAccounts();
        this.showNotification("✅ All data cleared successfully", "success");
      } else {
        this.showNotification("❌ Error clearing data", "error");
      }
    } catch (error) {
      console.error("Error clearing all data:", error);
      this.showNotification("❌ Error clearing data", "error");
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Load dark mode preference
  chrome.storage.local.get(["darkMode"], (result) => {
    if (result.darkMode) {
      document.body.classList.add("dark-mode");
      // Set sun icon for dark mode
      document.getElementById("darkModeToggle").innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"/>
        </svg>
      `;
    }
  });

  // Initialize sidebar manager
  new CursorAccountSidebar();
});
