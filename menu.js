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

function showOrderSuccess(order, items, total) {
  document.getElementById('cartPanel')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('active');

  // Store receipt data on window so printReceipt() can access it safely
  window._lastReceipt = { order, items, total };

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'successModal';

  const itemsHtml = items.map(i => `
    <div class="order-summary-item">
      <span>${i.quantity}× ${i.name}${i.variantName ? ` (${i.variantName})` : ''}</span>
      <span>₦${(i.price * i.quantity).toLocaleString()}</span>
    </div>`).join('');

  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-body" style="text-align:center; padding-top:2.5rem;">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(74,158,92,0.1);border:2px solid var(--success);
          display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;animation:successPop 0.4s cubic-bezier(.18,.89,.32,1.28) both;">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--success)" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.5rem;color:var(--cream);margin-bottom:0.4rem;">Order Placed!</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1.5rem;">
          Table <strong>${order.table_number}</strong> — your order is heading to the kitchen.
        </p>
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;text-align:left;margin-bottom:0.5rem;">
          ${itemsHtml}
          <div class="order-summary-total">
            <span>Total</span>
            <span>₦${total.toLocaleString()}</span>
          </div>
        </div>
        <p style="font-family:'DM Mono',monospace;font-size:0.6rem;letter-spacing:0.1em;color:var(--text-dim);margin-top:0.5rem;">
          Order ref: ${order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
      <div class="modal-actions">
        <button id="printReceiptBtn" style="flex:1;padding:0.75rem;background:transparent;border:1px solid var(--gold-dark);color:var(--gold);border-radius:var(--radius);font-size:0.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print Receipt
        </button>
        <button class="btn-gold" style="flex:1" onclick="document.getElementById('successModal').remove()">Done</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Attach click handler directly — no data through HTML attributes
  document.getElementById('printReceiptBtn').addEventListener('click', () => {
    const r = window._lastReceipt;
    if (r) printReceipt(r.order, r.items, r.total);
  });
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