/* ═══════════════════════════════════════════════════════════════
   ROSERAG v2.0 — Institutional Intelligence Platform
   ════════════════════════════════════════════════════════════ */

const API = "";
const chatHistory = [];
let currentAgent = "research";

// ── DOM refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const statusDot    = $("status-dot");
const statusLabel  = $("status-label");
const chatMessages = $("chat-messages");
const chatInput    = $("chat-input");
const sendBtn      = $("send-btn");
const fileInput    = $("file-input");
const uploadStatus = $("upload-status");
const rpPlaceholder = $("rp-placeholder");
const rpContent    = $("rp-content");

// ══ Navigation ════════════════════════════════════════════════
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    $(`view-${view}`).classList.add("active");
    onViewActivated(view);
  });
});

function onViewActivated(view) {
  if (view === "documents") loadDocuments();
  if (view === "analytics") loadAnalytics();
  if (view === "history")   loadHistory();
  if (view === "graph")     loadGraph();
}

// ══ Health ═══════════════════════════════════════════════════
async function checkHealth() {
  try {
    const res = await fetch(`${API}/api/health`);
    if (res.ok) {
      statusDot.className = "status-dot online";
      statusLabel.textContent = "System online";
    } else throw new Error();
  } catch {
    statusDot.className = "status-dot offline";
    statusLabel.textContent = "Offline";
  }
}

// ══ Ask / Chat ════════════════════════════════════════════════
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
});

chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + "px";
});

sendBtn.addEventListener("click", sendChat);

