// Background script for Cursor Account Manager extension

// Import services
importScripts("services/account.js");
importScripts("services/payment.js");
importScripts("services/account-deletion.js");

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Cursor Account Manager extension installed");

  try {
    // Enable side panel for all tabs (if supported)
    if (chrome.sidePanel) {
      console.log("Side Panel API available");
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true, // Always open sidebar on click
      });
    } else {
      console.log("Side Panel API not available - requires Chrome 114+");
    }

    // Check if there's an active session
    const cookies = await accountService.getCurrentCookies();
    console.log("Found cookies:", cookies.length);

    if (cookies.length > 0) {
      const username = await accountService.autoDetectAccount();
      console.log("Auto-detected username:", username);

      if (username) {
        await accountService.updateBadge(username);
      }
    }
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

// Sync accounts when cookies change
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  if (changeInfo.cookie.domain.includes("cursor.com")) {
    // If cookie was added and we don't have an active account, auto-detect
    if (!changeInfo.removed) {
      const activeAccount = await accountService.getActiveAccount();
      if (!activeAccount) {
        await accountService.autoDetectAccount();
      }
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      console.log("Received message:", request.type);
      switch (request.type) {
        case "ping":
          sendResponse({ success: true });
          break;

        case "getAccounts":
          const accounts = await accountService.getAll();
          sendResponse({ success: true, data: accounts });
          break;

        case "switchAccount":
          await accountService.switchTo(request.account);
          sendResponse({ success: true });
          break;

        case "removeAccount":
          await accountService.remove(
            request.account,
            request.deleteFile || false
          );
          sendResponse({ success: true });
          break;

        case "addCurrentAccount":
          const username = await accountService.autoDetectAccount();
          sendResponse({ success: true, data: username });
          break;

        case "getActiveAccount":
          const active = await accountService.getActiveAccount();
          sendResponse({ success: true, data: active });
          break;

        case "importAccount":
          await accountService.upsert(
            request.account.name,
            request.account.cookies
          );
          sendResponse({ success: true });
          break;

        case "checkSwitchSuccess":
          // Verify if the account switch was successful
          const currentActive = await accountService.getActiveAccount();
          const expectedAccount = request.expectedAccount;
          sendResponse({
            success: true,
            switchSuccessful: currentActive === expectedAccount,
            currentActive: currentActive,
          });
          break;

        case "scanDownloadsFolder":
          // Scan Downloads folder for account files
          const downloadFiles = await accountService.scanDownloadsForAccounts();
          sendResponse({ success: true, data: downloadFiles });
          break;

        case "importAccountJSON":
          const accountName = await accountService.importAccountFromJSON(
            request.jsonText,
            request.customName,
            request.overrideExisting || false
          );
          sendResponse({ success: true, data: accountName });
          break;

        case "exportAccount":
          await accountService.exportAccountToFile(request.account);
          sendResponse({ success: true });
          break;

        case "revealAccountFile":
          const revealResult = await accountService.revealAccountFile(
            request.account
          );
          if (typeof revealResult === "boolean") {
            // Legacy support
            sendResponse({ success: revealResult });
          } else {
            // New detailed response
            sendResponse(revealResult);
          }
          break;

        case "clearAllData":
          const cleared = await accountService.clearAllData();
          sendResponse({ success: cleared });
          break;

        case "getAllStoredData":
          const allData = await accountService.getAllStoredData();
          sendResponse({ success: true, data: allData });
          break;

        case "checkDuplicateAccount":
          const duplicate = await accountService.findDuplicateAccount(
            request.cookies
          );
          sendResponse({ success: true, duplicate: duplicate });
          break;

        case "consolidateDuplicates":
          const consolidationResult =
            await accountService.consolidateDuplicates();
          sendResponse(consolidationResult);
          break;

        case "updateAccountInfo":
          await accountService.saveAccountInfo(
            request.account,
            request.email,
            request.status
          );
          sendResponse({ success: true });
          break;

        case "getAccountInfo":
          // Extract info from current page
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          // Only process if we're on cursor.com/dashboard or settings
          if (
            tab &&
            tab.url &&
            (tab.url.includes("cursor.com/dashboard") ||
              tab.url.includes("cursor.com/settings"))
          ) {
            const result = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                // This runs in the page context
                const extractInfo = () => {
                  let email = null;
                  let status = "unknown";

                  // Find email
                  const emailEls = document.querySelectorAll(
                    'p.truncate.text-sm.font-medium, [class*="truncate"][class*="font-medium"]'
                  );
                  for (const el of emailEls) {
                    const text = el.textContent.trim();
                    if (text && text.includes("@")) {
                      email = text;
                      break;
                    }
                  }

                  // Find status - enhanced selectors for better detection
                  const statusSelectors = [
                    // New complex class selector for Pro Trial
                    'p[class*="flex-shrink-0"][class*="text-sm"][class*="text-brand-gray-300"]',
                    // Specific selector for div with title Pro Trial
                    'div[title="Pro Trial"] p',
                    'div[title*="Trial"] p',
                    'div[title*="Free"] p',
                    'div[title*="Pro"] p',
                    'div[title*="Business"] p',
                    // Direct title attribute selectors
                    'div[title="Pro Trial"]',
                    'div[title="Free Plan"]',
                    'div[title="Pro Plan"]',
                    'div[title="Business Plan"]',
                    // Original selectors
                    "p.flex-shrink-0.text-sm.text-brand-gray-300",
                    '[class*="text-brand-gray-300"]',
                    'div[title*="Plan"] p',
                    'div[title*="plan"] p',
                    "div.flex.min-w-0.items-center.gap-1 p",
                    // Specific class combination selectors
                    'div.flex.min-w-0.items-center.gap-1[title*="Trial"] p',
                    'div.flex.min-w-0.items-center.gap-1[title*="Free"] p',
                    'div.flex.min-w-0.items-center.gap-1[title*="Pro"] p',
                    // Additional selectors for various layouts
                    'p:contains("Trial")',
                    'p:contains("Free")',
                    'p:contains("Pro")',
                    'span[class*="text-brand-gray-300"]',
                    '[class*="text-sm"]:contains("Trial")',
                    '[class*="text-sm"]:contains("Free")',
                    '[class*="text-sm"]:contains("Pro")',
                  ];

                  for (const selector of statusSelectors) {
                    let statusEls;

                    // Handle :contains() pseudo-selector manually since it's not supported in all browsers
                    if (selector.includes(":contains(")) {
                      const baseSelector = selector.split(":contains(")[0];
                      const searchText = selector
                        .split(":contains(")[1]
                        .replace(")", "")
                        .replace(/"/g, "");
                      statusEls = Array.from(
                        document.querySelectorAll(baseSelector)
                      ).filter((el) =>
                        el.textContent
                          .toLowerCase()
                          .includes(searchText.toLowerCase())
                      );
                    } else {
                      statusEls = document.querySelectorAll(selector);
                    }

                    for (const el of statusEls) {
                      const text = el.textContent.trim().toLowerCase();
                      const title = el.getAttribute("title") || "";
                      const titleLower = title.toLowerCase();

                      if (text || title) {
                        console.log(
                          `Found status element with text: "${text}", title: "${title}"`
                        );

                        // Check title attribute first (more reliable)
                        if (
                          titleLower.includes("pro trial") ||
                          titleLower === "pro trial"
                        ) {
                          status = "pro trial";
                          break;
                        } else if (titleLower.includes("free")) {
                          status = "free";
                          break;
                        } else if (
                          titleLower.includes("pro plan") ||
                          titleLower === "pro plan"
                        ) {
                          status = "pro";
                          break;
                        } else if (titleLower.includes("business")) {
                          status = "business";
                          break;
                        }

                        // Then check text content
                        else if (text.includes("free")) {
                          status = "free";
                          break;
                        } else if (
                          text.includes("pro trial") ||
                          text.includes("trial")
                        ) {
                          status = "pro trial";
                          break;
                        } else if (text.includes("pro")) {
                          status = "pro";
                          break;
                        } else if (text.includes("business")) {
                          status = "business";
                          break;
                        }
                      }
                    }
                    if (status !== "unknown") break;
                  }

                  // Fallback: check title attributes and aria-labels
                  if (status === "unknown") {
                    const titleEls = document.querySelectorAll(
                      '[title*="Plan"], [title*="plan"], [title*="Trial"], [title*="trial"]'
                    );
                    for (const el of titleEls) {
                      const title = el.getAttribute("title").toLowerCase();
                      if (title.includes("free")) {
                        status = "free";
                        break;
                      } else if (
                        title.includes("pro trial") ||
                        title.includes("trial")
                      ) {
                        status = "pro trial";
                        break;
                      } else if (title.includes("pro")) {
                        status = "pro";
                        break;
                      } else if (title.includes("business")) {
                        status = "business";
                        break;
                      }
                    }
                  }

                  // Additional fallback: search all text containing status keywords
                  if (status === "unknown") {
                    const allTextElements =
                      document.querySelectorAll("p, span, div");
                    for (const el of allTextElements) {
                      const text = el.textContent.trim().toLowerCase();
                      if (
                        text === "pro trial" ||
                        text === "free plan" ||
                        text === "pro plan" ||
                        text === "business plan"
                      ) {
                        console.log(`Found status in fallback: "${text}"`);
                        if (text.includes("free")) {
                          status = "free";
                          break;
                        } else if (
                          text.includes("pro trial") ||
                          text === "pro trial"
                        ) {
                          status = "pro trial";
                          break;
                        } else if (text.includes("pro")) {
                          status = "pro";
                          break;
                        } else if (text.includes("business")) {
                          status = "business";
                          break;
                        }
                      }
                    }
                  }

                  return { email, status };
                };

                return extractInfo();
              },
            });

            if (result && result[0] && result[0].result) {
              sendResponse({ success: true, data: result[0].result });
            } else {
              sendResponse({ success: false, error: "Could not extract info" });
            }
          } else {
            sendResponse({ success: false, error: "Not on cursor.com" });
          }
          break;

        // Payment service handlers
        case "importPaymentCards":
          const importedCount = await paymentService.importCards(
            request.cardData,
            request.replace || false
          );
          sendResponse({ success: true, data: importedCount });
          break;

        case "getPaymentCards":
          const cards = await paymentService.getCards();
          sendResponse({ success: true, data: cards });
          break;

        case "removePaymentCard":
          await paymentService.removeCard(request.cardId);
          sendResponse({ success: true });
          break;

        case "clearPaymentCards":
          await paymentService.clearAllCards();
          sendResponse({ success: true });
          break;

        case "autoFillPayment":
          // Get card data first
          const cardData = await paymentService.getCard(request.cardId);
          if (!cardData) {
            sendResponse({ success: false, error: "Card not found" });
            break;
          }

          // Execute auto-fill in the current tab
          const [currentTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });

          if (!currentTab) {
            sendResponse({ success: false, error: "No active tab found" });
            break;
          }

          try {
            const result = await chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              func: (card) => {
                // Auto-fill payment fields with improved Stripe support
                const fillInput = (element, value) => {
                  if (!element || !value) return false;

                  // Focus the element first
                  element.focus();

                  // Clear existing value
                  element.value = "";

                  // Simulate typing for React/Stripe forms
                  for (let i = 0; i < value.length; i++) {
                    const char = value[i];

                    // KeyDown event
                    const keyDownEvent = new KeyboardEvent("keydown", {
                      key: char,
                      keyCode: char.charCodeAt(0),
                      which: char.charCodeAt(0),
                      bubbles: true,
                      cancelable: true,
                    });
                    element.dispatchEvent(keyDownEvent);

                    // Update value progressively
                    element.value = value.substring(0, i + 1);

                    // Input event after each character
                    const inputEvent = new Event("input", { bubbles: true });
                    element.dispatchEvent(inputEvent);

                    // KeyUp event
                    const keyUpEvent = new KeyboardEvent("keyup", {
                      key: char,
                      keyCode: char.charCodeAt(0),
                      which: char.charCodeAt(0),
                      bubbles: true,
                      cancelable: true,
                    });
                    element.dispatchEvent(keyUpEvent);
                  }

                  // Final events
                  const events = ["change", "blur"];
                  events.forEach((eventType) => {
                    const event = new Event(eventType, { bubbles: true });
                    element.dispatchEvent(event);
                  });

                  return true;
                };

                let filledCount = 0;

                // Stripe-specific selectors first, then generic
                const cardNumberSelectors = [
                  "#cardNumber",
                  'input[name="cardNumber"]',
                  'input[autocomplete="cc-number"]',
                  'input[aria-label*="Card number"]',
                  'input.CheckoutInput[autocomplete="cc-number"]',
                ];

                const expirySelectors = [
                  "#cardExpiry",
                  'input[name="cardExpiry"]',
                  'input[autocomplete="cc-exp"]',
                  'input[aria-label*="Expiration"]',
                  'input.CheckoutInput[autocomplete="cc-exp"]',
                ];

                const cvcSelectors = [
                  "#cardCvc",
                  'input[name="cardCvc"]',
                  'input[autocomplete="cc-csc"]',
                  'input[aria-label*="CVC"]',
                  'input.CheckoutInput[autocomplete="cc-csc"]',
                ];

                // Fill card number
                for (const selector of cardNumberSelectors) {
                  const element = document.querySelector(selector);
                  if (element && element.offsetParent !== null) {
                    if (fillInput(element, card.number)) filledCount++;
                    break;
                  }
                }

                // Fill expiry
                for (const selector of expirySelectors) {
                  const element = document.querySelector(selector);
                  if (element && element.offsetParent !== null) {
                    if (fillInput(element, card.expiry)) filledCount++;
                    break;
                  }
                }

                // Fill CVC
                for (const selector of cvcSelectors) {
                  const element = document.querySelector(selector);
                  if (element && element.offsetParent !== null) {
                    if (fillInput(element, card.cvc)) filledCount++;
                    break;
                  }
                }

                return { filled: filledCount, cardType: card.type };
              },
              args: [cardData],
            });

            if (result && result[0] && result[0].result.filled > 0) {
              sendResponse({
                success: true,
                data: {
                  filled: result[0].result.filled,
                  cardType: result[0].result.cardType,
                },
              });
            } else {
              sendResponse({
                success: false,
                error: "No payment fields found or filled",
              });
            }
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case "findPaymentFields":
          // Find payment fields in current tab
          const [activeTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });

          if (!activeTab) {
            sendResponse({ success: false, error: "No active tab found" });
            break;
          }

          try {
            const result = await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: () => {
                // Find payment form fields
                const fields = {
                  cardNumber: null,
                  expiry: null,
                  cvc: null,
                  name: null,
                };

                const cardNumberSelectors = [
                  'input[name*="card"]',
                  'input[name*="number"]',
                  'input[placeholder*="card"]',
                  'input[autocomplete="cc-number"]',
                  "#card-number",
                ];

                for (const selector of cardNumberSelectors) {
                  const element = document.querySelector(selector);
                  if (element && element.offsetParent !== null) {
                    fields.cardNumber = true;
                    break;
                  }
                }

                // Similar logic for other fields...
                const expirySelectors = [
                  'input[name*="expir"]',
                  'input[placeholder*="MM/YY"]',
                ];
                for (const selector of expirySelectors) {
                  const element = document.querySelector(selector);
                  if (element && element.offsetParent !== null) {
                    fields.expiry = true;
                    break;
                  }
                }

                const cvcSelectors = [
                  'input[name*="cvc"]',
                  'input[name*="cvv"]',
                ];
                for (const selector of cvcSelectors) {
                  const element = document.querySelector(selector);
                  if (element && element.offsetParent !== null) {
                    fields.cvc = true;
                    break;
                  }
                }

                return {
                  found: Object.values(fields).filter(Boolean).length,
                  fields: fields,
                };
              },
            });

            sendResponse({ success: true, data: result[0].result });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case "deleteFreeAccount":
          try {
            const result = await accountDeletionService.deleteFreeAccount();
            sendResponse(result);
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case "deleteProTrialAccount":
          try {
            const result = await accountDeletionService.deleteProTrialAccount();
            sendResponse(result);
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case "checkDeletionStatus":
          sendResponse({
            success: true,
            inProgress: accountDeletionService.isDeletionInProgress(),
          });
          break;

        case "cancelDeletion":
          accountDeletionService.cancelDeletion();
          sendResponse({ success: true, message: "Deletion cancelled" });
          break;

        default:
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep channel open for async response
});

// Update badge on startup
chrome.runtime.onStartup.addListener(async () => {
  const activeAccount = await accountService.getActiveAccount();
  if (activeAccount) {
    await accountService.updateBadge(activeAccount);
  }
});
