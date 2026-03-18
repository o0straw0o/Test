// nav.js — Navigation commune et toggle MJ/Joueur
// La Larme d'Argent — Outil de gestion de campagne

const NAV_ITEMS = [
  { href: 'index.html',        label: 'Accueil',      icon: '⌂' },
  { href: 'personnages.html',  label: 'Aventuriers',  icon: '⚔' },
  { href: 'pnjs.html',         label: 'PNJs',         icon: '◈' },
  { href: 'monstres.html',     label: 'Monstres',     icon: '◎' },
  { href: 'relations.html',    label: 'Relations',    icon: '⊕' },
  { sep: true },
  { href: 'quetes.html',       label: 'Quêtes',       icon: '◉' },
  { href: 'rapports.html',     label: 'Rapports',     icon: '✉' },
  { sep: true },
  { href: 'lore.html',         label: 'Lore',         icon: '✧' },
  { href: 'codex.html',        label: 'Codex',        icon: '⊡' },
  { href: 'carte.html',        label: 'Carte',        icon: '✦' },
  { href: 'lieux.html',        label: 'Lieux',        icon: '⌖' },
  { href: 'timeline.html',     label: 'Chronologie',  icon: '◷' },
  { sep: true },
  { href: 'regles.html',       label: 'Règles',       icon: '⊟' },
  { href: 'combat-v2.html',    label: 'Combat',       icon: '✤', mjOnly: true },
  { sep: true },
  { href: 'des.html',          label: 'Dés',          icon: '⚄' },
];

// ── PARAMÈTRES CAMPAGNE ──────────────────────────────────────────────────────
const SETTINGS_KEY = 'sw_settings';

// ── AUTH PARTAGÉ ─────────────────────────────────────────────────────────────
async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function genRecoveryCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const group = () => Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return [group(),group(),group(),group()].join('-');
}

async function loadAuthData() {
  try {
    if (typeof window.electronAPI !== 'undefined') {
      const data = await window.electronAPI.readFile('auth.json');
      if (data) return data;
    }
  } catch(e) {}
  try { const s = localStorage.getItem('sw_auth_v1'); if (s) return JSON.parse(s); } catch(e) {}
  return null;
}

async function saveAuthData(data) {
  if (typeof window.electronAPI !== 'undefined') {
    try { await window.electronAPI.writeFile('auth.json', data); } catch(e) {}
  }
  localStorage.setItem('sw_auth_v1', JSON.stringify(data));
}


function getNavSettings() {
  try { const s = localStorage.getItem(SETTINGS_KEY); if (s) return JSON.parse(s); } catch(e) {}
  return {};
}

async function fetchAndApplySettings() {
  try {
    const r = await fetch('data/' + getCampaignId() + '/settings.json?_=' + Date.now());
    if (!r.ok) return;
    const s = await r.json();
    const _ex = getNavSettings();
    if (!s.nav_visible && _ex.nav_visible) s.nav_visible = _ex.nav_visible;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    _applyNavVis(s);
    const nt = document.querySelector('.nav-title');
    const ns = document.querySelector('.nav-sub');
    if (nt && s.campaign_title)    nt.textContent = s.campaign_title;
    if (ns && s.campaign_subtitle) ns.textContent = s.campaign_subtitle;
  } catch(e) {}
}

// ── MODE MJ ─────────────────────────────────────────────────────────────────
function getMJMode() {
  return localStorage.getItem('sw_mj_mode') === 'true';
}

function setMJMode(val) {
  localStorage.setItem('sw_mj_mode', val ? 'true' : 'false');
  applyMJMode(val);
}

function applyMJMode(isMJ) {
  document.body.classList.toggle('mj-active', isMJ);
  const btnJ = document.getElementById('btn-mode-joueur');
  const btnM = document.getElementById('btn-mode-mj');
  if (btnJ) btnJ.classList.toggle('active', !isMJ);
  if (btnM) btnM.classList.toggle('active', isMJ);
  document.querySelectorAll('.mj-only').forEach(el => {
    el.style.display = isMJ ? '' : 'none';
  });
}

