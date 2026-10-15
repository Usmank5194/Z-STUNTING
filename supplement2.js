/* ================================================================
   Z-STUNTING · SUPPLEMENT 2
   9 Fitur Tambahan:
   1. Ganti Password Admin       6. Auto Backup
   2. Restore Backup JSON        7. Notifikasi Push PWA
   3. Validasi NIK & Duplikat    8. Tren Bulanan
   4. Bulk Assign + Verifikasi   9. Export Format BKKBN
   5. Log Aktivitas Lengkap
   ================================================================ */
(function(){
  const ADMIN_PASS_KEY = 'zst_admin_passwords';
  
  /* ============================================================
     HELPERS
     ============================================================ */
  function log2(action, detail){
    if(!APP || !APP.state) return;
    if(!APP.state.auditLog) APP.state.auditLog = [];
    APP.state.auditLog.unshift({
      id: 'LOG' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      ts: new Date().toISOString(),
      user: APP.user?.username || 'system',
      nama: APP.user?.nama || 'System',
      role: APP.user?.role || 'system',
      action, detail
    });
    if(APP.state.auditLog.length > 1500) APP.state.auditLog.length = 1500;
  }
  
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  
  function pad(n, l){ return String(n).padStart(l, '0'); }
  
  function fmt(n){ return (n||0).toLocaleString('id-ID'); }
  
  /* ============================================================
     1. GANTI PASSWORD ADMIN
     ============================================================ */
  function loadCustomAdminPasswords(){
    try {
      const stored = JSON.parse(localStorage.getItem(ADMIN_PASS_KEY) || '{}');
      Object.keys(stored).forEach(u => {
        const acc = ADMIN_ACCOUNTS.find(a => a.u === u);
        if(acc) acc.p = stored[u];
      });
    } catch(e){ console.warn('Load admin pass error:', e); }
  }
  
  function saveAdminPassword(username, newPass){
    try {
      const stored = JSON.parse(localStorage.getItem(ADMIN_PASS_KEY) || '{}');
      stored[username] = newPass;
      localStorage.setItem(ADMIN_PASS_KEY, JSON.stringify(stored));
      // Patch live object
      const acc = ADMIN_ACCOUNTS.find(a => a.u === username);
      if(acc) acc.p = newPass;
    } catch(e){ console.warn('Save admin pass error:', e); }
  }
  
  // Enhance profil page - tambah section ganti password admin
  function enhanceProfilPassword(){
    const origProfil = window.renderProfil;
    window.renderProfil = function(c){
      origProfil.call(this, c);
      setTimeout(() => {
        if(!APP.user || APP.user.role !== 'admin') return;
        const cards = c.querySelectorAll('.card');
        let adminCard = null;
        cards.forEach(card => { if(card.textContent.includes('Ganti Password')) adminCard = card; });
        if(!adminCard) return;
        if(adminCard.querySelector('.admin-pass-info')) return;
        
        const info = document.createElement('div');
        info.className = 'admin-pass-info';
        info.style.cssText = 'margin-top:14px;padding:12px;background:#fef3c7;border-radius:10px;font-size:12px;color:#92400e;line-height:1.6';
        info.innerHTML = `
          <b>👑 Anda login sebagai Admin.</b><br>
          Password admin bisa diganti dari halaman ini. Format: min 6 karakter.<br>
          <b>Catat password baru Anda di tempat aman!</b>
        `;
        adminCard.querySelector('.card-header').after(info);
        
        // Enable the change password button for admin
        const btn = adminCard.querySelector('button');
        if(btn){
          btn.onclick = changeAdminPassword;
        }
      }, 200);
    };
    
    window.changeAdminPassword = function(){
      const oldP = document.getElementById('oldPass')?.value || '';
      const newP = document.getElementById('newPass')?.value || '';
      const conf = document.getElementById('confirmPass')?.value || '';
      
      if(!oldP || !newP || !conf){ toast('Isi semua kolom','error'); return; }
      if(newP.length < 6){ toast('Password min 6 karakter','error'); return; }
      if(newP !== conf){ toast('Konfirmasi tidak cocok','error'); return; }
      
      const currentPass = ADMIN_ACCOUNTS.find(a => a.u === APP.user.username)?.p;
      if(oldP !== currentPass){ toast('Password lama salah','error'); return; }
      
      saveAdminPassword(APP.user.username, newP);
      log2('CHANGE_ADMIN_PASS', `Admin ${APP.user.username} ubah password`);
      saveState();
      
      ['oldPass','newPass','confirmPass'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
      });
      
      toast('✅ Password admin diubah. Catat baik-baik!', 'success');
    };
  }
  
  /* ============================================================
     2. RESTORE BACKUP JSON
     ============================================================ */
  function enhancePengaturanRestore(){
    const origPengaturan = window.renderPengaturan;
    window.renderPengaturan = function(c){
      origPengaturan.call(this, c);
      setTimeout(() => {
        const cards = c.querySelectorAll('.card');
        let backupCard = null;
        cards.forEach(card => { if(card.textContent.includes('Backup')) backupCard = card; });
        if(!backupCard) return;
        if(backupCard.querySelector('.btn-restore')) return;
        
        const wrap = backupCard.querySelector('div[style*="flex"]');
        if(!wrap) return;
        
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline btn-restore';
        btn.innerHTML = '📤 Restore Backup JSON';
        btn.style.cssText = 'background:linear-gradient(135deg,#a78bfa,#8b5cf6);color:#fff;border:none';
        btn.onclick = showRestoreDialog;
        wrap.appendChild(btn);
      }, 200);
    };
    
    window.showRestoreDialog = function(){
      const modal = document.getElementById('modalConfirm');
      if(!modal) return;
      document.getElementById('confirmTitle').textContent = '📤 Restore Backup';
      document.getElementById('confirmBody').innerHTML = `
        <div style="background:#fef3c7;padding:14px;border-radius:10px;margin-bottom:14px;font-size:12.5px;color:#92400e;line-height:1.6">
          ⚠️ <b>PERHATIAN!</b><br>
          Restore akan MENGGANTI SEMUA data saat ini.<br>
          Pastikan Anda sudah ekspor backup terbaru dulu.
        </div>
        <div class="form-group">
          <label>Pilih file backup (.json)</label>
          <input type="file" id="restoreFile" accept=".json">
        </div>
        <div id="restoreInfo" style="font-size:12px;color:#64748b;line-height:1.6"></div>
      `;
      const btn = document.getElementById('confirmBtn');
      btn.textContent = '📤 Restore Sekarang';
      btn.className = 'btn btn-warning';
      btn.style.display = 'none';
      btn.onclick = doRestore;
      
      document.getElementById('restoreFile').addEventListener('change', e => {
        const f = e.target.files[0];
        if(!f){ btn.style.display = 'none'; return; }
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const data = JSON.parse(ev.target.result);
            const cases = (data.cases||[]).length;
            const tpk = (data.tpk||[]).length;
            const accounts = (data.accounts||[]).length;
            document.getElementById('restoreInfo').innerHTML = `
              <div style="background:#dcfce7;padding:10px;border-radius:8px;color:#166534">
                ✅ <b>File valid</b><br>
                📋 ${cases} kasus<br>
                👥 ${tpk} tim TPK<br>
                🔑 ${accounts} akun<br>
                📅 Backup dari: ${data.savedAt ? new Date(data.savedAt).toLocaleString('id-ID') : '-'}
              </div>
            `;
            btn.style.display = 'inline-flex';
          } catch(err){
            document.getElementById('restoreInfo').innerHTML = `<div style="background:#fee2e2;padding:10px;border-radius:8px;color:#991b1b">❌ File tidak valid: ${escapeHtml(err.message)}</div>`;
            btn.style.display = 'none';
          }
        };
        reader.readAsText(f);
      });
      
      modal.classList.add('show');
    };
    
    async function doRestore(){
      const f = document.getElementById('restoreFile')?.files[0];
      if(!f){ toast('Pilih file dulu','warning'); return; }
      if(!confirm('⚠️ Yakin restore? Data saat ini akan diganti total!')) return;
      
      try {
        const text = await f.text();
        const data = JSON.parse(text);
        if(!data.cases && !data.tpk){ toast('File tidak valid','error'); return; }
        
        APP.state = {
          cases: data.cases || [],
          tpk: data.tpk || [],
          accounts: data.accounts || [],
          auditLog: data.auditLog || [],
          savedAt: new Date().toISOString()
        };
        log2('RESTORE_BACKUP', `Restore dari file ${f.name}`);
        saveState();
        closeModal('modalConfirm');
        toast('✅ Restore berhasil! Refresh halaman...', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch(e){
        toast('❌ Gagal restore: ' + e.message, 'error');
      }
    }
  }
  
  /* ============================================================
     3. VALIDASI NIK + DETEKSI DUPLIKAT
     ============================================================ */
  function enhanceValidasiNIK(){
    const origSaveEdit = window.saveEdit;
    window.saveEdit = function(){
      const isNew = !APP.currentEdit;
      const nikEl = document.getElementById('e_nik');
      const nama = document.getElementById('e_nama')?.value?.trim() || '';
      
      // Validasi NIK kalau ada field NIK
      if(nikEl && nikEl.value.trim()){
        const nik = nikEl.value.trim();
        if(!/^\d{16}$/.test(nik)){
          toast('⚠️ NIK harus 16 digit angka', 'error');
          nikEl.focus();
          return;
        }
        // Cek duplikat
        const existing = (APP.state.cases||[]).find(c => c.nik === nik && c.id !== (APP.currentEdit?.id||''));
        if(existing){
          if(!confirm(`⚠️ NIK ${nik} sudah terdaftar untuk "${existing.nama}".\n\nTetap lanjutkan?`)) return;
        }
      }
      
      // Panggil original
      origSaveEdit.call(this);
      
      // Log kalau berhasil (cek setelah delay)
      setTimeout(() => {
        if(nama) log2(isNew ? 'ADD_CASE' : 'EDIT_CASE', `${isNew?'Tambah':'Edit'}: ${nama}`);
      }, 500);
    };
  }
  
  // Tambah field NIK di form tambah/edit
  function enhanceFormNIK(){
    const origBuildForm = window.buildForm;
    window.buildForm = function(x, lock){
      let html = origBuildForm.call(this, x, lock);
      // Insert field NIK setelah field Nama
      if(!html.includes('id="e_nik"')){
        html = html.replace(
          /(<div class="form-group"><label>Nama Balita \*<\/label>[\s\S]*?<\/div>)/,
          `$1<div class="form-group"><label>NIK (16 digit)</label><input type="text" id="e_nik" maxlength="16" value="${escapeHtml(x.nik||'')}" placeholder="7304xxxxxxxxxxxx" inputmode="numeric"></div>`
        );
      }
      return html;
    };
    
    // Tambahkan NIK ke data yang disimpan
    const origSaveEdit = window.saveEdit;
    window.saveEdit = function(){
      if(!APP.currentEdit){
        APP._pendingNik = document.getElementById('e_nik')?.value?.trim() || '';
      } else {
        APP.currentEdit._newNik = document.getElementById('e_nik')?.value?.trim() || '';
      }
      return origSaveEdit.call(this);
    };
  }
  
  /* ============================================================
     4. BULK ASSIGN + BULK VERIFIKASI
     ============================================================ */
  function enhanceBulkActions(){
    // State untuk bulk selection
    window._bulkSelected = new Set();
    
    const origKasus = window.renderKasus;
    window.renderKasus = function(c){
      origKasus.call(this, c);
      setTimeout(() => addBulkUI(c), 250);
    };
    
    function addBulkUI(c){
      const card = c.querySelector('.card');
      if(!card) return;
      if(card.querySelector('.bulk-toolbar')) return;
      
      // Sisipkan toolbar di atas table
      const tableWrap = card.querySelector('.table-wrap');
      if(!tableWrap) return;
      
      const toolbar = document.createElement('div');
      toolbar.className = 'bulk-toolbar';
      toolbar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;background:linear-gradient(135deg,#e0f2fe,#cffafe);border-radius:12px;margin-bottom:12px;font-size:12.5px';
      toolbar.innerHTML = `
        <b style="color:#0369a1">⚡ Aksi Massal:</b>
        <span id="bulkCount" style="color:#0369a1;font-weight:700">0 dipilih</span>
        <button class="btn btn-sm" onclick="selectAllOnPage()" style="background:#fff;color:#0369a1;border:1px solid #bae6fd">☑️ Pilih Semua Halaman Ini</button>
        <button class="btn btn-sm" onclick="clearBulkSelection()" style="background:#fff;color:#64748b;border:1px solid #cbd5e1">❌ Bersihkan</button>
        <button class="btn btn-sm" onclick="bulkAssign()" style="background:linear-gradient(135deg,#a78bfa,#8b5cf6);color:#fff">👥 Assign ke TPK</button>
        <button class="btn btn-sm" onclick="bulkVerify()" style="background:linear-gradient(135deg,#16a34a,#059669);color:#fff">✅ Verifikasi</button>
        <button class="btn btn-sm" onclick="bulkExport()" style="background:linear-gradient(135deg,#4dd0e1,#26c6da);color:#fff">📤 Ekspor Terpilih</button>
      `;
      tableWrap.parentNode.insertBefore(toolbar, tableWrap);
      
      // Tambahkan checkbox di setiap row
      const rows = card.querySelectorAll('tbody tr');
      const pageData = getFilteredCases().slice((APP.page-1)*APP.pageSize, (APP.page-1)*APP.pageSize + APP.pageSize);
      
      rows.forEach((row, i) => {
        const x = pageData[i];
        if(!x) return;
        const firstCell = row.querySelector('td');
        if(!firstCell || firstCell.querySelector('.bulk-cb')) return;
        
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'bulk-cb';
        cb.style.cssText = 'margin-right:6px;cursor:pointer;width:16px;height:16px;vertical-align:middle';
        cb.checked = window._bulkSelected.has(x.id);
        cb.onchange = () => {
          if(cb.checked) window._bulkSelected.add(x.id);
          else window._bulkSelected.delete(x.id);
          updateBulkCount();
        };
        firstCell.insertBefore(cb, firstCell.firstChild);
      });
    }
    
    window.selectAllOnPage = function(){
      const pageData = getFilteredCases().slice((APP.page-1)*APP.pageSize, (APP.page-1)*APP.pageSize + APP.pageSize);
      pageData.forEach(x => window._bulkSelected.add(x.id));
      document.querySelectorAll('.bulk-cb').forEach(cb => cb.checked = true);
      updateBulkCount();
    };
    
    window.clearBulkSelection = function(){
      window._bulkSelected.clear();
      document.querySelectorAll('.bulk-cb').forEach(cb => cb.checked = false);
      updateBulkCount();
    };
    
    function updateBulkCount(){
      const el = document.getElementById('bulkCount');
      if(el) el.textContent = window._bulkSelected.size + ' dipilih';
    }
    
    window.bulkAssign = function(){
      if(!window._bulkSelected.size){ toast('Pilih kasus dulu', 'warning'); return; }
      
      const ids = Array.from(window._bulkSelected);
      const cases = ids.map(id => APP.state.cases.find(c => c.id === id)).filter(Boolean);
      const kecSet = new Set(cases.map(c => c.kecamatan).filter(Boolean));
      
      if(kecSet.size > 1){
        toast('⚠️ Pilih kasus dari SATU kecamatan saja', 'error');
        return;
      }
      
      const kec = Array.from(kecSet)[0];
      const tpkList = (APP.state.tpk||[]).filter(t => t.kecamatan === kec);
      
      if(!tpkList.length){
        toast('Tidak ada TPK di kecamatan tersebut', 'error');
        return;
      }
      
      // Modal pilih tim
      const modal = document.getElementById('modalConfirm');
      document.getElementById('confirmTitle').textContent = `👥 Assign ${ids.length} Kasus`;
      document.getElementById('confirmBody').innerHTML = `
        <div style="background:#e0f2fe;padding:12px;border-radius:10px;margin-bottom:14px;font-size:13px;color:#0369a1">
          <b>${ids.length} kasus</b> akan di-assign ke tim TPK di kecamatan <b>${escapeHtml(kec)}</b>.
        </div>
        <div class="form-group">
          <label>Pilih Mode Assign</label>
          <select id="bulkAssignMode" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px">
            <option value="auto">🤖 Otomatis (bagi rata per desa)</option>
            <option value="single">🎯 Pilih Tim Tertentu</option>
          </select>
        </div>
        <div class="form-group" id="bulkAssignTeamWrap" style="display:none">
          <label>Pilih Tim TPK</label>
          <select id="bulkAssignTeam" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px">
            ${tpkList.map(t => `<option value="${t.teamId}">Tim ${t.tim} · ${escapeHtml(t.desa)} · ${escapeHtml(t.bidan?.nama||'-')}</option>`).join('')}
          </select>
        </div>
      `;
      
      document.getElementById('bulkAssignMode').onchange = (e) => {
        document.getElementById('bulkAssignTeamWrap').style.display = e.target.value === 'single' ? 'block' : 'none';
      };
      
      const btn = document.getElementById('confirmBtn');
      btn.textContent = '👥 Assign Sekarang';
      btn.className = 'btn btn-primary-solid';
      btn.style.display = 'inline-flex';
      btn.onclick = () => {
        const mode = document.getElementById('bulkAssignMode').value;
        const teamId = mode === 'single' ? document.getElementById('bulkAssignTeam').value : null;
        
        cases.forEach(c => {
          if(mode === 'single' && teamId){
            c.team_id = teamId;
          } else {
            // Auto: cari tim di desa yang sama
            const matchTeam = tpkList.find(t => 
              String(t.desa||'').toUpperCase() === String(c.desa||'').toUpperCase()
            ) || tpkList[0];
            if(matchTeam) c.team_id = matchTeam.teamId;
          }
        });
        
        log2('BULK_ASSIGN', `Assign ${cases.length} kasus ke ${mode === 'single' ? 'tim ' + teamId : 'auto'}`);
        saveState();
        closeModal('modalConfirm');
        window._bulkSelected.clear();
        toast(`✅ ${cases.length} kasus berhasil di-assign`, 'success');
        renderKasus(document.getElementById('content'));
      };
      
      modal.classList.add('show');
    };
    
    window.bulkVerify = function(){
      if(!window._bulkSelected.size){ toast('Pilih kasus dulu', 'warning'); return; }
      
      const ids = Array.from(window._bulkSelected);
      const cases = ids.map(id => APP.state.cases.find(c => c.id === id)).filter(Boolean);
      
      if(!confirm(`✅ Verifikasi ${cases.length} kasus?\n\nSemua akan ditandai sebagai "Terverifikasi".`)) return;
      
      let count = 0;
      cases.forEach(c => {
        if(c.status_verifikasi !== 'Terverifikasi'){
          c.status_verifikasi = 'Terverifikasi';
          c.verifikasiBy = APP.user.nama;
          c.verifikasiAt = new Date().toISOString();
          count++;
        }
      });
      
      log2('BULK_VERIFY', `Verifikasi ${count} kasus`);
      saveState();
      window._bulkSelected.clear();
      toast(`✅ ${count} kasus berhasil diverifikasi`, 'success');
      renderKasus(document.getElementById('content'));
    };
    
    window.bulkExport = function(){
      if(!window._bulkSelected.size){ toast('Pilih kasus dulu', 'warning'); return; }
      const ids = Array.from(window._bulkSelected);
      const cases = ids.map(id => APP.state.cases.find(c => c.id === id)).filter(Boolean);
      
      const headers = ['nik','nama','jk','tgl_lahir','usia_bulan','nama_ibu','nama_ayah','alamat','desa','kecamatan','hp_ortu','bb','tb','status_gizi','pendampingan'];
      const rows = cases.map(x => [x.nik,x.nama,x.jk,x.tgl_lahir,x.usia_bulan,x.nama_ibu,x.nama_ayah,x.alamat,x.desa,x.kecamatan,x.hp_ortu,x.bb,x.tb,x.status_gizi,x.status_pendampingan]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `BNBA_Selected_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast(`✅ ${cases.length} kasus diekspor`, 'success');
    };
  }
  
  /* ============================================================
     5. LOG AKTIVITAS LENGKAP
     ============================================================ */
  function enhanceAuditPage(){
    const origAudit = window.renderAudit;
    window.renderAudit = function(c){
      const logs = (APP.state.auditLog || []).slice();
      
      // Stats
      const stats = {};
      logs.forEach(l => { stats[l.action] = (stats[l.action]||0) + 1; });
      const topActions = Object.entries(stats).sort((a,b) => b[1]-a[1]).slice(0, 5);
      
      c.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">📜 Log Aktivitas</div>
              <div class="card-sub">${fmt(logs.length)} aktivitas tercatat</div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="exportAuditLog()">📤 Ekspor Log</button>
          </div>
          
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
            ${topActions.map(([act, cnt]) => 
              `<span style="background:#e0f2fe;color:#0369a1;padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:700">${escapeHtml(act)}: ${cnt}</span>`
            ).join('')}
          </div>
          
          <div class="filters">
            <input type="text" id="auditSearch" placeholder="🔍 Cari aktivitas/nama user..." oninput="filterAuditLog()">
            <select id="auditFilter" onchange="filterAuditLog()">
              <option value="">Semua Aksi</option>
              ${Object.keys(stats).map(a => `<option>${escapeHtml(a)}</option>`).join('')}
            </select>
          </div>
          
          ${logs.length ? `<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;max-height:600px;overflow-y:auto" id="auditList">
            ${logs.slice(0, 500).map(l => `
              <div class="audit-row" data-action="${escapeHtml(l.action)}" data-search="${escapeHtml((l.user||'')+' '+(l.nama||'')+' '+(l.detail||'')).toLowerCase()}" style="display:grid;grid-template-columns:140px 120px 1fr;gap:10px;padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12.5px;align-items:center">
                <div style="color:#64748b;font-size:11.5px">${new Date(l.ts).toLocaleString('id-ID')}</div>
                <div><span class="badge ${l.action.includes('DELETE')?'badge-danger':l.action.includes('ADD')||l.action.includes('CREATE')?'badge-success':l.action.includes('BULK')?'badge-purple':'badge-info'}">${escapeHtml(l.action)}</span></div>
                <div><b>${escapeHtml(l.user)}</b> ${l.role ? `<span style="color:#94a3b8;font-size:11px">(${escapeHtml(l.role)})</span>` : ''} — ${escapeHtml(l.detail)}</div>
              </div>
            `).join('')}
          </div>
          ${logs.length > 500 ? `<div style="text-align:center;padding:12px;color:#6b7280;font-size:12px">500 dari ${fmt(logs.length)} aktivitas</div>` : ''}
          ` : '<div class="empty"><div class="ic">📜</div><div>Belum ada aktivitas</div></div>'}
        </div>
      `;
    };
    
    window.filterAuditLog = function(){
      const q = (document.getElementById('auditSearch')?.value||'').toLowerCase();
      const act = document.getElementById('auditFilter')?.value || '';
      document.querySelectorAll('#auditList .audit-row').forEach(row => {
        const matchSearch = !q || row.dataset.search.includes(q);
        const matchAction = !act || row.dataset.action === act;
        row.style.display = matchSearch && matchAction ? '' : 'none';
      });
    };
    
    window.exportAuditLog = function(){
      const logs = APP.state.auditLog || [];
      const headers = ['timestamp','user','nama','role','action','detail'];
      const rows = logs.map(l => [l.ts, l.user||'', l.nama||'', l.role||'', l.action||'', l.detail||'']);
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Audit_Log_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast('✅ Log diekspor', 'success');
    };
  }
  
  /* ============================================================
     6. AUTO BACKUP — Reminder + Quick Backup
     ============================================================ */
  function installSmartBackup(){
    const KEY = 'zst_lastBackup';
    const oneDay = 24 * 60 * 60 * 1000;
    
    function checkBackup(){
      const last = parseInt(localStorage.getItem(KEY) || '0');
      const now = Date.now();
      if(now - last > oneDay){
        showBackupReminder();
      }
    }
    
    function showBackupReminder(){
      if(document.getElementById('backupReminder')) return;
      const el = document.createElement('div');
      el.id = 'backupReminder';
      el.style.cssText = 'position:fixed;bottom:90px;right:24px;z-index:250;background:#fff;border-radius:14px;padding:14px 18px;box-shadow:0 15px 40px rgba(0,0,0,.2);max-width:300px;font-size:13px;display:flex;flex-direction:column;gap:10px;border-left:4px solid #f59e0b';
      el.innerHTML = `
        <div style="font-weight:700;color:#92400e">💾 Waktunya Backup Data</div>
        <div style="color:#64748b;font-size:12px;line-height:1.5">Backup terakhir lebih dari 24 jam lalu. Amankan data sekarang.</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary-solid" style="flex:1;justify-content:center" onclick="quickBackup()">📥 Backup Sekarang</button>
          <button class="btn btn-outline" onclick="dismissBackup()">Nanti</button>
        </div>
      `;
      document.body.appendChild(el);
    }
    
    window.quickBackup = function(){
      if(typeof exportJSON === 'function') exportJSON();
      localStorage.setItem(KEY, Date.now().toString());
      log2('BACKUP', 'Manual backup via reminder');
      const el = document.getElementById('backupReminder');
      if(el) el.remove();
      toast('✅ Backup terunduh', 'success');
    };
    
    window.dismissBackup = function(){
      localStorage.setItem(KEY, Date.now().toString());
      const el = document.getElementById('backupReminder');
      if(el) el.remove();
    };
    
    // Cek setelah login
    setTimeout(checkBackup, 10000);
    setInterval(checkBackup, 60 * 60 * 1000); // tiap 1 jam
  }
  
  /* ============================================================
     7. NOTIFIKASI PUSH PWA
     ============================================================ */
  function installPushNotification(){
    if(!('Notification' in window)) return;
    
    // Request permission setelah login (kalau belum)
    const KEY = 'zst_notif_asked';
    if(Notification.permission === 'default' && !localStorage.getItem(KEY)){
      setTimeout(() => {
        if(confirm('🔔 Aktifkan notifikasi?\n\nAnda akan dapat notifikasi saat:\n• Ada kasus baru di tim Anda\n• Jadwal Posyandu\n• Pengingat backup')){
          Notification.requestPermission().then(perm => {
            localStorage.setItem(KEY, '1');
            if(perm === 'granted') toast('✅ Notifikasi aktif','success');
          });
        } else {
          localStorage.setItem(KEY, '1');
        }
      }, 15000);
    }
    
    // Fungsi kirim notif
    window.sendNotif = function(title, body, tag){
      if(Notification.permission !== 'granted') return;
      try {
        const n = new Notification(title, {
          body: body,
          icon: 'icon-192.png',
          badge: 'icon-192.png',
          tag: tag || 'zstunting',
          requireInteraction: false
        });
        setTimeout(() => n.close(), 8000);
      } catch(e){ console.warn('Notif error:', e); }
    };
    
    // Cek kasus baru untuk kader setelah sync
    const origPull = Cloud.pull;
    Cloud.pull = async function(silent){
      const beforeCount = (APP.state.cases||[]).filter(c => c.team_id === APP.user?.teamId).length;
      const result = await origPull.call(this, silent);
      const afterCount = (APP.state.cases||[]).filter(c => c.team_id === APP.user?.teamId).length;
      if(afterCount > beforeCount && APP.user?.role === 'kader'){
        window.sendNotif(
          '📋 Kasus Baru untuk Tim Anda',
          `${afterCount - beforeCount} kasus baru masuk. Buka aplikasi untuk melihat.`,
          'new-cases'
        );
      }
      return result;
    };
  }
  
  /* ============================================================
     8. TREN BULANAN DI DASHBOARD
     ============================================================ */
  function enhanceDashboardTren(){
    const origDashboard = window.renderDashboard;
    window.renderDashboard = function(c){
      origDashboard.call(this, c);
      setTimeout(() => addTrenChart(c), 300);
    };
    
    function addTrenChart(c){
      const cases = visibleCases();
      if(!cases.length) return;
      if(c.querySelector('.tren-card')) return;
      
      // Hitung data per bulan dari riwayat
      const now = new Date();
      const months = [];
      for(let i = 11; i >= 0; i--){
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: d.toISOString().slice(0, 7),
          label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
          kunjungan: 0,
          stunting: 0,
          giziKurang: 0,
          giziBuruk: 0,
          verified: 0
        });
      }
      
      cases.forEach(x => {
        (x.riwayat || []).forEach(r => {
          const mk = (r.tanggal || '').slice(0, 7);
          const m = months.find(mm => mm.key === mk);
          if(!m) return;
          m.kunjungan++;
          if(r.statusGizi === 'Stunting') m.stunting++;
          else if(r.statusGizi === 'Gizi Kurang') m.giziKurang++;
          else if(r.statusGizi === 'Gizi Buruk') m.giziBuruk++;
        });
      });
      
      // Perbandingan bulan ini vs bulan lalu
      const thisMonth = months[months.length - 1];
      const lastMonth = months[months.length - 2] || { kunjungan: 0, stunting: 0 };
      const trendKunjungan = lastMonth.kunjungan ? Math.round((thisMonth.kunjungan - lastMonth.kunjungan) / lastMonth.kunjungan * 100) : 0;
      const trendStunting = lastMonth.stunting ? Math.round((thisMonth.stunting - lastMonth.stunting) / lastMonth.stunting * 100) : 0;
      
      const maxKunjungan = Math.max(...months.map(m => m.kunjungan), 10);
      const W = 800, H = 200, PAD = 40;
      const stepX = (W - PAD * 2) / (months.length - 1);
      
      const linePath = (key, color) => {
        const pts = months.map((m, i) => {
          const x = PAD + i * stepX;
          const y = H - PAD - (m[key] / maxKunjungan) * (H - PAD * 2);
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ');
        return `<path d="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>`;
      };
      
      const dots = (key, color) => months.map((m, i) => {
        const x = PAD + i * stepX;
        const y = H - PAD - (m[key] / maxKunjungan) * (H - PAD * 2);
        return `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"/>`;
      }).join('');
      
      const xLabels = months.map((m, i) => 
        `<text x="${PAD + i * stepX}" y="${H - 15}" text-anchor="middle" font-size="10" fill="#7c8ba3">${m.label}</text>`
      ).join('');
      
      const yGrid = [0, 0.5, 1].map(t => {
        const y = H - PAD - t * (H - PAD * 2);
        return `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#e0e8f0" stroke-dasharray="2,3"/>
                <text x="${PAD - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#a3b1c6">${Math.round(t * maxKunjungan)}</text>`;
      }).join('');
      
      const card = document.createElement('div');
      card.className = 'card tren-card';
      card.innerHTML = `
        <div class="card-header">
          <div>
            <div class="card-title">📈 Tren Kunjungan 12 Bulan Terakhir</div>
            <div class="card-sub">Perkembangan aktivitas pendampingan</div>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:var(--soft-bg);padding:14px;border-radius:12px;text-align:center">
            <div style="font-size:11px;color:#7c8ba3;font-weight:600">KUNJUNGAN BULAN INI</div>
            <div style="font-size:26px;font-weight:800;color:var(--soft-cyan-deep);margin-top:4px">${thisMonth.kunjungan}</div>
            <div style="font-size:11px;color:${trendKunjungan >= 0 ? '#16a34a' : '#dc2626'};font-weight:700;margin-top:2px">${trendKunjungan >= 0 ? '▲' : '▼'} ${Math.abs(trendKunjungan)}% vs bulan lalu</div>
          </div>
          <div style="background:var(--soft-bg);padding:14px;border-radius:12px;text-align:center">
            <div style="font-size:11px;color:#7c8ba3;font-weight:600">STUNTING BULAN INI</div>
            <div style="font-size:26px;font-weight:800;color:#dc2626;margin-top:4px">${thisMonth.stunting}</div>
            <div style="font-size:11px;color:${trendStunting <= 0 ? '#16a34a' : '#dc2626'};font-weight:700;margin-top:2px">${trendStunting >= 0 ? '▲' : '▼'} ${Math.abs(trendStunting)}% vs bulan lalu</div>
          </div>
          <div style="background:var(--soft-bg);padding:14px;border-radius:12px;text-align:center">
            <div style="font-size:11px;color:#7c8ba3;font-weight:600">RATA-RATA/BULAN</div>
            <div style="font-size:26px;font-weight:800;color:var(--soft-purple-deep);margin-top:4px">${Math.round(months.reduce((s, m) => s + m.kunjungan, 0) / 12)}</div>
            <div style="font-size:11px;color:#7c8ba3;margin-top:2px">kunjungan/bulan</div>
          </div>
        </div>
        
        <div style="overflow-x:auto">
          <svg viewBox="0 0 ${W} ${H}" style="min-width:700px;width:100%;height:auto">
            ${yGrid}
            ${linePath('kunjungan', '#26c6da')}
            ${linePath('stunting', '#dc2626')}
            ${linePath('giziKurang', '#f59e0b')}
            ${dots('kunjungan', '#26c6da')}
            ${dots('stunting', '#dc2626')}
            ${dots('giziKurang', '#f59e0b')}
            ${xLabels}
          </svg>
        </div>
        
        <div style="display:flex;gap:16px;justify-content:center;margin-top:14px;flex-wrap:wrap;font-size:12px">
          <span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:3px;background:#26c6da;border-radius:2px"></span> Total Kunjungan</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:3px;background:#dc2626;border-radius:2px"></span> Stunting</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:3px;background:#f59e0b;border-radius:2px"></span> Gizi Kurang</span>
        </div>
      `;
      
      c.appendChild(card);
    }
  }
  
  /* ============================================================
     9. EXPORT FORMAT BKKBN
     ============================================================ */
  function enhanceExportBKKBN(){
    const origLaporan = window.renderLaporan;
    window.renderLaporan = function(c){
      origLaporan.call(this, c);
      setTimeout(() => {
        const cards = c.querySelectorAll('.card');
        cards.forEach(card => {
          if(card.textContent.includes('Ekspor Laporan') && !card.querySelector('.btn-bkkbn')){
            const wrap = card.querySelector('div[style*="flex"]');
            if(!wrap) return;
            const btn = document.createElement('button');
            btn.className = 'btn btn-bkkbn';
            btn.innerHTML = '🏛️ Excel Format BKKBN';
            btn.style.cssText = 'background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;padding:10px 18px;border-radius:10px;border:none;font-weight:700;cursor:pointer';
            btn.onclick = exportBKKBN;
            wrap.appendChild(btn);
          }
        });
      }, 200);
    };
    
    window.exportBKKBN = function(){
      if(typeof XLSX === 'undefined'){ toast('Library Excel belum siap','error'); return; }
      const cases = visibleCases();
      const now = new Date();
      const periode = `${pad(now.getMonth()+1,2)}/${now.getFullYear()}`;
      
      // Sheet 1: Rekap BNBA sesuai format BKKBN
      const header1 = ['NO', 'NIK', 'NAMA BALITA', 'JK', 'TGL LAHIR', 'USIA (BLN)', 'NAMA ORANG TUA', '', 'ALAMAT', 'DESA/KEL', 'KECAMATAN', 'KABUPATEN', 'PROVINSI', 'BB (KG)', 'TB (CM)', 'STATUS GIZI', 'KATEGORI STUNTING', 'KET'];
      const header2 = ['', '', '', '', '', '', 'AYAH', 'IBU', '', '', '', '', '', '', '', '', '', ''];
      
      const dataRows = cases.map((x, i) => [
        i + 1,
        x.nik || '',
        (x.nama || '').toUpperCase(),
        x.jk || '',
        x.tgl_lahir || '',
        x.usia_bulan || 0,
        (x.nama_ayah || '').toUpperCase(),
        (x.nama_ibu || '').toUpperCase(),
        x.alamat || '',
        (x.desa || '').toUpperCase(),
        (x.kecamatan || '').toUpperCase(),
        'JENEPONTO',
        'SULAWESI SELATAN',
        x.bb || '',
        x.tb || '',
        x.status_gizi || '',
        x.status_gizi === 'Stunting' ? 'PENDEK' : (x.status_gizi === 'Gizi Buruk' ? 'SANGAT PENDEK' : ''),
        x.catatan || ''
      ]);
      
      // Tambah baris kosong atas untuk header instansi
      const instansiHeader = [
        ['PEMERINTAH KABUPATEN JENEPONTO'],
        ['DINAS PENGENDALIAN PENDUDUK DAN KELUARGA BERENCANA'],
        ['LAPORAN BNBA (BY NAME BY ADDRESS) STUNTING'],
        [`PERIODE: ${periode}`],
        ['']
      ];
      
      const sheet1Data = [...instansiHeader, header1, header2, ...dataRows];
      const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
      
      // Merge header rows untuk tampilan rapi
      ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 17 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 17 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 17 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 17 } },
        { s: { r: 5, c: 6 }, e: { r: 5, c: 7 } }
      ];
      ws1['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 25 }, { wch: 5 }, { wch: 12 }, { wch: 8 },
        { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 12 },
        { wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 18 }, { wch: 12 }
      ];
      
      // Sheet 2: Rekap per Kecamatan
      const perKec = {};
      cases.forEach(x => {
        const k = x.kecamatan || '-';
        if(!perKec[k]) perKec[k] = { total: 0, stunting: 0, giziKurang: 0, giziBuruk: 0, ideal: 0 };
        perKec[k].total++;
        if(x.status_gizi === 'Stunting') perKec[k].stunting++;
        else if(x.status_gizi === 'Gizi Kurang') perKec[k].giziKurang++;
        else if(x.status_gizi === 'Gizi Buruk') perKec[k].giziBuruk++;
        else perKec[k].ideal++;
      });
      
      const rekapData = [
        ['REKAP BNBA PER KECAMATAN'],
        [`PERIODE: ${periode}`],
        [''],
        ['NO', 'KECAMATAN', 'TOTAL', 'STUNTING', 'GIZI KURANG', 'GIZI BURUK', 'IDEAL', 'PREVALENSI (%)'],
        ...Object.entries(perKec).sort((a, b) => b[1].total - a[1].total).map(([kec, d], i) => [
          i + 1,
          kec,
          d.total,
          d.stunting,
          d.giziKurang,
          d.giziBuruk,
          d.ideal,
          d.total ? Math.round(d.stunting / d.total * 1000) / 10 : 0
        ]),
        ['', 'TOTAL', cases.length, cases.filter(x => x.status_gizi === 'Stunting').length, 0, 0, 0, '']
      ];
      
      const ws2 = XLSX.utils.aoa_to_sheet(rekapData);
      ws2['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
      ];
      ws2['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, 'BNBA Detail');
      XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Per Kecamatan');
      
      const fname = `BNBA_BKKBN_Jeneponto_${now.getFullYear()}_${pad(now.getMonth() + 1, 2)}.xlsx`;
      XLSX.writeFile(wb, fname);
      
      log2('EXPORT_BKKBN', `Export format BKKBN: ${cases.length} kasus`);
      toast('✅ File Excel format BKKBN diunduh', 'success');
    };
  }
  
  /* ============================================================
     BOOT
     ============================================================ */
  function boot(){
    loadCustomAdminPasswords();
    enhanceProfilPassword();
    enhancePengaturanRestore();
    enhanceFormNIK();
    enhanceValidasiNIK();
    enhanceBulkActions();
    enhanceAuditPage();
    installSmartBackup();
    installPushNotification();
    enhanceDashboardTren();
    enhanceExportBKKBN();
    
    console.log('%c✅ Z-STUNTING Supplement 2 aktif — 9 fitur', 'color:#059669;font-weight:bold');
  }
  
  // Tunggu APP siap
  if(typeof APP !== 'undefined' && typeof window.toast === 'function'){
    boot();
  } else {
    const t = setInterval(() => {
      if(typeof APP !== 'undefined' && typeof window.toast === 'function'){
        clearInterval(t);
        boot();
      }
    }, 500);
    setTimeout(() => clearInterval(t), 30000);
  }
})();
