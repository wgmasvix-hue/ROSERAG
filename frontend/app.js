/* ═══════════════════════════════════════════════════════════════
   ROSERAG v3.0 — Institutional Intelligence Platform
   ════════════════════════════════════════════════════════════ */

const API = "";
const chatHistory = [];
let currentAgent = "research";
let driveSelectedFiles = new Set();
let driveFolderStack = [{ id: "root", name: "My Drive" }];

// ── DOM refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Viewport height fix (iOS keyboard shrinks window) ─────────
function setVh() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty("--real-vh", `${h * 0.01}px`);
}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setVh);
} else {
  window.addEventListener("resize", setVh);
}
setVh();

// ── Configure marked.js ───────────────────────────────────────
if (typeof marked !== "undefined") {
  marked.setOptions({ gfm: true, breaks: true });
}

const chatMessages  = $("chat-messages");
const chatInput     = $("chat-input");
const sendBtn       = $("send-btn");
const fileInput     = $("file-input");
const uploadStatus  = $("upload-status");
const rpPlaceholder = $("rp-placeholder");
const rpContent     = $("rp-content");

// SVG icons for send / stop
const ICON_SEND = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
const ICON_STOP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
let streamAbortController = null;

// ══ Navigation ════════════════════════════════════════════════
function switchView(view) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".bn-tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(`.nav-item[data-view="${view}"]`).forEach(b => b.classList.add("active"));
  document.querySelectorAll(`.bn-tab[data-view="${view}"]`).forEach(b => b.classList.add("active"));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(`view-${view}`).classList.add("active");
  onViewActivated(view);
}

document.querySelectorAll(".nav-item").forEach(btn =>
  btn.addEventListener("click", () => switchView(btn.dataset.view))
);
document.querySelectorAll(".bn-tab").forEach(btn =>
  btn.addEventListener("click", () => switchView(btn.dataset.view))
);

function onViewActivated(view) {
  if (view === "documents") loadDocuments();
  if (view === "analytics") loadAnalytics();
  if (view === "history")   loadHistory();
  if (view === "graph")     loadGraph();
  if (view === "drive")     initDrive();
}

// ══ Health ═══════════════════════════════════════════════════
async function checkHealth() {
  try {
    const ok = await fetch(`${API}/api/health`).then(r => r.ok);
    const cls = ok ? "status-dot online" : "status-dot offline";
    document.querySelectorAll(".status-dot").forEach(d => d.className = cls);
    const sl = $("status-label"), slm = $("status-label-m");
    if (sl)  sl.textContent  = ok ? "System online" : "Offline";
    if (slm) slm.textContent = ok ? "Online" : "Offline";
  } catch {
    document.querySelectorAll(".status-dot").forEach(d => d.className = "status-dot offline");
  }
}

// ══ Toast notifications ═══════════════════════════════════════
function toast(msg, type = "info", duration = 4000) {
  const container = $("toast-container");
  if (!container) return;
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("toast-visible")));
  setTimeout(() => {
    t.classList.remove("toast-visible");
    setTimeout(() => t.remove(), 350);
  }, duration);
}

// ══ Markdown rendering ════════════════════════════════════════
function renderMarkdown(text) {
  if (!text) return "";
  if (typeof marked === "undefined") return formatText(text);
  // Pre-process citation markers before markdown so they survive parsing
  const withCites = String(text).replace(/\[(\d+)\]/g,
    (_, n) => `CITEREF${n}ENDCITE`
  );
  let html = marked.parse(withCites);
  // Post-process: restore citation markers as clickable links
  html = html.replace(/CITEREF(\d+)ENDCITE/g,
    '<a href="#" class="cite-ref" data-n="$1" title="View source $1">[$1]</a>'
  );
  return html;
}

// Citation click delegation
chatMessages.addEventListener("click", e => {
  const ref = e.target.closest(".cite-ref");
  if (!ref) return;
  e.preventDefault();
  const n = parseInt(ref.dataset.n, 10);
  highlightSource(n);
  openRightPanel();
});

