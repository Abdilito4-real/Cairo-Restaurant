// ═══════════════════════════════════════════════════════════
// CAIRO RESTAURANT — MENU PAGE
// ═══════════════════════════════════════════════════════════

let cart          = [];
let allMenuItems  = [];
let allCategories = [];
let currentFilter = 'all';
let currentSearch = '';

// ── CART PERSISTENCE ────────────────────────────────────────
function loadCart() {
  try {
    const saved = localStorage.getItem('cairo-cart');
    cart = saved ? JSON.parse(saved) : [];
  } catch { cart = []; }
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('cairo-cart', JSON.stringify(cart));
  updateCartUI();
}

// ── CART UI ─────────────────────────────────────────────────
function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll('#cartCount, #mobileCartCount').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
  renderCart();
}

function toggleCart() {
  const panel   = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  const isOpen  = panel.classList.contains('open');
  panel.classList.toggle('open', !isOpen);
  overlay.classList.toggle('active', !isOpen);
  if (!isOpen) renderCart();
}

function renderCart() {
  const body   = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p>Your cart is empty</p>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  body.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.variantName ? `<div class="cart-item-variant">${item.variantName}</div>` : ''}
        <div class="cart-item-price">₦${(item.price * item.quantity).toLocaleString()}</div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" onclick="changeCartQty(${idx}, -1)">−</button>
          <span style="font-family:'DM Mono',monospace;font-size:0.82rem;min-width:20px;text-align:center;">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="changeCartQty(${idx}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${idx})" title="Remove">&times;</button>
    </div>`).join('');

  const total  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = `₦${total.toLocaleString()}`;
  if (footer) footer.style.display = 'block';
}

function changeCartQty(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) cart.splice(idx, 1);
  saveCart();
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  saveCart();
  showToast('Item removed', 'info');
}

// ── SKELETON LOADER ──────────────────────────────────────────
function showSkeletons(count = 8) {
  const container = document.getElementById('menuContainer');
  if (!container) return;
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="menu-card skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-desc"></div>
        <div class="skeleton skeleton-desc" style="width:60%;"></div>
        <div class="skeleton skeleton-price"></div>
      </div>
    </div>`).join('');
}

function showFilterSkeletons() {
  const container = document.getElementById('filterButtons');
  if (!container) return;
  container.innerHTML = Array.from({ length: 5 }, (_, i) => `
    <div class="skeleton skeleton-filter" style="width:${60 + i * 15}px;"></div>`).join('');
}

// ── ERROR STATE ──────────────────────────────────────────────
function showMenuError(err) {
  const container = document.getElementById('menuContainer');
  if (!container) return;

  const isNetwork = err.message && (
    err.message.includes('Failed to fetch') ||
    err.message.includes('NetworkError') ||
    err.message.includes('timeout')
  );

  container.innerHTML = `
    <div class="menu-error" style="grid-column:1/-1;">
      <div class="menu-error-icon">
        ${isNetwork
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
        }
      </div>
      <h3 class="menu-error-title">${isNetwork ? 'Connection problem' : 'Could not load menu'}</h3>
      <p class="menu-error-msg">${isNetwork
        ? 'Check your internet connection and try again.'
        : 'Something went wrong fetching the menu.'
      }</p>
      <button class="menu-error-retry" onclick="retryLoad()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
        Try Again
      </button>
    </div>`;
}

async function retryLoad() {
  showSkeletons();
  showFilterSkeletons();
  await init();
}

// ── FETCH DATA ───────────────────────────────────────────────
async function fetchMenuData() {
  // Fetch with 10s timeout
  const withTimeout = (promise, ms = 10000) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
  ]);

  const [catsRes, itemsRes] = await Promise.all([
    withTimeout(supabaseClient.from('categories').select('*').order('name')),
    withTimeout(
      supabaseClient
        .from('menu_items')
        .select('*, menu_item_variants(*)')
        .eq('available', true)
        .order('name')
    )
  ]);

  if (catsRes.error)  throw catsRes.error;
  if (itemsRes.error) throw itemsRes.error;

  allCategories = catsRes.data  || [];
  allMenuItems  = itemsRes.data || [];
}

