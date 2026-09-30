/**
 * OmniAssist AI - Background Service Worker (Manifest V3)
 * Universal multi-provider AI storage & background coordinator for Gemini, ChatGPT, Claude, Perplexity, DeepSeek, Poe & Web.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["chatRecall", "smartAssistSettings"], (result) => {
    if (!result.chatRecall) {
      chrome.storage.local.set({ chatRecall: [] });
    }
    if (!result.smartAssistSettings) {
      chrome.storage.local.set({
        smartAssistSettings: {
          autoCapture: false,
          highlightColor: "#fef08a",
          theme: "dark"
        }
      });
    }
  });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "omniassist_save_selection",
      title: "📌 Save to OmniAssist Memory",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "omniassist_search_selection",
      title: "🔍 Search this text with OmniAssist",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "omniassist_inject_last_memory",
      title: "⚡ Inject Last Memory into AI Input",
      contexts: ["editable", "page"]
    });
  });
});

function detectProviderFromUrl(url) {
  if (!url) return "Web";
  const u = url.toLowerCase();
  if (u.includes("gemini.google.com")) return "Gemini";
  if (u.includes("chatgpt.com") || u.includes("chat.openai.com")) return "ChatGPT";
  if (u.includes("claude.ai")) return "Claude";
  if (u.includes("perplexity.ai")) return "Perplexity";
  if (u.includes("deepseek.com")) return "DeepSeek";
  if (u.includes("poe.com")) return "Poe";
  if (u.includes("mistral.ai")) return "Mistral";
  if (u.includes("huggingface.co")) return "HuggingChat";
  return "Web Page";
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === "omniassist_save_selection" && info.selectionText) {
    const selectedText = info.selectionText.trim();
    const provider = detectProviderFromUrl(tab.url);
    saveMessageToStorage({
      id: Date.now().toString(),
      title: selectedText.substring(0, 45) + (selectedText.length > 45 ? "..." : ""),
      text: selectedText,
      source: tab.url || "Web Page",
      provider: provider,
      time: new Date().toLocaleString(),
      tags: ["quick-save", provider.toLowerCase()],
      isFavorite: false
    });
  } else if (info.menuItemId === "omniassist_search_selection" && info.selectionText) {
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "HIGHLIGHT_SEARCH",
        term: info.selectionText
      },
      () => {
        if (chrome.runtime.lastError) {
          // Suppress error if active page has no content script
        }
      }
    );
  } else if (info.menuItemId === "omniassist_inject_last_memory") {
    chrome.storage.local.get(["chatRecall"], (result) => {
      const list = result.chatRecall || [];
      if (list.length > 0) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "INJECT_CONTEXT",
            text: list[0].text,
            title: list[0].title
          },
          () => {
            if (chrome.runtime.lastError) {
              // Ignore error
            }
          }
        );
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SAVE_MESSAGE") {
    saveMessageToStorage(request.payload, sendResponse);
    return true;
  }

  if (request.action === "GET_ALL_MESSAGES") {
    chrome.storage.local.get(["chatRecall"], (result) => {
      sendResponse({ status: "success", data: result.chatRecall || [] });
    });
    return true;
  }

  if (request.action === "CLEAR_ALL_MESSAGES") {
    chrome.storage.local.set({ chatRecall: [] }, () => {
      sendResponse({ status: "success" });
    });
    return true;
  }
});

function saveMessageToStorage(item, callback) {
  chrome.storage.local.get(["chatRecall"], (result) => {
    const messages = result.chatRecall || [];
    const exists = messages.some((m) => m.text === item.text);

    if (!exists) {
      if (!item.provider) {
        item.provider = detectProviderFromUrl(item.source);
      }
      messages.unshift(item);
      chrome.storage.local.set({ chatRecall: messages }, () => {
        if (callback) callback({ status: "success", message: "Saved to OmniAssist memory!" });
      });
    } else if (callback) {
      callback({ status: "duplicate", message: "Message already exists in memory." });
    }
  });
}
