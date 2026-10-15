/* ================================================================
   Z-STUNTING · SUPPLEMENT 3 — JADWAL POSYANDU (ALL-IN-ONE v3)
   ✅ Master Wilayah 11 Kecamatan + 113 Desa (sudah include)
   ✅ Fix semua tombol (fallback + auto-load XLSX)
   ✅ Dropdown berjenjang Kecamatan → Desa
   ✅ Siap pakai, tinggal paste 1x
   ================================================================ */
(function(){
  console.log('%c🔧 Supplement3 v3 (ALL-IN-ONE) loading...', 'color:#26c6da;font-weight:bold');

  /* ============================================================
     MASTER WILAYAH JENEPONTO (11 KEC · 113 DESA)
     ============================================================ */
  const WILAYAH = {
    "ARUNGKEKE": ["Arungkeke","Arungkeke Pallantikang","Boronglamu","Bulo-Bulo","Kalumpangloe","Kampala","Palajau"],
    "BINAMU": ["Balang","Balang Beru","Balang Toa","Biringkassi","Bontoa","Empoang","Empoang Selatan","Empoang Utara","Monro-Monro","Pabiringa","Panaikang","Sapanang","Sidenre"],
    "BONTORAMBA": ["Balumbungan","Bangkalaloe","Baraya","Batujala","Bontoramba","Bulusibatang","Bulusuka","Datara","Kareloe","Lentu","Maero","Tanammawang"],
    "BATANG": ["Bonto Raya","Bungeng","Camba-Camba","Kaluku","Maccinibaji","Togo-Togo"],
    "BANGKALA": ["Benteng","Bontomanai","Bontorannu","Gunung Silanu","Jenetallasa","Kalimporo","Kapita","Mallasoro","Marayoka","Pallantikang","Pallengu","Pantai Bahari","Punagaya","Tombolo"],
    "BANGKALA BARAT": ["Banrimanurung","Barana","Beroanging","Bulujaya","Garassikang","Pappalluang","Pattiro","Tuju"],
    "KELARA": ["Bonto Lebang","Bontonompo","Gantarang","Samataring","Tolo","Tolo Barat","Tolo Selatan","Tolo Timur","Tolo Utara","Tombolo"],
    "TAROWANG": ["Allu Tarowang","Balang Baru","Balangloe Tarowang","Bonto Ujung","Bontorappo","Pao","Tarowang","Tino"],
    "TURATEA": ["Bontomatene","Bululoe","Bungungloe","Jombe","Kayuloe Barat","Kayuloe Timur","Langkura","Mangepong","Paitana","Parasangang Beru","Tanjonga"],
    "TAMALATEA": ["Bontojai","Bontosunggu","Bontotangnga","Borongtala","Karelayu","Manjangloe","Tamanroya","Tonrokassi","Tonrokassi Barat","Tonrokassi Timur","Turatea","Turatea Timur"],
    "RUMBIA": ["Bontocini","Bontomanai","Bontotiro","Jenetallasa","Kassi","Lebangmanai","Lebangmanai Utara","Loka","Pallantikang","Rumbia","Tompobulu","Ujungbulu"]
  };
  
  const KEC_LIST = Object.keys(WILAYAH);
  const getDesa = (kec) => WILAYAH[kec] || [];

  /* ============================================================
     FALLBACK GLOBALS
     ============================================================ */
  function safeToast(msg, type){
    try { if(typeof toast === 'function'){ toast(msg, type); return; } } catch(e){}
    console.log('[TOAST ' + (type||'info') + ']', msg);
    if(type === 'error') alert('❌ ' + msg);
    else if(type === 'warning') alert('⚠️ ' + msg);
  }
  function safeSaveState(){
    try { if(typeof saveState === 'function') saveState(); } catch(e){ console.warn(e); }
  }
  function safeLogAudit(a, d){
    try { if(typeof logAudit === 'function') logAudit(a, d); } catch(e){}
  }
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function copyText(text){
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise((res, rej) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta); res();
      } catch(e){ rej(e); }
    });
  }
  
  function ensureModal(){
    let modal = document.getElementById('modalConfirm');
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = 'modalConfirm';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:600px;background:#fff;border-radius:16px;padding:0;overflow:hidden">
        <div class="modal-header" style="padding:14px 18px;background:linear-gradient(135deg,#26c6da,#0891b2);color:#fff;display:flex;justify-content:space-between;align-items:center">
          <h3 id="confirmTitle" style="margin:0;font-size:16px">Konfirmasi</h3>
          <button onclick="document.getElementById('modalConfirm').classList.remove('show')" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer">✕</button>
        </div>
        <div class="modal-body" id="confirmBody" style="padding:18px;max-height:70vh;overflow:auto"></div>
        <div class="modal-footer" style="padding:14px 18px;background:#f8fafc;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e2e8f0">
          <button onclick="document.getElementById('modalConfirm').classList.remove('show')" style="padding:10px 16px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer;font-weight:600">Batal</button>
          <button id="confirmBtn" style="padding:10px 16px;background:linear-gradient(135deg,#26c6da,#0891b2);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">OK</button>
        </div>
      </div>
    `;
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:none;align-items:center;justify-content:center;padding:16px;overflow:auto';
    document.body.appendChild(modal);
    if(!document.getElementById('_zstModalStyle')){
      const style = document.createElement('style');
      style.id = '_zstModalStyle';
      style.textContent = `#modalConfirm.show{display:flex!important}@media(max-width:640px){#modalConfirm .modal-content{max-width:100%!important}}`;
      document.head.appendChild(style);
    }
    return modal;
  }
  
  function ensureXLSX(){
    return new Promise((resolve) => {
      if(typeof XLSX !== 'undefined'){ resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }
  
  function safeShowLoading(msg){
    try { if(typeof showLoading === 'function'){ showLoading(msg); return; } } catch(e){}
    let el = document.getElementById('_zstLoad');
    if(!el){
      el = document.createElement('div');
      el.id = '_zstLoad';
      el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:700';
      el.textContent = msg || 'Memuat...';
      document.body.appendChild(el);
    }
  }
  function safeHideLoading(){
    try { if(typeof hideLoading === 'function'){ hideLoading(); return; } } catch(e){}
    const el = document.getElementById('_zstLoad');
    if(el) el.remove();
  }

  /* ============================================================
     STATE
     ============================================================ */
  const AGENDA_LIST = [
    'Penimbangan & Pengukuran','Pemberian Vitamin A','Konseling Gizi',
    'Imunisasi Rutin','Penyuluhan KB','Pemberian PMT','Pemeriksaan Kesehatan',
    'Deteksi Tumbuh Kembang','Penyuluhan ASI/MP-ASI','Skrining Anemia Rematri'
  ];
  const HARI = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  
  let _viewMonth = new Date();
  let _viewMode = 'calendar';
  let _filter = { kec: '', desa: '', search: '' };
  let _currentEditJadwal = null;
  let _filterTimer = null;
  
  function initState(){
    if(!APP || !APP.state) return [];
    if(!APP.state.jadwal) APP.state.jadwal = [];
    return APP.state.jadwal;
  }
  function genId(){ return 'JDW' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase(); }
  function pad(n, l){ return String(n).padStart(l, '0'); }
  
  function parseDate(s){
    if(!s) return null;
    s = String(s).trim().split(' ')[0];
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(m) return new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]));
    m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if(m){
      let dd = parseInt(m[1]), mm = parseInt(m[2]), y = m[3];
      if(mm > 12){ const t = dd; dd = mm; mm = t; }
      return new Date(y, mm-1, dd);
    }
    return null;
  }
  function toISO(d){ return d ? `${d.getFullYear()}-${pad(d.getMonth()+1,2)}-${pad(d.getDate(),2)}` : ''; }
  
  function getFiltered(){
    let arr = initState();
    if(_filter.kec) arr = arr.filter(j => String(j.kecamatan||'').toUpperCase() === _filter.kec.toUpperCase());
    if(_filter.desa){
      const q = _filter.desa.toLowerCase();
      arr = arr.filter(j => String(j.desa||'').toLowerCase().includes(q));
    }
    if(_filter.search){
      const q = _filter.search.toLowerCase();
      arr = arr.filter(j => 
        String(j.posyandu||'').toLowerCase().includes(q) ||
        String(j.desa||'').toLowerCase().includes(q) ||
        String(j.kecamatan||'').toLowerCase().includes(q) ||
        String(j.agenda||'').toLowerCase().includes(q)
      );
    }
    return arr.sort((a, b) => (a.tanggal||'').localeCompare(b.tanggal||''));
  }

  /* ============================================================
     MENU INJECTION
     ============================================================ */
  function injectMenu(){
    const nav = document.querySelector('.nav');
    if(!nav || document.getElementById('navJadwal')) return;
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.id = 'navJadwal';
    btn.dataset.view = 'jadwal';
    btn.innerHTML = '<span class="ic">📅</span> Jadwal Posyandu';
    const ref = nav.querySelector('[data-view="laporan"]') || nav.querySelector('[data-view="kunjungan"]');
    if(ref && ref.parentNode) ref.parentNode.insertBefore(btn, ref.nextSibling);
    else nav.appendChild(btn);
    btn.onclick = () => {
      try {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sb = document.getElementById('sidebar'); if(sb) sb.classList.remove('open');
        const pt = document.getElementById('pageTitle'); if(pt) pt.textContent = 'Jadwal Posyandu';
        const pc = document.getElementById('pageCrumb'); if(pc) pc.textContent = 'Kalender kegiatan Posyandu';
        window.renderJadwal(document.getElementById('content'));
      } catch(e){ console.error(e); safeToast('Gagal buka: ' + e.message, 'error'); }
    };
  }

  /* ============================================================
     RENDER HALAMAN JADWAL
     ============================================================ */
  window.renderJadwal = function(c){
    try {
      if(!c) c = document.getElementById('content');
      if(!c){ safeToast('Konten tidak ditemukan','error'); return; }
      initState();
      
      c.innerHTML = `
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div>
              <div class="card-title">📅 Jadwal Posyandu</div>
              <div class="card-sub">Kelola jadwal kegiatan Posyandu seluruh kecamatan</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-primary-solid" onclick="window.openTambahJadwal()">➕ Tambah Jadwal</button>
              <button class="btn btn-info" onclick="window.importJadwalExcel()">📥 Import Excel</button>
              <button class="btn btn-outline" onclick="window.exportJadwalCSV()">📤 Export</button>
              <button class="btn btn-wa" onclick="window.kirimJadwalWA()">💬 Kirim ke WA</button>
            </div>
          </div>
          <div class="stats-grid" style="margin-bottom:16px" id="jadwalStats"></div>
          <div class="filters">
            <input type="text" id="jSearch" placeholder="🔍 Cari posyandu/desa/agenda..." value="${escapeHtml(_filter.search)}" oninput="window._updateJadwalFilter('search', this.value)">
            <select onchange="window._updateJadwalFilter('kec', this.value)">
              <option value="">✅ Semua Kecamatan</option>
              ${KEC_LIST.map(k => `<option value="${escapeHtml(k)}" ${_filter.kec === k ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('')}
            </select>
            <input type="text" placeholder="🔍 Filter desa..." value="${escapeHtml(_filter.desa)}" oninput="window._updateJadwalFilter('desa', this.value)">
            <button class="btn btn-outline" onclick="window._resetJadwalFilter()">🔄 Reset</button>
          </div>
          <div style="display:flex;gap:6px;margin-bottom:14px">
            <button class="btn ${_viewMode === 'calendar' ? 'btn-primary-solid' : 'btn-outline'}" onclick="window._setJadwalView('calendar')">📅 Kalender</button>
            <button class="btn ${_viewMode === 'list' ? 'btn-primary-solid' : 'btn-outline'}" onclick="window._setJadwalView('list')">📋 List</button>
          </div>
          <div id="jadwalView"></div>
        </div>
      `;
      renderStats();
      if(_viewMode === 'calendar') renderCalendar(); else renderList();
    } catch(e){ console.error(e); safeToast('Error render: ' + e.message,'error'); }
  };
  
  function renderStats(){
    const el = document.getElementById('jadwalStats');
    if(!el) return;
    const all = initState();
    const today = new Date();
    const todayStr = toISO(today);
    const thisMonth = all.filter(j => { const d = parseDate(j.tanggal); return d && d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth(); });
    const upcoming = all.filter(j => { const d = parseDate(j.tanggal); return d && d >= today; });
    const uniqueP = new Set(all.map(j => (j.kecamatan||'')+'|'+(j.desa||'')+'|'+(j.posyandu||'')));
    const todayCount = all.filter(j => j.tanggal === todayStr).length;
    el.innerHTML = `
      <div class="stat-card"><div class="icon" style="background:var(--primary-light);color:var(--primary)">📅</div><div class="label">Total Jadwal</div><div class="value">${all.length}</div></div>
      <div class="stat-card"><div class="icon" style="background:var(--info-light);color:var(--info)">📌</div><div class="label">Bulan Ini</div><div class="value">${thisMonth.length}</div></div>
      <div class="stat-card"><div class="icon" style="background:var(--warning-light);color:var(--warning)">⏳</div><div class="label">Akan Datang</div><div class="value">${upcoming.length}</div></div>
      <div class="stat-card"><div class="icon" style="background:var(--success-light);color:var(--success)">🏥</div><div class="label">Posyandu Terdaftar</div><div class="value">${uniqueP.size}</div></div>
      <div class="stat-card"><div class="icon" style="background:var(--danger-light);color:var(--danger)">🔔</div><div class="label">Hari Ini</div><div class="value">${todayCount}</div></div>
    `;
  }
  
  function renderCalendar(){
    const el = document.getElementById('jadwalView');
    if(!el) return;
    const y = _viewMonth.getFullYear(), m = _viewMonth.getMonth();
    const startDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const todayStr = toISO(new Date());
    const byDate = {};
    getFiltered().forEach(j => { if(!j.tanggal) return; (byDate[j.tanggal] = byDate[j.tanggal] || []).push(j); });
    
    let grid = '';
    for(let i = 0; i < startDow; i++) grid += `<div style="background:#f1f5f9;border-radius:10px;min-height:90px;padding:6px;opacity:.35"></div>`;
    for(let d = 1; d <= daysInMonth; d++){
      const ds = `${y}-${pad(m+1,2)}-${pad(d,2)}`;
      const isToday = ds === todayStr;
      const evts = byDate[ds] || [];
      const bg = isToday ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : (evts.length ? 'linear-gradient(135deg,#e0f2fe,#bae6fd)' : 'var(--soft-bg)');
      const bd = isToday ? '2px solid #f59e0b' : '2px solid transparent';
      grid += `<div onclick="window._clickDay('${ds}')" style="background:${bg};border-radius:10px;min-height:90px;padding:6px;cursor:pointer;border:${bd}">
        <div style="font-weight:800;font-size:13px;color:${isToday?'#92400e':'var(--soft-text)'};margin-bottom:4px">${d}</div>
        ${evts.slice(0,2).map(ev => `<div style="font-size:9.5px;background:rgba(255,255,255,.85);border-radius:5px;padding:2px 4px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0369a1;font-weight:600">${escapeHtml(ev.posyandu||ev.desa||'-')}</div>`).join('')}
        ${evts.length > 2 ? `<div style="font-size:9px;color:#0369a1;font-weight:700">+${evts.length-2} lagi</div>` : ''}
      </div>`;
    }
    const trailing = (7 - ((startDow + daysInMonth) % 7)) % 7;
    for(let i = 0; i < trailing; i++) grid += `<div style="background:#f1f5f9;border-radius:10px;min-height:90px;padding:6px;opacity:.35"></div>`;
    
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <button class="btn btn-outline" onclick="window._navMonth(-1)">‹ Bulan Lalu</button>
        <div style="font-size:17px;font-weight:800">${BULAN[m]} ${y}</div>
        <button class="btn btn-outline" onclick="window._navMonth(1)">Bulan Depan ›</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:6px">
        ${HARI.map(h => `<div style="text-align:center;font-size:11px;font-weight:800;color:var(--soft-text-dim);padding:6px 0">${h}</div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">${grid}</div>
      <div style="display:flex;gap:14px;justify-content:center;margin-top:16px;font-size:11.5px;color:var(--soft-text-dim);flex-wrap:wrap">
        <span>🟨 Hari Ini</span><span>🟦 Ada Jadwal</span><span>⬜ Kosong</span>
      </div>
    `;
  }
  
  function renderList(){
    const el = document.getElementById('jadwalView');
    if(!el) return;
    const arr = getFiltered();
    if(!arr.length){
      el.innerHTML = `<div class="empty"><div class="ic">📅</div><div>Belum ada jadwal</div><div style="font-size:12px;margin-top:8px">Klik <b>➕ Tambah Jadwal</b></div></div>`;
      return;
    }
    const todayStr = toISO(new Date());
    const grouped = {};
    arr.forEach(j => { (grouped[j.tanggal] = grouped[j.tanggal] || []).push(j); });
    const dates = Object.keys(grouped).sort();
    
    el.innerHTML = `
      <div style="margin-bottom:10px;font-size:13px">Menampilkan <b>${arr.length}</b> jadwal</div>
      <div class="table-wrap" style="overflow-x:auto">
        <table>
          <thead><tr><th>Tanggal</th><th>Hari</th><th>Kecamatan</th><th>Desa</th><th>Posyandu</th><th>Waktu</th><th>Agenda</th><th>Aksi</th></tr></thead>
          <tbody>
            ${dates.map(tgl => {
              const d = parseDate(tgl);
              const isToday = tgl === todayStr;
              return grouped[tgl].map((j, idx) => `
                <tr style="${isToday?'background:linear-gradient(90deg,#fef3c7,#fef9e7)':''}">
                  ${idx === 0 ? `<td rowspan="${grouped[tgl].length}" style="font-weight:700;vertical-align:top;white-space:nowrap">${d ? d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : tgl}${isToday?'<div style="font-size:10px;color:#92400e;font-weight:800">🔔 HARI INI</div>':''}</td>
                  <td rowspan="${grouped[tgl].length}" style="font-size:12px;vertical-align:top">${d ? d.toLocaleDateString('id-ID',{weekday:'long'}) : '-'}</td>` : ''}
                  <td style="font-size:12px">${escapeHtml(j.kecamatan||'-')}</td>
                  <td style="font-size:12px">${escapeHtml(j.desa||'-')}</td>
                  <td><b>${escapeHtml(j.posyandu||'-')}</b></td>
                  <td style="font-size:12px">${escapeHtml(j.waktu||'-')}</td>
                  <td style="font-size:12px"><span class="badge badge-info">${escapeHtml(j.agenda||'-')}</span></td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-sm btn-info" onclick="window.openEditJadwal('${j.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="window.hapusJadwal('${j.id}')">🗑</button>
                  </td>
                </tr>
              `).join('');
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ============================================================
     NAVIGATION & FILTER
     ============================================================ */
  window._navMonth = function(delta){
    _viewMonth = new Date(_viewMonth.getFullYear(), _viewMonth.getMonth()+delta, 1);
    renderCalendar();
  };
  window._setJadwalView = function(mode){
    _viewMode = mode;
    if(mode === 'calendar') renderCalendar(); else renderList();
    document.querySelectorAll('.card button').forEach(b => {
      const t = b.textContent.trim();
      if(t.includes('Kalender') || t.includes('List')){
        if((mode === 'calendar' && t.includes('Kalender')) || (mode === 'list' && t.includes('List'))) b.className = 'btn btn-primary-solid';
        else b.className = 'btn btn-outline';
      }
    });
  };
  window._updateJadwalFilter = function(key, val){
    _filter[key] = val;
    if(_filterTimer) clearTimeout(_filterTimer);
    _filterTimer = setTimeout(() => {
      if(_viewMode === 'calendar') renderCalendar(); else renderList();
      renderStats();
    }, key === 'search' ? 300 : 0);
  };
  window._resetJadwalFilter = function(){
    _filter = { kec: '', desa: '', search: '' };
    window.renderJadwal(document.getElementById('content'));
  };
  window._clickDay = function(ds){
    const list = getFiltered().filter(j => j.tanggal === ds);
    if(!list.length){
      if(confirm('Belum ada jadwal di tanggal ini.\n\nTambah jadwal baru?')) window.openTambahJadwal(ds);
      return;
    }
    const d = parseDate(ds);
    const modal = ensureModal();
    document.getElementById('confirmTitle').textContent = '📅 Jadwal ' + (d ? d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : ds);
    document.getElementById('confirmBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${list.map(j => `
          <div style="background:#f1f5f9;padding:12px;border-radius:10px;border-left:4px solid #26c6da">
            <div style="font-weight:800;font-size:14px">${escapeHtml(j.posyandu||'-')}</div>
            <div style="font-size:12px;margin-top:3px">📍 ${escapeHtml(j.desa||'-')}, ${escapeHtml(j.kecamatan||'-')}</div>
            <div style="font-size:12px;margin-top:2px">🕐 ${escapeHtml(j.waktu||'-')}</div>
            <div style="margin-top:6px"><span class="badge badge-info">${escapeHtml(j.agenda||'-')}</span></div>
            ${j.catatan ? `<div style="font-size:11.5px;margin-top:6px;font-style:italic">${escapeHtml(j.catatan)}</div>` : ''}
            <div style="display:flex;gap:6px;margin-top:10px">
              <button class="btn btn-sm btn-info" onclick="document.getElementById('modalConfirm').classList.remove('show');window.openEditJadwal('${j.id}')">✏️ Edit</button>
              <button class="btn btn-sm btn-danger" onclick="document.getElementById('modalConfirm').classList.remove('show');window.hapusJadwal('${j.id}')">🗑 Hapus</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    const btn = document.getElementById('confirmBtn');
    btn.textContent = '➕ Tambah Jadwal di Tanggal Ini';
    btn.onclick = () => { modal.classList.remove('show'); window.openTambahJadwal(ds); };
    modal.classList.add('show');
  };

  /* ============================================================
     FORM TAMBAH/EDIT (DROPDOWN BERJENJANG)
     ============================================================ */
  window.openTambahJadwal = function(defaultDate){
    try {
      _currentEditJadwal = null;
      showForm({
        kecamatan: _filter.kec || '',
        desa: _filter.desa || '',
        posyandu: '',
        tanggal: defaultDate || toISO(new Date()),
        waktu: '08:00-12:00',
        agenda: AGENDA_LIST[0],
        catatan: ''
      }, true);
    } catch(e){ console.error(e); safeToast('Error: ' + e.message, 'error'); }
  };
  window.openEditJadwal = function(id){
    const j = initState().find(x => x.id === id);
    if(!j){ safeToast('Jadwal tidak ditemukan','error'); return; }
    _currentEditJadwal = j;
    showForm(j, false);
  };
  
  function showForm(data, isNew){
    const modal = ensureModal();
    const desaList = data.kecamatan ? getDesa(data.kecamatan) : [];
    
    document.getElementById('confirmTitle').textContent = isNew ? '➕ Tambah Jadwal' : '✏️ Edit Jadwal';
    document.getElementById('confirmBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:12px;font-weight:700;color:#334155;display:block;margin-bottom:4px">Kecamatan *</label>
          <select id="jd_kec" onchange="window._onKecChange()" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px">
            <option value="">- Pilih Kecamatan -</option>
            ${KEC_LIST.map(k => `<option value="${escapeHtml(k)}" ${data.kecamatan === k ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#334155;display:block;margin-bottom:4px">Desa/Kelurahan *</label>
          <select id="jd_desa" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px">
            <option value="">- Pilih Desa -</option>
            ${desaList.map(d => `<option value="${escapeHtml(d)}" ${data.desa === d ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#334155;display:block;margin-bottom:4px">Nama Posyandu *</label>
          <input type="text" id="jd_posyandu" value="${escapeHtml(data.posyandu||'')}" placeholder="Contoh: Melati / Anggrek" list="pSuggest" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px">
          <datalist id="pSuggest">
            <option value="Melati"><option value="Anggrek"><option value="Mawar">
            <option value="Kenanga"><option value="Cempaka"><option value="Flamboyan">
            <option value="Bougenville"><option value="Dahlia"><option value="Kamboja">
          </datalist>
          <small style="font-size:11px;color:#64748b">Nama posyandu biasanya nama bunga</small>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#334155;display:block;margin-bottom:4px">Tanggal *</label>
          <input type="date" id="jd_tanggal" value="${escapeHtml(data.tanggal||'')}" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px">
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#334155;display:block;margin-bottom:4px">Waktu</label>
          <input type="text" id="jd_waktu" value="${escapeHtml(data.waktu||'08:00-12:00')}" placeholder="08:00-12:00" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px">
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#334155;display:block;margin-bottom:4px">Agenda *</label>
          <select id="jd_agenda" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px">
            ${AGENDA_LIST.map(a => `<option ${data.agenda === a ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#334155;display:block;margin-bottom:4px">Catatan</label>
          <textarea id="jd_catatan" rows="2" placeholder="Opsional" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;font-family:inherit">${escapeHtml(data.catatan||'')}</textarea>
        </div>
      </div>
    `;
    const btn = document.getElementById('confirmBtn');
    btn.textContent = isNew ? '💾 Simpan' : '💾 Perbarui';
    btn.onclick = saveJadwal;
    modal.classList.add('show');
  }
  
  window._onKecChange = function(){
    const kec = document.getElementById('jd_kec')?.value || '';
    const sel = document.getElementById('jd_desa');
    if(!sel) return;
    const list = getDesa(kec);
    sel.innerHTML = '<option value="">- Pilih Desa -</option>' + 
      list.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
  };
  
  function saveJadwal(){
    try {
      const kec = document.getElementById('jd_kec')?.value?.trim() || '';
      const desa = document.getElementById('jd_desa')?.value?.trim() || '';
      const posyandu = document.getElementById('jd_posyandu')?.value?.trim() || '';
      const tanggal = document.getElementById('jd_tanggal')?.value?.trim() || '';
      const waktu = document.getElementById('jd_waktu')?.value?.trim() || '';
      const agenda = document.getElementById('jd_agenda')?.value?.trim() || '';
      const catatan = document.getElementById('jd_catatan')?.value?.trim() || '';
      
      if(!kec || !desa || !posyandu || !tanggal || !agenda){
        safeToast('⚠️ Lengkapi field bertanda *', 'error');
        return;
      }
      initState();
      if(_currentEditJadwal){
        Object.assign(_currentEditJadwal, { kecamatan: kec, desa, posyandu, tanggal, waktu, agenda, catatan });
        safeLogAudit('EDIT_JADWAL', `Edit ${posyandu} - ${tanggal}`);
        safeToast('✅ Jadwal diperbarui', 'success');
      } else {
        APP.state.jadwal.push({
          id: genId(), kecamatan: kec, desa, posyandu, tanggal, waktu, agenda, catatan,
          createdBy: APP.user?.username || 'system',
          createdAt: new Date().toISOString()
        });
        safeLogAudit('ADD_JADWAL', `Tambah ${posyandu} - ${tanggal}`);
        safeToast('✅ Jadwal ditambahkan', 'success');
      }
      safeSaveState();
      document.getElementById('modalConfirm').classList.remove('show');
      window.renderJadwal(document.getElementById('content'));
    } catch(e){ console.error(e); safeToast('Error: ' + e.message, 'error'); }
  }
  
  window.hapusJadwal = function(id){
    const j = initState().find(x => x.id === id);
    if(!j) return;
    if(!confirm(`Hapus jadwal "${j.posyandu}" tanggal ${j.tanggal}?`)) return;
    APP.state.jadwal = APP.state.jadwal.filter(x => x.id !== id);
    safeLogAudit('DELETE_JADWAL', `Hapus ${j.posyandu}`);
    safeSaveState();
    safeToast('🗑 Jadwal dihapus', 'success');
    window.renderJadwal(document.getElementById('content'));
  };

  /* ============================================================
     IMPORT EXCEL
     ============================================================ */
  window.importJadwalExcel = async function(){
    try {
      await ensureXLSX();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls,.csv,.txt';
      input.onchange = e => { const f = e.target.files[0]; if(f) doImport(f); };
      input.click();
    } catch(e){ console.error(e); safeToast('Error: ' + e.message, 'error'); }
  };
  
  async function doImport(file){
    safeShowLoading('Membaca file...');
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let rows = [];
      if(ext === 'csv' || ext === 'txt'){
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const delim = ((lines[0]||'').match(/;/g)||[]).length > ((lines[0]||'').match(/,/g)||[]).length ? ';' : ',';
        rows = lines.map(line => {
          const vals = []; let cur = ''; let inQ = false;
          for(let i = 0; i < line.length; i++){
            const ch = line[i];
            if(ch === '"'){ if(inQ && line[i+1] === '"'){ cur += '"'; i++; } else inQ = !inQ; }
            else if(ch === delim && !inQ){ vals.push(cur); cur = ''; }
            else cur += ch;
          }
          vals.push(cur);
          return vals.map(v => v.trim());
        });
      } else {
        if(typeof XLSX === 'undefined'){ safeHideLoading(); safeToast('Library Excel gagal dimuat','error'); return; }
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
      }
      if(rows.length < 2){ safeHideLoading(); safeToast('File kosong','error'); return; }
      
      let hIdx = 0;
      for(let i = 0; i < Math.min(5, rows.length); i++){
        const j = rows[i].join(' ').toLowerCase();
        if(j.includes('tanggal') || j.includes('posyandu') || j.includes('kecamatan')){ hIdx = i; break; }
      }
      const norm = h => String(h||'').toLowerCase().trim().replace(/[\/\.\-]/g,'_').replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
      const hdr = rows[hIdx].map(norm);
      const findIdx = (names) => {
        for(const n of names){ const i = hdr.findIndex(h => h && (h === n || h.includes(n))); if(i >= 0) return i; }
        return -1;
      };
      const idx = {
        kecamatan: findIdx(['kecamatan','kec']),
        desa: findIdx(['desa','kelurahan','kel']),
        posyandu: findIdx(['posyandu','nama_posyandu']),
        tanggal: findIdx(['tanggal','tgl']),
        waktu: findIdx(['waktu','jam']),
        agenda: findIdx(['agenda','kegiatan']),
        catatan: findIdx(['catatan','keterangan','ket'])
      };
      if(idx.posyandu === -1 || idx.tanggal === -1){
        safeHideLoading();
        alert('❌ File harus punya kolom: posyandu, tanggal\n\nHeader: ' + rows[hIdx].join(' | '));
        return;
      }
      const gv = (r, i) => i >= 0 && r[i] !== undefined ? String(r[i]).trim() : '';
      const baru = [];
      for(let i = hIdx + 1; i < rows.length; i++){
        const r = rows[i];
        if(!r) continue;
        const posyandu = gv(r, idx.posyandu);
        const tanggal = gv(r, idx.tanggal);
        if(!posyandu || !tanggal) continue;
        const d = parseDate(tanggal);
        if(!d) continue;
        baru.push({
          id: genId(),
          kecamatan: gv(r, idx.kecamatan).toUpperCase() || '',
          desa: gv(r, idx.desa),
          posyandu, tanggal: toISO(d),
          waktu: gv(r, idx.waktu) || '08:00-12:00',
          agenda: gv(r, idx.agenda) || 'Penimbangan & Pengukuran',
          catatan: gv(r, idx.catatan),
          createdBy: APP.user?.username || 'import',
          createdAt: new Date().toISOString()
        });
      }
      safeHideLoading();
      if(!baru.length){ safeToast('❌ Tidak ada data valid','error'); return; }
      const modeAdd = confirm(`📊 IMPORT JADWAL\n\nFile: ${file.name}\nTotal: ${baru.length} jadwal\n\nOK = TAMBAH ke ${initState().length} jadwal lama\nCANCEL = GANTI SEMUA`);
      if(modeAdd) APP.state.jadwal = [...initState(), ...baru];
      else APP.state.jadwal = baru;
      safeLogAudit('IMPORT_JADWAL', `Import ${baru.length} jadwal`);
      safeSaveState();
      safeToast(`✅ ${baru.length} jadwal diimport`, 'success');
      window.renderJadwal(document.getElementById('content'));
    } catch(e){ safeHideLoading(); console.error(e); safeToast('❌ Gagal import: ' + e.message,'error'); }
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  window.exportJadwalCSV = function(){
    try {
      const arr = getFiltered();
      if(!arr.length){ safeToast('Belum ada jadwal','warning'); return; }
      const headers = ['kecamatan','desa','posyandu','tanggal','waktu','agenda','catatan'];
      const rows = arr.map(j => [j.kecamatan, j.desa, j.posyandu, j.tanggal, j.waktu, j.agenda, j.catatan]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Jadwal_Posyandu_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      safeToast(`✅ ${arr.length} jadwal diekspor`, 'success');
    } catch(e){ console.error(e); safeToast('Error: ' + e.message,'error'); }
  };

  /* ============================================================
     KIRIM KE WA
     ============================================================ */
  window.kirimJadwalWA = function(){
    try {
      const arr = getFiltered();
      if(!arr.length){ safeToast('Belum ada jadwal','warning'); return; }
      const today = new Date();
      const limit = new Date(today.getTime() + 30*24*60*60*1000);
      const up = arr.filter(j => { const d = parseDate(j.tanggal); return d && d >= today && d <= limit; });
      if(!up.length){ safeToast('Tidak ada jadwal 30 hari ke depan','warning'); return; }
      
      const byKec = {};
      up.forEach(j => { const k = (j.kecamatan||'LAINNYA').toUpperCase(); (byKec[k] = byKec[k] || []).push(j); });
      
      const now = new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
      let msg = `📅 *JADWAL POSYANDU 30 HARI KE DEPAN*\n📍 Kabupaten Jeneponto\n📆 ${now}\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      Object.keys(byKec).sort().forEach(kec => {
        msg += `🏘️ *${kec}*\n`;
        byKec[kec].sort((a,b) => a.tanggal.localeCompare(b.tanggal)).forEach(j => {
          const d = parseDate(j.tanggal);
          const tglStr = d ? d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'}) : j.tanggal;
          msg += `  • ${tglStr} — ${j.posyandu}\n    📍 ${j.desa} · 🕐 ${j.waktu}\n`;
        });
        msg += `\n`;
      });
      msg += `━━━━━━━━━━━━━━━━━━━━\n\n🎯 _Mohon hadir tepat waktu._\n\n🔗 https://usmank5194.github.io/Z-STUNTING/\n\n_"Satu Data, Satu Aksi Menuju Jeneponto Bahagia"_`;
      
      copyText(msg).then(() => {
        safeToast('📋 Jadwal dicopy — tempel di grup WA','success');
        setTimeout(() => window.open('https://chat.whatsapp.com/', '_blank'), 500);
      }).catch(() => { prompt('Copy manual:', msg); });
    } catch(e){ console.error(e); safeToast('Error: ' + e.message,'error'); }
  };

  /* ============================================================
     BOOT
     ============================================================ */
  function boot(){
    try { injectMenu(); } catch(e){ console.warn(e); }
    try { initState(); } catch(e){}
    console.log('%c✅ Supplement 3 v3 (ALL-IN-ONE) aktif', 'color:#26c6da;font-weight:bold');
    console.log('📊 Master wilayah:', KEC_LIST.length, 'kecamatan ·', 
      Object.values(WILAYAH).reduce((a,b) => a+b.length, 0), 'desa');
    console.log('📅 Jadwal existing:', (APP?.state?.jadwal || []).length);
  }
  if(typeof APP !== 'undefined' && APP.state) boot();
  else {
    const t = setInterval(() => {
      if(typeof APP !== 'undefined' && APP.state){ clearInterval(t); boot(); }
    }, 500);
    setTimeout(() => clearInterval(t), 30000);
  }
  
  // Debug helper
  window._debugJadwal = {
    state: () => APP?.state?.jadwal,
    clear: () => { APP.state.jadwal = []; safeSaveState(); },
    wilayah: () => WILAYAH
  };
})();