function showMJPasswordModal() {
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.id = 'mj-pwd-ov';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = `
      <div style="background:#1a1a1a;border:1.5px solid rgba(255,255,255,.2);border-radius:12px;padding:24px 28px;min-width:280px;max-width:340px;font-family:'Crimson Text',serif;color:#f0f0f0;">
        <div style="font-family:'Cinzel',serif;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:16px;">Mode MJ</div>
        <input id="mj-pwd-inp" type="password" placeholder="Mot de passe" autocomplete="current-password"
          style="width:100%;padding:8px 12px;background:#111;border:1.5px solid rgba(255,255,255,.25);border-radius:6px;color:#f0f0f0;font-family:inherit;font-size:.9rem;outline:none;margin-bottom:8px;">
        <div id="mj-pwd-err" style="font-size:.72rem;color:#c00;font-style:italic;min-height:1.2em;margin-bottom:12px;"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="mj-pwd-cancel" style="padding:6px 16px;background:transparent;border:1px solid rgba(255,255,255,.25);border-radius:6px;color:rgba(255,255,255,.6);font-family:inherit;cursor:pointer;">Annuler</button>
          <button id="mj-pwd-ok" style="padding:6px 16px;background:rgba(180,40,40,.6);border:1px solid rgba(200,60,60,.5);border-radius:6px;color:#ffcccc;font-family:inherit;cursor:pointer;font-weight:600;">Confirmer</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const inp = document.getElementById('mj-pwd-inp');
    const err = document.getElementById('mj-pwd-err');
    function close(result) { ov.remove(); resolve(result); }
    async function trySubmit() {
      const auth = await loadAuthData();
      if (!auth || !auth.passwordHash || await sha256hex(inp.value) === auth.passwordHash) { close(true); }
      else { err.textContent = 'Mot de passe incorrect.'; inp.value = ''; inp.focus(); }
    }
    document.getElementById('mj-pwd-ok').onclick = trySubmit;
    document.getElementById('mj-pwd-cancel').onclick = () => close(false);
    ov.addEventListener('click', e => { if (e.target === ov) close(false); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') trySubmit(); if (e.key === 'Escape') close(false); });
    inp.focus();
  });
}

async function toggleMJTo(wantMJ) {
  const current = getMJMode();
  if (wantMJ === current) return;
  if (wantMJ) {
    const ok = await showMJPasswordModal();
    if (!ok) return;
    setMJMode(true);
  } else {
    setMJMode(false);
  }
}

function toggleMJ() { toggleMJTo(!getMJMode()); }

// ── INJECTION NAV ────────────────────────────────────────────────────────────
function _applyNavVis(cfg) {
  const nv = ((cfg && cfg.nav_visible) || (getNavSettings()).nav_visible) || {};
  const isMJ = getMJMode();
  // Liens navbar
  document.querySelectorAll('#nav-links a.nav-link[href]').forEach(function(link) {
    const href = link.getAttribute('href');
    const key = href.replace('.html', '');
    const item = NAV_ITEMS.find(function(it){ return it.href === href; });
    if (item && item.mjOnly) return;
    if (!isMJ && nv[key] === false) {
      link.classList.add('mj-only'); link.style.display = 'none';
    } else {
      link.classList.remove('mj-only'); link.style.display = '';
    }
  });
  // Cartes modules (index.html)
  document.querySelectorAll('.mod-card[href]').forEach(function(card) {
    const href = card.getAttribute('href');
    const key = href.replace('.html', '');
    const item = NAV_ITEMS.find(function(it){ return it.href === href; });
    if (item && item.mjOnly) return;
    card.style.display = (!isMJ && nv[key] === false) ? 'none' : '';
  });
}
function injectNav() {
  if (!document.getElementById('mj-style')) {
    const s = document.createElement('style');
    s.id = 'mj-style';
    s.textContent = '.nav-brand-ctx{position:fixed;background:#1a1a1a;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:6px;z-index:9999;min-width:190px;box-shadow:0 4px 20px rgba(0,0,0,.5);}.nav-brand-ctx button{display:block;width:100%;background:none;border:none;color:#f0f0f0;font-family:Crimson Text,serif;font-size:.85rem;padding:8px 12px;cursor:pointer;text-align:left;border-radius:5px;}.nav-brand-ctx button:hover{background:rgba(255,255,255,.08);}@media(min-width:861px){.nav-inner{position:relative;}.nav-links{position:absolute!important;left:50%!important;transform:translateX(-50%)!important;flex:unset!important;}.mj-toggle-wrap{margin-left:auto;}}' + 'body.mj-active .mj-only{display:revert!important;}body.mj-active .nav-link.mj-only{display:flex!important;}.nav-sep{display:flex;align-items:center;padding:0 2px;color:rgba(255,255,255,.18);font-size:.7rem;flex-shrink:0;user-select:none;}.mj-toggle-wrap{display:flex;border:1px solid rgba(255,255,255,.18);border-radius:6px;overflow:hidden;flex-shrink:0;}.mj-toggle-btn{background:transparent;color:rgba(255,255,255,.35);border:none;padding:5px 10px;font-size:.68rem;font-family:inherit;cursor:pointer;transition:background .15s,color .15s;white-space:nowrap;letter-spacing:.02em;}.mj-toggle-btn:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.06);}.mj-toggle-btn.active{background:rgba(255,255,255,.12);color:#fff;font-weight:600;}.mj-toggle-btn.mj-btn.active{background:rgba(180,40,40,.5);color:#ffcccc;border-left:1px solid rgba(255,255,255,.12);}.mj-toggle-btn.joueur-btn{border-right:1px solid rgba(255,255,255,.12);}';
    document.head.appendChild(s);
  }

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const cfg = getNavSettings();

  const nav = document.createElement('nav');
  nav.id = 'main-nav';
  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-brand" onclick="window.location='index.html'" oncontextmenu="showNavBrandMenu(event)" style="cursor:pointer" title="Accueil">
        <span class="nav-title">${cfg.campaign_title || "La Larme d'Argent"}</span>
        <span class="nav-sub">${cfg.campaign_subtitle || 'Brigade du Saumon Noir'}</span>
      </div>
      <div class="nav-links" id="nav-links">
        ${NAV_ITEMS.map(item => item.sep
          ? '<span class="nav-sep">|</span>'
          : `<a href="${item.href}" class="nav-link${currentPage === item.href ? ' active' : ''}${(item.mjOnly || (cfg.nav_visible && cfg.nav_visible[item.href.replace('.html','')] === false)) ? ' mj-only' : ''}">
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
          </a>`
        ).join('')}
      </div>
      <div class="mj-toggle-wrap">
        <button id="btn-mode-joueur" class="mj-toggle-btn joueur-btn" onclick="toggleMJTo(false)">Joueur</button>
        <button id="btn-mode-mj" class="mj-toggle-btn mj-btn" onclick="toggleMJTo(true)">⚿ MJ</button>
      </div>
      <button class="nav-burger" id="nav-burger" onclick="toggleBurger()" aria-label="Menu">☰</button>
    </div>
  `;

  document.body.insertBefore(nav, document.body.firstChild);
  applyMJMode(getMJMode());
  fetchAndApplySettings();
}

