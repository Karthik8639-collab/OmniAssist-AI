/**
 * OmniAssist AI - Quick Extension Popup Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  const openDashboardBtn = document.getElementById("btn-open-dashboard");
  const saveTurnBtn = document.getElementById("btn-save-turn");
  const searchInput = document.getElementById("popup-search-input");
  const searchBtn = document.getElementById("btn-popup-search");
  const countVal = document.getElementById("popup-count-val");

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["chatRecall"], (result) => {
      const items = result.chatRecall || [];
      if (countVal) countVal.textContent = items.length;
    });
  }

  openDashboardBtn.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL("Index.html") });
    } else {
      window.open("Index.html", "_blank");
    }
  });

  saveTurnBtn.addEventListener("click", () => {
    queryActiveTab((tab) => {
      if (!tab) return;
      chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_CURRENT_CHAT" }, (response) => {
        if (chrome.runtime.lastError) {
          alert("Unable to reach active page. Make sure you are on a supported AI website.");
        } else if (response && response.data) {
          alert(`Extracted ${response.data.length} chat turns from ${response.provider}!`);
        }
      });
    });
  });

  searchBtn.addEventListener("click", () => {
    triggerSearch();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") triggerSearch();
  });

  function triggerSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    queryActiveTab((tab) => {
      if (!tab) return;
      chrome.tabs.sendMessage(tab.id, { action: "HIGHLIGHT_SEARCH", term: query }, () => {
        window.close();
      });
    });
  }

  function queryActiveTab(callback) {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        callback(tabs[0]);
      });
    } else {
      callback(null);
    }
  }
});