// ── FILTERS ──────────────────────────────────────────────────
function renderFilters() {
  const container = document.getElementById('filterButtons');
  if (!container) return;
  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className   = 'filter-btn active';
  allBtn.dataset.filter = 'all';
  allBtn.innerHTML   = 'All <span class="filter-count">' + allMenuItems.length + '</span>';
  allBtn.onclick     = () => setFilter('all', allBtn);
  container.appendChild(allBtn);

  const maxVis = 4;
  allCategories.forEach((cat, i) => {
    const count = allMenuItems.filter(m => m.category_id === cat.id).length;
    if (count === 0) return; // hide empty categories
    const btn = document.createElement('button');
    btn.className     = 'filter-btn' + (i >= maxVis ? ' optional' : '');
    if (i >= maxVis) btn.style.display = 'none';
    btn.dataset.filter = cat.id;
    btn.innerHTML     = `${cat.emoji ? cat.emoji + ' ' : ''}${cat.name} <span class="filter-count">${count}</span>`;
    btn.onclick       = () => setFilter(cat.id, btn);
    container.appendChild(btn);
  });

  if (allCategories.length > maxVis) {
    const more = document.createElement('button');
    more.className = 'filter-btn btn-more-filters';
    more.textContent = 'More ›';
    more.onclick = () => {
      const expanded = container.classList.toggle('expanded');
      container.querySelectorAll('.filter-btn.optional').forEach(b => {
        b.style.display = expanded ? 'inline-flex' : 'none';
      });
      more.textContent = expanded ? '‹ Less' : 'More ›';
    };
    container.appendChild(more);
  }
}

function setFilter(catId, btnEl) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  currentFilter = catId;
  renderMenuItems();
}

// ── RENDER ITEMS ─────────────────────────────────────────────
function getFilteredItems() {
  let items = allMenuItems;
  if (currentFilter !== 'all') {
    items = items.filter(i => i.category_id === currentFilter);
  }
  if (currentSearch) {
    const term = currentSearch.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(term) ||
      (i.description || '').toLowerCase().includes(term)
    );
  }
  return items;
}

