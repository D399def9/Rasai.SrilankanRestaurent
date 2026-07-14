
/* ========================= DATA (in-memory) ========================= */
const STR = {
  en: {
    tagline:"Today's menu", search:"Search dishes…", addToCart:"Add", cart:"Cart", checkout:"Checkout",
    yourOrder:"Your order", empty:"Your cart is empty.", browseMenu:"Browse the menu",
    subtotal:"Subtotal", total:"Total", placeOrder:"Place order",
    signInGoogle:"Continue with Google", or:"or", guest:"Continue as guest",
    name:"Name", phone:"Phone number", confirm:"Confirm order",
    orderPlaced:"Order confirmed", track:"Track order", received:"Received", preparing:"Preparing", ready:"Ready", info:"Info",
    menu:"Menu", homeTab:"Home", cartTab:"Cart", infoTab:"Info", welcome:"Welcome to", popular:"Popular",
    hours:"Opening hours", location:"Location", contact:"Contact", languages:"Language",
    soldOut:"Sold out", ticketNo:"Ticket", itemsWord:"items", each:"ea",
  },
  it: {
    tagline:"Il menu di oggi", search:"Cerca un piatto…", addToCart:"Aggiungi", cart:"Carrello", checkout:"Ordina",
    yourOrder:"Il tuo ordine", empty:"Il carrello è vuoto.", browseMenu:"Sfoglia il menu",
    subtotal:"Subtotale", total:"Totale", placeOrder:"Invia ordine",
    signInGoogle:"Continua con Google", or:"oppure", guest:"Continua come ospite",
    name:"Nome", phone:"Numero di telefono", confirm:"Conferma ordine",
    orderPlaced:"Ordine confermato", track:"Stato ordine", received:"Ricevuto", preparing:"In preparazione", ready:"Pronto", info:"Info",
    menu:"Menu", homeTab:"Home", cartTab:"Carrello", infoTab:"Info", welcome:"Benvenuti da", popular:"Popolare",
    hours:"Orari", location:"Indirizzo", contact:"Contatti", languages:"Lingua",
    soldOut:"Esaurito", ticketNo:"Comanda", itemsWord:"piatti", each:"cad.",
  }
};

let nextId = 100;
const db = {
  restaurant: { name: 'Rasai', hours: 'Tue–Sun · 12:00–15:00 & 19:00–23:00', phone:'+94 77 123 4567', address: 'Colombo, Sri Lanka' },
  lang: 'en',
  categories:[
    {id:'short-eats', en:'Short Eats', it:'Stuzzichini'},
    {id:'mains', en:'Mains', it:'Piatti Forti'},
    {id:'sambols', en:'Sambols & Sides', it:'Contorni'},
    {id:'dolci', en:'Desserts', it:'Dolci'}
  ],
  dishes:[
    {id:1, cat:'short-eats', en:'Mutton Rolls', it:'Involtini', price:8.5, photo:'🌯', available:true, popular:true,
      descEn:'Spiced minced mutton and potato fried to golden perfection.', descIt:'Carne di montone speziata e patate fritti.'},
    {id:2, cat:'short-eats', en:'Egg Hopper (Appa)', it:'Egg Hopper', price:4.5, photo:'🍳', available:true, popular:false,
      descEn:'Bowl-shaped fermented rice flour crepe with a soft-boiled egg in the center.', descIt:'Crepe di farina di riso fermentata con uovo al centro.'},
    {id:3, cat:'mains', en:'Kottu Roti (Chicken)', it:'Kottu Roti', price:14.5, photo:'🥘', available:true, popular:true,
      descEn:'Shredded roti stir-fried with vegetables, egg, aromatic spices, and curry chicken.', descIt:'Roti sminuzzato e saltato con verdure, uova, spezie e pollo al curry.'},
    {id:4, cat:'mains', en:'Ceylon Black Pork Curry', it:'Curry nero di maiale', price:16, photo:'🍲', available:true, popular:false,
      descEn:'Tender pork belly slow-cooked in a dark, heavily roasted Sri Lankan spice blend.', descIt:'Pancetta di maiale stufata lentamente con spezie tostate.'},
    {id:5, cat:'sambols', en:'Pol Sambol', it:'Pol Sambol', price:3.5, photo:'🥥', available:true, popular:true,
      descEn:'Freshly grated coconut ground with red onions, dried chilies, lime, and salt.', descIt:'Cocco grattugiato fresco, cipolla rossa, peperoncino e lime.'},
    {id:6, cat:'dolci', en:'Watalappan', it:'Watalappan', price:7, photo:'🍮', available:true, popular:true,
      descEn:'Traditional spiced coconut custard sweetened with dark kithul jaggery and cardamom.', descIt:'Budino di latte di cocco speziato al cardamomo e zucchero di palma kithul.'}
  ],
  orders: [],
  promotions: [
    {id:1, title:'Welcome Offer', desc:'Use code RASAI20 for 20% off your first delivery order.', active:true}
  ]
};

