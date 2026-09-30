/**
 * OmniAssist AI - Universal Companion Engine (v4.0 Supermax)
 * Multi-provider local memory manager for Gemini, ChatGPT, Claude, Perplexity, DeepSeek, Poe, and custom entries.
 */

(function () {
  let memories = [];
  let currentFilter = "all";
  let activeSearchQuery = "";

  document.addEventListener("DOMContentLoaded", () => {
    initApp();
  });

  function initApp() {
    loadMemoriesFromStorage();
    attachEventListeners();
    attachGlobalKeyboardShortcuts();
  }

  function loadMemoriesFromStorage() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["chatRecall"], (result) => {
        memories = result.chatRecall || [];
        renderAll();
      });
    } else {
      const localData = localStorage.getItem("chatRecall");
      memories = localData ? JSON.parse(localData) : [];
      renderAll();
    }
  }

  function saveMemoriesToStorage() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ chatRecall: memories });
    }
    localStorage.setItem("chatRecall", JSON.stringify(memories));
    renderAll();
  }

  function attachEventListeners() {
    const searchBar = document.getElementById("searchBar");
    const clearBtn = document.getElementById("btn-clear-search");

    searchBar.addEventListener("input", (e) => {
      activeSearchQuery = e.target.value.toLowerCase();
      clearBtn.style.display = activeSearchQuery ? "inline-block" : "none";
      renderGrid();
    });

    clearBtn.addEventListener("click", () => {
      searchBar.value = "";
      activeSearchQuery = "";
      clearBtn.style.display = "none";
      renderGrid();
    });

    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-view");
        renderGrid();
      });
    });

    document.getElementById("btnClearAll").addEventListener("click", () => {
      if (confirm("Are you sure you want to delete all saved memories? This action cannot be undone.")) {
        memories = [];
        saveMemoriesToStorage();
      }
    });

    document.getElementById("btn-load-demo").addEventListener("click", () => {
      loadSampleDemoData();
    });

    const addModal = document.getElementById("modal-add");
    document.getElementById("btn-open-add-modal").addEventListener("click", () => {
      addModal.style.display = "flex";
      document.getElementById("input-title").focus();
    });

    document.getElementById("modal-add-close").addEventListener("click", () => {
      addModal.style.display = "none";
    });

    document.getElementById("btn-save-new-memory").addEventListener("click", () => {
      const title = document.getElementById("input-title").value.trim() || "Untitled Memory";
      const provider = document.getElementById("input-provider").value;
      const text = document.getElementById("input-text").value.trim();
      const tagsInput = document.getElementById("input-tags").value.trim();
      const tags = tagsInput ? tagsInput.split(",").map((t) => t.trim()) : [provider.toLowerCase()];

      if (!text) {
        alert("Please enter memory content!");
        return;
      }

      const newMsg = {
        id: Date.now().toString(),
        title,
        text,
        provider,
        time: new Date().toLocaleString(),
        source: "Manual Entry",
        tags,
        isFavorite: false
      };

      memories.unshift(newMsg);
      saveMemoriesToStorage();

      document.getElementById("input-title").value = "";
      document.getElementById("input-text").value = "";
      document.getElementById("input-tags").value = "";
      addModal.style.display = "none";
    });

    const viewModal = document.getElementById("modal-view");
    document.getElementById("modal-view-close").addEventListener("click", () => {
      viewModal.style.display = "none";
    });

    document.getElementById("btn-copy-view").addEventListener("click", () => {
      const text = document.getElementById("view-text-content").textContent;
      navigator.clipboard.writeText(text);
      alert("Copied text to clipboard!");
    });

    const exportBtn = document.getElementById("btn-export-dropdown");
    const exportMenu = document.getElementById("export-menu");
    exportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      exportMenu.style.display = exportMenu.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", () => {
      exportMenu.style.display = "none";
    });

    document.getElementById("export-json").addEventListener("click", () => exportJSON());
    document.getElementById("export-md").addEventListener("click", () => exportMarkdown());

    const importBtn = document.getElementById("btn-import-file");
    const fileInput = document.getElementById("file-input-json");
    importBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            const existingIds = new Set(memories.map((m) => m.id));
            const newItems = imported.filter((item) => !existingIds.has(item.id));
            memories = [...newItems, ...memories];
            saveMemoriesToStorage();
            alert(`Successfully imported ${newItems.length} new items!`);
          } else {
            alert("Invalid JSON format. Expected an array of memory objects.");
          }
        } catch (err) {
          alert("Error parsing JSON file: " + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  function attachGlobalKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.getElementById("modal-add").style.display = "none";
        document.getElementById("modal-view").style.display = "none";
        document.getElementById("export-menu").style.display = "none";
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        const activeTag = document.activeElement ? document.activeElement.tagName : "";
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA" && activeTag !== "SELECT") {
          e.preventDefault();
          document.getElementById("searchBar").focus();
        }
      }
    });
  }

  function renderAll() {
    updateStats();
    renderGrid();
  }

  function updateStats() {
    document.getElementById("count-all").textContent = memories.length;
    document.getElementById("count-fav").textContent = memories.filter((m) => m.isFavorite).length;

    document.getElementById("count-gemini").textContent = memories.filter((m) => getProviderName(m) === "Gemini").length;
    document.getElementById("count-gpt").textContent = memories.filter((m) => getProviderName(m) === "ChatGPT").length;
    document.getElementById("count-claude").textContent = memories.filter((m) => getProviderName(m) === "Claude").length;
    document.getElementById("count-other").textContent = memories.filter((m) => !["Gemini", "ChatGPT", "Claude"].includes(getProviderName(m))).length;

    document.getElementById("stat-total").textContent = memories.length;

    const todayStr = new Date().toLocaleDateString();
    const todayCount = memories.filter((m) => m.time && m.time.includes(todayStr)).length;
    document.getElementById("stat-today").textContent = todayCount;

    const jsonStr = JSON.stringify(memories);
    const kb = (new Blob([jsonStr]).size / 1024).toFixed(1);
    document.getElementById("stat-storage").textContent = `${kb} KB`;
  }

  function getProviderName(item) {
    if (item.provider) return item.provider;
    if (item.source) {
      const s = item.source.toLowerCase();
      if (s.includes("gemini")) return "Gemini";
      if (s.includes("chatgpt") || s.includes("openai")) return "ChatGPT";
      if (s.includes("claude")) return "Claude";
      if (s.includes("perplexity")) return "Perplexity";
      if (s.includes("deepseek")) return "DeepSeek";
      if (s.includes("poe")) return "Poe";
    }
    return "Web";
  }

  function renderGrid() {
    const container = document.getElementById("messagesContainer");
    container.innerHTML = "";

    let filtered = memories;

    if (currentFilter === "favorites") {
      filtered = filtered.filter((m) => m.isFavorite);
    } else if (currentFilter === "gemini") {
      filtered = filtered.filter((m) => getProviderName(m) === "Gemini");
    } else if (currentFilter === "chatgpt") {
      filtered = filtered.filter((m) => getProviderName(m) === "ChatGPT");
    } else if (currentFilter === "claude") {
      filtered = filtered.filter((m) => getProviderName(m) === "Claude");
    } else if (currentFilter === "other") {
      filtered = filtered.filter((m) => !["Gemini", "ChatGPT", "Claude"].includes(getProviderName(m)));
    }

    if (activeSearchQuery) {
      filtered = filtered.filter((m) => {
        const textMatch = m.text && m.text.toLowerCase().includes(activeSearchQuery);
        const titleMatch = m.title && m.title.toLowerCase().includes(activeSearchQuery);
        const provMatch = getProviderName(m).toLowerCase().includes(activeSearchQuery);
        const tagMatch = m.tags && m.tags.some((t) => t.toLowerCase().includes(activeSearchQuery));
        return textMatch || titleMatch || provMatch || tagMatch;
      });
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-large">
          <span class="empty-icon">📂</span>
          <h3>No memories match your query</h3>
          <p>Try searching for another keyword or click "+ New Memory" to add one.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((msg) => {
      const card = document.createElement("div");
      card.className = "card";

      const provider = getProviderName(msg);
      const titleText = escapeHtml(msg.title || "Saved Memory");
      const snippetText = escapeHtml(msg.text.length > 200 ? msg.text.substring(0, 200) + "..." : msg.text);
      const timeText = escapeHtml(msg.time || "N/A");
      const favClass = msg.isFavorite ? "fav-active" : "";

      const tagsHtml = (msg.tags || [provider.toLowerCase()])
        .map((t) => `<span class="tag">#${escapeHtml(t)}</span>`)
        .join(" ");

      card.innerHTML = `
        <div class="card-header">
          <div>
            <span class="provider-badge badge-${provider.toLowerCase()}">${provider}</span>
            <h4 class="card-title">${highlightText(titleText, activeSearchQuery)}</h4>
          </div>
          <button class="star-btn ${favClass}" data-id="${msg.id}">${msg.isFavorite ? "★" : "☆"}</button>
        </div>
        <div class="card-meta">
          <span>🕒 ${timeText}</span>
        </div>
        <p class="card-snippet">${highlightText(snippetText, activeSearchQuery)}</p>
        <div class="card-tags">${tagsHtml}</div>
        <div class="card-actions">
          <button class="btn small outline view-btn" data-id="${msg.id}">👁️ View</button>
          <button class="btn small outline copy-btn" data-text="${escapeHtmlAttribute(msg.text)}">📋 Copy</button>
          <button class="btn small danger delete-btn" data-id="${msg.id}">🗑️ Delete</button>
        </div>
      `;

      card.querySelector(".star-btn").addEventListener("click", () => toggleFavorite(msg.id));
      card.querySelector(".view-btn").addEventListener("click", () => openViewModal(msg));
      card.querySelector(".copy-btn").addEventListener("click", (e) => {
        navigator.clipboard.writeText(msg.text);
        e.target.textContent = "✓ Copied";
        setTimeout(() => (e.target.textContent = "📋 Copy"), 1500);
      });
      card.querySelector(".delete-btn").addEventListener("click", () => deleteMemory(msg.id));

      container.appendChild(card);
    });
  }

  function toggleFavorite(id) {
    const item = memories.find((m) => m.id === id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      saveMemoriesToStorage();
    }
  }

  function deleteMemory(id) {
    if (confirm("Delete this memory item?")) {
      memories = memories.filter((m) => m.id !== id);
      saveMemoriesToStorage();
    }
  }

  function openViewModal(msg) {
    const provider = getProviderName(msg);
    const badge = document.getElementById("view-provider");
    badge.textContent = provider;
    badge.className = `provider-badge badge-${provider.toLowerCase()}`;

    document.getElementById("view-title").textContent = msg.title || "Memory Detail";
    document.getElementById("view-time").textContent = msg.time || "";
    document.getElementById("view-source").textContent = msg.source || "Local";
    document.getElementById("view-text-content").textContent = msg.text;

    document.getElementById("modal-view").style.display = "flex";
  }

  function loadSampleDemoData() {
    const demoItems = [
      {
        id: "demo-gemini-1",
        title: "Gemini 1.5 Pro Multimodal Context Window",
        text: "Prompt: What is the context window limit for Google Gemini 1.5 Pro?\n\nResponse: Gemini 1.5 Pro supports up to 2,000,000 (2 Million) tokens natively, allowing ingestion of 1 hour of video or entire code repositories.",
        provider: "Gemini",
        time: new Date().toLocaleString(),
        source: "https://gemini.google.com",
        tags: ["gemini", "ai-models", "context-window"],
        isFavorite: true
      },
      {
        id: "demo-chatgpt-1",
        title: "Python Async asyncio TaskGroup Pattern",
        text: "Prompt: Explain async asyncio tasks in Python 3.12.\n\nResponse: Use `asyncio.TaskGroup()` for safe structured concurrency instead of `asyncio.gather()` when executing parallel coroutines.",
        provider: "ChatGPT",
        time: new Date().toLocaleString(),
        source: "https://chatgpt.com",
        tags: ["chatgpt", "python", "asyncio"],
        isFavorite: true
      },
      {
        id: "demo-claude-1",
        title: "Claude 3.5 Sonnet Artifacts & Coding Benchmark",
        text: "Prompt: How does Claude 3.5 Sonnet handle UI rendering with Artifacts?\n\nResponse: Claude 3.5 Sonnet generates interactive HTML/SVG/React code in a dedicated side-panel sandbox called Artifacts.",
        provider: "Claude",
        time: new Date().toLocaleString(),
        source: "https://claude.ai",
        tags: ["claude", "artifacts", "react"],
        isFavorite: false
      }
    ];

    const existingIds = new Set(memories.map((m) => m.id));
    const newDemos = demoItems.filter((d) => !existingIds.has(d.id));

    if (newDemos.length > 0) {
      memories = [...newDemos, ...memories];
      saveMemoriesToStorage();
      alert("Sample Multi-Provider AI demo data loaded!");
    } else {
      alert("Demo data is already loaded in your memory.");
    }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(memories, null, 2)], { type: "application/json" });
    downloadBlob(blob, "omniassist-backup.json");
  }

  function exportMarkdown() {
    let md = `# ⚡ OmniAssist AI - Saved Memory Collection\n\n_Exported on ${new Date().toLocaleString()}_\n\n---\n\n`;
    memories.forEach((item, i) => {
      const prov = getProviderName(item);
      md += `## ${i + 1}. [${prov}] ${item.title || "Saved Memory"}\n`;
      md += `* **Provider:** ${prov}\n`;
      md += `* **Timestamp:** ${item.time}\n`;
      md += `* **Source:** ${item.source || "N/A"}\n`;
      md += `* **Tags:** ${item.tags ? item.tags.join(", ") : "none"}\n\n`;
      md += "```\n" + item.text + "\n```\n\n---\n\n";
    });
    const blob = new Blob([md], { type: "text/markdown" });
    downloadBlob(blob, "omniassist-export.md");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function escapeHtmlAttribute(str) {
    if (!str) return "";
    return str.replace(/"/g, "&quot;");
  }

  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(regex, '<mark class="highlight">$1</mark>');
  }
})();
