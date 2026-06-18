const API = "";

// ---- State ----
const history = [];

// ---- DOM refs ----
const chatMessages  = document.getElementById("chat-messages");
const chatInput     = document.getElementById("chat-input");
const sendBtn       = document.getElementById("send-btn");
const fileInput     = document.getElementById("file-input");
const uploadStatus  = document.getElementById("upload-status");
const docList       = document.getElementById("doc-list");
const statusDot     = document.getElementById("status-dot");
const statusLabel   = document.getElementById("status-label");

// ---- Health check ----
async function checkHealth() {
  try {
    const res = await fetch(`${API}/api/health`);
    if (res.ok) {
      statusDot.className   = "status-dot online";
      statusLabel.textContent = "Backend online";
    } else {
      throw new Error();
    }
  } catch {
    statusDot.className   = "status-dot offline";
    statusLabel.textContent = "Backend offline";
  }
}

// ---- Document management ----
async function loadDocuments() {
  try {
    const res  = await fetch(`${API}/api/documents`);
    const data = await res.json();
    renderDocList(data.documents || []);
  } catch {
    docList.innerHTML = `<div class="doc-empty">Could not load documents.</div>`;
  }
}

function renderDocList(docs) {
  if (!docs.length) {
    docList.innerHTML = `<div class="doc-empty">No documents ingested yet.</div>`;
    return;
  }
  docList.innerHTML = docs.map(d => `
    <div class="doc-item" data-id="${d.id}">
      <div class="doc-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div class="doc-info">
        <div class="doc-name" title="${d.filename}">${d.filename}</div>
        <div class="doc-meta">${d.pages} pages · ${d.chunks} chunks</div>
      </div>
      <button class="doc-delete" title="Remove from knowledge base" onclick="deleteDoc('${d.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join("");
}

async function deleteDoc(docId) {
  if (!confirm("Remove this document from the knowledge base?")) return;
  try {
    const res = await fetch(`${API}/api/documents/${docId}`, { method: "DELETE" });
    if (res.ok) {
      showUploadStatus("Document removed.", "success");
      loadDocuments();
    } else {
      showUploadStatus("Deletion failed.", "error");
    }
  } catch {
    showUploadStatus("Network error.", "error");
  }
}

// ---- Upload ----
fileInput.addEventListener("change", async () => {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  for (const file of files) {
    showUploadStatus(`Uploading ${file.name}…`, "");
    const form = new FormData();
    form.append("file", file);

    try {
      const res  = await fetch(`${API}/api/documents/upload`, { method: "POST", body: form });
      const data = await res.json();

      if (res.ok) {
        showUploadStatus(`✓ ${data.filename} — ${data.chunks} chunks created`, "success");
        loadDocuments();
      } else {
        showUploadStatus(`Error: ${data.detail || "Upload failed"}`, "error");
      }
    } catch {
      showUploadStatus("Network error during upload.", "error");
    }
  }

  fileInput.value = "";
});

function showUploadStatus(msg, type) {
  uploadStatus.textContent = msg;
  uploadStatus.className   = `upload-status ${type}`;
  clearTimeout(uploadStatus._timer);
  if (type === "success" || type === "error") {
    uploadStatus._timer = setTimeout(() => {
      uploadStatus.className = "upload-status hidden";
    }, 4000);
  }
}

// ---- Hints ----
document.querySelectorAll(".hint").forEach(el => {
  el.addEventListener("click", () => {
    chatInput.value = el.textContent;
    chatInput.dispatchEvent(new Event("input"));
    chatInput.focus();
  });
});

// ---- Chat ----
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + "px";
});

sendBtn.addEventListener("click", sendMessage);

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Clear welcome message
  const welcome = chatMessages.querySelector(".welcome-message");
  if (welcome) welcome.remove();

  appendMessage("user", text);
  history.push({ role: "user", content: text });

  chatInput.value       = "";
  chatInput.style.height = "auto";
  sendBtn.disabled      = true;

  const thinkingEl = appendThinking();

  try {
    const res  = await fetch(`${API}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: history.slice(-10), top_k: 5 }),
    });

    const data = await res.json();
    thinkingEl.remove();

    if (res.ok) {
      const msgEl = appendMessage("assistant", data.answer, data);
      history.push({ role: "assistant", content: data.answer });
    } else {
      appendMessage("assistant", `Error: ${data.detail || "Something went wrong."}`);
    }
  } catch {
    thinkingEl.remove();
    appendMessage("assistant", "Network error — ensure the backend is running.");
  }

  sendBtn.disabled = false;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMessage(role, text, meta = null) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

  const roleLabel = document.createElement("div");
  roleLabel.className = "message-role";
  roleLabel.textContent = role === "user" ? "You" : "ROSERAG";
  div.appendChild(roleLabel);

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.innerHTML = formatText(text);
  div.appendChild(bubble);

  if (role === "assistant" && meta) {
    // Confidence bar
    if (meta.confidence !== undefined) {
      const pct = Math.round(meta.confidence * 100);
      const bar = document.createElement("div");
      bar.className = "confidence-bar";
      bar.innerHTML = `
        <span>Confidence</span>
        <div class="confidence-track">
          <div class="confidence-fill" style="width:${pct}%"></div>
        </div>
        <span>${pct}%</span>
        <span style="color:var(--text-muted)">· ${meta.retrieved_chunks} chunks retrieved</span>
      `;
      div.appendChild(bar);
    }

    // Sources
    if (meta.sources && meta.sources.length > 0) {
      div.appendChild(buildSourcesPanel(meta.sources));
    }
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function appendThinking() {
  const outer = document.createElement("div");
  outer.className = "message assistant";

  const roleLabel = document.createElement("div");
  roleLabel.className = "message-role";
  roleLabel.textContent = "ROSERAG";
  outer.appendChild(roleLabel);

  const bubble = document.createElement("div");
  bubble.className = "thinking";
  bubble.innerHTML = "<span></span><span></span><span></span>";
  outer.appendChild(bubble);

  chatMessages.appendChild(outer);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return outer;
}

function buildSourcesPanel(sources) {
  const section = document.createElement("div");
  section.className = "sources-section";

  const toggle = document.createElement("button");
  toggle.className = "sources-toggle";
  toggle.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
    ${sources.length} source${sources.length > 1 ? "s" : ""} cited
  `;
  section.appendChild(toggle);

  const body = document.createElement("div");
  body.className = "sources-body";

  sources.forEach(s => {
    const card = document.createElement("div");
    card.className = "source-card";
    card.innerHTML = `
      <div class="source-header">
        <span class="source-doc">${escapeHtml(s.document)}</span>
        <span class="source-page">Page ${s.page}</span>
        <span class="source-score">${Math.round(s.score * 100)}% match</span>
      </div>
      <div class="source-excerpt">"${escapeHtml(s.excerpt)}"</div>
    `;
    body.appendChild(card);
  });

  section.appendChild(body);

  toggle.addEventListener("click", () => {
    const open = toggle.classList.toggle("open");
    body.classList.toggle("open", open);
  });

  return section;
}

function formatText(text) {
  return text
    .split("\n\n")
    .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---- Init ----
checkHealth();
loadDocuments();
setInterval(checkHealth, 30000);