const session = {
  shell:'customer',
  lang:'en',
  page:'home',
  activeCat:'short-eats',
  search:'',
  cart:{}, // dishId -> qty
  user:null, // {name, phone, method}
  currentOrderId:null,
  adminPage:'orders',
};

let ticketCounter = 41;

/* ========================= HELPERS ========================= */
function t(key){ return STR[session.lang][key]; }
function fmt(n){ return '€'+n.toFixed(2); }
function dishName(d){ return session.lang==='it' ? d.it : d.en; }
function dishDesc(d){ return session.lang==='it' ? d.descIt : d.descEn; }
function catName(c){ return session.lang==='it' ? c.it : c.en; }
function cartCount(){ return Object.values(session.cart).reduce((a,b)=>a+b,0); }
function cartTotal(){
  return Object.entries(session.cart).reduce((sum,[id,qty])=>{
    const d = db.dishes.find(x=>x.id==id); return sum + (d? d.price*qty : 0);
  },0);
}
function showToast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 1800);
}
function statusLabel(s){
  return s==='received'? t('received') : s==='preparing'? t('preparing') : t('ready');
}

/* ========================= STAFF ACCESS ========================= */
const ADMIN_PASSWORD = 'staff2026';

function openAdminGate(){
  const gate = document.getElementById('adminGate');
  const input = document.getElementById('adminPasswordInput');
  if(gate){ gate.classList.add('active'); }
  if(input){ input.value=''; input.focus(); }
}

function closeAdminGate(){
  const gate = document.getElementById('adminGate');
  if(gate){ gate.classList.remove('active'); }
}

function submitAdminPassword(){
  const input = document.getElementById('adminPasswordInput');
  if(!input) return;
  if(input.value.trim() === ADMIN_PASSWORD){
    closeAdminGate();
    setShell('admin');
    showToast('Admin access granted');
  } else {
    input.value='';
    input.focus();
    showToast('Incorrect password');
  }
}

function setShell(which){
  session.shell = which;
  const staffBtn = document.getElementById('staffAccessBtn');
  if(staffBtn){ staffBtn.classList.toggle('active', which==='admin'); }
  document.getElementById('customerStage').style.display = which==='customer' ? 'flex' : 'none';
  document.getElementById('adminWrap').classList.toggle('active', which==='admin');
  if(which==='admin') renderAdmin(); else { renderCustomer(); closeAdminGate(); }
}

/* ========================= CUSTOMER RENDER ========================= */
function setLang(l){ session.lang = l; renderCustomer(); }
function setPage(p){ session.page = p; renderCustomer(); }
function setCat(c){ session.activeCat = c; renderCustomer(); }

function addToCart(id){
  session.cart[id] = (session.cart[id]||0)+1;
  renderCustomer();
  showToast(session.lang==='it' ? 'Aggiunto al carrello' : 'Added to cart');
}
function changeQty(id, delta){
  const cur = session.cart[id]||0;
  const next = cur+delta;
  if(next<=0) delete session.cart[id]; else session.cart[id]=next;
  renderCustomer();
}

