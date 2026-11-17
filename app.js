import { icon, platIcon } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n == null ? '—' : n.toLocaleString('vi-VN'));
const dmy = (iso) => iso.split('-').reverse().join('/');
const dm = (iso) => iso.slice(8) + '/' + iso.slice(5, 7);
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dow = (iso) => (new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7; // Mon=0
const STATUSES = ['live', 'chờ duyệt', 'bị gỡ', 'bỏ qua', 'chưa xác minh'];
const sCls = { live: 'live', 'chờ duyệt': 'cho', 'bị gỡ': 'go' };

const shortPlat = (p) => (/page/i.test(p) ? 'FB page' : /group/i.test(p) ? 'FB group' : p);
const shortAcc = (a) => (/^page\b/i.test(a || '') && /babyface/i.test(a) ? 'Page Babyface' : a || '—');
let filtersOpen = false;
const noData = () => !!F.brand && !D.posts.some((p) => p.brand === F.brand);
const isMobile = () => innerWidth <= 640;
let D, F, sort = { k: 'when', dir: -1 }, shown = 25;
const EMPTY_F = () => ({ brand: '', platform: '', account: '', status: [], campaign: '', from: '', to: '', q: '' });

async function load() {
  if (window.__DASHBOARD_DATA__) return window.__DASHBOARD_DATA__;
  const r = await fetch('data/dashboard-data.json');
  return r.json();
}
function readHash() {
  const f = EMPTY_F();
  const p = new URLSearchParams(location.hash.slice(1));
  for (const k of Object.keys(f)) if (p.has(k)) f[k] = k === 'status' ? p.get(k).split('|').filter(Boolean) : p.get(k);
  return f;
}
function writeHash() {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(F)) { const s = Array.isArray(v) ? v.join('|') : v; if (s) p.set(k, s); }
  const vw = new URLSearchParams(location.hash.slice(1)).get('view'); if (vw) p.set('view', vw);
  history.replaceState(null, '', p.toString() ? '#' + p : location.pathname + location.search);
}
const counted = (p) => p.status !== 'bỏ qua';
function filtered(skip) {
  const q = F.q.trim().toLowerCase();
  return D.posts.filter((p) =>
    (!F.brand || p.brand === F.brand) && (!F.platform || p.platform === F.platform) &&
    (!F.account || p.account === F.account) && (!F.status.length || F.status.includes(p.status)) &&
    (!F.campaign || p.campaign === F.campaign) && (!F.from || p.date >= F.from) && (!F.to || p.date <= F.to) &&
    (!q || [p.place, p.campaign, p.account, p.note].join(' ').toLowerCase().includes(q)));
}
const uniq = (k) => [...new Set(D.posts.map((p) => p[k]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
const sum = (a, k) => a.reduce((s, p) => s + (p[k] || 0), 0);

/* ---------- sections ---------- */
function kpis(rows) {
  const t = D.today, c = rows.filter(counted);
  const mon = addDays(t, -dow(t)), sun = addDays(mon, 6);
  const week = c.filter((p) => p.date >= mon && p.date <= sun).length;
  const range = `${+mon.slice(8)}–${+sun.slice(8)}/${sun.slice(5, 7)}`;
  const cm = rows.filter((p) => p.comments != null).length, ld = rows.filter((p) => p.leads != null).length;
  const nd = noData();
  const K = [
    ['Bài hôm nay', c.filter((p) => p.date === t).length, dmy(t), 'lime'],
    ['Bài tuần này', week, 'Tuần ' + range, ''],
    ['Đang live', c.filter((p) => p.status === 'live').length, `trên ${c.length} bài`, ''],
    ['Chờ duyệt', c.filter((p) => p.status === 'chờ duyệt').length, 'chưa có link bài', ''],
    ['Bị gỡ', c.filter((p) => p.status === 'bị gỡ').length, 'admin group gỡ', ''],
    ['Bình luận', sum(rows, 'comments'), `từ ${cm} bài có số liệu`, ''],
    ['Đăng ký / Lead', sum(rows, 'leads'), ld ? `từ ${ld} bài có số liệu` : 'Chưa có số liệu', ''],
  ];
  return `<section id="overview" class="kpis">${K.map(([l, v, s, c]) =>
    `<div class="card kpi ${c}"><div class="l">${l}</div><div class="v">${nd ? '—' : fmt(v)}</div><div class="s">${esc(nd ? 'Chưa có bài đăng' : s)}</div></div>`).join('')}
</section>`;
}

function chart(rows) {
  const t = D.today, c = rows.filter(counted);
  let to = F.to || t, from = F.from;
  if (!from) from = addDays(to, -29);
  if (F.from && !F.to) to = t;
  if (from > to) from = to;
  let days = []; for (let d = from; d <= to && days.length < 366; d = addDays(d, 1)) days.push(d);
  const data = days.map((d) => { const x = c.filter((p) => p.date === d); return { d, n: x.length, live: x.filter((p) => p.status === 'live').length }; });
  const max = Math.max(4, ...data.map((x) => x.n)), top = Math.ceil(max / 4) * 4;
  const mob = isMobile(), W = mob ? Math.max(260, innerWidth - 24 - 40 - 2) : 760, H = mob ? 240 : 310, L = mob ? 24 : 28, B = mob ? 30 : 28, T = 10, pw = W - L, ph = H - B - T, bw = pw / data.length;
  const bar = Math.max(3, Math.min(22, bw * 0.62));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Số bài theo ngày">`;
  for (let i = 0; i <= 4; i++) {
    const y = T + ph - (ph * i) / 4;
    s += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="${i ? '#F0F0EE' : '#D9D9D6'}" stroke-width="1"/><text x="${L - 8}" y="${y + 4}" text-anchor="end" font-size="${mob ? 11 : 10.5}" fill="#8A8A8A">${(top * i) / 4}</text>`;
  }
  const every = mob ? Math.ceil(data.length / 5) : Math.ceil(data.length / 10);
  data.forEach((x, i) => {
    const cx = L + bw * i + bw / 2, h = (ph * x.n) / top, hl = (ph * x.live) / top;
    if (x.n) {
      s += `<rect x="${cx - bar / 2}" y="${T + ph - h}" width="${bar}" height="${h}" rx="${Math.min(5, bar / 2)}" fill="#C9FA08"/>`;
      if (x.live && x.live < x.n) s += `<rect x="${cx - bar / 2}" y="${T + ph - hl}" width="${bar}" height="${hl}" rx="${Math.min(5, bar / 2)}" fill="#111" opacity=".85"/>`;
      else if (x.live) s += `<rect x="${cx - bar / 2}" y="${T + ph - hl}" width="${bar}" height="${hl}" rx="${Math.min(5, bar / 2)}" fill="#111" opacity=".85"/>`;
    }
    if ((data.length - 1 - i) % every === 0) s += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="${mob ? 11.5 : 10.5}" fill="#8A8A8A">${dm(x.d)}</text>`;
    s += `<rect class="hit" data-i="${i}" x="${cx - bw / 2}" y="${T}" width="${bw}" height="${ph + B}" fill="transparent"/>`;
  });
  s += '</svg>';
  return { html: `<section class="card" id="chart"><div class="cardhead"><h2>Bài theo ngày</h2><span class="badge">${c.filter((p) => p.date >= from && p.date <= to).length}</span>
    <span class="legend"><span><i style="background:#C9FA08"></i>Tất cả</span><span><i style="background:#111"></i>Live</span></span></div>
    <div class="sub">${dmy(from)} – ${dmy(to)}</div><div class="chart-wrap">${noData() ? `<div class="chart-empty">${icon('chart', 28)}<b>Chưa có bài đăng</b><span>Biểu đồ sẽ hiện khi có bài đầu tiên.</span></div>` : s + '<div class="tip"></div>'}</div></section>`, data, W, L, bw, T };
}

function limitCard() {
  const t = D.today;
  if (F.brand && !D.posts.some((p) => p.brand === F.brand)) return `<section class="card empty" id="limit"><b>Giới hạn Facebook hôm nay</b>Chưa kết nối — ${esc(F.brand)} chưa có tài khoản Facebook theo dõi.</section>`;
  const defs = [['Jen Naito', 'Jen Naito', (a) => /jen naito/i.test(a)], ['Page Babyface Casting Agency', 'page', (a) => /page/i.test(a) && /babyface/i.test(a)]];
  const m = defs.map(([label, , test]) => {
    const row = D.platforms.find((p) => p.platform === 'Facebook group' && test(p.account || ''));
    const lim = row?.dailyLimit ?? 5;
    const n = D.posts.filter((p) => p.date === t && p.platform === 'Facebook group' && counted(p) && test(p.account)).length;
    const left = Math.max(0, lim - n);
    return `<div class="meter"><div class="row"><span>${label}</span><span class="num">${n}<small>/${lim}</small></span></div>
      <div class="bar"><b style="width:${Math.min(100, (n / lim) * 100)}%"></b></div>
      <div class="note">${left ? `Còn ${left} lượt hôm nay` : '<span class="done">Đã đủ hôm nay</span>'}</div></div>`;
  }).join('');
  return `<section class="card lime" id="limit"><h2>Giới hạn Facebook hôm nay</h2><div class="sub" style="color:#111;opacity:.65">Bài đăng group · ${dmy(t)}</div>
    <div class="meters">${m}</div><div class="rule">${icon('gauge', 18)}<span>Quy tắc: mỗi bài cách nhau ≥ 20 phút</span></div></section>`;
}

function platforms() {
  const P = D.posts.filter((p) => !F.brand || p.brand === F.brand);
  const cards = D.allPlatforms.map((name) => {
    const rows = D.platforms.filter((r) => r.platform === name), on = !noData() && rows.some((r) => r.connected);
    const ps = P.filter((p) => p.platform === name && counted(p));
    const last = ps.map((p) => p.date).sort().pop();
    const accs = rows.map((r) => r.account).filter(Boolean);
    const body = on ? `<div class="acc">${esc(accs.join(' · ') || '—')}</div>
      <dl><dt>Tổng số bài</dt><dd>${ps.length}</dd><dt>Đang live</dt><dd>${ps.filter((p) => p.status === 'live').length}</dd><dt>Bài gần nhất</dt><dd>${last ? dmy(last) : '—'}</dd></dl>`
      : `<div class="big">Chưa kết nối</div><div class="hint">Chị đăng nhập tài khoản trên máy Grobo để bắt đầu theo dõi</div>`;
    return `<div class="plat ${on ? '' : 'off'}"><div class="top">${platIcon(name)}<span class="nm">${esc(name)}</span><span class="st ${on ? '' : 'off'}">${on ? 'Đã kết nối' : 'Chưa kết nối'}</span></div>${body}</div>`;
  }).join('');
  const n = noData() ? 0 : D.allPlatforms.filter((p) => D.platforms.some((r) => r.platform === p && r.connected)).length;
  return `<section class="card" id="platforms"><div class="cardhead"><h2>Nền tảng</h2><span class="badge">${n}/${D.allPlatforms.length}</span></div><div class="plats">${cards}</div></section>`;
}

const dateField = (k, l) => `<div class="field"><span>${l}</span><label class="datebtn ${F[k] ? 'has' : ''}">${icon('cal', 16)}<em>${F[k] ? dmy(F[k]) : 'Chọn ngày'}</em><input type="date" lang="vi" data-f="${k}" value="${F[k]}" aria-label="${l}"></label></div>`;
function activeCount() {
  const t = D.today, quick = [[t, t], [addDays(t, -6), t], [addDays(t, -29), t]].some(([a, b]) => F.from === a && F.to === b);
  return [F.brand, F.platform, F.account, F.campaign, F.status.length, (F.from || F.to) && !quick].filter(Boolean).length;
}
function filterBar() {
  const sel = (id, label, opts, v) => `<label class="field"><span>${label}</span><select data-f="${id}"><option value="">Tất cả</option>${opts.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
  const t = D.today, nAct = activeCount(), q = (a, b) => F.from === a && F.to === b;
  const quick = [['Hôm nay', t, t], ['7 ngày', addDays(t, -6), t], ['30 ngày', addDays(t, -29), t], ['Tất cả', '', '']];
  return `<section class="card filters" id="filters">
    <div class="frow top"><div class="search">${icon('search', 18)}<input type="search" data-f="q" placeholder="Tìm group, chiến dịch…" value="${esc(F.q)}"></div>
      ${quick.map(([l, a, b]) => `<button class="chip ${q(a, b) ? 'on' : ''}" data-q="${a}|${b}">${l}</button>`).join('')}
      <button class="btn ftoggle ${nAct ? '' : 'idle'}" id="ftoggle" aria-expanded="${filtersOpen}">${icon('filter', 16)}Bộ lọc${nAct ? `<span class="badge lime">${nAct}</span>` : ''}</button></div>
    <div class="fpanel ${filtersOpen ? 'open' : ''}"><div class="frow">${sel('brand', 'Brand', D.brands, F.brand)}${sel('platform', 'Nền tảng', D.allPlatforms, F.platform)}${sel('account', 'Tài khoản', uniq('account'), F.account)}${sel('campaign', 'Chiến dịch', uniq('campaign'), F.campaign)}
      ${dateField('from', 'Từ ngày')}${dateField('to', 'Đến ngày')}
      </div>
    <div class="frow"><span class="lab">Trạng thái</span>${STATUSES.map((s) => `<button class="chip ${F.status.includes(s) ? 'on' : ''}" data-s="${s}">${s}</button>`).join('')}<span class="sp"></span><button class="btn ghost" id="clear">${icon('x', 16)}Xoá lọc</button></div></div></section>`;
}

const KEY = { when: (p) => p.date + (p.time || '00:00'), platform: (p) => p.platform, account: (p) => p.account, place: (p) => p.place.toLowerCase(), campaign: (p) => p.campaign, status: (p) => p.status, comments: (p) => p.comments ?? -1, leads: (p) => p.leads ?? -1 };
const when = (p) => `<span class="dt">${dmy(p.date).slice(0, 5)}/${p.date.slice(0, 4)}<small>${p.time ? p.time + ' giờ VN' : 'chưa rõ giờ'}</small></span>`;
const pill = (s) => `<span class="spill ${sCls[s] || ''}">${esc(s)}</span>`;
const lnk = (p) => (p.link ? `<a class="open" href="${esc(p.link)}" target="_blank" rel="noopener">Mở bài ↗</a>` : '—');
const placeHtml = (p) => `<div class="place" title="${esc(p.place)}">${p.placeUrl ? `<a href="${esc(p.placeUrl)}" target="_blank" rel="noopener">${esc(p.place)}</a>` : esc(p.place)}${p.note ? `<div class="n" title="${esc(p.note)}">${esc(p.note)}</div>` : ''}</div>`;

function table(rows) {
  const k = KEY[sort.k], s = [...rows].sort((a, b) => (k(a) > k(b) ? 1 : k(a) < k(b) ? -1 : 0) * sort.dir || (a.id < b.id ? 1 : -1));
  const v = s.slice(0, shown);
  const th = (key, l, c = '') => `<th class="${c}" data-k="${key}">${l} <span class="ar">${sort.k === key ? (sort.dir > 0 ? '↑' : '↓') : ''}</span></th>`;
  const body = v.length ? `<div class="tw"><table><colgroup><col class="c-dt"><col class="c-pf"><col class="c-ac"><col><col class="c-ca"><col class="c-st"><col class="c-cm"><col class="c-ld"><col class="c-lk"></colgroup><thead><tr>${th('when', 'Ngày giờ')}${th('platform', 'Nền tảng')}${th('account', 'Tài khoản')}${th('place', 'Nơi đăng')}${th('campaign', 'Chiến dịch')}${th('status', 'Trạng thái')}${th('comments', 'Bình luận', 'num')}${th('leads', 'Lead', 'num')}<th style="cursor:default">Link</th></tr></thead><tbody>
    ${v.map((p) => `<tr><td>${when(p)}</td><td><span class="pf" title="${esc(p.platform)}">${platIcon(p.platform).replace('width="22" height="22"','width="16" height="16"')}${shortPlat(p.platform)}</span></td><td class="acc" title="${esc(p.account)}">${esc(shortAcc(p.account))}</td><td>${placeHtml(p)}</td><td class="camp"><div title="${esc(p.campaign)}">${esc(p.campaign)}</div></td><td>${pill(p.status)}</td><td class="num">${fmt(p.comments)}</td><td class="num">${fmt(p.leads)}</td><td>${lnk(p)}</td></tr>`).join('')}</tbody></table></div>
    <div class="cards">${v.map((p) => `<div class="pc"><div class="r"><span class="dt">${dmy(p.date)}${p.time ? ' · ' + p.time : ''}</span>${pill(p.status)}</div>${placeHtml(p).replace('class="place"', 'class="p"')}<div class="n">${esc(p.campaign)}</div>
      <div class="m"><span class="ml" title="${esc(p.platform + ' · ' + p.account)}">${shortPlat(p.platform)} · ${esc(shortAcc(p.account))}</span><span class="mr">Bình luận <b>${fmt(p.comments)}</b> · Lead <b>${fmt(p.leads)}</b></span></div>${p.link ? `<div class="lk">${lnk(p)}</div>` : ''}</div>`).join('')}</div>
    <div class="more"><span class="sub">Hiển thị ${v.length}/${s.length}</span>${s.length > v.length ? '<button class="btn" id="more">Xem thêm</button>' : ''}</div>`
    : `<div class="empty"><b>Không có bài nào khớp bộ lọc</b>Thử đổi bộ lọc hoặc bấm “Xoá lọc”.</div>`;
  return `<section class="card" id="posts"><div class="cardhead"><h2>Bài đăng</h2><span class="badge">${rows.length}</span></div>${body}</section>`;
}

/* ---------- render ---------- */
function brandPills() {
  const o = [['', 'Tất cả'], ['Babyface', 'Babyface'], ['Aescentic', '<img src="assets/aescentic-logo.png" alt="">Aescentic']];
  return `<div class="pills">${o.map(([v, l]) => `<button class="pill ${F.brand === v ? 'on' : ''}" data-b="${v}">${l}</button>`).join('')}</div>`;
}
function updated() {
  const g = D.generatedAt || '';
  const m = g.match(/(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);
  return m ? `${m[4]}:${m[5]} ${m[3]}/${m[2]}/${m[1]}` : dmy(D.today);
}
let chartInfo;
function render(keepFocus) {
  const rows = filtered();
  const ch = chart(rows); chartInfo = ch;
  const brandOnly = D.brands.filter((b) => !D.posts.some((p) => p.brand === b));
  const ae = F.brand && brandOnly.includes(F.brand) ? `<div class="card empty"><b>Chưa kết nối</b>Chưa có dữ liệu cho ${esc(F.brand)}. Chị đăng nhập tài khoản trên máy Grobo để bắt đầu theo dõi.</div>` : '';
  const act = document.activeElement?.dataset?.f, pos = document.activeElement?.selectionStart;
  $('#app').innerHTML = `<div style="display:flex;flex-direction:column;gap:20px">
    <header class="head"><div><h1>Theo dõi đăng bài</h1><div class="sub">Cập nhật lúc ${updated()} (giờ VN)</div></div>${brandPills()}</header>
    ${filterBar()}${ae}${kpis(rows)}<div class="two">${ch.html}${limitCard()}</div>${platforms()}${table(rows)}
    <footer class="foot">Dữ liệu: Google Sheet 'Dashboard đăng bài – data' · Grobo cập nhật sau mỗi đợt đăng/quét</footer></div>`;
  if (keepFocus && act) { const e = $(`[data-f="${act}"]`); if (e) { e.focus(); try { e.setSelectionRange(pos, pos); } catch {} } }
  bindChart(); updateMenu(); sideFoot(); brandMark();
}
function bindChart() {
  const w = $('.chart-wrap'), tip = $('.tip', w), { data, W } = chartInfo; if (!tip) return;
  const show = (e) => {
    const i = +e.target.dataset.i; if (isNaN(i)) return;
    const x = data[i], r = w.getBoundingClientRect(), b = e.target.getBoundingClientRect();
    tip.innerHTML = `<b>${dm(x.d)}</b> · ${x.n} bài${x.live ? ` (${x.live} live)` : ''}`;
    tip.style.left = Math.min(r.width - 60, Math.max(60, b.left + b.width / 2 - r.left)) + 'px';
    tip.style.top = Math.max(24, (b.top - r.top) + (b.height * (1 - Math.min(1, x.n / Math.max(4, ...data.map((d) => d.n)))) * 0.85)) + 'px';
    tip.style.opacity = 1;
  };
  w.addEventListener('mouseover', show); w.addEventListener('click', show);
  w.addEventListener('mouseleave', () => (tip.style.opacity = 0));
}

function brandMark() {
  const ae = F.brand === 'Aescentic';
  $('#brandmark').innerHTML = ae ? '<img class="mk" src="assets/aescentic-logo.png" alt="Aescentic"><span class="bn">Aescentic</span>' : '<img class="wide" src="assets/babyface-logo.png" alt="Babyface">';
}
function sideFoot() {
  $('#sfoot').innerHTML = `<div class="sl">Dữ liệu cập nhật</div><div class="st2">${updated().split(' ')[0]}<small>${updated().split(' ')[1]} · giờ VN</small></div>
    <div class="sb"><img src="assets/babyface-logo.png" alt="Babyface"><img src="assets/aescentic-logo.png" alt="Aescentic"></div>`;
}
const MENU = [['overview', 'Tổng quan', 'home'], ['posts', 'Bài đăng', 'list'], ['platforms', 'Nền tảng', 'plug'], ['limit', 'Giới hạn FB', 'gauge']];
let activeMenu = 'overview';
function updateMenu() {
  const n = D.posts.filter((p) => counted(p) && (!F.brand || p.brand === F.brand)).length;
  $('#menu').innerHTML = MENU.map(([id, l, ic]) => `<a href="#" data-m="${id}" class="${id === activeMenu ? 'on' : ''}">${icon(ic, 20)}<span>${l}</span>${id === 'posts' ? `<span class="badge">${n}</span>` : ''}</a>`).join('');
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-m],[data-b],[data-q],[data-s],[data-k],#clear,#more,#ftoggle'); if (!t) return;
  if (t.id === 'ftoggle') { filtersOpen = !filtersOpen; render(); return; }
  if (t.dataset.m) { e.preventDefault(); activeMenu = t.dataset.m; $('#' + activeMenu)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); updateMenu(); return; }
  if (t.dataset.b !== undefined) F.brand = t.dataset.b;
  else if (t.dataset.q) { [F.from, F.to] = t.dataset.q.split('|'); }
  else if (t.dataset.s) F.status = F.status.includes(t.dataset.s) ? F.status.filter((s) => s !== t.dataset.s) : [...F.status, t.dataset.s];
  else if (t.dataset.k) sort = { k: t.dataset.k, dir: sort.k === t.dataset.k ? -sort.dir : t.dataset.k === 'when' ? -1 : 1 };
  else if (t.id === 'clear') F = EMPTY_F();
  else if (t.id === 'more') shown += 25;
  if (!t.id || t.id === 'clear') shown = t.dataset.k ? shown : 25;
  writeHash(); render();
});
document.addEventListener('click', (e) => { const i = e.target.closest('.datebtn')?.querySelector('input'); if (i && e.target !== i) try { i.showPicker(); } catch {} else if (i) try { i.showPicker(); } catch {} });
document.addEventListener('input', (e) => {
  const f = e.target.dataset?.f; if (!f) return;
  F[f] = e.target.value; shown = 25; writeHash(); render(true);
});
addEventListener('hashchange', () => { const n = readHash(); if (JSON.stringify(n) !== JSON.stringify(F)) { F = n; render(); } });
let wasMob; addEventListener('resize', () => { if (D && wasMob !== isMobile()) { wasMob = isMobile(); render(); } });
addEventListener('scroll', () => {
  const ids = MENU.map((m) => m[0]); let cur = ids[0];
  for (const id of ids) { const el = $('#' + id); if (el && el.getBoundingClientRect().top < innerHeight * 0.4) cur = id; }
  if (cur !== activeMenu) { activeMenu = cur; updateMenu(); }
}, { passive: true });

load().then((d) => { D = d; F = readHash(); render(); const v = new URLSearchParams(location.hash.slice(1)).get('view'); if (v) { document.body.dataset.view = v; activeMenu = v; updateMenu(); } }).catch((e) => { $('#app').innerHTML = `<div class="card empty"><b>Không tải được dữ liệu</b>${esc(e.message)}</div>`; });