function highlightSource(n) {
  document.querySelectorAll(".source-card").forEach((card, i) => {
    card.classList.toggle("source-highlight", i + 1 === n);
    if (i + 1 === n) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

// ══ Ask / Chat (SSE Streaming) ════════════════════════════════
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
  // If already streaming, abort
  if (streamAbortController) {
    streamAbortController.abort();
    return;
  }

  const text = chatInput.value.trim();
  if (!text) return;

  const welcome = chatMessages.querySelector(".welcome-block");
  if (welcome) welcome.remove();

  appendMsg("user", text);
  chatHistory.push({ role: "user", content: text });
  chatInput.value = "";
  chatInput.style.height = "auto";

  // Switch to stop button
  sendBtn.innerHTML = ICON_STOP;
  sendBtn.classList.add("btn-stop");
  sendBtn.title = "Stop generating";

  // Create the streaming assistant bubble
  const assistantDiv = document.createElement("div");
  assistantDiv.className = "msg assistant msg-entering";
  const roleEl = document.createElement("div");
  roleEl.className = "msg-role";
  roleEl.textContent = "ROSERAG";
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = '<span class="streaming-cursor"></span>';
  assistantDiv.appendChild(roleEl);
  assistantDiv.appendChild(bubble);
  chatMessages.appendChild(assistantDiv);
  requestAnimationFrame(() => assistantDiv.classList.remove("msg-entering"));
  chatMessages.scrollTop = chatMessages.scrollHeight;

  streamAbortController = new AbortController();
  let fullAnswer = "";
  let lastMeta = null;

  try {
    const res = await fetch(`${API}/api/ask/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, top_k: 5 }),
      signal: streamAbortController.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      bubble.innerHTML = `<p class="msg-error">Error: ${escHtml(err.detail || "Request failed")}</p>`;
      finishStream();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const ev = JSON.parse(raw);

          if (ev.type === "meta") {
            lastMeta = ev;
            showRightPanel({ sources: ev.sources, trust: ev.trust, confidence: 0 });
          } else if (ev.type === "token") {
            fullAnswer += ev.content;
            bubble.innerHTML = renderMarkdown(fullAnswer) + '<span class="streaming-cursor"></span>';
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } else if (ev.type === "done") {
            bubble.innerHTML = renderMarkdown(fullAnswer);
            if (lastMeta) showRightPanel({ ...lastMeta, confidence: ev.confidence });
            chatHistory.push({ role: "assistant", content: fullAnswer });
          } else if (ev.type === "error") {
            bubble.innerHTML = `<p class="msg-error">Error: ${escHtml(ev.detail)}</p>`;
          }
        } catch { /* malformed SSE line — skip */ }
      }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      // User stopped — finalise whatever was received
      if (fullAnswer) {
        bubble.innerHTML = renderMarkdown(fullAnswer);
        bubble.classList.add("msg-truncated");
        chatHistory.push({ role: "assistant", content: fullAnswer });
      } else {
        assistantDiv.remove();
      }
    } else {
      bubble.innerHTML = `<p class="msg-error">Network error — ${escHtml(err.message || "connection failed")}.</p>`;
    }
  }

  finishStream();
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function finishStream() {
  streamAbortController = null;
  sendBtn.innerHTML = ICON_SEND;
  sendBtn.classList.remove("btn-stop");
  sendBtn.title = "Send";
  chatInput.focus();
}

function appendMsg(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role} msg-entering`;
  const roleEl = document.createElement("div");
  roleEl.className = "msg-role";
  roleEl.textContent = role === "user" ? "You" : "ROSERAG";
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = role === "user" ? `<p>${escHtml(text)}</p>` : renderMarkdown(text);
  div.appendChild(roleEl);
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  requestAnimationFrame(() => div.classList.remove("msg-entering"));
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// ══ Right Panel ═══════════════════════════════════════════════
function openRightPanel() {
  $("right-panel").classList.add("rp-open");
  if (window.innerWidth < 1024) {
    const overlay = $("nav-overlay");
    overlay.classList.add("visible");
    overlay.onclick = closeRightPanel;
  }
}

function closeRightPanel() {
  $("right-panel").classList.remove("rp-open");
  const overlay = $("nav-overlay");
  overlay.classList.remove("visible");
  overlay.onclick = null;
}

function showRightPanel(data) {
  rpPlaceholder.classList.add("hidden");
  rpContent.classList.remove("hidden");
  openRightPanel();

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
      <div class="trust-comp-bar"><div class="trust-comp-fill" style="width:${Math.round(v * 100)}%"></div></div>
      <span>${Math.round(v * 100)}%</span>
    </div>
  `).join("");

  // Sources
  const sources = data.sources || [];
  $("rp-sources").innerHTML = sources.length === 0
    ? `<p class="rp-empty">No sources retrieved.</p>`
    : sources.map((s, i) => {
        const full  = s.chunk || s.excerpt || "";
        const short = full.slice(0, 220);
        const hasMore = full.length > 220;
        return `
          <div class="source-card" id="source-${i + 1}">
            <div class="source-card-header">
              <span class="source-num">[${i + 1}]</span>
              <span class="source-doc-name">${escHtml(s.document)}</span>
            </div>
            <div class="source-card-meta">
              <span class="source-page-badge">p.${s.page}</span>
              <span class="source-score-badge">${Math.round(s.score * 100)}% match</span>
            </div>
            <div class="source-excerpt source-excerpt-collapsed" id="src-text-${i}">
              ${escHtml(short)}${hasMore ? "…" : ""}
            </div>
            ${hasMore ? `<button class="source-expand-btn" onclick="toggleSourceText(${i}, ${JSON.stringify(full).replace(/</g,'\\u003c')})">Show more</button>` : ""}
          </div>
        `;
      }).join("");
}

function toggleSourceText(i, full) {
  const el  = $(`src-text-${i}`);
  const btn = el.nextElementSibling;
  const collapsed = el.classList.toggle("source-excerpt-collapsed");
  el.textContent = collapsed ? full.slice(0, 220) + "…" : full;
  if (btn) btn.textContent = collapsed ? "Show more" : "Show less";
}

// ══ Documents — Drag-and-drop ══════════════════════════════════
const dropZone = $("drop-zone");

if (dropZone) {
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", e => {
    if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove("drag-over");
  });
  dropZone.addEventListener("drop", async e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (!files.length) { toast("Only PDF files are accepted.", "error"); return; }
    await uploadFiles(files);
  });
}

if (fileInput) {
  fileInput.addEventListener("change", async () => {
    const files = Array.from(fileInput.files);
    if (files.length) await uploadFiles(files);
    fileInput.value = "";
  });
}

async function uploadFiles(files) {
  const queue = $("upload-queue");
  queue.classList.remove("hidden");
  queue.innerHTML = "";

  for (const file of files) {
    const row = document.createElement("div");
    row.className = "upload-row";
    row.innerHTML = `
      <span class="upload-filename">${escHtml(file.name)}</span>
      <span class="upload-state uploading">Uploading…</span>
    `;
    queue.appendChild(row);
    const stateEl = row.querySelector(".upload-state");

    const form = new FormData();
    form.append("file", file);

    try {
      const res  = await fetch(`${API}/api/documents/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        stateEl.textContent = `✓ ${data.chunks} chunks`;
        stateEl.className = "upload-state success";
        toast(`${file.name} ingested — ${data.chunks} chunks`, "success");
      } else {
        stateEl.textContent = `Error: ${data.detail || "Upload failed"}`;
        stateEl.className = "upload-state error";
        toast(`Failed to upload ${file.name}`, "error");
      }
    } catch {
      stateEl.textContent = "Network error";
      stateEl.className = "upload-state error";
    }
  }

  setTimeout(() => { queue.innerHTML = ""; queue.classList.add("hidden"); }, 7000);
  loadDocuments();
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
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No documents yet. Upload a PDF above.</td></tr>`;
    return;
  }
  tbody.innerHTML = docs.map(d => `
    <tr>
      <td class="doc-filename">${escHtml(d.filename)}</td>
      <td>${d.pages}</td>
      <td>${d.chunks}</td>
      <td>${fmtDate(d.ingested_at)}</td>
      <td>
        <button class="btn-icon" title="Remove" onclick="deleteDoc('${escAttr(d.id)}')">
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
  if (res.ok) { toast("Document removed.", "success"); loadDocuments(); }
  else         toast("Deletion failed.", "error");
}

// ══ Google Drive ═══════════════════════════════════════════════
async function initDrive() {
  driveSelectedFiles.clear();
  try {
    const res  = await fetch(`${API}/api/drive/status`);
    const data = await res.json();
    if (data.connected) {
      $("drive-connect-card").classList.add("hidden");
      $("drive-browser").classList.remove("hidden");
      driveFolderStack = [{ id: "root", name: "My Drive" }];
      loadDriveFolder("root");
    } else {
      $("drive-connect-card").classList.remove("hidden");
      $("drive-browser").classList.add("hidden");
    }
  } catch {
    $("drive-connect-card").classList.remove("hidden");
    $("drive-browser").classList.add("hidden");
  }
}

async function loadDriveFolder(folderId = "root") {
  const list = $("drive-file-list");
  list.innerHTML = `<div class="loading-state">Loading…</div>`;
  updateDriveBreadcrumb();
  updateDriveSyncBar();

  try {
    const res  = await fetch(`${API}/api/drive/files?folder_id=${encodeURIComponent(folderId)}`);
    if (!res.ok) throw new Error("Drive fetch failed");
    const data = await res.json();
    renderDriveItems(data.files || [], data.folders || []);
  } catch {
    list.innerHTML = `<div class="loading-state">Could not load Drive files. Check your connection.</div>`;
  }
}

function renderDriveItems(files, folders) {
  const list = $("drive-file-list");
  if (!files.length && !folders.length) {
    list.innerHTML = `<div class="loading-state">This folder is empty.</div>`;
    return;
  }

  const folderHtml = folders.map(f => `
    <div class="drive-item drive-folder" onclick="drillIntoFolder('${escAttr(f.id)}','${escAttr(f.name)}')">
      <span class="drive-item-icon">📁</span>
      <span class="drive-item-name">${escHtml(f.name)}</span>
    </div>
  `).join("");

  const fileHtml = files.map(f => `
    <label class="drive-item drive-file">
      <input type="checkbox" class="drive-checkbox" value="${escAttr(f.id)}"
        data-name="${escAttr(f.name)}" onchange="toggleDriveFile(this)" />
      <span class="drive-item-icon">📄</span>
      <span class="drive-item-name">${escHtml(f.name)}</span>
      <span class="drive-item-size">${f.size || ""}</span>
    </label>
  `).join("");

  list.innerHTML = folderHtml + fileHtml;
}

function drillIntoFolder(id, name) {
  driveFolderStack.push({ id, name });
  loadDriveFolder(id);
}

function updateDriveBreadcrumb() {
  const bc = $("drive-breadcrumb");
  if (!bc) return;
  bc.innerHTML = driveFolderStack.map((f, i) => {
    if (i === driveFolderStack.length - 1) return `<span>${escHtml(f.name)}</span>`;
    return `<a href="#" onclick="driveNavTo(${i});return false;">${escHtml(f.name)}</a>`;
  }).join(" / ");
}

function driveNavTo(index) {
  driveFolderStack = driveFolderStack.slice(0, index + 1);
  loadDriveFolder(driveFolderStack[driveFolderStack.length - 1].id);
}

function toggleDriveFile(checkbox) {
  const key = JSON.stringify({ id: checkbox.value, name: checkbox.dataset.name });
  if (checkbox.checked) driveSelectedFiles.add(key);
  else driveSelectedFiles.delete(key);
  updateDriveSyncBar();
}

function updateDriveSyncBar() {
  const btn = $("drive-sync-btn");
  const cnt = $("drive-selected-count");
  const n = driveSelectedFiles.size;
  if (cnt) cnt.textContent = n === 1 ? "1 file selected" : `${n} files selected`;
  if (btn) btn.disabled = n === 0;
}

const driveSyncBtn = $("drive-sync-btn");
if (driveSyncBtn) {
  driveSyncBtn.addEventListener("click", async () => {
    const files = [...driveSelectedFiles].map(s => JSON.parse(s));
    if (!files.length) return;
    driveSyncBtn.disabled = true;
    driveSyncBtn.textContent = "Importing…";
    try {
      const res  = await fetch(`${API}/api/drive/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`${data.imported} document(s) imported from Drive`, "success");
        driveSelectedFiles.clear();
        document.querySelectorAll(".drive-checkbox").forEach(cb => cb.checked = false);
        updateDriveSyncBar();
      } else {
        toast(`Drive import failed: ${data.detail || "unknown error"}`, "error");
      }
    } catch {
      toast("Network error during Drive import.", "error");
    }
    driveSyncBtn.disabled = false;
    driveSyncBtn.textContent = "Import to Knowledge Base";
  });
}

const driveDisconnect = $("drive-disconnect");
if (driveDisconnect) {
  driveDisconnect.addEventListener("click", async () => {
    if (!confirm("Disconnect Google Drive?")) return;
    await fetch(`${API}/api/drive/disconnect`);
    toast("Google Drive disconnected.", "info");
    initDrive();
  });
}

// ══ Knowledge Graph ════════════════════════════════════════════
$("graph-refresh").addEventListener("click", loadGraph);
$("graph-filter").addEventListener("change", loadGraph);

async function loadGraph() {
  const type = $("graph-filter").value;
  const params = type ? `?entity_type=${type}` : "";
  try {
    const res  = await fetch(`${API}/api/graph${params}`);
    renderGraph(await res.json());
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
    renderAnalytics(await res.json());
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
      <div class="stat-card"><div class="stat-value">${d.documents}</div><div class="stat-label">Documents</div></div>
      <div class="stat-card"><div class="stat-value">${d.chunks}</div><div class="stat-label">Chunks</div></div>
      <div class="stat-card"><div class="stat-value">${d.questions}</div><div class="stat-label">Questions</div></div>
      <div class="stat-card"><div class="stat-value">${Math.round((d.avg_trust_score || 0) * 100)}%</div><div class="stat-label">Avg Trust</div></div>
      <div class="stat-card"><div class="stat-value">${d.knowledge_graph?.nodes || 0}</div><div class="stat-label">Graph Nodes</div></div>
      <div class="stat-card"><div class="stat-value">${d.knowledge_graph?.edges || 0}</div><div class="stat-label">Graph Edges</div></div>
    </div>
    ${d.topics?.length ? `
    <div class="analytics-section">
      <h3>Institutional Topics</h3>
      <div class="topic-chips">${d.topics.map(t => `<span class="topic-chip">${escHtml(t)}</span>`).join("")}</div>
    </div>` : ""}
    ${entityRows ? `
    <div class="analytics-section">
      <h3>Entity Landscape</h3>
      <div class="stat-row">${entityRows}</div>
    </div>` : ""}
  `;
}

// ══ History ════════════════════════════════════════════════════
async function loadHistory() {
  $("history-list").innerHTML = `<div class="loading-state">Loading history…</div>`;
  try {
    const res  = await fetch(`${API}/api/history?limit=30`);
    renderHistory((await res.json()).entries || []);
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
          <div class="history-answer">${renderMarkdown(e.answer || "")}</div>
          ${e.sources?.length ? `
          <div class="history-sources">
            Sources: ${e.sources.map(s => `${escHtml(s.document)} p.${s.page}`).join(" · ")}
          </div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function toggleHistory(header) {
  header.nextElementSibling.classList.toggle("open");
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
    <div class="copilot-result-header">${escHtml(currentAgent).toUpperCase()} AGENT</div>
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
        <div class="copilot-result-header">${escHtml(data.agent).toUpperCase()} — ${escHtml(data.agent_description)}</div>
        <div class="copilot-result-body">
          ${renderMarkdown(data.answer)}
          ${data.reasoning_notes ? `<div class="copilot-notes">${escHtml(data.reasoning_notes)}</div>` : ""}
        </div>
      `;
      showRightPanel(data);
    } else {
      resultEl.innerHTML = `<div class="copilot-result-body msg-error">Error: ${data.detail || "Agent failed."}</div>`;
    }
  } catch {
    resultEl.innerHTML = `<div class="copilot-result-body msg-error">Network error.</div>`;
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

function escAttr(str) {
  return String(str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

// ══ Right Panel close button ═══════════════════════════════════
const rpClose = $("rp-close");
if (rpClose) rpClose.addEventListener("click", closeRightPanel);

// ══ Branding ═══════════════════════════════════════════════════
async function applyBranding() {
  try {
    const res = await fetch(`${API}/api/config`);
    if (!res.ok) return;
    const cfg = await res.json();
    const root = document.documentElement;
    if (cfg.brand_color_primary) root.style.setProperty("--rose-600", cfg.brand_color_primary);
    if (cfg.brand_color_accent)  root.style.setProperty("--rose-400", cfg.brand_color_accent);
    document.querySelectorAll(".brand-rose").forEach(el => el.textContent = cfg.brand_prefix);
    document.querySelectorAll(".brand-rag").forEach(el => el.textContent = cfg.brand_suffix);
    const taglineEl = document.querySelector(".nav-tagline");
    if (taglineEl) taglineEl.textContent = cfg.institution_tagline;
    const askH1 = document.querySelector("#view-ask .view-header h1");
    if (askH1) askH1.textContent = `Ask ${cfg.brand_prefix}${cfg.brand_suffix}`;
    const welcomeH2 = document.querySelector(".welcome-block h2");
    if (welcomeH2) welcomeH2.textContent = cfg.institution_name;
    const welcomeP = document.querySelector(".welcome-block > p");
    if (welcomeP) {
      welcomeP.textContent = `Upload documents, then ask questions grounded in ${cfg.institution_name}'s knowledge. Every answer includes source citations, trust score, and evidence trails.`;
    }
    const composerNote = document.querySelector(".composer-note");
    if (composerNote) composerNote.textContent = `Answers sourced exclusively from ${cfg.institution_name} documents`;
    document.title = `${cfg.brand_prefix}${cfg.brand_suffix} — ${cfg.institution_name}`;
  } catch { /* Branding fetch failed — defaults remain */ }
}

// ══ Google Drive ══════════════════════════════════════════════

let driveConnected = false;
let driveFolderStack = [{ id: "root", name: "My Drive" }];
const driveSelected = new Set();

async function initDrive() {
  try {
    const res = await fetch(`${API}/api/drive/status`);
    const data = await res.json();
    driveConnected = data.connected;
  } catch { driveConnected = false; }

  // Check for ?drive=connected redirect from OAuth
  if (location.search.includes("drive=connected")) {
    driveConnected = true;
    history.replaceState({}, "", location.pathname);
  }

  if (driveConnected) {
    $("drive-connect-state").classList.add("hidden");
    $("drive-browser-state").classList.remove("hidden");
    loadDriveFolder("root");
  } else {
    $("drive-connect-state").classList.remove("hidden");
    $("drive-browser-state").classList.add("hidden");
  }
}

async function loadDriveFolder(folderId) {
  driveSelected.clear();
  updateDriveSyncBar();
  $("drive-loading").classList.remove("hidden");
  $("drive-file-list").innerHTML = "";

  try {
    const [foldersRes, filesRes] = await Promise.all([
      fetch(`${API}/api/drive/folders?folder_id=${folderId}`),
      fetch(`${API}/api/drive/files?folder_id=${folderId}`),
    ]);
    const folders = (await foldersRes.json()).files || [];
    const files   = (await filesRes.json()).files   || [];
    renderDriveItems(folders, files);
  } catch {
    $("drive-file-list").innerHTML = `<div class="loading-state">Failed to load Drive files.</div>`;
  } finally {
    $("drive-loading").classList.add("hidden");
  }

  // Breadcrumb
  $("drive-breadcrumb").textContent = driveFolderStack.map(f => f.name).join(" › ");
  $("drive-back").disabled = driveFolderStack.length <= 1;
}

function renderDriveItems(folders, files) {
  const list = $("drive-file-list");
  if (!folders.length && !files.length) {
    list.innerHTML = `<div class="loading-state">This folder is empty.</div>`;
    return;
  }

  const folderHtml = folders.map(f => `
    <div class="drive-item drive-folder" data-id="${f.id}" data-name="${escHtml(f.name)}">
      <span class="drive-item-icon">📁</span>
      <span class="drive-item-name">${escHtml(f.name)}</span>
    </div>
  `).join("");

  const fileHtml = files.map(f => {
    const ext  = f.name.split(".").pop().toUpperCase();
    const size = f.size ? `${Math.round(f.size / 1024)} KB` : "";
    const date = f.modifiedTime ? fmtDate(f.modifiedTime) : "";
    return `
      <div class="drive-item drive-file" data-id="${f.id}">
        <input type="checkbox" class="drive-checkbox" data-id="${f.id}" />
        <span class="drive-item-icon">📄</span>
        <span class="drive-item-name">${escHtml(f.name)}</span>
        <span class="drive-item-meta">${size} ${date}</span>
      </div>
    `;
  }).join("");

  list.innerHTML = folderHtml + fileHtml;

  list.querySelectorAll(".drive-folder").forEach(el => {
    el.addEventListener("click", () => {
      driveFolderStack.push({ id: el.dataset.id, name: el.dataset.name });
      loadDriveFolder(el.dataset.id);
    });
  });

  list.querySelectorAll(".drive-checkbox").forEach(cb => {
    cb.addEventListener("change", () => {
      if (cb.checked) driveSelected.add(cb.dataset.id);
      else driveSelected.delete(cb.dataset.id);
      updateDriveSyncBar();
    });
  });
}

function updateDriveSyncBar() {
  const n = driveSelected.size;
  $("drive-selected-count").textContent = `${n} file${n !== 1 ? "s" : ""} selected`;
  $("drive-sync-btn").disabled = n === 0;
}

$("drive-back").addEventListener("click", () => {
  if (driveFolderStack.length > 1) {
    driveFolderStack.pop();
    loadDriveFolder(driveFolderStack[driveFolderStack.length - 1].id);
  }
});

$("drive-sync-btn").addEventListener("click", async () => {
  const ids = [...driveSelected];
  if (!ids.length) return;

  const btn = $("drive-sync-btn");
  btn.disabled = true;
  btn.textContent = "Ingesting…";
  showDriveSyncStatus(`Ingesting ${ids.length} file(s)…`, "");

  try {
    const res  = await fetch(`${API}/api/drive/sync`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ file_ids: ids, agent_tag: "drive" }),
    });
    const data = await res.json();
    const ok   = data.synced?.length || 0;
    const bad  = data.errors?.length || 0;
    showDriveSyncStatus(
      `✓ ${ok} ingested${bad ? ` · ${bad} failed` : ""}`,
      ok > 0 ? "success" : "error"
    );
    driveSelected.clear();
    updateDriveSyncBar();
    loadDriveFolder(driveFolderStack[driveFolderStack.length - 1].id);
  } catch {
    showDriveSyncStatus("Sync failed — network error.", "error");
  }

  btn.textContent = "Ingest Selected";
  btn.disabled = false;
});

$("drive-disconnect").addEventListener("click", async () => {
  await fetch(`${API}/api/drive/disconnect`);
  driveConnected = false;
  $("drive-connect-state").classList.remove("hidden");
  $("drive-browser-state").classList.add("hidden");
});

function showDriveSyncStatus(msg, type) {
  const el = $("drive-sync-status");
  el.textContent = msg;
  el.className = `upload-status ${type}`;
  clearTimeout(el._t);
  if (type === "success" || type === "error") {
    el._t = setTimeout(() => el.classList.add("hidden"), 6000);
  }
}

// ══ Init ═══════════════════════════════════════════════════════
applyBranding();
checkHealth();
setInterval(checkHealth, 30_000);

// Handle ?drive=connected redirect
if (new URLSearchParams(location.search).get("drive") === "connected") {
  window.history.replaceState({}, "", "/");
  toast("Google Drive connected!", "success");
  switchView("drive");
}
