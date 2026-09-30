/**
 * OmniAssist AI - Extension Popup Logic (v4.0)
 * XSS-sanitized memory rendering with provider icons & one-click context injection.
 */

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  loadSavedMemories();

  const searchInput = document.getElementById("popup-search-input");
  searchInput.addEventListener("input", (e) => {
    filterMemories(e.target.value);
  });

  document.getElementById("btn-trigger-inpage-search").addEventListener("click", async () => {
    const term = searchInput.value.trim();
    if (!term) {
      updateStatus("Enter a term to search.");
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "HIGHLIGHT_SEARCH", term }, () => {
          if (chrome.runtime.lastError) {
            updateStatus("Could not connect to page. Reload tab & retry.");
          } else {
            updateStatus("Search highlighted!");
          }
        });
      }
    } catch (err) {
      updateStatus("Search unavailable on this page.");
    }
  });

  document.getElementById("btn-inject-popup-context").addEventListener("click", async () => {
    try {
      chrome.storage.local.get(["chatRecall"], async (result) => {
        const list = result.chatRecall || [];
        if (list.length === 0) {
          updateStatus("No saved memories to inject!");
          return;
        }
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          chrome.tabs.sendMessage(
            tab.id,
            { action: "INJECT_CONTEXT", text: list[0].text, title: list[0].title },
            () => {
              if (chrome.runtime.lastError) {
                updateStatus("Could not inject into tab.");
              } else {
                updateStatus("Context injected into AI prompt!");
              }
            }
          );
        }
      });
    } catch (e) {
      updateStatus("Injection error.");
    }
  });

  document.getElementById("open-web-app").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
  });

  document.getElementById("btn-export-json").addEventListener("click", () => {
    chrome.storage.local.get(["chatRecall"], (result) => {
      const data = result.chatRecall || [];
      downloadFile(JSON.stringify(data, null, 2), "omniassist-memories.json", "application/json");
      updateStatus("Exported JSON file!");
    });
  });

  document.getElementById("btn-export-md").addEventListener("click", () => {
    chrome.storage.local.get(["chatRecall"], (result) => {
      const data = result.chatRecall || [];
      let md = `# ⚡ OmniAssist AI - Saved Memory Collection\n\n_Exported on ${new Date().toLocaleString()}_\n\n---\n\n`;
      data.forEach((item, i) => {
        md += `### ${i + 1}. [${item.provider || "AI"}] ${item.title || "Saved Memory"} (${item.time})\n`;
        md += `**Source:** [${item.source || "Local"}](<${item.source || "#"}>)\n\n`;
        md += "```\n" + (item.text || "") + "\n```\n\n---\n\n";
      });
      downloadFile(md, "omniassist-memories.md", "text/markdown");
      updateStatus("Exported Markdown file!");
    });
  });

  document.getElementById("btn-clear-all").addEventListener("click", () => {
    if (confirm("Clear all saved memories?")) {
      chrome.storage.local.set({ chatRecall: [] }, () => {
        loadSavedMemories();
        updateStatus("All memories cleared.");
      });
    }
  });
});

function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const contentId = tab.getAttribute("data-tab");
      document.getElementById(contentId).classList.add("active");
    });
  });
}

function loadSavedMemories() {
  chrome.storage.local.get(["chatRecall"], (result) => {
    const list = result.chatRecall || [];
    document.getElementById("saved-count").textContent = list.length;
    renderMemoryList(list);
  });
}

function renderMemoryList(items) {
  const container = document.getElementById("saved-list");
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `<div class="empty-state">No saved memories found.</div>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "memory-card";

    const headerRow = document.createElement("div");
    headerRow.className = "memory-card-header";

    const providerBadge = document.createElement("span");
    providerBadge.className = `provider-badge badge-${(item.provider || "web").toLowerCase()}`;
    providerBadge.textContent = item.provider || "Web";

    const timeSpan = document.createElement("span");
    timeSpan.className = "memory-time";
    timeSpan.textContent = item.time || "Recent";

    headerRow.appendChild(providerBadge);
    headerRow.appendChild(timeSpan);

    const titleEl = document.createElement("strong");
    titleEl.className = "memory-title";
    titleEl.textContent = item.title || "Saved Turn";

    const textEl = document.createElement("p");
    textEl.className = "memory-text";
    textEl.textContent = item.text.length > 150 ? item.text.substring(0, 150) + "..." : item.text;

    const actionRow = document.createElement("div");
    actionRow.className = "memory-actions";

    const injectBtn = document.createElement("button");
    injectBtn.className = "mini-btn accent";
    injectBtn.textContent = "⚡ Inject";
    injectBtn.onclick = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "INJECT_CONTEXT", text: item.text, title: item.title }, () => {
          if (chrome.runtime.lastError) updateStatus("Tab not ready.");
          else updateStatus("Injected into input!");
        });
      }
    };

    const copyBtn = document.createElement("button");
    copyBtn.className = "mini-btn";
    copyBtn.textContent = "📋 Copy";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(item.text);
      updateStatus("Copied!");
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "mini-btn danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = () => deleteMemoryItem(item.id);

    actionRow.appendChild(injectBtn);
    actionRow.appendChild(copyBtn);
    actionRow.appendChild(deleteBtn);

    card.appendChild(headerRow);
    card.appendChild(titleEl);
    card.appendChild(textEl);
    card.appendChild(actionRow);

    container.appendChild(card);
  });
}

function filterMemories(term) {
  const query = term.toLowerCase();
  chrome.storage.local.get(["chatRecall"], (result) => {
    const list = result.chatRecall || [];
    const filtered = list.filter(
      (item) =>
        item.text.toLowerCase().includes(query) ||
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.provider && item.provider.toLowerCase().includes(query))
    );
    renderMemoryList(filtered);
  });
}

function deleteMemoryItem(id) {
  chrome.storage.local.get(["chatRecall"], (result) => {
    const list = result.chatRecall || [];
    const updated = list.filter((item) => item.id !== id);
    chrome.storage.local.set({ chatRecall: updated }, () => {
      loadSavedMemories();
      updateStatus("Item deleted.");
    });
  });
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function updateStatus(msg) {
  const el = document.getElementById("status-msg");
  if (el) {
    el.textContent = msg;
    setTimeout(() => {
      el.textContent = "Ready";
    }, 2500);
  }
}