function toggleBurger() {
  const links = document.getElementById('nav-links');
  if (links) links.classList.toggle('open');
}


// ── Sélecteur de campagne joueur ──────────────────────────────────────────────
let _pickerCamps = [];

async function checkCampaignAccess() {
  const params = new URLSearchParams(window.location.search);
  const qc = params.get('c');
  if (qc) { localStorage.setItem('sw_campaign', qc); return; }
  let camps = [];
  try {
    const r = await fetch('data/campaigns.json');
    if (r.ok) camps = await r.json();
  } catch(e) {}
  if (!camps.length) { localStorage.setItem('sw_campaign', 'larmes'); return; }
  // Une seule campagne sans mdp : sélection auto
  if (camps.length === 1 && !camps[0].password) {
    localStorage.setItem('sw_campaign', camps[0].id);
    return;
  }
  // Plusieurs campagnes / mdp : exiger un choix explicite via le picker
  const picked = localStorage.getItem('sw_campaign_picked');
  if (picked && camps.some(c => c.id === picked)) {
    localStorage.setItem('sw_campaign', picked);
    return;
  }
  await showCampaignPickerOverlay(camps);
}

async function showCampaignPickerOverlay(camps) {
  _pickerCamps = camps;
  // Fetch hero backgrounds en parallele
  const settings = await Promise.all(camps.map(c =>
    fetch('data/' + c.id + '/settings.json')
      .then(r => r.ok ? r.json() : {})
      .catch(() => ({}))
  ));
  return new Promise(resolve => {
    window._pickerResolve = resolve;
    const ov = document.createElement('div');
    ov.id = 'camp-picker-ov';
    ov.style.cssText = 'position:fixed;inset:0;background:#111;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:\'Crimson Text\',serif;color:#f0f0f0;padding:20px;';
    ov.innerHTML =
      '<div style="font-family:Cinzel,serif;font-size:1.1rem;letter-spacing:.25em;text-transform:uppercase;margin-bottom:6px">Story Warden</div>' +
      '<div style="font-size:.85rem;color:rgba(255,255,255,.42);font-style:italic;margin-bottom:40px">Sélectionnez votre campagne</div>' +
      '<div style="display:flex;flex-direction:column;gap:14px;width:100%;max-width:420px">' +
      camps.map((c, i) => {
        const s = settings[i] || {};
        const hasBg = s.hero_bg_type === 'image' && s.hero_bg_image;
        const bgStyle = hasBg
          ? 'background:linear-gradient(rgba(0,0,0,.52),rgba(0,0,0,.52)),url(' + s.hero_bg_image + ') center/cover;'
          : 'background:#1a1a1a;';
        return '<div style="' + bgStyle + 'border:1.5px solid rgba(255,255,255,.15);border-radius:12px;padding:20px 24px;">' +
          '<div style="font-family:Cinzel,serif;font-size:.75rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin-bottom:' + (c.password ? '14px' : '10px') + '">' + c.nom + '</div>' +
          (c.password
            ? '<input id="picker-pw-' + i + '" type="password" placeholder="••••••••" style="width:100%;padding:8px 12px;background:#202020;border:1.5px solid rgba(255,255,255,.12);border-radius:7px;color:#f0f0f0;font-family:Crimson Text,serif;font-size:.9rem;outline:none;margin-bottom:8px;letter-spacing:.1em" onkeydown="if(event.key===\'Enter\')pickerSubmit(' + i + ')">' 
            + '<div id="picker-err-' + i + '" style="color:#c55;font-size:.75rem;min-height:1em;margin-bottom:8px"></div>'
            : '') +
          '<button onclick="pickerSubmit(' + i + ')" style="background:#c8966a;border:none;border-radius:7px;color:#111;font-family:Cinzel,serif;font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;padding:9px 22px;cursor:pointer;font-weight:700">Rejoindre →</button>' +
          '</div>';
      }).join('') +
      '</div>';
    document.body.appendChild(ov);
  });
}