function renderCustomer(){
  const s = document.getElementById('screen');
  let html = '';

  if(session.page==='home' || session.page==='menu'){
    html += headerBlock();
    html += `<div class="cats">` + db.categories.map(c=>
      `<button class="cat-pill ${session.activeCat===c.id?'active':''}" onclick="setCat('${c.id}')">${catName(c)}</button>`
    ).join('') + `</div>`;
    html += `<div class="search"><span>🔎</span><input placeholder="${t('search')}" oninput="session.search=this.value; renderDishesOnly();" value="${session.search}"></div>`;
    if(session.page==='home'){
      const active = db.promotions.find(p=>p.active);
      if(active) html += `<div class="promo-banner">🏷️ <b>${active.title}</b> — ${active.desc}</div>`;
    }
    html += `<div id="dishListWrap">` + dishListHtml() + `</div>`;
    if(cartCount()>0){
      html += `<button class="fab-cart" onclick="setPage('cart')"><span>🛒 ${cartCount()} ${t('itemsWord')}</span><span>${fmt(cartTotal())} → </span></button>`;
    }
  }
  else if(session.page==='cart'){
    html += headerBlock(true);
    html += `<div class="section-pad">`;
    const entries = Object.entries(session.cart);
    if(entries.length===0){
      html += `<div class="card" style="text-align:center; padding:30px 14px;">
        <div style="font-size:34px;">🧺</div>
        <p style="color:var(--ink-soft); font-size:13px; margin:10px 0 16px;">${t('empty')}</p>
        <button class="primary-btn ghost" onclick="setPage('home')">${t('browseMenu')}</button>
      </div>`;
    } else {
      html += `<div class="card">`;
      entries.forEach(([id,qty])=>{
        const d = db.dishes.find(x=>x.id==id);
        html += `<div class="cart-row">
          <div class="dish-photo" style="width:46px;height:46px;font-size:20px;">${d.photo}</div>
          <div style="flex:1;">
            <div style="font-weight:600; font-size:13.5px;">${dishName(d)}</div>
            <div style="font-size:11.5px; color:var(--ink-soft);">${fmt(d.price)} ${t('each')}</div>
          </div>
          <div class="qty-ctrl">
            <button onclick="changeQty(${d.id},-1)">−</button>
            <span style="font-weight:700; min-width:14px; text-align:center; display:inline-block;">${qty}</span>
            <button onclick="changeQty(${d.id},1)">+</button>
          </div>
        </div>`;
      });
      html += `</div>`;
      html += `<div class="card" style="margin-top:12px;">
        <div class="totals-row"><span>${t('subtotal')}</span><span>${fmt(cartTotal())}</span></div>
        <div class="totals-row grand"><span>${t('total')}</span><span>${fmt(cartTotal())}</span></div>
      </div>`;
      html += `<button class="primary-btn" onclick="setPage('checkout')">${t('checkout')} · ${fmt(cartTotal())}</button>`;
    }
    html += `</div>`;
  }
  else if(session.page==='checkout'){
    html += headerBlock(true);
    html += `<div class="section-pad">`;
    if(!session.user){
      html += `<h3 style="margin-top:0;">${t('yourOrder')}</h3>`;
      html += `<button class="auth-option google" onclick="signInGoogle()">🔵 ${t('signInGoogle')}</button>`;
      html += `<div class="divider-or">${t('or')}</div>`;
      html += `<div class="card">
        <div class="field"><label>${t('name')}</label><input id="guestName" placeholder="Marco Rossi"></div>
        <div class="field"><label>${t('phone')}</label><input id="guestPhone" placeholder="+39 333 1234567"></div>
        <button class="primary-btn ghost" style="margin-top:4px;" onclick="continueGuest()">${t('guest')}</button>
      </div>`;
    } else {
      html += `<div class="card" style="display:flex; gap:10px; align-items:center;">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--pine);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${session.user.name.charAt(0)}</div>
        <div>
          <div style="font-weight:700; font-size:13.5px;">${session.user.name}</div>
          <div style="font-size:11.5px; color:var(--ink-soft);">${session.user.phone} · ${session.user.method==='google'?'Google':'Guest'}</div>
        </div>
      </div>`;
      html += `<div class="card" style="margin-top:12px;">`;
      Object.entries(session.cart).forEach(([id,qty])=>{
        const d = db.dishes.find(x=>x.id==id);
        html += `<div class="trow" style="display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0;"><span>${qty}× ${dishName(d)}</span><span>${fmt(d.price*qty)}</span></div>`;
      });
      html += `<div class="totals-row grand"><span>${t('total')}</span><span>${fmt(cartTotal())}</span></div>
      </div>`;
      html += `<button class="primary-btn" onclick="placeOrder()">${t('confirm')} · ${fmt(cartTotal())}</button>`;
    }
    html += `</div>`;
  }
  else if(session.page==='tracking'){
    const order = db.orders.find(o=>o.id===session.currentOrderId);
    html += headerBlock(true);
    html += `<div class="ticket-wrap">`;
    if(order) html += ticketHtml(order, true);
    html += `<button class="primary-btn ghost" onclick="setPage('home')">${session.lang==='it'?'Torna al menu':'Back to menu'}</button>`;
    html += `</div>`;
  }
  else if(session.page==='info'){
    html += headerBlock(true);
    html += `<div class="section-pad">
      <div class="card">
        <div class="info-row"><span class="ic">🕐</span><div><b>${t('hours')}</b><br><span style="color:var(--ink-soft);">${db.restaurant.hours}</span></div></div>
        <div class="info-row"><span class="ic">📍</span><div><b>${t('location')}</b><br><span style="color:var(--ink-soft);">${db.restaurant.address}</span></div></div>
        <div class="info-row"><span class="ic">☎️</span><div><b>${t('contact')}</b><br><span style="color:var(--ink-soft);">${db.restaurant.phone}</span></div></div>
        <div class="info-row"><span class="ic">🌐</span><div><b>${t('languages')}</b><br>
          <span style="color:var(--ink-soft);">EN / IT</span>
        </div></div>
      </div>
    </div>`;
  }

  // bottom tabs (hidden on tracking to keep focus)
  if(session.page!=='tracking'){
    html += `<div class="bottom-tabs">
      <button class="${['home','menu'].includes(session.page)?'active':''}" onclick="setPage('home')"><span class="ic">🍽️</span>${t('homeTab')}</button>
      <button class="${session.page==='cart'?'active':''}" onclick="setPage('cart')"><span class="ic">🛒</span>${t('cartTab')}${cartCount()?` (${cartCount()})`:''}</button>
      <button class="${session.page==='info'?'active':''}" onclick="setPage('info')"><span class="ic">ℹ️</span>${t('infoTab')}</button>
      <button id="staffAccessBtn" class="staff-access-btn ${session.shell==='admin'?'active':''}" onclick="openAdminGate()"><span class="ic">🔐</span>Staff</button>
    </div>`;
  }

  s.innerHTML = html;
  window.scrollTo(0,0);
}