document.querySelectorAll(".hint-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    chatInput.value = chip.dataset.q;
    chatInput.dispatchEvent(new Event("input"));
    chatInput.focus();
  });
});

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  const welcome = chatMessages.querySelector(".welcome-block");
  if (welcome) welcome.remove();

  appendMsg("user", text);
  chatHistory.push({ role: "user", content: text });
  chatInput.value = "";
  chatInput.style.height = "auto";
  sendBtn.disabled = true;

  const thinkEl = appendThinking();

  try {
    const res = await fetch(`${API}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, top_k: 5 }),
    });
    const data = await res.json();
    thinkEl.remove();

    if (res.ok) {
      appendMsg("assistant", data.answer);
      chatHistory.push({ role: "assistant", content: data.answer });
      showRightPanel(data);
    } else {
      appendMsg("assistant", `Error: ${data.detail || "Request failed."}`);
    }
  } catch {
    thinkEl.remove();
    appendMsg("assistant", "Network error — ensure the backend is running.");
  }

  sendBtn.disabled = false;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMsg(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  const roleEl = document.createElement("div");
  roleEl.className = "msg-role";
  roleEl.textContent = role === "user" ? "You" : "ROSERAG";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = formatText(text);

  div.appendChild(roleEl);
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function appendThinking() {
  const div = document.createElement("div");
  div.className = "msg assistant";

  const roleEl = document.createElement("div");
  roleEl.className = "msg-role";
  roleEl.textContent = "ROSERAG";

  const dots = document.createElement("div");
  dots.className = "thinking-dots";
  dots.innerHTML = "<span></span><span></span><span></span>";

  div.appendChild(roleEl);
  div.appendChild(dots);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// ══ Right Panel ═══════════════════════════════════════════════
function showRightPanel(data) {
  rpPlaceholder.classList.add("hidden");
  rpContent.classList.remove("hidden");

  // Trust
  const trust = data.trust || {};
  const badge = $("trust-badge");
  const level = trust.trust_level || "LOW";
  badge.textContent = level;
  badge.className = `trust-badge trust-${level}`;
  $("trust-score").textContent = trust.trust_score != null
    ? `${Math.round(trust.trust_score * 100)}%` : "—";

  const comps = trust.components || {};
  $("trust-components").innerHTML = Object.entries(comps).map(([k, v]) => `
    <div class="trust-comp-row">
      <span>${k.replace(/_/g, " ")}</span>
      <div class="trust-comp-bar">
        <div class="trust-comp-fill" style="width:${Math.round(v * 100)}%"></div>
      </div>
      <span>${Math.round(v * 100)}%</span>
    </div>
  `).join("");

  // Sources
  const sources = data.sources || [];
  $("rp-sources").innerHTML = sources.length === 0
    ? `<p style="font-size:12px;color:var(--ink-400)">No sources retrieved.</p>`
    : sources.map(s => `
      <div class="source-card">
        <div class="source-card-header">
          <span class="source-doc-name">${escHtml(s.document)}</span>
          <span class="source-page-badge">p.${s.page}</span>
          <span class="source-score-badge">${Math.round(s.score * 100)}%</span>
        </div>
        <div class="source-excerpt">"${escHtml((s.chunk || s.excerpt || "").slice(0, 220))}…"</div>
      </div>
    `).join("");
}

// ══ Documents ══════════════════════════════════════════════════
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
        showUploadStatus(`✓ ${data.filename} — ${data.chunks} chunks`, "success");
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
  uploadStatus.className = `upload-status ${type}`;
  clearTimeout(uploadStatus._t);
  if (type === "success" || type === "error") {
    uploadStatus._t = setTimeout(() => uploadStatus.classList.add("hidden"), 5000);
  }
}

async function loadDocuments() {
  try {
    const res  = await fetch(`${API}/api/documents`);
    const data = await res.json();
    renderDocTable(data.documents || []);
  } catch {
    $("doc-tbody").innerHTML = `<tr><td colspan="5" class="empty-row">Failed to load documents.</td></tr>`;
  }
}

function renderDocTable(docs) {
  const tbody = $("doc-tbody");
  if (!docs.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No documents in knowledge base.</td></tr>`;
    return;
  }
  tbody.innerHTML = docs.map(d => `
    <tr>
      <td class="doc-filename">${escHtml(d.filename)}</td>
      <td>${d.pages}</td>
      <td>${d.chunks}</td>
      <td>${fmtDate(d.ingested_at)}</td>
      <td>
        <button class="btn-icon" title="Remove" onclick="deleteDoc('${d.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join("");
}

async function deleteDoc(docId) {
  if (!confirm("Remove this document from the knowledge base?")) return;
  const res = await fetch(`${API}/api/documents/${docId}`, { method: "DELETE" });
  if (res.ok) { showUploadStatus("Document removed.", "success"); loadDocuments(); }
  else         showUploadStatus("Deletion failed.", "error");
}

// ══ Knowledge Graph ════════════════════════════════════════════
$("graph-refresh").addEventListener("click", loadGraph);
$("graph-filter").addEventListener("change", loadGraph);

async function loadGraph() {
  const type   = $("graph-filter").value;
  const params = type ? `?entity_type=${type}` : "";

  try {
    const res  = await fetch(`${API}/api/graph${params}`);
    const data = await res.json();
    renderGraph(data);
  } catch {
    $("graph-entity-list").innerHTML = `<div class="loading-state">Failed to load graph.</div>`;
  }
}

function renderGraph(data) {
  const stats = data.stats || {};
  $("graph-stats").innerHTML = Object.entries(stats).map(([k, v]) =>
    `<span class="stat-pill"><strong>${v}</strong> ${k.toLowerCase()}s</span>`
  ).join("") || `<span class="stat-pill">No entities extracted yet.</span>`;

  const nodes = data.nodes || [];
  if (!nodes.length) {
    $("graph-entity-list").innerHTML = `<div class="loading-state">No entities found. Upload documents to populate the knowledge graph.</div>`;
    return;
  }

  $("graph-entity-list").innerHTML = nodes.map(n => `
    <div class="entity-item">
      <span class="entity-type type-${n.type}">${n.type}</span>
      <span class="entity-name">${escHtml(n.name)}</span>
      <span class="entity-freq">×${n.frequency}</span>
    </div>
  `).join("");
}

// ══ Analytics ══════════════════════════════════════════════════
async function loadAnalytics() {
  $("analytics-body").innerHTML = `<div class="loading-state">Loading analytics…</div>`;
  try {
    const res  = await fetch(`${API}/api/analytics`);
    const data = await res.json();
    renderAnalytics(data);
  } catch {
    $("analytics-body").innerHTML = `<div class="loading-state">Analytics unavailable.</div>`;
  }
}

function renderAnalytics(d) {
  const entityRows = Object.entries(d.entities || {})
    .map(([k, v]) => `<span class="stat-pill"><strong>${v}</strong> ${k.toLowerCase()}s</span>`)
    .join("");

  $("analytics-body").innerHTML = `
    <div class="analytics-grid">
      <div class="stat-card">
        <div class="stat-value">${d.documents}</div>
        <div class="stat-label">Documents</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.chunks}</div>
        <div class="stat-label">Chunks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.questions}</div>
        <div class="stat-label">Questions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round((d.avg_trust_score || 0) * 100)}%</div>
        <div class="stat-label">Avg Trust</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.knowledge_graph?.nodes || 0}</div>
        <div class="stat-label">Graph Nodes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${d.knowledge_graph?.edges || 0}</div>
        <div class="stat-label">Graph Edges</div>
      </div>
    </div>

    ${d.topics?.length ? `
    <div class="analytics-section">
      <h3>Institutional Topics</h3>
      <div class="topic-chips">
        ${d.topics.map(t => `<span class="topic-chip">${escHtml(t)}</span>`).join("")}
      </div>
    </div>
    ` : ""}

    ${entityRows ? `
    <div class="analytics-section">
      <h3>Entity Landscape</h3>
      <div class="stat-row">${entityRows}</div>
    </div>
    ` : ""}
  `;
}

// ══ History ════════════════════════════════════════════════════
async function loadHistory() {
  $("history-list").innerHTML = `<div class="loading-state">Loading history…</div>`;
  try {
    const res  = await fetch(`${API}/api/history?limit=30`);
    const data = await res.json();
    renderHistory(data.entries || []);
  } catch {
    $("history-list").innerHTML = `<div class="loading-state">History unavailable.</div>`;
  }
}

function renderHistory(entries) {
  if (!entries.length) {
    $("history-list").innerHTML = `<div class="loading-state">No questions asked yet.</div>`;
    return;
  }
  $("history-list").innerHTML = entries.map(e => {
    const level = e.trust_level || "LOW";
    const score = e.trust_score != null ? `${Math.round(e.trust_score * 100)}%` : "—";
    return `
      <div class="history-item">
        <div class="history-header" onclick="toggleHistory(this)">
          <div class="history-q">${escHtml(e.question)}</div>
          <div class="history-meta">
            <span class="trust-badge-sm trust-${level}">${level}</span>
            <span>${score}</span>
            <span>${fmtDate(e.asked_at)}</span>
          </div>
        </div>
        <div class="history-body">
          <p>${escHtml(e.answer).replace(/\n/g, "<br>")}</p>
          ${e.sources?.length ? `
          <div style="margin-top:10px;font-size:11px;color:var(--ink-400)">
            Sources: ${e.sources.map(s => `${escHtml(s.document)} p.${s.page}`).join(" · ")}
          </div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function toggleHistory(header) {
  const body = header.nextElementSibling;
  body.classList.toggle("open");
}

// ══ Copilot ════════════════════════════════════════════════════
document.querySelectorAll(".agent-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".agent-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    currentAgent = card.dataset.agent;
  });
});

$("copilot-send").addEventListener("click", sendCopilot);
$("copilot-input").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCopilot(); }
});

async function sendCopilot() {
  const text = $("copilot-input").value.trim();
  if (!text) return;

  const resultEl = $("copilot-result");
  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `
    <div class="copilot-result-header">${currentAgent.toUpperCase()} AGENT</div>
    <div class="copilot-result-body"><div class="thinking-dots"><span></span><span></span><span></span></div></div>
  `;

  try {
    const res  = await fetch(`${API}/api/copilot/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, agent: currentAgent, top_k: 5 }),
    });
    const data = await res.json();

    if (res.ok) {
      resultEl.innerHTML = `
        <div class="copilot-result-header">${data.agent.toUpperCase()} — ${escHtml(data.agent_description)}</div>
        <div class="copilot-result-body">
          ${formatText(data.answer)}
          ${data.reasoning_notes ? `<div class="copilot-notes">${escHtml(data.reasoning_notes)}</div>` : ""}
        </div>
      `;
      showRightPanel(data);
    } else {
      resultEl.innerHTML = `<div class="copilot-result-body" style="color:#991b1b">Error: ${data.detail || "Agent failed."}</div>`;
    }
  } catch {
    resultEl.innerHTML = `<div class="copilot-result-body" style="color:#991b1b">Network error.</div>`;
  }
}

// ══ Utilities ═════════════════════════════════════════════════
function formatText(text) {
  return (text || "").split("\n\n")
    .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

// ══ Init ═══════════════════════════════════════════════════════
checkHealth();
setInterval(checkHealth, 30_000);