function pickerSubmit(i) {
  const c = _pickerCamps[i];
  if (c.password) {
    const inp = document.getElementById('picker-pw-' + i);
    const pw = inp ? inp.value : '';
    const errEl = document.getElementById('picker-err-' + i);
    if (pw !== c.password) {
      if (errEl) errEl.textContent = 'Mot de passe incorrect.';
      return;
    }
  }
  localStorage.setItem('sw_campaign', c.id);
  localStorage.setItem('sw_campaign_picked', c.id);
  const ov = document.getElementById('camp-picker-ov');
  if (ov) ov.remove();
  window._pickerResolve && window._pickerResolve();
}

// Menu contextuel nav-brand
function showNavBrandMenu(e) {
  e.preventDefault();
  const ex = document.getElementById('nav-brand-ctx');
  if (ex) ex.remove();
  const m = document.createElement('div');
  m.id = 'nav-brand-ctx';
  m.className = 'nav-brand-ctx';
  m.style.left = e.clientX + 'px';
  m.style.top  = e.clientY + 'px';
  const btn = document.createElement('button');
  btn.textContent = '\u2190 Changer de campagne';
  btn.onclick = resetCampaignPick;
  m.appendChild(btn);
  document.body.appendChild(m);
  function close(ev) { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('click', close); } }
  setTimeout(function() { document.addEventListener('click', close); }, 10);
}

function resetCampaignPick() {
  localStorage.removeItem('sw_campaign');
  localStorage.removeItem('sw_campaign_picked');
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', async () => {
  await checkCampaignAccess();
  injectNav();
});