function headerBlock(back){
  // Compact header: inline flag and title, small subtitle
  return `<div class="app-header">
    <div class="lang-toggle" style="position:absolute;right:12px;top:12px;">` +
      `<button style="border:none;background:transparent;color:rgba(255,255,255,0.85);font-weight:700;padding:6px 8px;" onclick="toggleLang()">${session.lang==='en'?'IT':'EN'}</button>` +
    `</div>
    <h1>${db.restaurant.name} <span style="font-size:22px;">🇱🇰</span></h1>
    ${session.page==='home' ? `<div class="sub">Authentic Sri Lankan Cuisine</div>` : ''}
  </div>`;
}

function toggleLang(){ session.lang = session.lang==='en' ? 'it' : 'en'; renderCustomer(); }

function dishListHtml(){
  const dishes = db.dishes.filter(d=> d.cat===session.activeCat &&
    (session.search==='' || dishName(d).toLowerCase().includes(session.search.toLowerCase())));
  if(dishes.length===0){
    return `<div style="padding:30px; text-align:center; color:var(--ink-soft); font-size:13px;">${session.lang==='it'?'Nessun piatto trovato.':'No dishes found.'}</div>`;
  }
  return `<div class="dish-list">` + dishes.map(d=>`
    <div class="dish-card ${!d.available?'sold-out':''}">
      <div class="dish-photo">${d.photo}</div>
      <div class="dish-info">
        <h3>${dishName(d)} ${d.popular?`<span class="badge-pop">${t('popular')}</span>`:''}</h3>
        <p>${dishDesc(d)}</p>
        <div class="dish-bottom">
          <span class="price">${fmt(d.price)}</span>
          ${d.available
            ? `<button class="add-btn" onclick="addToCart(${d.id})">${t('addToCart')}</button>`
            : `<button class="add-btn" disabled>${t('soldOut')}</button>`}
        </div>
      </div>
    </div>
  `).join('') + `</div>`;
}
function renderDishesOnly(){
  document.getElementById('dishListWrap').innerHTML = dishListHtml();
  if(cartCount()===0){} // fab handled on full render only; acceptable for search interaction
}

