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
    this.init();
  }

  async init() {
    // Load accounts and active account
    await this.loadAccounts();

    // Setup event listeners
    this.setupEventListeners();
    
    // Setup message listener for bypass results
    this.setupMessageListener();

    // Update UI
    this.updateUI();
  }
  
  setupMessageListener() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'displayBypassJSON' && request.data) {
        console.log('Received bypass JSON results to display');
        this.displayBypassJSON(request.data);
        sendResponse({ success: true });
      }
      return false;
    });
  }

  setupEventListeners() {
    // Tab navigation
    document.getElementById("accountsTab").addEventListener("click", () => {
      this.switchTab("accounts");
    });

    document.getElementById("paymentsTab").addEventListener("click", () => {
      this.switchTab("payments");
    });

    // NEW: Bypass tab navigation
    const bypassTab = document.getElementById("bypassTab");
    if (bypassTab) {
      bypassTab.addEventListener("click", () => {
        this.switchTab("bypass");
      });
    }

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

    // Refresh status button
    document
      .getElementById("refreshStatusBtn")
      .addEventListener("click", () => {
        this.forceRefreshStatus();
      });

    // Consolidate duplicates button
    document
      .getElementById("consolidateDuplicatesBtn")
      .addEventListener("click", () => {
        this.consolidateDuplicates();
      });

    // Clear all data button
    document.getElementById("clearAllDataBtn").addEventListener("click", () => {
      this.clearAllData();
    });

    // Payment functionality
    document.getElementById("importCardsBtn").addEventListener("click", () => {
      this.showImportCardsModal();
    });

    document.getElementById("exportCardsBtn").addEventListener("click", () => {
      this.exportCards();
    });

    document
      .getElementById("findPaymentFieldsBtn")
      .addEventListener("click", () => {
        this.findPaymentFields();
      });

    document.getElementById("clearCardsBtn").addEventListener("click", () => {
      this.clearAllCards();
    });

    // NEW: Bypass Testing Event Listeners
    this.setupBypassEventListeners();
    
    // Initialize Bypass Settings Manager
    if (window.BypassSettingsManager) {
      this.bypassSettings = new window.BypassSettingsManager();
    }
    
    // Initialize Bypass Testing Handler
    if (window.BypassTestingHandler) {
      this.bypassHandler = new window.BypassTestingHandler();
    }

    // Card filter and selection functionality
    const cardFilterInput = document.getElementById("cardFilterInput");
    if (cardFilterInput) {
      cardFilterInput.addEventListener("input", (e) => {
        this.cardFilters.search = e.target.value.toLowerCase();
        this.filterCards();
      });
    }

    const cardTypeFilter = document.getElementById("cardTypeFilter");
    if (cardTypeFilter) {
      cardTypeFilter.addEventListener("change", (e) => {
        this.cardFilters.type = e.target.value.toLowerCase();
        this.filterCards();
      });
    }

    const selectAllCards = document.getElementById("selectAllCards");
    if (selectAllCards) {
      selectAllCards.addEventListener("change", (e) => {
        this.selectAllCards(e.target.checked);
      });
    }

    const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener("click", () => {
        this.deleteSelectedCards();
      });
    }

    const clearSelectionBtn = document.getElementById("clearSelectionBtn");
    if (clearSelectionBtn) {
      clearSelectionBtn.addEventListener("click", () => {
        this.clearSelection();
      });
    }

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

    // Refresh button
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.loadAccounts();
    });

    // Dark mode toggle
    document.getElementById("darkModeToggle").addEventListener("click", () => {
      this.toggleDarkMode();
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

      try {
        const infoResponse = await chrome.runtime.sendMessage({
          type: "getAccountInfo",
        });

        if (infoResponse && infoResponse.success && infoResponse.data) {
          const { username, email, status } = infoResponse.data;
          // Use email for account info, or fallback to username if no email
          const accountEmail = email || username;
          if (accountEmail) {
            await chrome.runtime.sendMessage({
              type: "updateAccountInfo",
              account: this.activeAccount,
              email: accountEmail,
              status: status || "free",
            });
            setTimeout(() => {
              this.infoUpdated = true;
              this.loadAccounts();
            }, 500);
          }
        }
      } catch (error) {
        console.log("Could not update account info:", error);
      }
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
      currentAccountEl.innerHTML = `
        <span class="account-icon">🟢</span>
        <div class="account-details">
          <span class="account-name">${this.escapeHtml(
            activeAccount.email
          )}</span>
          <span class="account-status">${activeAccount.status}</span>
        </div>
      `;
    } else {
      currentAccountEl.innerHTML = `
        <span class="account-icon">🔴</span>
        <div class="account-details">
          <span class="account-name">Not logged in</span>
          <span class="account-status"></span>
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
    document.getElementById("addAccountModal").style.display = "block";
    document.getElementById("cookiesInput").value = "";
    document.getElementById("accountNameInput").value = "";
    document.getElementById("cookiesInput").focus();

    // Clear any existing warnings
    const existingWarning = document.querySelector(".duplicate-warning");
    if (existingWarning) {
      existingWarning.remove();
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
        this.showNotification(`Switching to ${accountName}...`, "success");
        // Let background script handle redirect
        setTimeout(() => this.loadAccounts(), 1000);
      } else {
        this.showNotification("Switch failed", "error");
      }
    } catch (error) {
      console.error("Error switching account:", error);
      this.showNotification("Switch error", "error");
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

    // Update button
    document.getElementById("darkModeToggle").textContent = isDark
      ? "☀️"
      : "🌙";
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

  // Switch between tabs
  switchTab(tabName) {
    this.currentTab = tabName;

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
    } else if (tabName === "bypass") {
      this.initializeBypassTab();
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

  // ============= BYPASS TESTING FUNCTIONALITY =============
  
  setupBypassEventListeners() {
    // Detect URL button
    const detectUrlBtn = document.getElementById("bypassDetectUrl");
    if (detectUrlBtn) {
      detectUrlBtn.addEventListener("click", () => this.detectCurrentUrl());
    }

    // Select all techniques
    const selectAllBtn = document.getElementById("bypassSelectAll");
    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", () => this.selectAllTechniques());
    }

    // Technique checkboxes
    document.querySelectorAll('.technique-item input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener("change", () => this.updateTestCount());
    });

    // Start testing button
    const startBtn = document.getElementById("startBypassTest");
    if (startBtn) {
      startBtn.addEventListener("click", () => this.startBypassTesting());
    }

    // Stop testing button
    const stopBtn = document.getElementById("stopBypassTest");
    if (stopBtn) {
      stopBtn.addEventListener("click", () => this.stopBypassTesting());
    }

    // Export results button
    const exportBtn = document.getElementById("exportBypassResults");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportBypassResults());
    }
    
    // View results button
    const viewResultsBtn = document.getElementById("viewBypassResults");
    if (viewResultsBtn) {
      viewResultsBtn.addEventListener("click", () => this.viewBypassResults());
    }
    
    // Open console button
    const consoleBtn = document.getElementById("openBypassConsole");
    if (consoleBtn) {
      consoleBtn.addEventListener("click", () => this.openBypassConsole());
    }
  }

  initializeBypassTab() {
    // Reset UI when switching to bypass tab
    this.resetBypassUI();
    this.updateTestCount();
  }

  async detectCurrentUrl() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url) {
        // Check if it's a Cursor API endpoint
        if (tab.url.includes('cursor.com') || tab.url.includes('cursor.sh')) {
          document.getElementById("bypassTargetUrl").value = tab.url;
          this.showNotification("URL detected from current tab", "success");
        } else {
          // If not on cursor.com, try to use a default endpoint
          const defaultEndpoint = "https://cursor.com/api/dashboard/delete-account";
          document.getElementById("bypassTargetUrl").value = defaultEndpoint;
          this.showNotification("Using default Cursor API endpoint", "info");
          
          // Only try to send message if we're on a regular http/https page
          if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
            try {
              const response = await chrome.tabs.sendMessage(tab.id, {
                type: "detectApiEndpoints"
              });
              
              if (response && response.endpoints && response.endpoints.length > 0) {
                document.getElementById("bypassTargetUrl").value = response.endpoints[0];
                this.showNotification(`Found ${response.endpoints.length} API endpoints`, "success");
              }
            } catch (msgError) {
              // Ignore message error, use default endpoint
              console.log("Could not connect to tab, using default endpoint");
            }
          }
        }
      } else {
        // Use default endpoint if no tab available
        const defaultEndpoint = "https://cursor.com/api/dashboard/delete-account";
        document.getElementById("bypassTargetUrl").value = defaultEndpoint;
        this.showNotification("Using default Cursor API endpoint", "info");
      }
    } catch (error) {
      console.error("Error detecting URL:", error);
      // Use default endpoint on error
      const defaultEndpoint = "https://cursor.com/api/dashboard/delete-account";
      document.getElementById("bypassTargetUrl").value = defaultEndpoint;
      this.showNotification("Using default Cursor API endpoint", "info");
    }
  }

  selectAllTechniques() {
    const checkboxes = document.querySelectorAll('.technique-item input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = !allChecked;
    });
    
    this.updateTestCount();
  }

  updateTestCount() {
    const checkboxes = document.querySelectorAll('.technique-item input[type="checkbox"]:checked');
    const techniques = Array.from(checkboxes).map(cb => cb.dataset.technique);
    
    // Calculate total tests based on selected techniques
    const testCounts = {
      parameter: 15,
      header: 15,
      method: 20,
      content: 9,
      auth: 6,
      storage: 20,
      frontend: 5,
      race: 10,
      encoding: 9,
      endpoint: 7
    };
    
    let totalTests = 0;
    techniques.forEach(tech => {
      totalTests += testCounts[tech] || 0;
    });
    
    const totalTestsEl = document.getElementById("bypassTotalTests");
    if (totalTestsEl) {
      totalTestsEl.textContent = `${totalTests} tests selected`;
    }
  }

  async startBypassTesting() {
    const targetUrl = document.getElementById("bypassTargetUrl").value.trim();
    
    if (!targetUrl) {
      this.showNotification("Please enter a target URL", "warning");
      return;
    }
    
    // Get selected techniques
    const checkboxes = document.querySelectorAll('.technique-item input[type="checkbox"]:checked');
    const techniques = Array.from(checkboxes).map(cb => cb.dataset.technique);
    
    if (techniques.length === 0) {
      this.showNotification("Please select at least one technique", "warning");
      return;
    }
    
    // Update UI
    document.getElementById("startBypassTest").disabled = true;
    document.getElementById("stopBypassTest").disabled = false;
    document.getElementById("bypassProgressSection").style.display = "block";
    document.getElementById("bypassResultsSection").style.display = "none";
    
    // Get settings from bypass settings manager
    const settings = this.bypassSettings ? this.bypassSettings.getSettings() : {};
    
    // Use the bypass handler to start testing
    if (this.bypassHandler) {
      await this.bypassHandler.startTest(targetUrl, techniques, settings);
    } else {
      console.error("Bypass handler not initialized");
      this.showNotification("Failed to start bypass testing", "error");
      this.resetBypassUI();
    }
  }

  async monitorBypassProgress() {
    if (!this.bypassTestRunning) return;
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: "getBypassProgress"
      });
      
      if (response.success) {
        const { progress, total, current, results } = response.data;
        
        // Update progress bar
        const progressPercent = (progress / total) * 100;
        document.getElementById("bypassProgressFill").style.width = `${progressPercent}%`;
        document.getElementById("bypassProgressText").textContent = 
          `Testing ${current || "..."}... (${progress}/${total})`;
        
        // Store results
        if (results) {
          this.bypassTestResults = results;
        }
        
        // Check if completed
        if (progress >= total) {
          this.completeBypassTesting();
        } else {
          // Continue monitoring
          setTimeout(() => this.monitorBypassProgress(), 500);
        }
      }
    } catch (error) {
      console.error("Error monitoring bypass progress:", error);
    }
  }

  completeBypassTesting() {
    this.bypassTestRunning = false;
    
    // Update UI
    document.getElementById("startBypassTest").disabled = false;
    document.getElementById("stopBypassTest").disabled = true;
    document.getElementById("bypassProgressSection").style.display = "none";
    document.getElementById("bypassResultsSection").style.display = "block";
    
    // Display results
    this.displayBypassResults();
    
    this.showNotification("Bypass testing completed!", "success");
  }

  async stopBypassTesting() {
    if (this.bypassHandler) {
      this.bypassHandler.stopTest();
      this.showNotification("Bypass testing stopped", "info");
    }
    this.resetBypassUI();
  }

  displayBypassResults() {
    if (!this.bypassTestResults || this.bypassTestResults.length === 0) {
      document.getElementById("bypassResultDetails").innerHTML = 
        '<div class="empty-state">No results to display</div>';
      return;
    }
    
    // Count results by status
    let successCount = 0;
    let partialCount = 0;
    let failedCount = 0;
    
    this.bypassTestResults.forEach(result => {
      if (result.status === "success") successCount++;
      else if (result.status === "partial") partialCount++;
      else failedCount++;
    });
    
    // Update summary
    document.getElementById("bypassSuccessCount").textContent = successCount;
    document.getElementById("bypassPartialCount").textContent = partialCount;
    document.getElementById("bypassFailedCount").textContent = failedCount;
    
    // Display detailed results
    const detailsHtml = this.bypassTestResults
      .filter(result => result.status !== "failed") // Only show successful/partial
      .map(result => `
        <div class="result-item ${result.status}">
          <div class="result-header">
            <span class="result-technique">${result.technique}</span>
            <span class="result-status">${result.status}</span>
          </div>
          <div class="result-description">${result.description}</div>
          ${result.payload ? `<div class="result-payload"><code>${this.escapeHtml(result.payload)}</code></div>` : ''}
        </div>
      `).join('');
    
    document.getElementById("bypassResultDetails").innerHTML = detailsHtml || 
      '<div class="empty-state">No successful bypasses found</div>';
  }

  async exportBypassResults() {
    if (this.bypassHandler) {
      this.bypassHandler.exportResults();
    } else {
      this.showNotification("No bypass handler available", "error");
    }
  }

  resetBypassUI() {
    document.getElementById("startBypassTest").disabled = false;
    document.getElementById("stopBypassTest").disabled = true;
    document.getElementById("bypassProgressSection").style.display = "none";
    document.getElementById("bypassProgressFill").style.width = "0%";
    document.getElementById("bypassProgressText").textContent = "Initializing...";
  }
  
  // View bypass results
  viewBypassResults() {
    const resultsSection = document.getElementById("bypassResultsSection");
    
    if (resultsSection.style.display === "none") {
      // Show results if hidden
      if (this.bypassTestResults && this.bypassTestResults.length > 0) {
        resultsSection.style.display = "block";
        this.displayBypassResults();
        this.showNotification("Showing test results", "info");
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        this.showNotification("No test results available. Run a test first!", "warning");
      }
    } else {
      // Hide results if visible
      resultsSection.style.display = "none";
      this.showNotification("Results hidden", "info");
    }
  }
  
  // Open bypass console - Using advanced console service
  async openBypassConsole() {
    // Load console service if not loaded
    if (!window.consoleService) {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('services/console-service.js');
      document.head.appendChild(script);
      
      // Wait for script to load
      await new Promise(resolve => {
        script.onload = resolve;
        setTimeout(resolve, 1000); // Fallback timeout
      });
    }
    
    // Create or toggle console
    if (window.consoleService) {
      const console = window.consoleService.createConsoleUI();
      
      if (!console) {
        // Console was already open and got closed
        this.showNotification('Console closed', 'info');
      } else {
        // Console opened
        window.consoleService.captureLog('success', ['Advanced console initialized']);
        window.consoleService.captureLog('info', ['Type :help for available commands']);
        
        // Log current context
        window.consoleService.captureLog('system', [
          `Context: ${this.currentTab} tab`,
          `Active account: ${this.activeAccount?.name || 'None'}`,
          `URL: ${window.location.href}`
        ]);
      }
    } else {
      // Fallback to simple console if service fails to load
      this.openSimpleConsole();
    }
  }
  
  // Fallback simple console
  openSimpleConsole() {
    // Create or show console panel
    let consolePanel = document.getElementById("bypassConsole");
    
    if (!consolePanel) {
      // Create console panel if it doesn't exist
      consolePanel = document.createElement("div");
      consolePanel.id = "bypassConsole";
      consolePanel.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 250px;
        background: #0f172a;
        border-top: 2px solid #334155;
        display: flex;
        flex-direction: column;
        z-index: 9999;
      `;
      
      consolePanel.innerHTML = `
        <div style="padding: 10px; background: #1e293b; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: white; font-size: 14px;">🖥️ Bypass Console</h3>
          <button 
            onclick="document.getElementById('bypassConsole').remove()" 
            style="background: #ef4444; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
            Close
          </button>
        </div>
        <div id="bypassConsoleOutput" style="flex: 1; padding: 10px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 12px; color: #94a3b8;">
          <div style="color: #10b981;">[Console] Bypass testing console initialized...</div>
        </div>
        <div style="padding: 10px; background: #1e293b;">
          <input 
            id="bypassConsoleInput" 
            type="text" 
            placeholder="Type command... (help for commands)"
            style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px;"
            onkeypress="if(event.key === 'Enter') { window.cursorSidebar.executeBypassCommand(this.value); this.value = ''; }"
          />
        </div>
      `;
      
      document.body.appendChild(consolePanel);
      
      // Store reference for command execution
      window.cursorSidebar = this;
      
      this.logToConsole("Console opened. Type 'help' for available commands.", "info");
    } else {
      // Remove console if it exists
      consolePanel.remove();
    }
  }
  
  // Log to bypass console
  logToConsole(message, type = "log") {
    const output = document.getElementById("bypassConsoleOutput");
    if (output) {
      const colors = {
        log: "#94a3b8",
        info: "#3b82f6",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444"
      };
      
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = document.createElement("div");
      logEntry.style.color = colors[type] || colors.log;
      logEntry.innerHTML = `[${timestamp}] ${message}`;
      output.appendChild(logEntry);
      output.scrollTop = output.scrollHeight;
    }
  }
  
  // Execute bypass console command
  executeBypassCommand(command) {
    this.logToConsole(`> ${command}`, "info");
    
    const cmd = command.toLowerCase().trim();
    
    switch(cmd) {
      case 'help':
        this.logToConsole(`
Available commands:
  start - Start bypass testing
  stop - Stop bypass testing
  clear - Clear console
  results - Show results summary
  export - Export results to file
  techniques - List available techniques
  status - Show current status
`, "success");
        break;
        
      case 'start':
        this.startBypassTesting();
        break;
        
      case 'stop':
        this.stopBypassTesting();
        break;
        
      case 'clear':
        const output = document.getElementById("bypassConsoleOutput");
        if (output) output.innerHTML = '';
        this.logToConsole("Console cleared", "info");
        break;
        
      case 'results':
        if (this.bypassTestResults && this.bypassTestResults.length > 0) {
          const success = this.bypassTestResults.filter(r => r.status === "success").length;
          const partial = this.bypassTestResults.filter(r => r.status === "partial").length;
          const failed = this.bypassTestResults.filter(r => r.status === "failed").length;
          this.logToConsole(`Results: ${success} successful, ${partial} partial, ${failed} failed`, "success");
        } else {
          this.logToConsole("No results available", "warning");
        }
        break;
        
      case 'export':
        this.exportBypassResults();
        break;
        
      case 'techniques':
        this.logToConsole(`
Available techniques:
  • Parameter Injection (15 tests)
  • Header Manipulation (15 tests)
  • Method Override (20 tests)
  • Content-Type Bypass (9 tests)
  • Authorization Bypass (6 tests)
  • Storage Manipulation (20 tests)
  • Frontend Override (5 tests)
  • Race Condition (10 tests)
  • Encoding Bypass (9 tests)
  • Alternative Endpoints (7 tests)
`, "success");
        break;
        
      case 'status':
        const running = this.bypassTestRunning ? "Running" : "Idle";
        const progress = this.bypassTestProgress || 0;
        const total = this.bypassTestTotal || 0;
        this.logToConsole(`Status: ${running}, Progress: ${progress}/${total}`, "info");
        break;
        
      default:
        this.logToConsole(`Unknown command: ${command}. Type 'help' for available commands.`, "error");
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Handle bypass results JSON
  displayBypassJSON(jsonData) {
    // Create results display modal
    const modal = document.createElement('div');
    modal.id = 'bypassResultsModal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 10000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const successRate = jsonData.summary ? jsonData.summary.success_rate : '0%';
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; font-size: 18px;">🔍 Bypass Test Results</h3>
        <button id="closeResultsModal" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      
      <div style="padding: 20px; overflow-y: auto; flex: 1;">
        <div style="
          background: #f3f4f6;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        ">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">
                ${jsonData.summary?.success || 0}
              </div>
              <div style="font-size: 12px; color: #6b7280;">Success</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">
                ${jsonData.summary?.partial || 0}
              </div>
              <div style="font-size: 12px; color: #6b7280;">Partial</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #ef4444;">
                ${jsonData.summary?.failed || 0}
              </div>
              <div style="font-size: 12px; color: #6b7280;">Failed</div>
            </div>
          </div>
          <div style="
            text-align: center;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
          ">
            <span style="font-size: 14px; color: #6b7280;">Success Rate:</span>
            <span style="font-size: 18px; font-weight: bold; color: #4b5563; margin-left: 5px;">
              ${successRate}
            </span>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #374151;">JSON Data:</h4>
          <pre id="jsonResultsContent" style="
            background: #1e293b;
            color: #10b981;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            margin: 0;
          ">${this.escapeHtml(jsonString)}</pre>
        </div>
      </div>
      
      <div style="
        padding: 15px 20px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      ">
        <button id="copyJSONBtn" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          📋 Copy JSON
        </button>
        <button id="downloadJSONBtn" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          💾 Download JSON
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'bypassResultsBackdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;
    document.body.appendChild(backdrop);
    
    // Event listeners
    document.getElementById('closeResultsModal').onclick = () => {
      modal.remove();
      backdrop.remove();
    };
    
    backdrop.onclick = () => {
      modal.remove();
      backdrop.remove();
    };
    
    // Copy JSON button
    document.getElementById('copyJSONBtn').onclick = async () => {
      try {
        await navigator.clipboard.writeText(jsonString);
        const btn = document.getElementById('copyJSONBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
        this.showNotification('Failed to copy to clipboard', 'error');
      }
    };
    
    // Download JSON button
    document.getElementById('downloadJSONBtn').onclick = () => {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bypass_results_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      const btn = document.getElementById('downloadJSONBtn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ Downloaded!';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    };
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Load dark mode preference
  chrome.storage.local.get(["darkMode"], (result) => {
    if (result.darkMode) {
      document.body.classList.add("dark-mode");
      document.getElementById("darkModeToggle").textContent = "☀️";
    }
  });

  // Initialize sidebar manager
  new CursorAccountSidebar();
});