function renderMenuItems() {
  const container = document.getElementById('menuContainer');
  if (!container) return;
  const items = getFilteredItems();

  if (!items.length) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 1rem;">
        <div style="font-size:2.5rem;opacity:0.3;margin-bottom:1rem;">🍽️</div>
        <p style="color:var(--text-dim);font-family:'DM Mono',monospace;font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;">
          ${currentSearch ? 'No dishes match your search' : 'No dishes in this category yet'}
        </p>
        ${currentSearch ? `<button style="margin-top:1rem;padding:0.5rem 1.25rem;background:transparent;border:1px solid var(--gold-dark);color:var(--gold);border-radius:6px;font-size:0.8rem;cursor:pointer;" onclick="document.getElementById('searchInput').value='';currentSearch='';renderMenuItems();">Clear search</button>` : ''}
      </div>`;
    return;
  }

  container.innerHTML = '';
  items.forEach((item, idx) => {
    const cat      = allCategories.find(c => c.id === item.category_id);
    const variants = (item.menu_item_variants || []).sort((a, b) => a.price - b.price);
    const hasVar   = variants.length > 0;
    const basePrice = hasVar ? variants[0].price : item.price;

    // Badges
    const badges = [];
    if (item.is_popular) badges.push(`<span class="item-badge badge-popular">⭐ Popular</span>`);
    if (item.is_new)     badges.push(`<span class="item-badge badge-new">✨ New</span>`);
    if (item.is_halal !== false) badges.push(`<span class="item-badge badge-halal">☪ Halal</span>`);

    const catLabel = cat
      ? `<span class="menu-card-category">${cat.emoji ? cat.emoji + ' ' : ''}${cat.name}</span>`
      : '';

    const variantHtml = hasVar ? `
      <div class="variant-wrapper">
        <svg class="variant-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
        <select class="variant-select" id="var-${item.id}" onchange="updateItemPrice('${item.id}')">
          ${variants.map(v => `<option value="${v.id}" data-price="${v.price}">${v.name} — ₦${Number(v.price).toLocaleString()}</option>`).join('')}
        </select>
      </div>` : '';

    const card = document.createElement('div');
    card.className = 'menu-card';
    card.style.animationDelay = `${Math.min(idx, 12) * 45}ms`;

    card.innerHTML = `
      <div class="menu-card-image-wrapper">
        <img src="${item.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=70'}"
             alt="${item.name}" class="menu-card-image" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=70'">
        ${catLabel}
        ${badges.length ? `<div class="item-badges">${badges.join('')}</div>` : ''}
        <div class="image-overlay">
          <button class="overlay-order-btn" onclick="quickAdd('${item.id}')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Quick Add
          </button>
        </div>
      </div>
      <div class="menu-card-content">
        <div class="menu-card-body">
          <h3 class="menu-card-title">${item.emoji ? item.emoji + ' ' : ''}${item.name}</h3>
          <p class="menu-card-desc">${item.description || 'A Cairo Restaurant signature dish.'}</p>
        </div>
        <div class="menu-card-footer">
          ${variantHtml}
          <div class="menu-card-actions">
            <div class="price-qty-row">
              <div class="price-block">
                <span class="price-label">Price</span>
                <span class="menu-card-price" id="price-${item.id}">₦${Number(basePrice).toLocaleString()}</span>
              </div>
              <div class="qty-selector">
                <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
                <span class="qty-display" id="qty-${item.id}">1</span>
                <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
              </div>
            </div>
            <button class="add-to-cart-btn" onclick="addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}')">
              Add to Order
            </button>
          </div>
        </div>
      </div>`;

    container.appendChild(card);
  });
}

// ── QTY CONTROLS ─────────────────────────────────────────────
const qtyState = {};

function changeQty(itemId, delta) {
  if (!qtyState[itemId]) qtyState[itemId] = 1;
  qtyState[itemId] = Math.max(1, qtyState[itemId] + delta);
  const el = document.getElementById(`qty-${itemId}`);
  if (el) el.textContent = qtyState[itemId];
}

function updateItemPrice(itemId) {
  const sel = document.getElementById(`var-${itemId}`);
  if (!sel) return;
  const opt   = sel.options[sel.selectedIndex];
  const price = Number(opt.dataset.price);
  const el    = document.getElementById(`price-${itemId}`);
  if (el) el.textContent = `₦${price.toLocaleString()}`;
}

function getCurrentPrice(itemId) {
  const sel = document.getElementById(`var-${itemId}`);
  if (sel) {
    const opt = sel.options[sel.selectedIndex];
    return {
      price:       Number(opt.dataset.price),
      variantId:   opt.value,
      variantName: opt.text.split(' — ')[0]
    };
  }
  const item = allMenuItems.find(i => i.id === itemId);
  return { price: Number(item?.price || 0), variantId: null, variantName: null };
}

// ── ADD TO CART ───────────────────────────────────────────────
function addToCart(itemId, itemName) {
  const qty = qtyState[itemId] || 1;
  const { price, variantId, variantName } = getCurrentPrice(itemId);

  const existing = cart.find(c => c.itemId === itemId && c.variantId === variantId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ itemId, variantId, name: itemName, variantName, price, quantity: qty });
  }

  qtyState[itemId] = 1;
  const qtyEl = document.getElementById(`qty-${itemId}`);
  if (qtyEl) qtyEl.textContent = '1';

  saveCart();
  showToast(`${itemName} added to order`, 'success');

  // Bounce cart icon
  document.querySelectorAll('#cartCount, #mobileCartCount').forEach(el => {
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  });

  // Auto-open the cart panel so user can review & place order
  const panel   = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  if (panel && !panel.classList.contains('open')) {
    panel.classList.add('open');
    overlay?.classList.add('active');
    renderCart();
  }
}

function quickAdd(itemId) {
  const item = allMenuItems.find(i => i.id === itemId);
  if (item) addToCart(itemId, item.name);
}

// ── SUBMIT ORDER ─────────────────────────────────────────────
async function submitOrder() {
  if (cart.length === 0) { showToast('Add items to your order first', 'warning'); return; }

  const tableNum = document.getElementById('tableNumber')?.value.trim();
  if (!tableNum) {
    showToast('Please enter your table number', 'warning');
    document.getElementById('tableNumber')?.focus();
    return;
  }

  const btn = document.getElementById('checkoutBtn');
  const resetBtn = () => {
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = 'Place Order';
  };

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span style="display:flex;align-items:center;gap:0.5rem;justify-content:center;">
      <svg style="animation:spin 0.7s linear infinite" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Placing order…
    </span>`;
  }

  try {
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const { data: order, error: orderErr } = await supabaseClient
      .from('orders')
      .insert({
        table_number:  tableNum,
        customer_name: document.getElementById('customerName')?.value.trim() || null,
        notes:         document.getElementById('orderNotes')?.value.trim() || null,
        status:        'pending',
        total_amount:  total
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    const orderItems = cart.map(item => ({
      order_id:     order.id,
      menu_item_id: item.itemId,
      variant_id:   item.variantId || null,
      name:         item.name,
      item_name:    item.name,
      variant_name: item.variantName || null,
      price:        item.price,
      unit_price:   item.price,
      quantity:     item.quantity
    }));

    const { error: itemsErr } = await supabaseClient.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    const orderedItems = [...cart];
    // Clear cart & inputs for next order
    cart = [];
    saveCart();
    if (document.getElementById('tableNumber'))  document.getElementById('tableNumber').value  = tableNum; // keep table
    if (document.getElementById('customerName')) document.getElementById('customerName').value = '';
    if (document.getElementById('orderNotes'))   document.getElementById('orderNotes').value   = '';
    resetBtn(); // always reset button before showing success

    showOrderSuccess(order, orderedItems, total);

  } catch (err) {
    console.error('Order failed:', err);
    const isNetwork = err.message?.includes('fetch') || err.message?.includes('timeout');
    showToast(
      isNetwork ? 'No connection — check your network and try again' : `Order failed: ${err.message}`,
      'error'
    );
    resetBtn();
  }
}

// ── TRIVIA DATA ────────────────────────────────────────────────
const _triviaBank = [
  { q:'Which city is Cairo Restaurant located in?',           a:0, opts:['Zaria','Kano','Abuja','Lagos'] },
  { q:'Which Nigerian city is suya originally from?',         a:0, opts:['Zaria / Kaduna','Lagos','Enugu','Port Harcourt'] },
  { q:'What is the main ingredient in egusi soup?',           a:1, opts:['Groundnuts','Melon seeds','Pumpkin seeds','Sesame'] },
  { q:'Jollof rice is traditionally cooked in which base?',   a:0, opts:['Tomato stew','Palm oil','Groundnut oil','Coconut milk'] },
  { q:'Which spice blend is essential for suya?',             a:1, opts:['Ras el hanout','Yaji (kuli-kuli)','Za\'atar','Berbere'] },
  { q:'Kilishi is the dried version of which food?',          a:0, opts:['Suya','Bole','Asun','Nkwobi'] },
  { q:'What gives Nigerian fried rice its colour?',           a:2, opts:['Saffron','Curry only','Turmeric & curry','Food dye'] },
  { q:'Zobo drink is made from which plant?',                 a:0, opts:['Roselle / Hibiscus','Jasmine','Lavender','Rose'] },
  { q:'Tuwo shinkafa is made from which grain?',              a:1, opts:['Yam','Rice','Cassava','Maize'] },
  { q:'What does "halal" mean in Arabic?',                    a:1, opts:['Blessed','Permissible','Pure','Fresh'] },
  { q:'Akara is made primarily from which ingredient?',       a:0, opts:['Black-eyed peas','Lentils','Chickpeas','Millet'] },
  { q:'Puff-puff is most similar to which western food?',     a:0, opts:['Doughnuts','Churros','Beignets','Waffles'] },
  { q:'Which state in Nigeria is known for miyan taushe?',    a:1, opts:['Kaduna','Kano','Borno','Sokoto'] },
  { q:'Dan wake is made from which flour?',                   a:0, opts:['Bean flour','Rice flour','Corn flour','Wheat flour'] },
  { q:'Fura da nono is a drink popular in which region?',     a:0, opts:['Northern Nigeria','Southern Nigeria','Eastern Nigeria','Western Nigeria'] },
];
let _triviaScore = 0;
let _triviaTotal = 0;

function showOrderSuccess(order, items, total) {
  document.getElementById('cartPanel')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('active');
  window._lastReceipt = { order, items, total };
  document.getElementById('successModal')?.remove();

  // Reset trivia state for this session
  _triviaScore = 0;
  _triviaTotal = 0;

  // Upsells — popular items not in this order
  const orderedIds = new Set(items.map(i => i.id));
  const upsells = allMenuItems
    .filter(m => !orderedIds.has(m.id) && m.available !== false)
    .sort((a,b) => (b.is_popular?1:0)-(a.is_popular?1:0))
    .slice(0,3);

  // Wait time estimate
  const qty      = items.reduce((s,i) => s+i.quantity, 0);
  const waitMins = Math.max(10, Math.min(35, 8 + qty * 2));

  // Trivia pick
  const trivia = _triviaBank[Math.floor(Math.random()*_triviaBank.length)];

  const upsellsHtml = upsells.length ? `
    <div class="poe-section">
      <div class="poe-section-title">🍽️ You Might Also Like</div>
      <div class="poe-upsells">
        ${upsells.map(m=>`
          <div class="poe-upsell-card" id="upsell-${m.id}">
            ${m.image_url
              ? `<img src="${m.image_url}" class="poe-upsell-img" onerror="this.style.display='none'" loading="lazy">`
              : `<div class="poe-upsell-emoji">${m.emoji||'🍽️'}</div>`}
            <div class="poe-upsell-body">
              <div class="poe-upsell-name">${m.name}</div>
              <div class="poe-upsell-price">₦${Number(m.price||0).toLocaleString()}</div>
            </div>
            <button class="poe-upsell-btn" onclick="poeAddUpsell('${m.id}')">+ Add</button>
          </div>`).join('')}
      </div>
    </div>` : '';

  const overlay = document.createElement('div');
  overlay.id = 'successModal';
  overlay.className = 'poe-overlay';

  overlay.innerHTML = `
    <div class="poe-sheet">

      <!-- HEADER -->
      <div class="poe-header">
        <div class="poe-check"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h2 class="poe-title">Order Placed! 🎉</h2>
        <p class="poe-ref">Table <strong>${order.table_number||'—'}</strong> &nbsp;·&nbsp; Ref <strong>#${order.id.slice(0,8).toUpperCase()}</strong></p>
      </div>

      <div class="poe-body">

        <!-- 1. LIVE TRACKER + WAIT TIMER -->
        <div class="poe-section">
          <div class="poe-section-title">📡 Live Order Status</div>
          <div class="poe-tracker" id="poeTracker">
            <div class="poe-step done"  id="poe-s0"><div class="poe-step-dot"></div><div class="poe-step-lbl">Received</div></div>
            <div class="poe-step-line"></div>
            <div class="poe-step active" id="poe-s1"><div class="poe-step-dot"></div><div class="poe-step-lbl">Kitchen</div></div>
            <div class="poe-step-line"></div>
            <div class="poe-step" id="poe-s2"><div class="poe-step-dot"></div><div class="poe-step-lbl">Preparing</div></div>
            <div class="poe-step-line"></div>
            <div class="poe-step" id="poe-s3"><div class="poe-step-dot"></div><div class="poe-step-lbl">Ready! ✅</div></div>
          </div>
          <div class="poe-wait-box">
            <div class="poe-wait-text">
              <div class="poe-wait-label">Estimated wait</div>
              <div class="poe-wait-mins" id="poeCountdown">${waitMins}:00</div>
            </div>
            <svg class="poe-ring" viewBox="0 0 56 56">
              <circle class="poe-ring-bg" cx="28" cy="28" r="22"/>
              <circle class="poe-ring-prog" id="poeRing" cx="28" cy="28" r="22"
                stroke-dasharray="138.2" stroke-dashoffset="0"/>
            </svg>
          </div>
        </div>

        <!-- 2. ORDER SUMMARY -->
        <div class="poe-section">
          <div class="poe-section-title">🧾 Your Order</div>
          <div class="poe-order-list">
            ${items.map(i=>`
              <div class="poe-order-row">
                <span class="poe-qty">${i.quantity}×</span>
                <span class="poe-item-name">${i.name}${i.variantName?` <em>(${i.variantName})</em>`:''}</span>
                <span class="poe-item-price">₦${(i.price*i.quantity).toLocaleString()}</span>
              </div>`).join('')}
            <div class="poe-total-row"><span>Total</span><span>₦${total.toLocaleString()}</span></div>
          </div>
        </div>

        <!-- 3. UPSELLS -->
        ${upsellsHtml}

        <!-- 4. TRIVIA -->
        <div class="poe-section">
          <div class="poe-section-title">🎯 Food Trivia — Play While You Wait!</div>
          <div class="poe-trivia" id="poeTrivia">
            <div class="poe-trivia-score" id="poeTriviaScore">Score: 0 / 0</div>
            <div class="poe-trivia-q" id="poeTriviaQ">${trivia.q}</div>
            <div class="poe-trivia-opts" id="poeTriviaOpts">
              ${trivia.opts.map((o,i)=>`<button class="poe-opt" onclick="poeTriviaAnswer(${i},${trivia.a})">${o}</button>`).join('')}
            </div>
            <div class="poe-trivia-result" id="poeTriviaResult"></div>
            <button class="poe-trivia-next" id="poeTriviaNext" style="display:none" onclick="poeNextTrivia()">Next Question →</button>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="poe-actions">
          <button class="poe-btn-outline" id="poeReceiptBtn">🖨️ Print Receipt</button>
          <button class="poe-btn-close" onclick="document.getElementById('successModal').remove()">Close</button>
        </div>

      </div><!-- /poe-body -->
    </div><!-- /poe-sheet -->
  `;

  document.body.appendChild(overlay);

  // Print handler
  document.getElementById('poeReceiptBtn').addEventListener('click', () => {
    const r = window._lastReceipt;
    if (r) printReceipt(r.order, r.items, r.total);
  });

  // ── COUNTDOWN ─────────────────────────────────────────
  let secsLeft = waitMins * 60;
  const totalSecs = secsLeft;
  const circumference = 138.2;
  const ringEl = document.getElementById('poeRing');
  const cdEl   = document.getElementById('poeCountdown');

  const ticker = setInterval(() => {
    if (!document.getElementById('successModal')) { clearInterval(ticker); return; }
    secsLeft = Math.max(0, secsLeft - 1);
    const m = Math.floor(secsLeft/60), s = secsLeft%60;
    if (cdEl) cdEl.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if (ringEl) ringEl.style.strokeDashoffset = String(circumference * (secsLeft / totalSecs));
    if (secsLeft === 0) clearInterval(ticker);
  }, 1000);

  // ── LIVE STATUS POLL ───────────────────────────────────
  const orderId  = order.id;
  let lastStatus = 'pending';
  const stepMap  = { pending:1, accepted:2, ready:3, complete:3 };

  const poller = setInterval(async () => {
    if (!document.getElementById('successModal')) { clearInterval(poller); return; }
    try {
      const { data } = await supabaseClient.from('orders').select('status').eq('id',orderId).single();
      if (!data || data.status === lastStatus) return;
      lastStatus = data.status;
      const activeStep = stepMap[data.status] ?? 1;
      for (let i = 0; i <= 3; i++) {
        const el = document.getElementById(`poe-s${i}`);
        if (!el) continue;
        el.className = 'poe-step' + (i < activeStep ? ' done' : i === activeStep ? ' active' : '');
      }
      // Flash tracker to show update
      const tracker = document.getElementById('poeTracker');
      if (tracker) {
        tracker.style.transition = 'none';
        tracker.style.background = 'rgba(201,168,76,0.08)';
        setTimeout(() => { tracker.style.background = ''; }, 600);
      }
      if (data.status === 'ready') {
        cdEl && (cdEl.textContent = 'Ready!');
        cdEl && (cdEl.style.color = '#4ade80');
        if (ringEl) ringEl.style.stroke = '#4ade80';
        clearInterval(ticker);
        const waitBox = document.querySelector('.poe-wait-box');
        if (waitBox) {
          waitBox.innerHTML = '<div class="poe-ready-banner">🍽️ Your food is ready! Please collect it.</div>';
        }
      }
    } catch(_) {}
  }, 8000);
}

// ── TRIVIA LOGIC ──────────────────────────────────────────────
function poeTriviaAnswer(chosen, correct) {
  document.querySelectorAll('.poe-opt').forEach((btn, i) => {
    btn.disabled = true;
    btn.classList.toggle('poe-opt-correct', i === correct);
    btn.classList.toggle('poe-opt-wrong', i === chosen && chosen !== correct);
  });
  _triviaTotal++;
  if (chosen === correct) _triviaScore++;
  const res  = document.getElementById('poeTriviaResult');
  const next = document.getElementById('poeTriviaNext');
  const scEl = document.getElementById('poeTriviaScore');
  if (scEl) scEl.textContent = `Score: ${_triviaScore} / ${_triviaTotal}`;
  if (res) {
    res.className = 'poe-trivia-result ' + (chosen === correct ? 'correct' : 'wrong');
    res.textContent = chosen === correct
      ? '✓ Correct! Great knowledge! 🎉'
      : `✗ Not quite — the answer was "${document.querySelectorAll('.poe-opt')[correct]?.textContent}"`;
  }
  if (next) next.style.display = 'inline-flex';
}

function poeNextTrivia() {
  const pick  = _triviaBank[Math.floor(Math.random() * _triviaBank.length)];
  const qEl   = document.getElementById('poeTriviaQ');
  const optsEl= document.getElementById('poeTriviaOpts');
  const resEl = document.getElementById('poeTriviaResult');
  const nextEl= document.getElementById('poeTriviaNext');
  if (!qEl) return;
  qEl.textContent = pick.q;
  optsEl.innerHTML = pick.opts.map((o,i) =>
    `<button class="poe-opt" onclick="poeTriviaAnswer(${i},${pick.a})">${o}</button>`
  ).join('');
  if (resEl) { resEl.textContent = ''; resEl.className = 'poe-trivia-result'; }
  if (nextEl) nextEl.style.display = 'none';
}

function poeAddUpsell(itemId) {
  const item = allMenuItems.find(m => m.id === itemId);
  if (!item) return;
  addToCart(item, null, null);
  const card = document.getElementById(`upsell-${itemId}`);
  if (card) {
    card.classList.add('poe-upsell-added');
    const btn = card.querySelector('.poe-upsell-btn');
    if (btn) { btn.textContent = '✓ Added'; btn.disabled = true; }
  }
}

// ── PRINT RECEIPT ─────────────────────────────────────────────
function printReceipt(order, items, total) {
  const ref      = order.id.slice(0, 8).toUpperCase();
  const table    = order.table_number || 'Takeaway';
  const guest    = order.customer_name || '';
  const notes    = order.notes || '';
  const dateStr  = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

  const rows = items.map(i => {
    const lineTotal = (i.price * i.quantity).toLocaleString();
    const variant   = i.variantName ? ` (${i.variantName})` : '';
    return `<tr>
      <td class="item-name">${i.quantity}&times; ${i.name}${variant}</td>
      <td class="item-price">&#8358;${lineTotal}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt #${ref} — Cairo Restaurant</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 28px 20px;
      max-width: 340px;
      margin: 0 auto;
    }

    /* ── HEADER ── */
    .header { text-align: center; margin-bottom: 18px; }
    .header .brand {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      letter-spacing: 0.3em;
      font-weight: bold;
      line-height: 1;
    }
    .header .sub {
      font-size: 11px;
      letter-spacing: 0.18em;
      color: #444;
      margin-top: 3px;
      text-transform: uppercase;
    }
    .header .address {
      font-size: 10px;
      color: #666;
      margin-top: 6px;
      line-height: 1.5;
    }

    /* ── DIVIDER ── */
    .dash { border: none; border-top: 1px dashed #bbb; margin: 12px 0; }
    .solid { border: none; border-top: 2px solid #111; margin: 12px 0; }

    /* ── META ── */
    .meta { font-size: 11px; color: #555; line-height: 1.8; margin-bottom: 4px; }
    .meta .row { display: flex; justify-content: space-between; }
    .meta .label { color: #888; }

    /* ── ITEMS TABLE ── */
    table { width: 100%; border-collapse: collapse; }
    .item-name { padding: 5px 0; font-size: 12px; width: 75%; vertical-align: top; }
    .item-price { padding: 5px 0; font-size: 12px; text-align: right; white-space: nowrap; vertical-align: top; }

    /* ── TOTAL ── */
    .total-row { }
    .total-row td {
      padding-top: 10px;
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 0.04em;
    }

    /* ── NOTES ── */
    .notes-block { font-size: 11px; color: #555; margin-top: 6px; font-style: italic; }

    /* ── FOOTER ── */
    .footer {
      text-align: center;
      font-size: 11px;
      color: #777;
      margin-top: 22px;
      line-height: 1.8;
    }
    .footer .thank { font-size: 13px; font-weight: bold; color: #333; margin-bottom: 3px; }

    /* ── PRINT BUTTON (screen only) ── */
    .print-btn-wrap { text-align: center; margin-top: 20px; }
    .print-btn {
      padding: 10px 32px;
      background: #c9a84c;
      color: #1a1510;
      border: none;
      border-radius: 5px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      letter-spacing: 0.04em;
    }
    .print-btn:hover { background: #e8c96a; }

    @media print {
      body { padding: 0; }
      .print-btn-wrap { display: none; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">CAIRO</div>
    <div class="sub">Restaurant</div>
    <div class="address">
      Zaria Sokoto Rd, opposite Polo Field<br>
      Zaria 810103, Kaduna State<br>
      Tel: 0903 537 8726
    </div>
  </div>

  <hr class="dash">

  <div class="meta">
    <div class="row"><span class="label">Date</span><span>${dateStr}</span></div>
    <div class="row"><span class="label">Table</span><span>${table}</span></div>
    ${guest ? `<div class="row"><span class="label">Guest</span><span>${guest}</span></div>` : ''}
    <div class="row"><span class="label">Order Ref</span><span>#${ref}</span></div>
  </div>

  <hr class="solid">

  <table>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr><td colspan="2"><hr class="dash" style="margin:6px 0;"></td></tr>
      <tr class="total-row">
        <td>TOTAL</td>
        <td class="item-price">&#8358;${total.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>

  ${notes ? `<div class="notes-block">Note: ${notes}</div>` : ''}

  <div style="border:1px dashed #c9a84c;border-radius:4px;padding:10px 12px;margin:14px 0;font-size:11px;color:#555;line-height:1.7;text-align:center;">
    <strong style="color:#111;font-size:12px;display:block;margin-bottom:3px;">💳 Payment at the Counter</strong>
    We accept cash, bank transfer &amp; POS card payments.<br>
    Please settle your bill before leaving.
    <div style="font-size:18px;letter-spacing:6px;margin-top:5px;">💵 💳 🏦</div>
  </div>

  <hr class="dash">

  <div class="footer">
    <div class="thank">Thank you for dining with us!</div>
    <div>We hope to see you again soon ✨</div>
    <div style="margin-top:8px;font-size:10px;color:#aaa;">cairo-restaurant.vercel.app</div>
  </div>

  <div class="print-btn-wrap">
    <button class="print-btn" onclick="window.print()">🖨️ Print</button>
  </div>

  <script>
    // Auto-print when window opens
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 300);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=440,height=680,toolbar=0,menubar=0');
  if (!win) {
    // Popup blocked — fallback: open in same tab
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.target = '_blank'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ── TOAST ────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    <div class="toast-progress"></div>`;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.querySelector('.toast-progress').style.animation = 'toastProgress 4000ms linear forwards';
  });
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── SEARCH ───────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── INIT ─────────────────────────────────────────────────────
async function init() {
  showSkeletons(8);
  showFilterSkeletons();
  try {
    await fetchMenuData();
    renderFilters();
    renderMenuItems();
  } catch (err) {
    console.error('Menu load failed:', err);
    showMenuError(err);
    // Reset filter bar on error
    const fb = document.getElementById('filterButtons');
    if (fb) fb.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  init();

  const si = document.getElementById('searchInput');
  if (si) {
    si.addEventListener('input', debounce(e => {
      currentSearch = e.target.value.trim();
      renderMenuItems();
    }, 280));
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('cartPanel')?.classList.remove('open');
      document.getElementById('cartOverlay')?.classList.remove('active');
      document.getElementById('successModal')?.remove();
    }
  });
});