function signInGoogle(){
  session.user = { name:'Giulia Bianchi', phone:'+39 347 555 0199', method:'google' };
  renderCustomer();
  showToast(session.lang==='it' ? 'Accesso con Google effettuato' : 'Signed in with Google');
}
function continueGuest(){
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  if(!name || !phone){ showToast(session.lang==='it' ? 'Inserisci nome e telefono' : 'Enter name and phone'); return; }
  session.user = { name, phone, method:'guest' };
  renderCustomer();
}
function placeOrder(){
  const items = Object.entries(session.cart).map(([id,qty])=>({dishId:Number(id), qty}));
  const order = {
    id: nextId++,
    ticketNo: ticketCounter++,
    name: session.user.name,
    phone: session.user.phone,
    method: session.user.method,
    items,
    status:'received',
    total: cartTotal(),
    time: new Date(),
  };
  db.orders.unshift(order);
  session.currentOrderId = order.id;
  session.cart = {};
  session.page = 'tracking';
  renderCustomer();
  // simulate kitchen progress
  setTimeout(()=>{ advanceStatus(order.id,'preparing'); }, 6000);
  setTimeout(()=>{ advanceStatus(order.id,'ready'); }, 13000);
}
function advanceStatus(orderId, status){
  const o = db.orders.find(x=>x.id===orderId);
  if(!o) return;
  const flow = ['received','preparing','ready'];
  if(flow.indexOf(status) <= flow.indexOf(o.status)) return;
  o.status = status;
  if(session.shell==='customer' && session.page==='tracking' && session.currentOrderId===orderId) renderCustomer();
  if(session.shell==='admin') renderAdmin();
}

function ticketHtml(order, showTrack, extraHtml){
  const steps = ['received','preparing','ready'];
  const idx = steps.indexOf(order.status);
  let html = `<div class="ticket">
    <h4 class="mono">${t('ticketNo')} №</h4>
    <div class="tnum">#${order.ticketNo}</div>
    <div style="font-size:11px; color:var(--ink-soft);">${order.name} · ${order.phone}</div>
    <hr class="dash">`;
  order.items.forEach(it=>{
    const d = db.dishes.find(x=>x.id===it.dishId);
    html += `<div class="trow"><span>${it.qty}× ${d?dishName(d):'—'}</span><span>${fmt((d?d.price:0)*it.qty)}</span></div>`;
  });
  html += `<hr class="dash">
    <div class="trow" style="font-weight:700;"><span>${t('total')}</span><span>${fmt(order.total)}</span></div>`;
  if(showTrack){
    html += `<div class="status-track">
      ${steps.map((st,i)=>`<div class="status-step ${i<idx?'done':''} ${i===idx?'now':''}">
        <div class="status-dot"></div><span>${statusLabel(st)}</span>
      </div>`).join('')}
    </div>`;
  } else {
    html += `<div style="margin-top:10px; font-size:11px; text-align:center; text-transform:uppercase; letter-spacing:.05em; font-weight:700;">${statusLabel(order.status)}</div>`;
  }
  if(extraHtml) html += extraHtml;
  html += `</div>`;
  return html;
}

