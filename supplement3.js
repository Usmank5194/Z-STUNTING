/* ================================================================
   Z-STUNTING · SUPPLEMENT 3 — JADWAL POSYANDU
   Fitur:
   - Menu baru di sidebar
   - Kalender bulanan + list view
   - Input manual (tambah/edit/hapus)
   - Import Excel/CSV bulk
   - Export Excel/CSV
   - Filter kecamatan/desa
   - Kirim ke Grup WA
   - Print PDF
   ================================================================ */
(function(){
  const AGENDA_LIST = [
    'Penimbangan & Pengukuran',
    'Pemberian Vitamin A',
    'Konseling Gizi',
    'Imunisasi Rutin',
    'Penyuluhan KB',
    'Pemberian PMT',
    'Pemeriksaan Kesehatan',
    'Deteksi Tumbuh Kembang',
    'Penyuluhan ASI/MP-ASI',
    'Skrining Anemia Rematri'
  ];
  
  const HARI = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  
  /* ============================================================
     STATE
     ============================================================ */
  let _viewMonth = new Date();
  let _viewMode = 'calendar'; // 'calendar' | 'list'
  let _filter = { kec: '', desa: '', search: '' };
  let _currentEditJadwal = null;
  
  /* ============================================================
     HELPERS
     ============================================================ */
  function initJadwalState(){
    if(!APP.state.jadwal) APP.state.jadwal = [];
    return APP.state.jadwal;
  }
  
  function genId(){
    return 'JDW' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
  }
  
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
    const bln = {jan:0,feb:1,mar:2,apr:3,mei:4,may:4,jun:5,jul:6,agu:7,aug:7,sep:8,okt:9,oct:9,nov:10,des:11,dec:11};
    m = s.toLowerCase().match(/^(\d{1,2})\s+([a-z]{3,})\s+(\d{4})$/);
    if(m){
      const mm = bln[m[2].slice(0,3)];
      if(mm !== undefined) return new Date(parseInt(m[3]), mm, parseInt(m[1]));
    }
    return null;
  }
  
  function toISO(d){
    if(!d) return '';
    return `${d.getFullYear()}-${pad(d.getMonth()+1, 2)}-${pad(d.getDate(), 2)}`;
  }
  
  function getFilteredJadwal(){
    let arr = initJadwalState();
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
    
    // Sisipkan setelah "Laporan"
    const ref = nav.querySelector('[data-view="laporan"]') || nav.querySelector('[data-view="kunjungan"]');
    if(ref && ref.parentNode){
      ref.parentNode.insertBefore(btn, ref.nextSibling);
    } else {
      nav.appendChild(btn);
    }
    
    btn.onclick = () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('pageTitle').textContent = 'Jadwal Posyandu';
      document.getElementById('pageCrumb').textContent = 'Kalender kegiatan Posyandu';
      renderJadwal(document.getElementById('content'));
    };
  }
  
  /* ============================================================
     RENDER: JADWAL PAGE
     ============================================================ */
  window.renderJadwal = function(c){
    initJadwalState();
    c.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <div class="card-title">📅 Jadwal Posyandu</div>
            <div class="card-sub">Kelola jadwal kegiatan Posyandu seluruh kecamatan</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-primary-solid" onclick="openTambahJadwal()">➕ Tambah Jadwal</button>
            <button class="btn btn-info" onclick="importJadwalExcel()">📥 Import Excel</button>
            <button class="btn btn-outline" onclick="exportJadwalCSV()">📤 Export</button>
            <button class="btn btn-wa" onclick="kirimJadwalWA()">💬 Kirim ke WA</button>
          </div>
        </div>
        
        <!-- Stats -->
        <div class="stats-grid" style="margin-bottom:16px" id="jadwalStats"></div>
        
        <!-- Filters -->
        <div class="filters">
          <input type="text" id="jSearch" placeholder="🔍 Cari posyandu/desa/agenda..." value="${_filter.search}" oninput="_updateJadwalFilter('search', this.value)">
          <select onchange="_updateJadwalFilter('kec', this.value)">
            <option value="">✅ Semua Kecamatan</option>
            ${KECAMATAN.map(k => `<option value="${k}" ${_filter.kec === k ? 'selected' : ''}>${k}</option>`).join('')}
          </select>
          <input type="text" placeholder="🔍 Filter desa..." value="${_filter.desa}" oninput="_updateJadwalFilter('desa', this.value)">
          <button class="btn btn-outline" onclick="_resetJadwalFilter()">🔄 Reset</button>
        </div>
        
        <!-- Toggle View -->
        <div style="display:flex;gap:6px;margin-bottom:14px">
          <button class="btn ${_viewMode === 'calendar' ? 'btn-primary-solid' : 'btn-outline'}" onclick="_setJadwalView('calendar')">📅 Kalender</button>
          <button class="btn ${_viewMode === 'list' ? 'btn-primary-solid' : 'btn-outline'}" onclick="_setJadwalView('list')">📋 List</button>
        </div>
        
        <!-- View Container -->
        <div id="jadwalView"></div>
      </div>
    `;
    
    renderJadwalStats();
    if(_viewMode === 'calendar') renderJadwalCalendar();
    else renderJadwalList();
  };
  
  function renderJadwalStats(){
    const el = document.getElementById('jadwalStats');
    if(!el) return;
    const all = initJadwalState();
    const today = new Date();
    const thisMonth = all.filter(j => {
      const d = parseDate(j.tanggal);
      return d && d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    });
    const upcoming = all.filter(j => {
      const d = parseDate(j.tanggal);
      return d && d >= today;
    });
    const uniquePosyandu = new Set(all.map(j => j.kecamatan + '|' + j.desa + '|' + j.posyandu));
    const todayCount = all.filter(j => j.tanggal === toISO(today)).length;
    
    el.innerHTML = `
      <div class="stat-card">
        <div class="icon" style="background:var(--primary-light);color:var(--primary)">📅</div>
        <div class="label">Total Jadwal</div>
        <div class="value">${all.length}</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:var(--info-light);color:var(--info)">📌</div>
        <div class="label">Bulan Ini</div>
        <div class="value">${thisMonth.length}</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:var(--warning-light);color:var(--warning)">⏳</div>
        <div class="label">Akan Datang</div>
        <div class="value">${upcoming.length}</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:var(--success-light);color:var(--success)">🏥</div>
        <div class="label">Posyandu Terdaftar</div>
        <div class="value">${uniquePosyandu.size}</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:var(--danger-light);color:var(--danger)">🔔</div>
        <div class="label">Hari Ini</div>
        <div class="value">${todayCount}</div>
      </div>
    `;
  }
  
  function renderJadwalCalendar(){
    const el = document.getElementById('jadwalView');
    if(!el) return;
    
    const y = _viewMonth.getFullYear();
    const m = _viewMonth.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startDow = firstDay.getDay(); // 0=Minggu
    const daysInMonth = lastDay.getDate();
    
    const today = new Date();
    const todayStr = toISO(today);
    
    const jadwal = getFilteredJadwal();
    const byDate = {};
    jadwal.forEach(j => {
      if(!j.tanggal) return;
      if(!byDate[j.tanggal]) byDate[j.tanggal] = [];
      byDate[j.tanggal].push(j);
    });
    
    let gridHTML = '';
    // Empty cells before day 1
    for(let i = 0; i < startDow; i++){
      gridHTML += `<div style="background:#f1f5f9;border-radius:10px;min-height:90px;padding:6px;opacity:.35"></div>`;
    }
    // Days
    for(let d = 1; d <= daysInMonth; d++){
      const dateStr = `${y}-${pad(m+1,2)}-${pad(d,2)}`;
      const isToday = dateStr === todayStr;
      const events = byDate[dateStr] || [];
      const hasEvents = events.length > 0;
      
      const bg = isToday ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : (hasEvents ? 'linear-gradient(135deg,#e0f2fe,#bae6fd)' : 'var(--soft-bg)');
      const border = isToday ? '2px solid #f59e0b' : '2px solid transparent';
      
      gridHTML += `
        <div onclick="_clickDay('${dateStr}')" style="background:${bg};border-radius:10px;min-height:90px;padding:6px;cursor:pointer;border:${border};box-shadow:2px 2px 5px rgba(174,191,212,.25),-2px -2px 5px rgba(255,255,255,.7);transition:.15s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          <div style="font-weight:800;font-size:13px;color:${isToday ? '#92400e' : 'var(--soft-text)'};margin-bottom:4px">${d}</div>
          ${events.slice(0, 2).map(ev => 
            `<div style="font-size:9.5px;background:rgba(255,255,255,.85);border-radius:5px;padding:2px 4px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0369a1;font-weight:600">${escapeHtml(ev.posyandu || ev.desa || '-')}</div>`
          ).join('')}
          ${events.length > 2 ? `<div style="font-size:9px;color:#0369a1;font-weight:700;margin-top:2px">+${events.length - 2} lagi</div>` : ''}
        </div>
      `;
    }
    // Trailing cells
    const totalCells = startDow + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;
    for(let i = 0; i < trailing; i++){
      gridHTML += `<div style="background:#f1f5f9;border-radius:10px;min-height:90px;padding:6px;opacity:.35"></div>`;
    }
    
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <button class="btn btn-outline" onclick="_navMonth(-1)">‹ Bulan Lalu</button>
        <div style="font-size:17px;font-weight:800;color:var(--soft-text)">${BULAN[m]} ${y}</div>
        <button class="btn btn-outline" onclick="_navMonth(1)">Bulan Depan ›</button>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:6px">
        ${HARI.map(h => `<div style="text-align:center;font-size:11px;font-weight:800;color:var(--soft-text-dim);padding:6px 0">${h}</div>`).join('')}
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
        ${gridHTML}
      </div>
      
      <div style="display:flex;gap:14px;justify-content:center;margin-top:16px;font-size:11.5px;color:var(--soft-text-dim);flex-wrap:wrap">
        <span style="display:flex;align-items:center;gap:5px"><span style="width:14px;height:14px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:4px;border:1.5px solid #f59e0b"></span> Hari Ini</span>
        <span style="display:flex;align-items:center;gap:5px"><span style="width:14px;height:14px;background:linear-gradient(135deg,#e0f2fe,#bae6fd);border-radius:4px"></span> Ada Jadwal</span>
        <span style="display:flex;align-items:center;gap:5px"><span style="width:14px;height:14px;background:var(--soft-bg);border-radius:4px;border:1px solid #e2e8f0"></span> Kosong</span>
      </div>
    `;
  }
  
  function renderJadwalList(){
    const el = document.getElementById('jadwalView');
    if(!el) return;
    const arr = getFilteredJadwal();
    
    if(!arr.length){
      el.innerHTML = `<div class="empty"><div class="ic">📅</div><div>Belum ada jadwal</div><div style="font-size:12px;margin-top:8px">Klik <b>➕ Tambah Jadwal</b> atau <b>📥 Import Excel</b></div></div>`;
      return;
    }
    
    // Group by date
    const todayStr = toISO(new Date());
    const grouped = {};
    arr.forEach(j => {
      if(!grouped[j.tanggal]) grouped[j.tanggal] = [];
      grouped[j.tanggal].push(j);
    });
    const sortedDates = Object.keys(grouped).sort();
    
    el.innerHTML = `
      <div style="margin-bottom:10px;font-size:13px;color:var(--soft-text-dim)">Menampilkan <b>${arr.length}</b> jadwal dari <b>${sortedDates.length}</b> tanggal</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Hari</th>
              <th>Kecamatan</th>
              <th>Desa</th>
              <th>Posyandu</th>
              <th>Waktu</th>
              <th>Agenda</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${sortedDates.map(tgl => {
              const d = parseDate(tgl);
              const isToday = tgl === todayStr;
              const isFuture = d && d > new Date();
              const rowBg = isToday ? 'background:linear-gradient(90deg,#fef3c7,#fef9e7)' : (isFuture ? '' : 'opacity:.75');
              return grouped[tgl].map((j, idx) => `
                <tr style="${rowBg}">
                  ${idx === 0 ? `<td rowspan="${grouped[tgl].length}" style="font-weight:700;color:var(--soft-text);vertical-align:top">${d ? d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : tgl}${isToday?'<div style="font-size:10px;color:#92400e;font-weight:800;margin-top:2px">🔔 HARI INI</div>':''}</td>
                  <td rowspan="${grouped[tgl].length}" style="font-size:12px;color:var(--soft-text-dim);vertical-align:top">${d ? d.toLocaleDateString('id-ID',{weekday:'long'}) : '-'}</td>` : ''}
                  <td style="font-size:12px">${escapeHtml(j.kecamatan || '-')}</td>
                  <td style="font-size:12px">${escapeHtml(j.desa || '-')}</td>
                  <td><b>${escapeHtml(j.posyandu || '-')}</b></td>
                  <td style="font-size:12px">${escapeHtml(j.waktu || '-')}</td>
                  <td style="font-size:12px"><span class="badge badge-info">${escapeHtml(j.agenda || '-')}</span></td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-sm btn-info" onclick="openEditJadwal('${j.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="hapusJadwal('${j.id}')">🗑</button>
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
    _viewMonth = new Date(_viewMonth.getFullYear(), _viewMonth.getMonth() + delta, 1);
    renderJadwalCalendar();
  };
  
  window._setJadwalView = function(mode){
    _viewMode = mode;
    if(mode === 'calendar') renderJadwalCalendar();
    else renderJadwalList();
    // Update buttons
    document.querySelectorAll('.card button').forEach(b => {
      const t = b.textContent.trim();
      if(t.includes('Kalender') || t.includes('List')){
        if((mode === 'calendar' && t.includes('Kalender')) || (mode === 'list' && t.includes('List'))){
          b.className = 'btn btn-primary-solid';
        } else {
          b.className = 'btn btn-outline';
        }
      }
    });
  };
  
  let _filterTimer = null;
  window._updateJadwalFilter = function(key, val){
    _filter[key] = val;
    if(_filterTimer) clearTimeout(_filterTimer);
    _filterTimer = setTimeout(() => {
      const inp = document.getElementById('jSearch');
      const pos = inp ? inp.selectionStart : null;
      if(_viewMode === 'calendar') renderJadwalCalendar();
      else renderJadwalList();
      renderJadwalStats();
      const n = document.getElementById('jSearch');
      if(n && key === 'search'){ n.focus(); if(pos !== null) try{ n.setSelectionRange(pos,pos); }catch(e){} }
    }, key === 'search' ? 300 : 0);
  };
  
  window._resetJadwalFilter = function(){
    _filter = { kec: '', desa: '', search: '' };
    renderJadwal(document.getElementById('content'));
  };
  
  window._clickDay = function(dateStr){
    const jadwal = getFilteredJadwal().filter(j => j.tanggal === dateStr);
    if(!jadwal.length){
      if(confirm('Belum ada jadwal di tanggal ini.\n\nTambah jadwal baru?')){
        openTambahJadwal(dateStr);
      }
      return;
    }
    // Show modal detail
    const d = parseDate(dateStr);
    const modal = document.getElementById('modalConfirm');
    document.getElementById('confirmTitle').textContent = '📅 Jadwal ' + (d ? d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : dateStr);
    document.getElementById('confirmBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${jadwal.map(j => `
          <div style="background:var(--soft-bg);padding:12px;border-radius:10px;border-left:4px solid #26c6da">
            <div style="font-weight:800;font-size:14px;color:var(--soft-text)">${escapeHtml(j.posyandu || '-')}</div>
            <div style="font-size:12px;color:var(--soft-text-dim);margin-top:3px">📍 ${escapeHtml(j.desa || '-')}, ${escapeHtml(j.kecamatan || '-')}</div>
            <div style="font-size:12px;color:var(--soft-text-dim);margin-top:2px">🕐 ${escapeHtml(j.waktu || '-')}</div>
            <div style="margin-top:6px"><span class="badge badge-info">${escapeHtml(j.agenda || '-')}</span></div>
            ${j.catatan ? `<div style="font-size:11.5px;color:var(--soft-text-dim);margin-top:6px;font-style:italic">${escapeHtml(j.catatan)}</div>` : ''}
            <div style="display:flex;gap:6px;margin-top:10px">
              <button class="btn btn-sm btn-info" onclick="closeModal('modalConfirm'); openEditJadwal('${j.id}')">✏️ Edit</button>
              <button class="btn btn-sm btn-danger" onclick="closeModal('modalConfirm'); hapusJadwal('${j.id}')">🗑 Hapus</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    const btn = document.getElementById('confirmBtn');
    btn.textContent = '➕ Tambah Jadwal di Tanggal Ini';
    btn.className = 'btn btn-primary-solid';
    btn.style.display = 'inline-flex';
    btn.onclick = () => { closeModal('modalConfirm'); openTambahJadwal(dateStr); };
    modal.classList.add('show');
  };
  
  /* ============================================================
     FORM TAMBAH / EDIT JADWAL
     ============================================================ */
  window.openTambahJadwal = function(defaultDate){
    _currentEditJadwal = null;
    showJadwalForm({
      kecamatan: _filter.kec || '',
      desa: _filter.desa || '',
      posyandu: '',
      tanggal: defaultDate || toISO(new Date()),
      waktu: '08:00-12:00',
      agenda: AGENDA_LIST[0],
      catatan: ''
    }, true);
  };
  
  window.openEditJadwal = function(id){
    const j = initJadwalState().find(x => x.id === id);
    if(!j) return;
    _currentEditJadwal = j;
    showJadwalForm(j, false);
  };
  
  function showJadwalForm(data, isNew){
    const modal = document.getElementById('modalConfirm');
    const desaList = [...new Set((APP.state.tpk||[])
      .filter(t => !data.kecamatan || t.kecamatan === data.kecamatan)
      .map(t => t.desa))].sort();
    
    document.getElementById('confirmTitle').textContent = isNew ? '➕ Tambah Jadwal Posyandu' : '✏️ Edit Jadwal Posyandu';
    document.getElementById('confirmBody').innerHTML = `
      <div class="form-grid">
        <div class="form-group">
          <label>Kecamatan *</label>
          <select id="jd_kec" onchange="_updateDesaOptions()">
            <option value="">- Pilih -</option>
            ${KECAMATAN.map(k => `<option value="${k}" ${data.kecamatan === k ? 'selected' : ''}>${k}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Desa/Kelurahan *</label>
          <input type="text" id="jd_desa" list="desaListJD" value="${escapeHtml(data.desa||'')}" placeholder="Nama desa">
          <datalist id="desaListJD">
            ${desaList.map(d => `<option value="${escapeHtml(d)}"></option>`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label>Nama Posyandu *</label>
          <input type="text" id="jd_posyandu" value="${escapeHtml(data.posyandu||'')}" placeholder="Contoh: Melati">
        </div>
        <div class="form-group">
          <label>Tanggal *</label>
          <input type="date" id="jd_tanggal" value="${escapeHtml(data.tanggal||'')}">
        </div>
        <div class="form-group">
          <label>Waktu</label>
          <input type="text" id="jd_waktu" value="${escapeHtml(data.waktu||'08:00-12:00')}" placeholder="08:00-12:00">
        </div>
        <div class="form-group">
          <label>Agenda *</label>
          <select id="jd_agenda">
            ${AGENDA_LIST.map(a => `<option ${data.agenda === a ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full">
          <label>Catatan</label>
          <textarea id="jd_catatan" rows="2" placeholder="Contoh: Bawa buku KIA, undang kader PKK">${escapeHtml(data.catatan||'')}</textarea>
        </div>
      </div>
    `;
    const btn = document.getElementById('confirmBtn');
    btn.textContent = isNew ? '💾 Simpan Jadwal' : '💾 Perbarui';
    btn.className = 'btn btn-primary-solid';
    btn.style.display = 'inline-flex';
    btn.onclick = saveJadwal;
    modal.classList.add('show');
  }
  
  window._updateDesaOptions = function(){
    const kec = document.getElementById('jd_kec')?.value || '';
    const desaList = [...new Set((APP.state.tpk||[])
      .filter(t => !kec || t.kecamatan === kec)
      .map(t => t.desa))].sort();
    const dl = document.getElementById('desaListJD');
    if(dl){
      dl.innerHTML = desaList.map(d => `<option value="${escapeHtml(d)}"></option>`).join('');
    }
  };
  
  function saveJadwal(){
    const kec = document.getElementById('jd_kec')?.value?.trim() || '';
    const desa = document.getElementById('jd_desa')?.value?.trim() || '';
    const posyandu = document.getElementById('jd_posyandu')?.value?.trim() || '';
    const tanggal = document.getElementById('jd_tanggal')?.value?.trim() || '';
    const waktu = document.getElementById('jd_waktu')?.value?.trim() || '';
    const agenda = document.getElementById('jd_agenda')?.value?.trim() || '';
    const catatan = document.getElementById('jd_catatan')?.value?.trim() || '';
    
    if(!kec || !desa || !posyandu || !tanggal || !agenda){
      toast('⚠️ Lengkapi field bertanda *', 'error');
      return;
    }
    
    initJadwalState();
    
    if(_currentEditJadwal){
      Object.assign(_currentEditJadwal, { kecamatan: kec, desa, posyandu, tanggal, waktu, agenda, catatan });
      if(typeof logAudit === 'function') logAudit('EDIT_JADWAL', `Edit jadwal ${posyandu} - ${tanggal}`);
      toast('✅ Jadwal diperbarui', 'success');
    } else {
      APP.state.jadwal.push({
        id: genId(),
        kecamatan: kec,
        desa, posyandu, tanggal, waktu, agenda, catatan,
        createdBy: APP.user?.username || 'system',
        createdAt: new Date().toISOString()
      });
      if(typeof logAudit === 'function') logAudit('ADD_JADWAL', `Tambah jadwal ${posyandu} - ${tanggal}`);
      toast('✅ Jadwal ditambahkan', 'success');
    }
    
    saveState();
    closeModal('modalConfirm');
    renderJadwal(document.getElementById('content'));
  }
  
  window.hapusJadwal = function(id){
    const j = initJadwalState().find(x => x.id === id);
    if(!j) return;
    if(!confirm(`Hapus jadwal "${j.posyandu}" tanggal ${j.tanggal}?`)) return;
    APP.state.jadwal = APP.state.jadwal.filter(x => x.id !== id);
    if(typeof logAudit === 'function') logAudit('DELETE_JADWAL', `Hapus jadwal ${j.posyandu}`);
    saveState();
    toast('🗑 Jadwal dihapus', 'success');
    renderJadwal(document.getElementById('content'));
  };
  
  /* ============================================================
     IMPORT EXCEL
     ============================================================ */
  window.importJadwalExcel = function(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv,.txt';
    input.onchange = e => {
      const f = e.target.files[0];
      if(f) doImport(f);
    };
    input.click();
  };
  
  async function doImport(file){
    if(typeof XLSX === 'undefined'){ toast('Library Excel belum siap', 'error'); return; }
    showLoading('Membaca file...');
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
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      }
      
      if(rows.length < 2){ hideLoading(); toast('File kosong', 'error'); return; }
      
      // Cari header row
      let hIdx = 0;
      for(let i = 0; i < Math.min(5, rows.length); i++){
        const joined = rows[i].join(' ').toLowerCase();
        if(joined.includes('tanggal') || joined.includes('posyandu') || joined.includes('kecamatan')){
          hIdx = i; break;
        }
      }
      
      const norm = h => String(h||'').toLowerCase().trim().replace(/[\/\.\-]/g,'_').replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
      const hdr = rows[hIdx].map(norm);
      
      const findIdx = (names) => {
        for(const n of names){
          const i = hdr.findIndex(h => h && (h === n || h.includes(n)));
          if(i >= 0) return i;
        }
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
        hideLoading();
        alert('❌ File harus punya kolom minimal: posyandu, tanggal\n\nCek header: ' + rows[hIdx].join(' | '));
        return;
      }
      
      const gv = (row, i) => i >= 0 && row[i] !== undefined ? String(row[i]).trim() : '';
      const jadwalBaru = [];
      
      for(let i = hIdx + 1; i < rows.length; i++){
        const r = rows[i];
        if(!r) continue;
        const posyandu = gv(r, idx.posyandu);
        const tanggal = gv(r, idx.tanggal);
        if(!posyandu || !tanggal) continue;
        
        const d = parseDate(tanggal);
        if(!d) continue;
        
        jadwalBaru.push({
          id: genId(),
          kecamatan: gv(r, idx.kecamatan).toUpperCase() || '',
          desa: gv(r, idx.desa),
          posyandu: posyandu,
          tanggal: toISO(d),
          waktu: gv(r, idx.waktu) || '08:00-12:00',
          agenda: gv(r, idx.agenda) || 'Penimbangan & Pengukuran',
          catatan: gv(r, idx.catatan),
          createdBy: APP.user?.username || 'import',
          createdAt: new Date().toISOString()
        });
      }
      
      hideLoading();
      
      if(!jadwalBaru.length){ toast('❌ Tidak ada data valid', 'error'); return; }
      
      const msg = `📊 SUMMARY IMPORT JADWAL\n\nFile: ${file.name}\nTotal: ${jadwalBaru.length} jadwal\n\n` +
        `Mode:\n` +
        `✅ OK = TAMBAH (gabung dengan ${APP.state.jadwal.length} jadwal lama)\n` +
        `❌ CANCEL = GANTI SEMUA`;
      
      const modeAdd = confirm(msg);
      if(modeAdd){
        APP.state.jadwal = [...(APP.state.jadwal || []), ...jadwalBaru];
      } else {
        APP.state.jadwal = jadwalBaru;
      }
      
      if(typeof logAudit === 'function') logAudit('IMPORT_JADWAL', `Import ${jadwalBaru.length} jadwal`);
      saveState();
      toast(`✅ ${jadwalBaru.length} jadwal diimport`, 'success');
      renderJadwal(document.getElementById('content'));
      
    } catch(e){
      hideLoading();
      console.error('Import error:', e);
      toast('❌ Gagal import: ' + e.message, 'error');
    }
  }
  
  /* ============================================================
     EXPORT
     ============================================================ */
  window.exportJadwalCSV = function(){
    const arr = getFilteredJadwal();
    if(!arr.length){ toast('Belum ada jadwal', 'warning'); return; }
    
    const headers = ['kecamatan','desa','posyandu','tanggal','waktu','agenda','catatan'];
    const rows = arr.map(j => [j.kecamatan, j.desa, j.posyandu, j.tanggal, j.waktu, j.agenda, j.catatan]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jadwal_Posyandu_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`✅ ${arr.length} jadwal diekspor`, 'success');
  };
  
  /* ============================================================
     KIRIM KE WA
     ============================================================ */
  window.kirimJadwalWA = function(){
    const arr = getFilteredJadwal();
    if(!arr.length){ toast('Belum ada jadwal', 'warning'); return; }
    
    // Ambil jadwal bulan ini + depan (30 hari ke depan)
    const today = new Date();
    const limit = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcoming = arr.filter(j => {
      const d = parseDate(j.tanggal);
      return d && d >= today && d <= limit;
    });
    
    if(!upcoming.length){
      toast('Tidak ada jadwal dalam 30 hari ke depan', 'warning');
      return;
    }
    
    // Group by kecamatan
    const byKec = {};
    upcoming.forEach(j => {
      const k = (j.kecamatan || 'LAINNYA').toUpperCase();
      if(!byKec[k]) byKec[k] = [];
      byKec[k].push(j);
    });
    
    const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    let msg = `📅 *JADWAL POSYANDU 30 HARI KE DEPAN*\n` +
      `📍 Kabupaten Jeneponto\n` +
      `📆 ${now}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    Object.keys(byKec).sort().forEach(kec => {
      msg += `🏘️ *${kec}*\n`;
      byKec[kec].sort((a,b) => a.tanggal.localeCompare(b.tanggal)).forEach(j => {
        const d = parseDate(j.tanggal);
        const tglStr = d ? d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : j.tanggal;
        msg += `  • ${tglStr} — ${j.posyandu}\n    📍 ${j.desa} · 🕐 ${j.waktu}\n`;
      });
      msg += `\n`;
    });
    
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `🎯 _Mohon hadir tepat waktu untuk penimbangan & pemeriksaan._\n\n`;
    msg += `🔗 Info: ${WEBSITE_URL}\n\n`;
    msg += `_"Satu Data, Satu Aksi Menuju Jeneponto Bahagia"_`;
    
    copyToClipboard(msg).then(() => {
      toast('📋 Jadwal dicopy — tempel di grup WA', 'success');
      setTimeout(() => window.open(WA_GRUP_TPK, '_blank'), 500);
    }).catch(() => {
      toast('⚠️ Gagal copy', 'warning');
    });
  };
  
  /* ============================================================
     BOOT
     ============================================================ */
  function boot(){
    injectMenu();
    initJadwalState();
    console.log('%c✅ Z-STUNTING Supplement 3 — Jadwal Posyandu aktif', 'color:#26c6da;font-weight:bold');
  }
  
  // Tunggu APP siap
  if(typeof APP !== 'undefined'){
    boot();
  } else {
    const t = setInterval(() => {
      if(typeof APP !== 'undefined'){
        clearInterval(t);
        boot();
      }
    }, 500);
    setTimeout(() => clearInterval(t), 30000);
  }
})();
