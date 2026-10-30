/* Karnataka Travel Tracker: data, filters, map, charts, CRUD, backup. */
const KEY = 'karnataka-tracker-v1';
const CATS = ['temple','waterfall','hill','beach','heritage','wildlife','nature','dam','garden','city'];
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let D = [], map, group, markers = {}, charts = {}, view = 'cards';

/* ---------- storage ---------- */
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(D)); }
  catch (e) { alert('Browser storage is full. Export a JSON backup and use smaller photos.'); }
}
async function loadDefaults() { D = await (await fetch('data/destinations.json')).json(); }
async function init() {
  try { D = JSON.parse(localStorage.getItem(KEY)) || []; } catch { D = []; }
  if (!D.length) await loadDefaults();
  map = L.map('map', { zoomControl: true }).setView([14.8, 76.3], 7);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  group = L.layerGroup().addTo(map);
  fillSelects(); bind(); render();
}

/* ---------- filters ---------- */
const uniq = k => [...new Set(D.map(d => d[k]).filter(Boolean))].sort();
function opts(el, label, vals) {
  const cur = el.value;
  el.innerHTML = `<option value="">${label}</option>` + vals.map(v => `<option>${esc(v)}</option>`).join('');
  el.value = vals.includes(cur) ? cur : '';
}
function fillSelects() {
  opts($('#fRegion'), 'All regions', uniq('region'));
  opts($('#fDist'), 'All districts', uniq('district'));
  opts($('#fCat'), 'All categories', [...new Set([...CATS, ...uniq('category')])]);
  $('#regions').innerHTML = uniq('region').map(r => `<option value="${esc(r)}">`).join('');
  $('form [name=category]').innerHTML = [...new Set([...CATS, ...uniq('category')])].map(c => `<option>${c}</option>`).join('');
}
function filtered() {
  const q = $('#q').value.toLowerCase(), s = $('#fStatus').value;
  const r = $('#fRegion').value, di = $('#fDist').value, c = $('#fCat').value;
  const out = D.filter(d => (!q || (d.name + d.district + d.region + d.notes).toLowerCase().includes(q)) &&
    (!s || (s === 'v') === d.visited) && (!r || d.region === r) && (!di || d.district === di) && (!c || d.category === c));
  return out.sort($('#sort').value === 'date'
    ? (a, b) => (b.date || '').localeCompare(a.date || '') || a.name.localeCompare(b.name)
    : (a, b) => a.name.localeCompare(b.name));
}

/* ---------- render ---------- */
function render() { const list = filtered(); stats(); charts_(); mapMarkers(list); cards(list); }
function stats() {
  const t = D.length, v = D.filter(d => d.visited).length, p = t ? Math.round(v / t * 100) : 0;
  $('#total').textContent = t; $('#vis').textContent = v; $('#rem').textContent = t - v;
  $('#pct').textContent = p + '%'; $('#bar').style.width = p + '%';
  const rec = D.filter(d => d.visited).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  $('#recent').innerHTML = rec.map(d => `<li>${esc(d.name)}<br><small>${esc(d.date || 'date not set')}</small></li>`).join('') || '<li>Nothing visited yet.</li>';
}
function countBy(arr, k) { const m = {}; arr.forEach(d => m[d[k]] = (m[d[k]] || 0) + 1); return m; }
function charts_() {
  const cat = countBy(D, 'category');
  const dist = {}; D.forEach(d => { const o = dist[d.district] ||= { v: 0, p: 0 }; d.visited ? o.v++ : o.p++; });
  const top = Object.entries(dist).sort((a, b) => (b[1].v + b[1].p) - (a[1].v + a[1].p)).slice(0, 10);
  const pal = ['#1e4a3a','#a3212b','#e8a317','#3f7a62','#7a1b22','#b98512','#6c9a86','#d56a6f','#5b4a2a','#9db8aa'];
  draw('cCat', 'doughnut', { labels: Object.keys(cat), datasets: [{ data: Object.values(cat), backgroundColor: pal }] }, {});
  draw('cDist', 'bar', { labels: top.map(t => t[0]), datasets: [
    { label: 'Visited', data: top.map(t => t[1].v), backgroundColor: '#1e4a3a' },
    { label: 'Pending', data: top.map(t => t[1].p), backgroundColor: '#e8a317' }] },
    { indexAxis: 'y', scales: { x: { stacked: true }, y: { stacked: true } } });
}
function draw(id, type, data, options) {
  if (charts[id]) { charts[id].data = data; charts[id].update(); return; }
  charts[id] = new Chart($('#' + id), { type, data, options: { responsive: true, ...options } });
}