/* ========================= ADMIN RENDER ========================= */
function setAdminPage(p){
  session.adminPage = p;
  document.querySelectorAll('.admin-nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===p));
  renderAdmin();
}

function renderAdmin(){
  const m = document.getElementById('adminMain');
  if(session.adminPage==='orders') m.innerHTML = adminOrdersHtml();
  else if(session.adminPage==='menu') m.innerHTML = adminMenuHtml();
  else if(session.adminPage==='customers') m.innerHTML = adminCustomersHtml();
  else if(session.adminPage==='promos') m.innerHTML = adminPromosHtml();
}

function adminOrdersHtml(){
  const counts = {received:0,preparing:0,ready:0};
  db.orders.forEach(o=>counts[o.status]++);
  let html = `<div class="admin-header"><div><h2>Live orders</h2><p>Orders update in real time as the kitchen works through them.</p></div></div>`;
  html += `<div class="stat-row">
    <div class="stat-card"><div class="num">${counts.received}</div><div class="lbl">Received</div></div>
    <div class="stat-card"><div class="num">${counts.preparing}</div><div class="lbl">Preparing</div></div>
    <div class="stat-card"><div class="num">${counts.ready}</div><div class="lbl">Ready for pickup</div></div>
    <div class="stat-card"><div class="num">${db.orders.length}</div><div class="lbl">Total today</div></div>
  </div>`;
  if(db.orders.length===0){
    html += `<div class="card" style="text-align:center; color:var(--ink-soft); padding:40px;">No orders yet — place one from the customer app to see it appear here.</div>`;
  } else {
    html += `<div class="rail">` + db.orders.map(o=>{
      let actionBtns = '';
      if(o.status==='received') actionBtns = `<button class="primary" onclick="advanceStatus(${o.id},'preparing')">Start preparing</button>`;
      else if(o.status==='preparing') actionBtns = `<button class="primary" onclick="advanceStatus(${o.id},'ready')">Mark ready</button>`;
      else actionBtns = `<button disabled style="opacity:.5;">Completed</button>`;
      return ticketHtml(o, false, `<div class="actions">${actionBtns}</div>`);
    }).join('') + `</div>`;
  }
  return html;
}

function adminMenuHtml(){
  let html = `<div class="admin-header">
    <div><h2>Menu manager</h2><p>Add dishes, edit prices, and toggle availability.</p></div>
    <button class="add-dish-btn" onclick="openDishModal()">+ Add dish</button>
  </div>`;
  html += `<table><thead><tr><th></th><th>Dish</th><th>Category</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>`;
  db.dishes.forEach(d=>{
    const cat = db.categories.find(c=>c.id===d.cat);
    html += `<tr>
      <td style="font-size:20px;">${d.photo}</td>
      <td><b>${d.en}</b><br><span style="color:var(--ink-soft); font-size:11.5px;">${d.it}</span></td>
      <td>${cat?cat.en:''}</td>
      <td>${fmt(d.price)}</td>
      <td><span class="pill ${d.available?'on':'off'}">${d.available?'Available':'Sold out'}</span></td>
      <td class="row-actions">
        <button onclick="openDishModal(${d.id})">Edit</button>
        <button onclick="toggleAvailability(${d.id})">${d.available?'Mark sold out':'Mark available'}</button>
        <button class="danger" onclick="deleteDish(${d.id})">Delete</button>
      </td>
    </tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function toggleAvailability(id){
  const d = db.dishes.find(x=>x.id===id); d.available = !d.available; renderAdmin(); renderCustomer();
}
function deleteDish(id){
  db.dishes = db.dishes.filter(x=>x.id!==id); renderAdmin(); renderCustomer();
  showToast('Dish deleted');
}
function openDishModal(id){
  const d = id ? db.dishes.find(x=>x.id===id) : null;
  const bg = document.getElementById('modalBg');
  document.getElementById('modalContent').innerHTML = `
    <h3>${d?'Edit dish':'Add dish'}</h3>
    <div class="field"><label>Name (EN)</label><input id="mEn" value="${d?d.en:''}"></div>
    <div class="field"><label>Name (IT)</label><input id="mIt" value="${d?d.it:''}"></div>
    <div class="field"><label>Description (EN)</label><input id="mDescEn" value="${d?d.descEn:''}"></div>
    <div class="field"><label>Description (IT)</label><input id="mDescIt" value="${d?d.descIt:''}"></div>
    <div class="field"><label>Category</label><select id="mCat">${db.categories.map(c=>`<option value="${c.id}" ${d&&d.cat===c.id?'selected':''}>${c.en}</option>`).join('')}</select></div>
    <div class="field"><label>Price (€)</label><input id="mPrice" type="number" step="0.5" value="${d?d.price:''}"></div>
    <div class="field"><label>Emoji photo</label><input id="mPhoto" value="${d?d.photo:'🍽️'}"></div>
    <div class="modal-actions">
      <button class="cancel" onclick="closeModal()">Cancel</button>
      <button class="save" onclick="saveDish(${d?d.id:'null'})">Save</button>
    </div>`;
  bg.classList.add('active');
}
function closeModal(){ document.getElementById('modalBg').classList.remove('active'); }
function saveDish(id){
  const en = document.getElementById('mEn').value.trim();
  const it = document.getElementById('mIt').value.trim();
  const descEn = document.getElementById('mDescEn').value.trim();
  const descIt = document.getElementById('mDescIt').value.trim();
  const cat = document.getElementById('mCat').value;
  const price = parseFloat(document.getElementById('mPrice').value)||0;
  const photo = document.getElementById('mPhoto').value.trim()||'🍽️';
  if(!en || !price){ showToast('Name and price are required'); return; }
  if(id){
    const d = db.dishes.find(x=>x.id===id);
    Object.assign(d,{en,it,descEn,descIt,cat,price,photo});
  } else {
    db.dishes.push({id:nextId++, cat, en, it, descEn, descIt, price, photo, available:true, popular:false});
  }
  closeModal(); renderAdmin(); renderCustomer();
  showToast('Menu updated');
}

function adminCustomersHtml(){
  const map = {};
  db.orders.forEach(o=>{
    const key = o.phone;
    if(!map[key]) map[key] = {name:o.name, phone:o.phone, method:o.method, orders:0, spent:0};
    map[key].orders++; map[key].spent += o.total;
  });
  const list = Object.values(map);
  let html = `<div class="admin-header"><div><h2>Customers</h2><p>Everyone who has ordered, built automatically from order history.</p></div></div>`;
  if(list.length===0){
    html += `<div class="card" style="text-align:center; color:var(--ink-soft); padding:40px;">No customers yet.</div>`;
  } else {
    html += `<table><thead><tr><th>Name</th><th>Phone</th><th>Sign-in</th><th>Orders</th><th>Total spent</th></tr></thead><tbody>`;
    list.forEach(c=>{
      html += `<tr><td><b>${c.name}</b></td><td>${c.phone}</td><td>${c.method==='google'?'Google':'Guest'}</td><td>${c.orders}</td><td>${fmt(c.spent)}</td></tr>`;
    });
    html += `</tbody></table>`;
  }
  return html;
}

function adminPromosHtml(){
  let html = `<div class="admin-header">
    <div><h2>Promotions</h2><p>Create special offers shown on the customer app's home screen.</p></div>
    <button class="add-dish-btn" onclick="openPromoModal()">+ New promotion</button>
  </div>`;
  html += `<table><thead><tr><th>Title</th><th>Details</th><th>Status</th><th></th></tr></thead><tbody>`;
  db.promotions.forEach(p=>{
    html += `<tr><td><b>${p.title}</b></td><td>${p.desc}</td><td><span class="pill ${p.active?'on':'off'}">${p.active?'Active':'Inactive'}</span></td>
      <td class="row-actions"><button onclick="togglePromo(${p.id})">${p.active?'Deactivate':'Activate'}</button><button class="danger" onclick="deletePromo(${p.id})">Delete</button></td></tr>`;
  });
  html += `</tbody></table>`;
  return html;
}
function togglePromo(id){
  db.promotions.forEach(p=>{ if(p.id===id) p.active=!p.active; else p.active=false; });
  renderAdmin(); renderCustomer();
}
function deletePromo(id){ db.promotions = db.promotions.filter(p=>p.id!==id); renderAdmin(); }
function openPromoModal(){
  document.getElementById('modalContent').innerHTML = `
    <h3>New promotion</h3>
    <div class="field"><label>Title</label><input id="pTitle"></div>
    <div class="field"><label>Details</label><input id="pDesc"></div>
    <div class="modal-actions">
      <button class="cancel" onclick="closeModal()">Cancel</button>
      <button class="save" onclick="savePromo()">Save</button>
    </div>`;
  document.getElementById('modalBg').classList.add('active');
}
function savePromo(){
  const title = document.getElementById('pTitle').value.trim();
  const desc = document.getElementById('pDesc').value.trim();
  if(!title){ showToast('Title required'); return; }
  db.promotions.push({id:nextId++, title, desc, active:false});
  closeModal(); renderAdmin();
}

/* ========================= INIT ========================= */
renderCustomer();
