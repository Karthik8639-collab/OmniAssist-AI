/**
 * OmniAssist AI - Content Script
 * Universal In-Page Engine for Gemini, ChatGPT, Claude, Perplexity, DeepSeek, Poe, and Any Web Page.
 */

(function () {
  if (window.__omniAssistInjected) return;
  window.__omniAssistInjected = true;

  let currentSearchMatches = [];
  let currentMatchIndex = -1;
  let observerDebounceTimer = null;
  let providerInfo = detectCurrentProvider();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOmniAssist);
  } else {
    initOmniAssist();
  }

  function initOmniAssist() {
    createFloatingWidget();
    attachMessageListeners();
    observeChatDOM();
  }

  function detectCurrentProvider() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes("gemini.google.com")) return { name: "Gemini", icon: "✨", badgeClass: "badge-gemini" };
    if (host.includes("chatgpt.com") || host.includes("chat.openai.com")) return { name: "ChatGPT", icon: "🤖", badgeClass: "badge-chatgpt" };
    if (host.includes("claude.ai")) return { name: "Claude", icon: "🟧", badgeClass: "badge-claude" };
    if (host.includes("perplexity.ai")) return { name: "Perplexity", icon: "🔍", badgeClass: "badge-perplexity" };
    if (host.includes("deepseek.com")) return { name: "DeepSeek", icon: "🐋", badgeClass: "badge-deepseek" };
    if (host.includes("poe.com")) return { name: "Poe", icon: "⚡", badgeClass: "badge-poe" };
    if (host.includes("mistral.ai")) return { name: "Mistral", icon: "🌀", badgeClass: "badge-mistral" };
    return { name: "Web Page", icon: "🌐", badgeClass: "badge-web" };
  }

  function getPlatformSelectors() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes("gemini.google.com")) {
      return "user-query, message-content, .query-text, .response-text, model-response, conversation-container, .message-content";
    }
    if (host.includes("chatgpt.com") || host.includes("chat.openai.com")) {
      return "article, [data-message-author-role], .user-message, .agent-turn";
    }
    if (host.includes("claude.ai")) {
      return ".font-user-message, .font-claude-message, [data-is-streaming], div[class*='content-']";
    }
    if (host.includes("perplexity.ai")) {
      return ".query-text, .prose, [data-testimonial]";
    }
    if (host.includes("deepseek.com")) {
      return ".kim-chat-message, .user-message, .assistant-message";
    }
    if (host.includes("poe.com")) {
      return "[class*='Message_botMessageBubble'], [class*='Message_humanMessageBubble']";
    }
    return "article, main, p, [role='main'], [data-message], .message";
  }

  function createFloatingWidget() {
    if (document.getElementById("smartassist-widget")) return;

    const widget = document.createElement("div");
    widget.id = "smartassist-widget";
    widget.className = "smartassist-panel";
    widget.innerHTML = `
      <div class="smartassist-header" id="smartassist-header">
        <div class="smartassist-title">
          <span class="smartassist-icon">⚡</span> OmniAssist
          <span class="provider-badge ${providerInfo.badgeClass}">${providerInfo.icon} ${providerInfo.name}</span>
        </div>
        <button id="smartassist-toggle-btn" title="Minimize/Expand">—</button>
      </div>
      <div class="smartassist-body" id="smartassist-body">
        <div class="smartassist-search-box">
          <input type="text" id="smartassist-input" placeholder="Search in ${providerInfo.name}..." />
          <button id="smartassist-search-go" title="Search">🔍</button>
        </div>
        <div class="smartassist-nav-row" id="smartassist-nav-row" style="display:none;">
          <span id="smartassist-counter">0 / 0</span>
          <div class="smartassist-nav-btns">
            <button id="smartassist-prev" title="Previous match">▲</button>
            <button id="smartassist-next" title="Next match">▼</button>
            <button id="smartassist-clear-search" title="Clear highlights">✕</button>
          </div>
        </div>
        <div class="smartassist-action-btns">
          <button id="smartassist-save-chat-btn" class="smartassist-btn">📌 Bookmark Turn</button>
          <button id="smartassist-summarize-btn" class="smartassist-btn secondary">⚡ Summarize Chat</button>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    makeDraggable(widget, document.getElementById("smartassist-header"));

    document.getElementById("smartassist-toggle-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const body = document.getElementById("smartassist-body");
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    const input = document.getElementById("smartassist-input");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") performInPageSearch(input.value);
    });

    document.getElementById("smartassist-search-go").addEventListener("click", () => {
      performInPageSearch(input.value);
    });

    document.getElementById("smartassist-prev").addEventListener("click", () => navigateMatch(-1));
    document.getElementById("smartassist-next").addEventListener("click", () => navigateMatch(1));
    document.getElementById("smartassist-clear-search").addEventListener("click", clearSearchHighlights);

    document.getElementById("smartassist-save-chat-btn").addEventListener("click", saveCurrentChatTurn);
    document.getElementById("smartassist-summarize-btn").addEventListener("click", summarizeCurrentChat);
  }

  function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.style.cursor = "move";
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (e.target.tagName === "BUTTON") return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
      element.style.bottom = "auto";
      element.style.right = "auto";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  function attachMessageListeners() {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
          if (request.action === "HIGHLIGHT_SEARCH") {
            const input = document.getElementById("smartassist-input");
            if (input) input.value = request.term;
            performInPageSearch(request.term);
            sendResponse({ status: "success" });
          } else if (request.action === "EXTRACT_CURRENT_CHAT") {
            const turns = extractChatTurns();
            sendResponse({ status: "success", data: turns, provider: providerInfo.name });
          }
        } catch (err) {
          sendResponse({ status: "error", message: err.message });
        }
        return true;
      });
    }
  }

  function performInPageSearch(term) {
    clearSearchHighlights();
    if (!term || !term.trim()) return;

    const query = term.trim().toLowerCase();
    const selectorStr = getPlatformSelectors();
    const elements = document.querySelectorAll(selectorStr);
    const scope = elements.length > 0 ? Array.from(elements) : [document.body];

    const matchingNodes = [];

    scope.forEach((container) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement.closest("#smartassist-widget, script, style")) return NodeFilter.FILTER_REJECT;
          return node.nodeValue.toLowerCase().includes(query) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      });

      let textNode;
      while ((textNode = walker.nextNode())) {
        matchingNodes.push(textNode);
      }
    });

    const highlights = [];

    matchingNodes.forEach((textNode) => {
      const parent = textNode.parentElement;
      if (!parent) return;

      const text = textNode.nodeValue;
      const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        const before = text.substring(lastIdx, match.index);

        if (before) frag.appendChild(document.createTextNode(before));

        const mark = document.createElement("mark");
        mark.className = "smartassist-highlight";
        mark.textContent = matchedText;
        frag.appendChild(mark);
        highlights.push(mark);

        lastIdx = regex.lastIndex;
      }

      const remaining = text.substring(lastIdx);
      if (remaining) frag.appendChild(document.createTextNode(remaining));

      parent.replaceChild(frag, textNode);
    });

    currentSearchMatches = highlights;
    const navRow = document.getElementById("smartassist-nav-row");
    const counter = document.getElementById("smartassist-counter");

    if (highlights.length > 0) {
      navRow.style.display = "flex";
      currentMatchIndex = 0;
      updateMatchHighlight();
    } else {
      navRow.style.display = "flex";
      counter.textContent = "0 matches found";
    }
  }

  function navigateMatch(direction) {
    if (currentSearchMatches.length === 0) return;
    currentMatchIndex = (currentMatchIndex + direction + currentSearchMatches.length) % currentSearchMatches.length;
    updateMatchHighlight();
  }

  function updateMatchHighlight() {
    currentSearchMatches.forEach((mark, idx) => {
      if (idx === currentMatchIndex) {
        mark.classList.add("active");
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        mark.classList.remove("active");
      }
    });
    const counter = document.getElementById("smartassist-counter");
    if (counter) {
      counter.textContent = `${currentMatchIndex + 1} / ${currentSearchMatches.length}`;
    }
  }

  function clearSearchHighlights() {
    const highlights = document.querySelectorAll("mark.smartassist-highlight");
    highlights.forEach((mark) => {
      const parent = mark.parentElement;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
    currentSearchMatches = [];
    currentMatchIndex = -1;
    const navRow = document.getElementById("smartassist-nav-row");
    if (navRow) navRow.style.display = "none";
  }

  function extractChatTurns() {
    const turns = [];
    const selectorStr = getPlatformSelectors();
    const elements = document.querySelectorAll(selectorStr);

    elements.forEach((el) => {
      const text = el.innerText ? el.innerText.trim() : "";
      if (text && text.length > 2) {
        const role = inferRole(el, text);
        turns.push({ role, text, time: new Date().toLocaleTimeString() });
      }
    });

    return turns;
  }

  function inferRole(el, text) {
    const attrRole = el.getAttribute("data-message-author-role");
    if (attrRole) return attrRole;

    const tag = el.tagName.toLowerCase();
    if (tag === "user-query" || el.classList.contains("query-text") || el.classList.contains("font-user-message")) {
      return "user";
    }
    if (tag === "model-response" || el.classList.contains("response-text") || el.classList.contains("font-claude-message")) {
      return "assistant";
    }

    return text.length < 150 ? "user" : "assistant";
  }

  function saveCurrentChatTurn() {
    const turns = extractChatTurns();
    if (turns.length === 0) {
      showNotification("⚠️ No chat messages detected on page.");
      return;
    }

    const lastUser = turns.filter((t) => t.role === "user").pop();
    const lastAssistant = turns.filter((t) => t.role === "assistant").pop();

    const snippetText = `Prompt: ${lastUser ? lastUser.text : "N/A"}\n\nResponse: ${lastAssistant ? lastAssistant.text : turns[turns.length - 1].text}`;

    const payload = {
      id: Date.now().toString(),
      text: snippetText,
      title: document.title || `${providerInfo.name} Conversation`,
      provider: providerInfo.name,
      time: new Date().toLocaleString(),
      source: window.location.href,
      tags: [providerInfo.name.toLowerCase(), "ai-turn"],
      isFavorite: false
    };

    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: "SAVE_MESSAGE", payload }, (resp) => {
          if (chrome.runtime.lastError) {
            fallbackLocalSave(payload);
          } else {
            showNotification(resp?.message || `Saved to OmniAssist (${providerInfo.name})!`);
          }
        });
      } else {
        fallbackLocalSave(payload);
      }
    } catch (e) {
      fallbackLocalSave(payload);
    }
  }

  function fallbackLocalSave(payload) {
    let saved = JSON.parse(localStorage.getItem("chatRecall") || "[]");
    saved.unshift(payload);
    localStorage.setItem("chatRecall", JSON.stringify(saved));
    showNotification(`Saved to local browser storage (${providerInfo.name})!`);
  }

  function summarizeCurrentChat() {
    const turns = extractChatTurns();
    if (turns.length === 0) {
      showNotification("⚠️ No chat text available to summarize.");
      return;
    }

    const totalWords = turns.reduce((acc, t) => acc + t.text.split(/\s+/).length, 0);
    const keyPhrases = turns
      .map((t) => t.text.substring(0, 100) + "...")
      .slice(-3)
      .join("\n- ");

    const summaryText = `📊 ${providerInfo.name} Summary\n• Total Turns: ${turns.length}\n• Total Words: ~${totalWords}\n• Recent Topics:\n- ${keyPhrases}`;
    alert(summaryText);
  }

  function showNotification(msg) {
    const note = document.createElement("div");
    note.className = "smartassist-toast";
    note.textContent = msg;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 3000);
  }

  function observeChatDOM() {
    const observer = new MutationObserver(() => {
      if (observerDebounceTimer) return;
      observerDebounceTimer = setTimeout(() => {
        observerDebounceTimer = null;
        if (!document.getElementById("smartassist-widget")) {
          createFloatingWidget();
        }
      }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
})();
