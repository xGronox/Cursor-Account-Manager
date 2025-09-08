// Cursor Account Manager - Sidebar Script

class CursorAccountSidebar {
  constructor() {
    this.accounts = [];
    this.activeAccount = null;
    this.infoUpdated = false;
    this.paymentCards = [];
    this.currentTab = "accounts";
    this.init();
  }

  async init() {
    // Load accounts and active account
    await this.loadAccounts();

    // Setup event listeners
    this.setupEventListeners();

    // Update UI
    this.updateUI();
  }

  setupEventListeners() {
    // Tab navigation
    document.getElementById("accountsTab").addEventListener("click", () => {
      this.switchTab("accounts");
    });

    document.getElementById("paymentsTab").addEventListener("click", () => {
      this.switchTab("payments");
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

    document
      .getElementById("findPaymentFieldsBtn")
      .addEventListener("click", () => {
        this.findPaymentFields();
      });

    document.getElementById("clearCardsBtn").addEventListener("click", () => {
      this.clearAllCards();
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

  async updateAccountInfo() {
    if (this.activeAccount) {
      // Check if this account already has proper email info
      const currentAccount = this.accounts.find(
        (acc) => acc.name === this.activeAccount
      );

      // Skip if we already have a proper email
      if (
        currentAccount &&
        currentAccount.email &&
        currentAccount.email !== this.activeAccount &&
        currentAccount.email.includes("@")
      ) {
        return;
      }

      try {
        const infoResponse = await chrome.runtime.sendMessage({
          type: "getAccountInfo",
        });

        if (infoResponse && infoResponse.success && infoResponse.data) {
          const { email, status } = infoResponse.data;
          if (email && email.includes("@")) {
            await chrome.runtime.sendMessage({
              type: "updateAccountInfo",
              account: this.activeAccount,
              email: email,
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

    if (this.accounts.length === 0) {
      listEl.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }

    listEl.style.display = "block";
    emptyEl.style.display = "none";
    listEl.innerHTML = "";

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
  }

  createAccountElement(account) {
    const template = document.getElementById("sidebarAccountTemplate");
    const element = template.content.cloneNode(true);
    const container = element.querySelector(".sidebar-account-item");

    // Set account data
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
    document.getElementById(`${tabName}Content`).style.display = "block";

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

    this.paymentCards.forEach((card) => {
      const cardEl = this.createCardElement(card);
      listEl.appendChild(cardEl);
    });
  }

  // Create card element
  createCardElement(card) {
    const template = document.getElementById("sidebarCardTemplate");
    const element = template.content.cloneNode(true);
    const container = element.querySelector(".card-item");

    // Set card data
    container.dataset.cardId = card.id;

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

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
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