/* ---------- map ---------- */
function popup(d) {
  return `<div class="pop">${d.photo ? `<img src="${d.photo}" alt="">` : ''}<b>${esc(d.name)}</b><br>${esc(d.district)}<br>${d.visited ? 'Visited' : 'Pending'}${d.interstate ? ' (outside Karnataka)' : ''}</div>`;
}
function mapMarkers(list) {
  group.clearLayers(); markers = {};
  list.filter(d => d.lat != null && d.lng != null).forEach(d => {
    const color = d.interstate ? '#7b3fa0' : d.visited ? '#1e7a4f' : '#e8a317';
    markers[d.id] = L.circleMarker([d.lat, d.lng], { radius: 8, color: '#222', weight: 1, fillColor: color, fillOpacity: .9 })
      .bindPopup(popup(d)).addTo(group);
  });
}
function locate(id) {
  const d = D.find(x => x.id === id), m = markers[id];
  if (!d || d.lat == null) return alert('No coordinates yet for this place. Edit it to add them.');
  if (!m) { $('#fStatus').value = $('#fRegion').value = $('#fDist').value = $('#fCat').value = $('#q').value = ''; render(); }
  $('#map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  map.flyTo([d.lat, d.lng], 12); setTimeout(() => markers[id]?.openPopup(), 700);
}

/* ---------- cards / list ---------- */
function cards(list) {
  $('#count').textContent = `Showing ${list.length} of ${D.length}`;
  const el = $('#items'); el.className = view === 'list' ? 'cards list' : 'cards';
  el.innerHTML = list.map(d => `<article class="card ${d.visited ? 'v' : 'p'}" data-id="${d.id}">
    <div class="ph" style="${d.photo ? `background-image:url('${d.photo}')` : ''}">${d.photo ? '' : esc(d.category)}</div>
    <div class="in"><h3>${esc(d.name)}</h3>
    <div class="meta">${esc(d.district)}, ${esc(d.region)}</div>
    <span class="tag ${d.interstate ? 'x' : ''}">${d.interstate ? 'Outside Karnataka' : d.visited ? 'Visited' : 'Pending'}${d.date ? ' ' + esc(d.date) : ''}</span>
    ${d.verify ? '<div class="meta">Coordinates/photo need verification</div>' : ''}
    ${d.notes ? `<div class="meta">${esc(d.notes)}</div>` : ''}
    <div class="acts"><button data-a="loc">Show on map</button><button data-a="tog">${d.visited ? 'Mark pending' : 'Mark visited'}</button>
    <button data-a="edit">Edit</button><button data-a="del">Delete</button></div></div></article>`).join('')
    || '<p>No destinations match these filters. Clear a filter to see more.</p>';
}

/* ---------- add / edit / delete ---------- */
const dlg = $('#dlg'), form = $('#form'); let editing = null;
function openForm(d) {
  editing = d || null; form.reset(); $('#dTitle').textContent = d ? 'Edit destination' : 'Add destination';
  if (d) for (const k of ['name','region','district','category','lat','lng','date','notes']) form.elements[k].value = d[k] ?? '';
  form.elements.visited.checked = !!d?.visited; dlg.showModal();
}
function shrink(file) { // resize photo to keep browser storage small
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => { const i = new Image(); i.onload = () => {
      const s = Math.min(1, 640 / i.width), c = document.createElement('canvas');
      c.width = i.width * s; c.height = i.height * s; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', .75)); }; i.src = r.result; };
    r.readAsDataURL(file);
  });
}
form.addEventListener('submit', async e => {
  const f = form.elements, num = v => v === '' ? null : parseFloat(v);
  const d = editing || { id: Date.now(), interstate: false, photo: '', verify: false };
  Object.assign(d, { name: f.name.value.trim(), region: f.region.value.trim(), district: f.district.value.trim(),
    category: f.category.value, lat: num(f.lat.value), lng: num(f.lng.value), visited: f.visited.checked,
    date: f.date.value, notes: f.notes.value.trim() });
  if (f.photo.files[0]) d.photo = await shrink(f.photo.files[0]);
  if (!editing) D.push(d);
  save(); fillSelects(); render();
});
$('#cancel').onclick = () => dlg.close();

/* ---------- events, backup ---------- */
function bind() {
  ['q','fStatus','fRegion','fDist','fCat','sort'].forEach(i => $('#' + i).addEventListener('input', render));
  $('#vCards').onclick = () => { view = 'cards'; $('#vCards').classList.add('on'); $('#vList').classList.remove('on'); render(); };
  $('#vList').onclick = () => { view = 'list'; $('#vList').classList.add('on'); $('#vCards').classList.remove('on'); render(); };
  $('#add').onclick = () => openForm();
  $('#items').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = +b.closest('.card').dataset.id, d = D.find(x => x.id === id), a = b.dataset.a;
    if (a === 'loc') locate(id);
    if (a === 'edit') openForm(d);
    if (a === 'tog') { d.visited = !d.visited; if (d.visited && !d.date) d.date = new Date().toISOString().slice(0, 10); save(); render(); }
    if (a === 'del' && confirm(`Delete "${d.name}"?`)) { D = D.filter(x => x.id !== id); save(); fillSelects(); render(); }
  });
  $('#export').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' }));
    a.download = 'karnataka-destinations-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
  };
  $('#import').onchange = async e => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (!Array.isArray(data) || !data.every(d => d.name && 'visited' in d)) throw 0;
      D = data; save(); fillSelects(); render();
    } catch { alert('That file is not a valid destinations JSON export.'); }
    e.target.value = '';
  };
  $('#reset').onclick = async () => {
    if (!confirm('Replace all your changes with the original list? Export a backup first.')) return;
    await loadDefaults(); save(); fillSelects(); render();
  };
}
init();
