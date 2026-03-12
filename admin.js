// ═══════════════════════════════════════════════════════
// CAIRO RESTAURANT — ADMIN DASHBOARD v3
// ═══════════════════════════════════════════════════════

const REFRESH_MS = 30000;

// ── STATE ─────────────────────────────────────────────
const state = {
  categories:    [],
  menuItems:     [],
  liveOrders:    [],
  historyOrders: [],
  reservations:  [],
  galleryImages: [],
  currentTab:    'overview',
  refreshTimer:  null,
  realtimeSub:   null
};

// ── ICONS ─────────────────────────────────────────────
const IC = {
  check:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  warn:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  edit:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  eye:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  confirm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`
};

// ── HELPERS ───────────────────────────────────────────
const $ = id => document.getElementById(id);
const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
const fmt = n => `₦${Number(n||0).toLocaleString()}`;
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';
const fmtTime = s => s ? new Date(s).toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'}) : '—';
const fmtDT   = s => s ? fmtDate(s)+' '+fmtTime(s) : '—';
const ago = s => {
  if (!s) return '';
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  return fmtDate(s);
};

// ── TOAST ─────────────────────────────────────────────
function toast(msg, type='info', dur=4000) {
  const wrap = $('toastWrap'); if (!wrap) return;
  if (type==='error') dur=6000;
  const icons = {success:IC.check,error:IC.x,warning:IC.warn,info:IC.info};
  const el = document.createElement('div');
  el.className=`toast ${type}`;
  el.innerHTML=`<span class="toast-icon">${icons[type]||IC.info}</span><span class="toast-msg">${msg}</span><button class="toast-x" onclick="this.closest('.toast').remove()">×</button><div class="toast-bar" style="animation-duration:${dur}ms"></div>`;
  wrap.appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),280);},dur);
}

// ── MODAL HELPERS ─────────────────────────────────────
function openModal(id)  { $(id)?.classList.add('show'); }
function closeModal(id) { $(id)?.classList.remove('show'); }

// ── AUTH ──────────────────────────────────────────────
// ── NOTIFICATIONS ─────────────────────────────────────
const Notifs = {
  get enabled() { return localStorage.getItem('cairo-notifs') === 'on'; },
  set enabled(v) { localStorage.setItem('cairo-notifs', v ? 'on' : 'off'); },

  // Plays a soft ding using Web Audio API — no file needed
  playDing() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const times = [[0, 880], [0.18, 1100], [0.36, 660]];
      times.forEach(([when, freq]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
        gain.gain.setValueAtTime(0.28, ctx.currentTime + when);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.7);
        osc.start(ctx.currentTime + when);
        osc.stop(ctx.currentTime + when + 0.7);
      });
    } catch(_) {}
  },

  // Fire notification — works in foreground AND background via SW
  async fire(title, body, tag='cairo-order') {
    if (!this.enabled) return;
    this.playDing();
    // Try service worker notification first (works when tab is backgrounded)
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION', title, body, tag
      });
      return;
    }
    // Fallback: direct browser notification (tab must be open)
    if (Notification?.permission === 'granted') {
      new Notification(title, {
        body, icon: '/icon-192.png', badge: '/icon-192.png', tag,
        requireInteraction: true
      });
    }
  },

  async toggle() {
    if (Notification?.permission === 'denied') {
      toast('Notifications blocked. Enable them in browser settings → Site Settings.', 'warning', 6000);
      return;
    }
    if (this.enabled) {
      this.enabled = false;
      this.updateBtn();
      toast('Notifications off', 'info');
      return;
    }
    // Request permission
    const perm = await Notification.requestPermission().catch(() => 'denied');
    if (perm === 'granted') {
      this.enabled = true;
      this.updateBtn();
      toast('🔔 Notifications enabled — you\'ll be alerted on new orders!', 'success', 5000);
    } else {
      toast('Permission denied. Allow notifications in your browser settings.', 'warning', 6000);
      this.updateBtn();
    }
  },

  updateBtn() {
    const btn    = $('notifBtn');
    const label  = $('notifLabel');
    const badge  = $('notifBadge');
    const icon   = $('notifIcon');
    if (!btn) return;
    const perm = Notification?.permission;
    if (perm === 'denied') {
      btn.className = 'notif-btn denied';
      label.textContent = 'Blocked';
      badge.style.display = 'none';
      icon.innerHTML = `<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/><line x1="1" y1="1" x2="23" y2="23"/>`;
      return;
    }
    if (this.enabled && perm === 'granted') {
      btn.className = 'notif-btn active';
      label.textContent = 'Notify On';
      badge.style.display = 'block';
      icon.innerHTML = `<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>`;
    } else {
      btn.className = 'notif-btn';
      label.textContent = 'Notify';
      badge.style.display = 'none';
      icon.innerHTML = `<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>`;
    }
  },

  init() {
    this.updateBtn();
    // If already granted + enabled, restore active state silently
    if (Notification?.permission === 'granted' && this.enabled) {
      // Good — already active
    }
  }
};

const Auth = {
  async init() {
    const { data:{session} } = await supabaseClient.auth.getSession();
    this.handle(session);
    supabaseClient.auth.onAuthStateChange?.((_, s) => this.handle(s));
  },
  handle(session) {
    const login=$('loginSection'), app=$('appShell');
    if (session) {
      login.style.display='none';
      app.classList.add('show');
      Admin.init();
    } else {
      login.style.display='flex';
      app.classList.remove('show');
    }
  },
  async login(email,pass) {
    const {error} = await supabaseClient.auth.signInWithPassword({email,password:pass});
    if (error) throw error;
  },
  async logout() {
    clearInterval(state.refreshTimer);
    try { supabaseClient.removeChannel(state.realtimeSub); } catch(_){}
    await supabaseClient.auth.signOut();
    location.reload();
  }
};

// ── ADMIN CORE ────────────────────────────────────────
const Admin = {
  async init() {
    await this.loadAll();
    this.subscribeRealtime();
    state.refreshTimer = setInterval(()=>{
      this.loadOrders();
      this.loadReservations();
    }, REFRESH_MS);
  },

  async loadAll() {
    await Promise.allSettled([
      this.loadCategories(),
      this.loadMenuItems(),
      this.loadOrders(),
      this.loadReservations(),
      this.loadGallery()
    ]);
    this.renderStats();
    this.renderTab(state.currentTab);
  },

  // ── LOADERS ─────────────────────────────────────────
  async loadCategories() {
    let res = await supabaseClient.from('categories').select('*').order('name');
    if (res.error) res = await supabaseClient.from('categories').select('*');
    const {data, error} = res;
    if (!error) {
      state.categories = data||[];
      // populate all category selects
      ['editCat','menuCatFilter'].forEach(selId => {
        const sel = $(selId); if (!sel) return;
        const placeholder = selId==='menuCatFilter' ? '<option value="all">All categories</option>' : '<option value="">— None —</option>';
        sel.innerHTML = placeholder;
        state.categories.forEach(c => {
          const o=document.createElement('option');
          o.value=c.id; o.textContent=`${c.emoji||''} ${c.name}`.trim();
          sel.appendChild(o);
        });
      });
    }
  },

  async loadMenuItems() {
    // Try with variants join first; if table doesn't exist yet, fall back
    let res = await supabaseClient
      .from('menu_items')
      .select('*, categories(name,emoji), menu_item_variants(*)')
      .order('name');
    if (res.error) {
      // menu_item_variants table may not exist — retry without it
      res = await supabaseClient
        .from('menu_items')
        .select('*, categories(name,emoji)')
        .order('name');
    }
    const {data, error} = res;
    if (!error) {
      state.menuItems = data||[];
      this.renderStats();
    }
  },

  async loadOrders() {
    const [liveRes,histRes] = await Promise.all([
      supabaseClient.from('orders').select('*, order_items(*)')
        .in('status',['pending','accepted','ready'])
        .order('created_at',{ascending:false}),
      supabaseClient.from('orders').select('*, order_items(*)')
        .in('status',['complete','completed','cancelled'])
        .order('created_at',{ascending:false}).limit(200)
    ]);
    state.liveOrders    = liveRes.data||[];
    state.historyOrders = histRes.data||[];
    this.renderStats();
    if (state.currentTab==='orders')    { this.renderLiveOrders('liveOrdersGrid2'); this.renderHistory(); }
    if (state.currentTab==='overview')  { this.renderLiveOrders('liveOrdersGrid');  this.renderActivity(); this.renderTodayRes(); }
    if (state.currentTab==='analytics') { this.renderAnalytics(); }
  },

  async loadReservations() {
    // Try new column names first, fall back to original schema columns
    let res = await supabaseClient
      .from('reservations').select('*')
      .order('created_at', {ascending: false});

    // If reservation_date exists, re-fetch with proper ordering
    if (!res.error && res.data?.length) {
      const sample = res.data[0];
      const hasNewCols = 'reservation_date' in sample;
      if (hasNewCols) {
        res = await supabaseClient
          .from('reservations').select('*')
          .order('reservation_date', {ascending: true, nullsFirst: false})
          .order('reservation_time', {ascending: true, nullsFirst: false});
      }
    } else if (res.error) {
      // total fallback
      res = await supabaseClient.from('reservations').select('*').order('created_at', {ascending: false});
    }

    const {data, error} = res;
    if (!error) {
      state.reservations = data||[];
      this.renderStats();
      if (state.currentTab==='reservations') this.renderReservations();
      if (state.currentTab==='overview')     { this.renderTodayRes(); this.renderActivity(); }
      if (state.currentTab==='analytics')    { this.renderAnalytics(); }
    }
  },

  async loadGallery() {
    let res = await supabaseClient.from('gallery').select('*').order('sort_order');
    if (res.error) res = await supabaseClient.from('gallery').select('*').order('created_at', {ascending: false});
    state.galleryImages = res.data||[];
    set('galleryCount', `${state.galleryImages.length} images`);
    if (state.currentTab==='gallery') this.renderGallery();
  },

  // ── STATS ────────────────────────────────────────────
  renderStats() {
    const today = new Date().toISOString().split('T')[0];
    const allOrders = [...state.liveOrders,...state.historyOrders];
    const todayOrders = allOrders.filter(o=>(o.created_at||'').startsWith(today));
    const revenue = todayOrders.filter(o=>o.status!=='cancelled')
      .reduce((s,o)=>s+Number(o.total_amount||0),0);
    const todayRes = state.reservations.filter(r=>{
      const d=r.reservation_date||r.date||'';
      return d===today && r.status!=='cancelled';
    }).length;
    const avail = state.menuItems.filter(i=>i.available).length;

    // Flash a stat card if its value changed
    const flashIfChanged = (id, newVal) => {
      const el = $(id); if (!el) return;
      const prev = el.dataset.prev;
      const str  = String(newVal);
      if (prev !== undefined && prev !== str) {
        el.classList.remove('stat-flash');
        void el.offsetWidth;
        el.classList.add('stat-flash');
      }
      el.textContent  = str;
      el.dataset.prev = str;
    };

    flashIfChanged('statLive',    state.liveOrders.length);
    flashIfChanged('statPending', state.liveOrders.filter(o=>o.status==='pending').length);
    flashIfChanged('statRevenue', fmt(revenue));
    flashIfChanged('statRes',     todayRes);
    set('statItems',  state.menuItems.length);
    set('statAvail',  `${avail} available`);

    // sidebar badges
    this.updateBadge('ordersBadge', state.liveOrders.filter(o=>o.status==='pending').length);
    this.updateBadge('resBadge',    state.reservations.filter(r=>r.status==='pending').length);

    // live count chips
    const cnt = state.liveOrders.length;
    ['liveCountChip','liveCountChip2'].forEach(id=>set(id,`${cnt} active`));
    set('galleryCount', `${state.galleryImages.length} images`);
  },

  updateBadge(id, count) {
    const el=$(id); if (!el) return;
    el.textContent=count;
    el.style.display=count>0?'inline-block':'none';
  },

  // ── REALTIME ─────────────────────────────────────────
  subscribeRealtime() {
    try {
      state.realtimeSub = supabaseClient.channel('cairo-admin-v3')
        .on('postgres_changes',{event:'*',schema:'public',table:'orders'}, payload=>{
          this.loadOrders();
          if (payload.eventType==='INSERT') {
            toast('🔔 New order received!','success');
            Notifs.fire('🍽️ New Order — Cairo Restaurant', 'A new order just came in. Tap to view.', 'cairo-order');
          }
        })
        .on('postgres_changes',{event:'*',schema:'public',table:'reservations'}, payload=>{
          this.loadReservations();
          if (payload.eventType==='INSERT') {
            toast('📅 New reservation!','info');
            Notifs.fire('📅 New Reservation — Cairo Restaurant', 'A table has been booked. Tap to review.', 'cairo-reservation');
          }
        })
        .subscribe(status=>{
          const dot = document.querySelector('.live-dot');
          if (!dot) return;
          if (status==='SUBSCRIBED') dot.style.background='var(--success)';
          else dot.style.background='var(--warning)';
        });
    } catch(_){}
  },

  // ── TABS ─────────────────────────────────────────────
  renderTab(tab) {
    state.currentTab=tab;
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===`tab-${tab}`));
    const titles={overview:'Overview',analytics:'Analytics',orders:'Orders',reservations:'Reservations',menu:'Menu Items',categories:'Categories',gallery:'Gallery'};
    set('pageTitle', titles[tab]||tab);
    if (tab==='overview')     { this.renderLiveOrders('liveOrdersGrid'); this.renderActivity(); this.renderTodayRes(); }
    if (tab==='analytics')    { this.renderAnalytics(); }
    if (tab==='orders')       { this.renderLiveOrders('liveOrdersGrid2'); this.renderHistory(); }
    if (tab==='reservations') this.renderReservations();
    if (tab==='menu')         this.renderMenu();
    if (tab==='categories')   this.renderCategories();
    if (tab==='gallery')      this.renderGallery();
  },

  // ── LIVE ORDERS ──────────────────────────────────────
  renderLiveOrders(gridId='liveOrdersGrid') {
    const el=$(gridId); if (!el) return;
    if (!state.liveOrders.length) {
      el.innerHTML=`<div class="empty" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg><p>No active orders right now</p></div>`;
      return;
    }
    el.innerHTML=state.liveOrders.map(o=>{
      const items=o.order_items||[];
      const time=fmtTime(o.created_at);
      const actions={
        pending: `<button class="btn btn-accept" onclick="Admin.setOrderStatus('${o.id}','accepted')">Accept</button>`,
        accepted:`<button class="btn btn-ready"  onclick="Admin.setOrderStatus('${o.id}','ready')">Mark Ready</button>`,
        ready:   `<button class="btn btn-complete" onclick="Admin.setOrderStatus('${o.id}','complete')">Complete</button>`
      };
      return `<div class="order-card ${o.status}" onclick="Admin.showOrderDetail('${o.id}')" style="cursor:pointer;">
        <div class="order-card-head">
          <span class="order-table">${o.table_number?`Table ${o.table_number}`:'Takeaway'}</span>
          <div style="display:flex;align-items:center;gap:.5rem;">
            <span class="badge badge-${o.status}">${o.status}</span>
            <span class="order-time">${time}</span>
          </div>
        </div>
        <div class="order-body">
          ${o.customer_name?`<div class="order-guest">👤 ${o.customer_name}${o.customer_phone?` · ${o.customer_phone}`:''}</div>`:''}
          <ul class="order-list">
            ${items.slice(0,4).map(i=>`<li>
              <span>${i.quantity}× ${i.item_name||i.name||'Item'}${i.variant_name?` <span style="color:var(--dim);font-size:.7rem;">(${i.variant_name})</span>`:''}</span>
              <span>${fmt((i.unit_price||i.price||0)*i.quantity)}</span>
            </li>`).join('')}
            ${items.length>4?`<li style="color:var(--dim);font-size:.72rem;"><span>+${items.length-4} more items</span></li>`:''}
          </ul>
          ${o.notes?`<div class="order-notes">📝 ${o.notes}</div>`:''}
          <div class="order-total-row">
            <span style="font-family:'DM Mono',monospace;font-size:.62rem;color:var(--dim);">${items.length} item${items.length!==1?'s':''}</span>
            <span class="order-total">${fmt(o.total_amount)}</span>
          </div>
        </div>
        <div class="order-foot" onclick="event.stopPropagation()">
          ${actions[o.status]||''}
          <button class="btn btn-danger" onclick="Admin.setOrderStatus('${o.id}','cancelled')">Cancel</button>
        </div>
      </div>`;
    }).join('');
  },

  // ── ORDER DETAIL MODAL ───────────────────────────────
  showOrderDetail(id) {
    const o = [...state.liveOrders,...state.historyOrders].find(x=>x.id===id);
    if (!o) return;
    const items=o.order_items||[];
    const steps=['pending','accepted','ready','complete'];
    const curIdx=steps.indexOf(o.status);

    $('orderModalTitle').textContent = `Order — ${o.table_number?'Table '+o.table_number:'Takeaway'}`;
    $('orderModalBody').innerHTML=`
      <div class="order-detail-section">
        <div class="order-detail-label">Status Flow</div>
        <div class="status-flow">
          ${steps.map((s,i)=>`<div class="status-step ${i<curIdx?'done':''} ${i===curIdx&&o.status!=='cancelled'?'active':''}">
            <span class="dot"></span><span>${s}</span>
          </div>${i<steps.length-1?'<span class="status-arrow">›</span>':''}`).join('')}
          ${o.status==='cancelled'?`<span style="margin-left:.5rem;"><span class="badge badge-cancelled">cancelled</span></span>`:''}
        </div>
      </div>
      <div class="detail-grid" style="margin-bottom:1.25rem;">
        <div class="detail-field"><label>Order ID</label><span style="font-family:'DM Mono',monospace;font-size:.75rem;">${o.id}</span></div>
        <div class="detail-field"><label>Placed at</label><span>${fmtDT(o.created_at)}</span></div>
        <div class="detail-field"><label>Customer</label><span>${o.customer_name||'—'}</span></div>
        <div class="detail-field"><label>Phone</label><span>${o.customer_phone||'—'}</span></div>
        ${o.notes?`<div class="detail-field" style="grid-column:1/-1"><label>Notes</label><span style="color:var(--gold);font-style:italic;">${o.notes}</span></div>`:''}
      </div>
      <div class="order-detail-section">
        <div class="order-detail-label">Items Ordered</div>
        <ul class="order-detail-items">
          ${items.map(i=>`<li>
            <span>${i.quantity}× ${i.item_name||i.name||'Item'}${i.variant_name?` <em style="color:var(--dim);font-size:.8rem;">(${i.variant_name})</em>`:''}</span>
            <span style="color:var(--muted);font-family:'DM Mono',monospace;font-size:.75rem;">${fmt(i.unit_price||i.price||0)} ea.</span>
            <span style="color:var(--gold);font-family:'Playfair Display',serif;">${fmt((i.unit_price||i.price||0)*i.quantity)}</span>
          </li>`).join('')}
        </ul>
        <div class="order-detail-total">
          <span>${items.length} item${items.length!==1?'s':''} · ${fmt(o.total_amount)} total</span>
          <span>${fmt(o.total_amount)}</span>
        </div>
      </div>`;

    const foot = $('orderModalFoot');
    const printBtn = `<button class="btn btn-ghost" id="adminPrintBtn" data-orderid="${o.id}">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print Receipt
    </button>`;
    if (['pending','accepted','ready'].includes(o.status)) {
      const next={pending:'accepted',accepted:'ready',ready:'complete'};
      const label={accepted:'Accept',ready:'Mark Ready',complete:'Complete'}[next[o.status]||'']||'Next';
      const cls={accepted:'btn-accept',ready:'btn-ready',complete:'btn-complete'}[next[o.status]||'']||'btn-ghost';
      foot.innerHTML=`
        ${printBtn}
        <button class="btn btn-ghost" onclick="closeModal('orderModal')">Close</button>
        <button class="btn btn-danger" onclick="Admin.setOrderStatus('${o.id}','cancelled');closeModal('orderModal')">Cancel Order</button>
        <button class="btn ${cls}" onclick="Admin.setOrderStatus('${o.id}','${next[o.status]}');closeModal('orderModal')">${label}</button>`;
    } else {
      foot.innerHTML=`${printBtn}<button class="btn btn-ghost" style="flex:1" onclick="closeModal('orderModal')">Close</button>`;
    }
    // Attach print handler safely via JS — avoids popup blockers and ID escaping issues
    const pb = $('adminPrintBtn');
    if (pb) pb.addEventListener('click', () => Admin.printOrderReceipt(pb.dataset.orderid));
    openModal('orderModal');
  },

  // ── HISTORY ──────────────────────────────────────────
  renderHistory() {
    const tbody=$('historyTbody'); if (!tbody) return;
    const filter=$('histFilter')?.value||'all';
    const q=($('histSearch')?.value||'').toLowerCase();
    let orders = filter==='all' ? state.historyOrders : state.historyOrders.filter(o=>o.status===filter);
    if (q) orders=orders.filter(o=>(o.customer_name||'').toLowerCase().includes(q)||`table ${o.table_number}`.includes(q)||(o.id||'').startsWith(q));
    if (!orders.length) {
      tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--dim);">No orders found</td></tr>`; return;
    }
    tbody.innerHTML=orders.map(o=>{
      const items=(o.order_items||[]).map(i=>`${i.quantity}× ${i.item_name||i.name||'Item'}`).join(', ');
      return `<tr onclick="Admin.showOrderDetail('${o.id}')">
        <td class="td-id">${o.id.slice(0,8)}</td>
        <td class="td-name"><strong>${o.table_number?`Table ${o.table_number}`:'Takeaway'}</strong>${o.customer_name?`<small>${o.customer_name}</small>`:''}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.75rem;color:var(--muted);">${items||'—'}</td>
        <td class="td-price">${fmt(o.total_amount)}</td>
        <td><span class="badge badge-${o.status}">${o.status}</span></td>
        <td class="td-mono">${fmtDT(o.created_at)}</td>
      </tr>`;
    }).join('');
  },

  async setOrderStatus(id, status) {
    try {
      const {error} = await supabaseClient.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id);
      if (error) throw error;
      await this.loadOrders();
      toast(`Order ${status}`, status==='cancelled'?'warning':'success');
    } catch(e) { toast('Failed: '+e.message,'error'); }
  },

  // ── RESERVATIONS ─────────────────────────────────────
  renderReservations() {
    const tbody=$('resTbody'); if (!tbody) return;
    const filter=$('resFilter')?.value||'all';
    const q=($('resSearch')?.value||'').toLowerCase();
    let list = filter==='all' ? state.reservations : state.reservations.filter(r=>r.status===filter);
    if (q) list=list.filter(r=>{
      const name=r.guest_name||`${r.first_name||''} ${r.last_name||''}`.trim()||'';
      return name.toLowerCase().includes(q)||(r.phone||'').includes(q)||(r.email||'').toLowerCase().includes(q);
    });
    if (!list.length) {
      tbody.innerHTML=`<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--dim);">No reservations found</td></tr>`; return;
    }
    tbody.innerHTML=list.map(r=>{
      const name=r.guest_name||`${r.first_name||''} ${r.last_name||''}`.trim()||'—';
      const date=r.reservation_date||r.date||'—';
      const time=r.reservation_time||r.time||'—';
      const phone=r.phone||r.guest_phone||'';
      const actions=[];
      if (r.status==='pending') actions.push(`<button class="icon-btn" title="Confirm" onclick="event.stopPropagation();Admin.setResStatus('${r.id}','confirmed')">${IC.confirm}</button>`);
      if (r.status!=='cancelled') actions.push(`<button class="icon-btn del" title="Cancel" onclick="event.stopPropagation();Admin.setResStatus('${r.id}','cancelled')">${IC.x}</button>`);
      actions.push(`<button class="icon-btn" title="View" onclick="event.stopPropagation();Admin.showResDetail('${r.id}')">${IC.eye}</button>`);
      return `<tr onclick="Admin.showResDetail('${r.id}')">
        <td class="td-id">${r.id.slice(0,8)}</td>
        <td class="td-name"><strong>${name}</strong>${phone?`<small>${phone}</small>`:''}</td>
        <td class="td-mono">${date}</td>
        <td class="td-mono">${time}</td>
        <td>${r.party_size||'—'} guests</td>
        <td style="text-transform:capitalize;font-size:.78rem;">${r.occasion||'—'}</td>
        <td><span class="badge badge-${r.status}">${r.status}</span></td>
        <td><div class="td-actions">${actions.join('')}</div></td>
      </tr>`;
    }).join('');
  },

  renderTodayRes() {
    const tbody=$('todayResTbody'); if (!tbody) return;
    const today=new Date().toISOString().split('T')[0];
    const list=state.reservations.filter(r=>(r.reservation_date||r.date||'')===today);
    if (!list.length) {
      tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--dim);">No reservations today</td></tr>`; return;
    }
    tbody.innerHTML=list.map(r=>{
      const name=r.guest_name||`${r.first_name||''} ${r.last_name||''}`.trim()||'—';
      const time=r.reservation_time||r.time||'—';
      const actions=[];
      if (r.status==='pending') actions.push(`<button class="icon-btn" title="Confirm" onclick="Admin.setResStatus('${r.id}','confirmed')">${IC.confirm}</button>`);
      if (r.status!=='cancelled') actions.push(`<button class="icon-btn del" title="Cancel" onclick="Admin.setResStatus('${r.id}','cancelled')">${IC.x}</button>`);
      return `<tr>
        <td class="td-name"><strong>${name}</strong></td>
        <td class="td-mono">${time}</td>
        <td>${r.party_size||'—'} guests</td>
        <td style="text-transform:capitalize;font-size:.78rem;">${r.occasion||'—'}</td>
        <td><span class="badge badge-${r.status}">${r.status}</span></td>
        <td><div class="td-actions">${actions.join('')}</div></td>
      </tr>`;
    }).join('');
  },

  // ── RES DETAIL MODAL ─────────────────────────────────
  showResDetail(id) {
    const r=state.reservations.find(x=>x.id===id); if (!r) return;
    const name=r.guest_name||`${r.first_name||''} ${r.last_name||''}`.trim()||'—';
    $('resModalTitle').textContent=`Reservation — ${name}`;
    $('resModalBody').innerHTML=`
      <div class="detail-grid">
        <div class="detail-field"><label>Ref ID</label><span style="font-family:'DM Mono',monospace;font-size:.75rem;">${r.id}</span></div>
        <div class="detail-field"><label>Status</label><span class="badge badge-${r.status}">${r.status}</span></div>
        <div class="detail-field"><label>Guest Name</label><span>${name}</span></div>
        <div class="detail-field"><label>Phone</label><span>${r.phone||r.guest_phone||'—'}</span></div>
        <div class="detail-field"><label>Email</label><span>${r.email||'—'}</span></div>
        <div class="detail-field"><label>Party Size</label><span>${r.party_size||'—'} guests</span></div>
        <div class="detail-field"><label>Date</label><span>${r.reservation_date||r.date||'—'}</span></div>
        <div class="detail-field"><label>Time</label><span>${r.reservation_time||r.time||'—'}</span></div>
        <div class="detail-field"><label>Occasion</label><span style="text-transform:capitalize;">${r.occasion||'—'}</span></div>
        <div class="detail-field"><label>Booked at</label><span>${fmtDT(r.created_at)}</span></div>
        ${(r.special_requests||r.notes)?`<div class="detail-field" style="grid-column:1/-1"><label>Special Requests</label><span style="color:var(--gold);font-style:italic;">${r.special_requests||r.notes}</span></div>`:''}
      </div>`;
    const foot=$('resModalFoot');
    const btns=[];
    if (r.status==='pending')   btns.push(`<button class="btn btn-accept" onclick="Admin.setResStatus('${r.id}','confirmed');closeModal('resModal')">Confirm Reservation</button>`);
    if (r.status!=='cancelled') btns.push(`<button class="btn btn-danger" onclick="Admin.setResStatus('${r.id}','cancelled');closeModal('resModal')">Cancel Reservation</button>`);
    foot.innerHTML=`<button class="btn btn-ghost" onclick="closeModal('resModal')">Close</button>${btns.join('')}`;
    openModal('resModal');
  },

  async setResStatus(id, status) {
    try {
      const {error} = await supabaseClient.from('reservations').update({status}).eq('id',id);
      if (error) throw error;
      await this.loadReservations();
      toast(`Reservation ${status}`, status==='confirmed'?'success':'info');
    } catch(e) { toast('Failed: '+e.message,'error'); }
  },

  // ── ACTIVITY FEED ────────────────────────────────────
  renderActivity() {
    const el=$('activityFeed'); if (!el) return;
    const allOrders=[...state.liveOrders,...state.historyOrders.slice(0,20)];
    const allRes=state.reservations.slice(0,10);

    // merge & sort by created_at
    const events=[
      ...allOrders.map(o=>({type:'order',data:o,ts:o.created_at})),
      ...allRes.map(r=>({type:'res',data:r,ts:r.created_at}))
    ].sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,15);

    if (!events.length) { el.innerHTML=`<div class="empty"><p>No recent activity</p></div>`; return; }
    el.innerHTML=`<div class="activity-list">${events.map(ev=>{
      if (ev.type==='order') {
        const o=ev.data;
        const isCancelled=o.status==='cancelled';
        const icon=isCancelled?'cancel':'order';
        const label=isCancelled?'Order cancelled':'New order';
        return `<div class="activity-item">
          <div class="activity-icon ${icon}">${isCancelled?'❌':'🍽️'}</div>
          <div class="activity-text">
            <strong>${label}</strong> — ${o.table_number?`Table ${o.table_number}`:'Takeaway'}
            ${o.customer_name?` · ${o.customer_name}`:''}
            <br><small>${ago(o.created_at)} · <span class="badge badge-${o.status}" style="font-size:.5rem;">${o.status}</span></small>
          </div>
          <span class="activity-amt">${fmt(o.total_amount)}</span>
        </div>`;
      } else {
        const r=ev.data;
        const name=r.guest_name||`${r.first_name||''} ${r.last_name||''}`.trim()||'Guest';
        return `<div class="activity-item">
          <div class="activity-icon res">📅</div>
          <div class="activity-text">
            <strong>Reservation</strong> — ${name}, ${r.party_size||'?'} guests
            <br><small>${ago(r.created_at)} · ${r.reservation_date||r.date||'?'} at ${r.reservation_time||r.time||'?'} · <span class="badge badge-${r.status}" style="font-size:.5rem;">${r.status}</span></small>
          </div>
        </div>`;
      }
    }).join('')}</div>`;
  },

  // ── ANALYTICS ────────────────────────────────────────
  renderAnalytics() {
    const allOrders=[...state.liveOrders,...state.historyOrders];
    const nonCancelled = allOrders.filter(o=>o.status!=='cancelled');
    const completed    = allOrders.filter(o=>['complete','completed'].includes(o.status));
    const totalRev     = nonCancelled.reduce((s,o)=>s+Number(o.total_amount||0),0);
    const completedRev = completed.reduce((s,o)=>s+Number(o.total_amount||0),0);
    const avgOrder     = completed.length ? Math.round(completedRev/completed.length) : 0;
    const compRate     = allOrders.length ? Math.round(completed.length/allOrders.length*100) : 0;
    set('kpiTotal',      allOrders.length);
    set('kpiRevenue',    fmt(totalRev));
    set('kpiAvgOrder',   fmt(avgOrder));
    set('kpiCompletion', `${compRate}%`);

    // Revenue last 7 days (local date)
    const days7=[];
    for (let i=6;i>=0;i--) {
      const d=new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
      const next=new Date(d); next.setDate(next.getDate()+1);
      const dayOrders=allOrders.filter(o=>{
        if (!o.created_at||o.status==='cancelled') return false;
        const t=new Date(o.created_at).getTime();
        return t>=d.getTime()&&t<next.getTime();
      });
      const rev=dayOrders.reduce((s,o)=>s+Number(o.total_amount||0),0);
      days7.push({label:d.toLocaleDateString('en-NG',{weekday:'short'}),val:rev,count:dayOrders.length});
    }
    const rev7max=days7.length?Math.max(...days7.map(d=>d.val),1):1;
    this._renderBarChart('revenueChart', days7, v=>v?fmt(v):'₦0', rev7max);

    // Orders by status donut
    const statuses=['pending','accepted','ready','complete','completed','cancelled'];
    const statusColors={'pending':'#e8a840','accepted':'#7ec898','ready':'#c9a84c','complete':'#8a7f6a','completed':'#8a7f6a','cancelled':'#e09090'};
    const statusCounts=statuses.map(s=>({label:s,val:allOrders.filter(o=>o.status===s).length,color:statusColors[s]||'#555'})).filter(s=>s.val>0);
    this._renderDonut('statusChart', statusCounts);

    // Top menu items by order count
    const itemFreq={};
    allOrders.forEach(o=>(o.order_items||[]).forEach(i=>{
      const name=i.item_name||i.name||'Unknown';
      itemFreq[name]=(itemFreq[name]||0)+Number(i.quantity||1);
    }));
    const topItems=Object.entries(itemFreq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,val])=>({label,val}));
    const topMax = topItems.length ? Math.max(...topItems.map(d=>d.val)) : 1;
    this._renderBarChart('topItemsChart', topItems.length ? topItems : [{label:'No orders yet',val:0}], v=>v ? v+' orders' : '—', topMax);

    // Orders by category
    const catFreq={};
    allOrders.forEach(o=>(o.order_items||[]).forEach(i=>{
      const itemObj=state.menuItems.find(m=>m.id===i.menu_item_id);
      const cat=itemObj?.categories?.name||'Uncategorised';
      catFreq[cat]=(catFreq[cat]||0)+Number(i.quantity||1);
    }));
    const catData=Object.entries(catFreq).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,val])=>({label,val}));
    const catMax = catData.length ? Math.max(...catData.map(d=>d.val)) : 1;
    this._renderBarChart('catChart', catData.length ? catData : [{label:'No data yet',val:0}], v=>v ? v+' orders' : '—', catMax);

    // Reservations last 7 days
    const resDays=[];
    for (let i=6;i>=0;i--) {
      const d=new Date(); d.setDate(d.getDate()-i);
      const key=d.toISOString().split('T')[0];
      const count=state.reservations.filter(r=>{
        const rd=r.reservation_date||r.date||'';
        return rd===key;
      }).length;
      resDays.push({label:d.toLocaleDateString('en-NG',{weekday:'short'}),val:count});
    }
    this._renderBarChart('resChart', resDays, v=>v ? v+' bookings' : '0', Math.max(...resDays.map(d=>d.val), 1));

    // Reservation status donut
    const resStatuses=['pending','confirmed','cancelled','no_show'];
    const resColors={pending:'#e8a840',confirmed:'#7ec898',cancelled:'#e09090',no_show:'#c49090'};
    const resCounts=resStatuses.map(s=>({label:s,val:state.reservations.filter(r=>r.status===s).length,color:resColors[s]})).filter(s=>s.val>0);
    this._renderDonut('resStatusChart', resCounts.length?resCounts:[{label:'No data',val:1,color:'var(--dim)'}]);
  },

  _renderBarChart(id, data, fmtFn, max) {
    const el=$(id); if (!el) return;
    if (!data.length) { el.innerHTML=`<div class="empty"><p>No data yet</p></div>`; return; }
    el.innerHTML=`<div class="bar-chart">${data.map(d=>`
      <div class="bar-row">
        <div class="bar-label" title="${d.label}">${d.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${max>0?Math.round(d.val/max*100):0}%"></div></div>
        <div class="bar-val">${fmtFn(d.val)}</div>
      </div>`).join('')}</div>`;
  },

  _renderDonut(id, data) {
    const el=$(id); if (!el) return;
    const total=data.reduce((s,d)=>s+d.val,0)||1;
    const r=54, cx=64, cy=64, circ=2*Math.PI*r;
    let offset=0;
    const segments=data.map(d=>{
      const pct=d.val/total;
      const dash=pct*circ;
      const seg=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="16" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-offset}" style="transition:stroke-dashoffset .6s"/>`;
      offset+=dash;
      return seg;
    });
    el.innerHTML=`
      <svg class="donut" width="128" height="128" viewBox="0 0 128 128">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg4)" stroke-width="16"/>
        ${segments.join('')}
      </svg>
      <div class="donut-legend">
        ${data.map(d=>`<div class="donut-item">
          <span class="donut-dot" style="background:${d.color}"></span>
          <span class="donut-name" style="text-transform:capitalize;">${d.label}</span>
          <span class="donut-pct">${Math.round(d.val/total*100)}%</span>
        </div>`).join('')}
      </div>`;
  },

  // ── MENU ─────────────────────────────────────────────
  renderMenu() {
    const el=$('menuManageGrid'); if (!el) return;
    const q=($('menuSearch')?.value||'').toLowerCase();
    const catF=$('menuCatFilter')?.value||'all';
    const availF=$('menuAvailFilter')?.value||'all';
    let items=state.menuItems;
    if (q) items=items.filter(i=>i.name.toLowerCase().includes(q)||(i.description||'').toLowerCase().includes(q));
    if (catF!=='all') items=items.filter(i=>i.category_id===catF);
    if (availF==='available') items=items.filter(i=>i.available);
    if (availF==='hidden')    items=items.filter(i=>!i.available);
    if (!items.length) {
      el.innerHTML=`<div class="empty" style="grid-column:1/-1"><p>${q?'No items match your search.':'No menu items yet.'}</p></div>`; return;
    }
    el.innerHTML=items.map(item=>{
      const cat=item.categories?.name||'';
      const img=item.image_url||'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=60';
      return `<div class="manage-card">
        <img class="manage-card-img" src="${img}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=60'">
        <div class="manage-card-body">
          <div class="manage-card-name">${item.emoji?item.emoji+' ':''}${item.name}</div>
          <div class="manage-card-price">${fmt(item.price)}</div>
          ${cat?`<div class="manage-card-cat">${cat}</div>`:''}
          <div class="item-flags">
            ${item.is_popular?`<span class="item-flag on">⭐ popular</span>`:''}
            ${item.is_new?`<span class="item-flag on">✨ new</span>`:''}
            ${item.is_halal?`<span class="item-flag on">☪ halal</span>`:``}
          </div>
        </div>
        <div class="manage-card-foot">
          <div class="avail-label">
            <label class="toggle" title="Toggle availability">
              <input type="checkbox" ${item.available?'checked':''} onchange="Admin.toggleAvailability('${item.id}',this.checked)">
              <span class="toggle-track"></span>
            </label>
            ${item.available?'<span style="color:var(--success);font-size:.68rem;">Available</span>':'<span style="color:var(--dim);font-size:.68rem;">Hidden</span>'}
          </div>
          <div class="td-actions">
            <button class="icon-btn" title="Edit" onclick="openItemModal('${item.id}')">${IC.edit}</button>
            <button class="icon-btn del" title="Delete" onclick="Admin.deleteMenuItem('${item.id}','${item.name.replace(/'/g,"\\'")}')">${IC.trash}</button>
          </div>
        </div>
      </div>`;
    }).join('');
  },

  async toggleAvailability(id, available) {
    try {
      const {error}=await supabaseClient.from('menu_items').update({available}).eq('id',id);
      if (error) throw error;
      const item=state.menuItems.find(i=>i.id===id);
      if (item) item.available=available;
      this.renderMenu();
      this.renderStats();
      toast(`${available?'Now available':'Hidden from menu'}`, available?'success':'info');
    } catch(e) { toast('Failed: '+e.message,'error'); }
  },

  async deleteMenuItem(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const {error}=await supabaseClient.from('menu_items').delete().eq('id',id);
      if (error) throw error;
      state.menuItems=state.menuItems.filter(i=>i.id!==id);
      this.renderMenu(); this.renderStats();
      toast(`${name} deleted`,'success');
    } catch(e) { toast('Failed: '+e.message,'error'); }
  },

  // ── GALLERY ──────────────────────────────────────────
  renderGallery() {
    const el=$('galleryGrid'); if (!el) return;
    if (!state.galleryImages.length) {
      el.innerHTML=`<div class="empty" style="grid-column:1/-1"><p>No gallery images yet.</p></div>`; return;
    }
    el.innerHTML=state.galleryImages.map(img=>`
      <div class="manage-card">
        <img class="manage-card-img" src="${img.image_url}" alt="${img.caption||''}" onerror="this.style.display='none'">
        <div class="manage-card-body">
          <div class="manage-card-name" style="font-size:.85rem;">${img.caption||'No caption'}</div>
          <div class="manage-card-cat">${img.category||'general'}</div>
        </div>
        <div class="manage-card-foot">
          <a href="${img.image_url}" target="_blank" class="icon-btn" title="Open">${IC.eye}</a>
          <button class="icon-btn del" title="Delete" onclick="Admin.deleteGalleryImage('${img.id}')">${IC.trash}</button>
        </div>
      </div>`).join('');
  },

  async deleteGalleryImage(id) {
    if (!confirm('Remove this image from the gallery?')) return;
    try {
      const {error}=await supabaseClient.from('gallery').delete().eq('id',id);
      if (error) throw error;
      state.galleryImages=state.galleryImages.filter(i=>i.id!==id);
      set('galleryCount',`${state.galleryImages.length} images`);
      this.renderGallery();
      toast('Image removed','success');
    } catch(e) { toast('Failed: '+e.message,'error'); }
  },

  // ── CATEGORIES ───────────────────────────────────────
  renderCategories() {
    const tbody=$('catTbody'); if (!tbody) return;
    if (!state.categories.length) {
      tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--dim);">No categories yet</td></tr>`; return;
    }
    tbody.innerHTML=state.categories.map(c=>{
      const count=state.menuItems.filter(i=>i.category_id===c.id).length;
      return `<tr>
        <td style="font-size:1.2rem;text-align:center;">${c.emoji||'—'}</td>
        <td><strong style="color:var(--cream);">${c.name}</strong></td>
        <td style="font-size:.78rem;color:var(--muted);">${c.description||'—'}</td>
        <td><span class="chip">${count}</span></td>
        <td><div class="td-actions">
          <button class="icon-btn del" title="Delete" onclick="Admin.deleteCategory('${c.id}','${c.name.replace(/'/g,"\\'")}')">${IC.trash}</button>
        </div></td>
      </tr>`;
    }).join('');
  },

  async deleteCategory(id, name) {
    const used=state.menuItems.filter(i=>i.category_id===id).length;
    if (used>0) { toast(`Cannot delete — ${used} item(s) use this category`,'warning'); return; }
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const {error}=await supabaseClient.from('categories').delete().eq('id',id);
      if (error) throw error;
      state.categories=state.categories.filter(c=>c.id!==id);
      this.renderCategories();
      toast(`${name} deleted`,'success');
    } catch(e) { toast('Failed: '+e.message,'error'); }
  },

  // ── PRINT ORDER RECEIPT ──────────────────────────────────
  printOrderReceipt(id) {
    const o=[...state.liveOrders,...state.historyOrders].find(x=>x.id===id);
    if (!o) return;
    const items  = o.order_items||[];
    const total  = Number(o.total_amount||0);
    const ref    = o.id.slice(0,8).toUpperCase();
    const dateStr= fmtDT(o.created_at);

    const rows = items.map(i=>{
      const name     = i.item_name||i.name||'Item';
      const variant  = i.variant_name ? ` (${i.variant_name})` : '';
      const price    = (i.unit_price||i.price||0)*i.quantity;
      return `<tr>
        <td class="item-name">${i.quantity}&times; ${name}${variant}</td>
        <td class="item-price">&#8358;${price.toLocaleString()}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt #${ref} — Cairo Restaurant</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px; color: #111; background: #fff;
      padding: 28px 20px; max-width: 340px; margin: 0 auto;
    }
    .header { text-align:center; margin-bottom:18px; }
    .brand  { font-family:Georgia,'Times New Roman',serif; font-size:28px; letter-spacing:.3em; font-weight:bold; line-height:1; }
    .sub    { font-size:11px; letter-spacing:.18em; color:#444; margin-top:3px; text-transform:uppercase; }
    .addr   { font-size:10px; color:#666; margin-top:6px; line-height:1.6; }
    .dash   { border:none; border-top:1px dashed #bbb; margin:12px 0; }
    .solid  { border:none; border-top:2px solid #111; margin:12px 0; }
    .meta   { font-size:11px; color:#555; line-height:1.9; }
    .meta .row { display:flex; justify-content:space-between; }
    .meta .lbl { color:#999; }
    table { width:100%; border-collapse:collapse; }
    .item-name  { padding:5px 0; font-size:12px; width:72%; vertical-align:top; }
    .item-price { padding:5px 0; font-size:12px; text-align:right; white-space:nowrap; vertical-align:top; }
    tfoot td { font-size:15px; font-weight:bold; padding-top:10px; }
    .pay-box {
      border:1px dashed #c9a84c; border-radius:4px; padding:10px 12px;
      margin:14px 0; font-size:11px; color:#555; line-height:1.7;
      text-align:center;
    }
    .pay-box strong { color:#111; font-size:12px; display:block; margin-bottom:3px; }
    .pay-icons { font-size:18px; letter-spacing:6px; margin-top:4px; }
    .notes  { font-size:11px; color:#555; font-style:italic; margin-top:6px; }
    .footer { text-align:center; font-size:11px; color:#777; margin-top:20px; line-height:1.8; }
    .footer .ty { font-size:13px; font-weight:bold; color:#333; margin-bottom:3px; }
    .print-wrap { text-align:center; margin-top:20px; }
    .print-btn  { padding:10px 32px; background:#c9a84c; color:#1a1510; border:none; border-radius:5px; font-size:13px; font-weight:bold; cursor:pointer; }
    .print-btn:hover { background:#e8c96a; }
    @media print { body{padding:0;} .print-wrap{display:none;} }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">CAIRO</div>
    <div class="sub">Restaurant</div>
    <div class="addr">
      Zaria Sokoto Rd, opposite Polo Field<br>
      Zaria 810103, Kaduna State<br>
      Tel: 0903 537 8726
    </div>
  </div>

  <hr class="dash">

  <div class="meta">
    <div class="row"><span class="lbl">Date</span><span>${dateStr}</span></div>
    <div class="row"><span class="lbl">Table</span><span>${o.table_number||'Takeaway'}</span></div>
    ${o.customer_name?`<div class="row"><span class="lbl">Guest</span><span>${o.customer_name}</span></div>`:''}
    ${o.customer_phone?`<div class="row"><span class="lbl">Phone</span><span>${o.customer_phone}</span></div>`:''}
    <div class="row"><span class="lbl">Order Ref</span><span>#${ref}</span></div>
    <div class="row"><span class="lbl">Status</span><span>${o.status.toUpperCase()}</span></div>
  </div>

  <hr class="solid">

  <table>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="2"><hr class="dash" style="margin:6px 0;"></td></tr>
      <tr>
        <td class="item-name">TOTAL</td>
        <td class="item-price">&#8358;${total.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>

  ${o.notes?`<div class="notes">Note: ${o.notes}</div>`:''}

  <div class="pay-box">
    <strong>💳 Payment at the Counter</strong>
    We accept cash, bank transfer &amp; POS card payments.<br>
    Please settle your bill before leaving.
    <div class="pay-icons">💵 💳 🏦</div>
  </div>

  <hr class="dash">

  <div class="footer">
    <div class="ty">Thank you for dining with us!</div>
    <div>We hope to see you again soon ✨</div>
    <div style="margin-top:8px;font-size:10px;color:#aaa;">cairo-restaurant.vercel.app</div>
  </div>

  <div class="print-wrap">
    <button class="print-btn" onclick="window.print()">🖨️ Print</button>
  </div>

  <script>
    window.addEventListener('load', function() { window.print(); });
  <\/script>
</body>
</html>`;

    // Use Blob URL — never blocked by popup blockers
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank', 'width=440,height=720,toolbar=0,menubar=0,scrollbars=yes');
    if (!win) {
      // Last resort fallback: navigate directly
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
};

// ── ITEM MODAL ─────────────────────────────────────────
function openItemModal(id) {
  const modal=$('itemModal'); if (!modal) return;
  if (id) {
    const item=state.menuItems.find(i=>i.id===id); if (!item) return;
    $('itemModalTitle').textContent='Edit Menu Item';
    $('editId').value=item.id; $('editName').value=item.name;
    $('editPrice').value=item.price; $('editCat').value=item.category_id||'';
    $('editEmoji').value=item.emoji||''; $('editDesc').value=item.description||'';
    $('editImage').value=item.image_url||'';
    $('editPopular').checked=!!item.is_popular; $('editNew').checked=!!item.is_new;
    $('editHalal').checked=item.is_halal!==false; $('editAvailable').checked=item.available!==false;
    const prev=$('editImgPreview');
    if (prev&&item.image_url){prev.src=item.image_url;prev.classList.add('show');}
  } else {
    $('itemModalTitle').textContent='Add Menu Item';
    ['editId','editName','editPrice','editEmoji','editDesc','editImage'].forEach(id=>$(id).value='');
    $('editCat').value='';
    $('editPopular').checked=false; $('editNew').checked=false;
    $('editHalal').checked=true; $('editAvailable').checked=true;
    const prev=$('editImgPreview');
    if (prev){prev.src='';prev.classList.remove('show');}
  }
  modal.classList.add('show');
}

function closeItemModal() { $('itemModal')?.classList.remove('show'); }

function previewEditImg() {
  const url=$('editImage')?.value.trim(), prev=$('editImgPreview'); if (!prev) return;
  if (url){prev.src=url;prev.classList.add('show');}else prev.classList.remove('show');
}

async function saveMenuItem() {
  const id=$('editId').value;
  const name=$('editName').value.trim();
  const price=parseFloat($('editPrice').value);
  if (!name){toast('Name is required','warning');return;}
  if (isNaN(price)||price<0){toast('Enter a valid price','warning');return;}
  const payload={
    name, price,
    category_id:$('editCat').value||null,
    emoji:$('editEmoji').value.trim()||null,
    description:$('editDesc').value.trim()||null,
    image_url:$('editImage').value.trim()||null,
    is_popular:$('editPopular').checked, is_new:$('editNew').checked,
    is_halal:$('editHalal').checked, available:$('editAvailable').checked
  };
  try {
    const {error}=id
      ? await supabaseClient.from('menu_items').update(payload).eq('id',id)
      : await supabaseClient.from('menu_items').insert({...payload,sort_order:state.menuItems.length});
    if (error) throw error;
    closeItemModal();
    await Admin.loadMenuItems();
    Admin.renderMenu(); Admin.renderStats();
    toast(id?'Item updated ✓':'Item added ✓','success');
  } catch(e){ toast('Save failed: '+e.message,'error'); }
}

// ── GALLERY ACTIONS ────────────────────────────────────
function previewGallery() {
  const url=$('galleryUrl')?.value.trim(), prev=$('galleryPreview'); if (!prev) return;
  if (url){prev.src=url;prev.classList.add('show');}else prev.classList.remove('show');
}

async function addGalleryImage() {
  const url=$('galleryUrl').value.trim();
  if (!url){toast('Image URL is required','warning');return;}
  try {
    const {error}=await supabaseClient.from('gallery').insert({
      image_url:url, caption:$('galleryCaption').value.trim()||null,
      category:$('galleryCat').value, sort_order:state.galleryImages.length
    });
    if (error) throw error;
    $('galleryUrl').value=''; $('galleryCaption').value='';
    const prev=$('galleryPreview');
    if (prev){prev.src='';prev.classList.remove('show');}
    await Admin.loadGallery();
    toast('Image added to gallery','success');
  } catch(e){ toast('Failed: '+e.message,'error'); }
}

// ── CATEGORY ACTIONS ───────────────────────────────────
async function addCategory() {
  const name=$('catName').value.trim();
  if (!name){toast('Category name is required','warning');return;}
  try {
    const {error}=await supabaseClient.from('categories').insert({
      name, emoji:$('catEmoji').value.trim()||null,
      description:$('catDesc').value.trim()||null, sort_order:state.categories.length
    });
    if (error) throw error;
    $('catName').value=''; $('catEmoji').value=''; $('catDesc').value='';
    await Admin.loadCategories();
    Admin.renderCategories();
    toast(`${name} added`,'success');
  } catch(e){ toast('Failed: '+e.message,'error'); }
}

// ── LOGIN LOGIC ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  Notifs.init();

  // login helpers
  const loginBtn=$('loginBtn'), loginProgress=$('loginProgress'),
        loginProgressBar=$('loginProgressBar'), loginRetryMsg=$('loginRetryMsg'),
        loginNetWarn=$('loginNetWarn');

  function setLoginLoading(on) {
    loginBtn.disabled=on; loginBtn.classList.toggle('loading',on);
    loginProgress.classList.toggle('active',on);
    if (on){loginProgressBar.classList.add('indeterminate');loginProgressBar.style.width='';}
    else loginProgressBar.classList.remove('indeterminate');
  }

  function showLoginError(title,msg,hint='') {
    $('loginErrTitle').textContent=title; $('loginErrMsg').textContent=msg;
    if (hint){$('loginErrHint').textContent=hint;$('loginErrHint').style.display='block';}
    else $('loginErrHint').style.display='none';
    $('loginErr').classList.add('show');
    ['loginEmail','loginPass'].forEach(id=>{
      const el=$(id); el.classList.add('input-error','input-shake');
      setTimeout(()=>el.classList.remove('input-shake'),450);
    });
  }

  function clearLoginError() {
    $('loginErr').classList.remove('show');
    loginNetWarn.classList.remove('warn');
    loginRetryMsg.textContent='';
    ['loginEmail','loginPass'].forEach(id=>$(id)?.classList.remove('input-error'));
  }

  function humaniseError(err) {
    const raw=(err.message||'').toLowerCase();
    if (raw.includes('failed to fetch')||raw.includes('networkerror')||raw.includes('err_connection')||raw.includes('load failed'))
      return {title:'Connection failed',msg:'Could not reach the server.',hint:"Check your internet. A VPN or firewall might be blocking the request.",isNetwork:true};
    if (raw.includes('timeout')||raw.includes('timed out'))
      return {title:'Request timed out',msg:'The server took too long to respond.',hint:'Try again — your connection may be unstable.',isNetwork:true};
    if (raw.includes('invalid login credentials')||raw.includes('invalid email'))
      return {title:'Incorrect credentials',msg:'The email or password you entered is wrong.',hint:''};
    if (raw.includes('email not confirmed'))
      return {title:'Email not verified',msg:'Confirm your email address first.',hint:''};
    if (raw.includes('too many requests')||raw.includes('rate limit'))
      return {title:'Too many attempts',msg:"You've been temporarily locked out.",hint:'Wait a few minutes then try again.'};
    return {title:'Sign-in failed',msg:err.message||'An unexpected error occurred.',hint:''};
  }

  let retryTimer=null;
  function startRetry(s) {
    loginRetryMsg.textContent=`Retry in ${s}s`;
    retryTimer=setInterval(()=>{
      s--;
      if (s<=0){clearInterval(retryTimer);loginRetryMsg.textContent='';loginBtn.disabled=false;}
      else loginRetryMsg.textContent=`Retry in ${s}s`;
    },1000);
  }

  $('loginForm')?.addEventListener('submit', async ()=>{
    const email=$('loginEmail').value.trim(), pass=$('loginPass').value;
    if (!email||!pass){showLoginError('Missing fields','Enter both your email and password.');return;}
    clearLoginError(); setLoginLoading(true);
    loginBtn.querySelector('.btn-login-text').textContent='Signing in';
    try {
      await Promise.race([
        Auth.login(email,pass),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('Request timed out')),12000))
      ]);
      loginBtn.classList.remove('loading'); loginBtn.classList.add('success-state');
      loginBtn.querySelector('.btn-login-text').textContent='✓ Signed in';
      loginProgressBar.classList.remove('indeterminate'); loginProgressBar.style.width='100%';
    } catch(e) {
      setLoginLoading(false);
      loginBtn.querySelector('.btn-login-text').textContent='Sign In';
      const p=humaniseError(e);
      if (p.isNetwork){loginNetWarn.classList.add('warn');startRetry(8);}
      showLoginError(p.title,p.msg,p.hint);
    }
  });

  ['loginEmail','loginPass'].forEach(id=>$(id)?.addEventListener('input',clearLoginError));

  // nav
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn=>
    btn.addEventListener('click',()=>Admin.renderTab(btn.dataset.tab))
  );

  // logout
  $('logoutBtn')?.addEventListener('click',()=>Auth.logout());

  // modal close on backdrop
  ['itemModal','orderModal','resModal'].forEach(id=>{
    $(id)?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal(id);});
  });

  // ESC closes any open modal
  document.addEventListener('keydown',e=>{
    if (e.key==='Escape') ['itemModal','orderModal','resModal'].forEach(closeModal);
  });

  await Auth.init();
});
