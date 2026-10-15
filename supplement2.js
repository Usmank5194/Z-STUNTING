/* ================================================================
   Z-STUNTING · SUPPLEMENT 2 (FINAL FIXED VERSION)
   9 Fitur Tambahan:
   1. Ganti Password Admin       6. Auto Backup
   2. Restore Backup JSON        7. Notifikasi Push PWA
   3. Validasi NIK & Duplikat    8. Tren Bulanan
   4. Bulk Assign + Verifikasi   9. Export Format BKKBN
   5. Log Aktivitas Lengkap
   
   ✅ Role-Based Access Control: TPK tidak bisa Verifikasi/Assign
   ================================================================ */
(function(){
  const ADMIN_PASS_KEY = 'zst_admin_passwords';
  
  /* ============================================================
     HELPERS
     ============================================================ */
  function isAdmin(){
    return APP && APP.user && APP.user.role === 'admin';
  }
  
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
  
  function downloadFile(filename, content, type){
    const blob = new Blob([content], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  
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
      const acc = ADMIN_ACCOUNTS.find(a => a.u === username);
      if(acc) acc.p = newPass;
    } catch(e){ console.warn('Save admin pass error:', e); }
  }
  
  function enhanceProfilPassword(){
    const origProfil = window.renderProfil;
    if(!origProfil) return;
    window.renderProfil = function(c){
      origProfil.call(this, c);
      setTimeout(() => {
        if(!isAdmin()) return;
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
        const cardHeader = adminCard.querySelector('.card-header');
        if(cardHeader) cardHeader.after(info);
        
        const btn = adminCard.querySelector('button');
        if(btn) btn.onclick = changeAdminPassword;
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
    if(!origPengaturan) return;
    window.renderPengaturan = function(c){
      origPengaturan.call(this, c);
      setTimeout(() => {
        if(!isAdmin()) return; // Hanya admin yang bisa restore
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
    if(!origSaveEdit) return;
    window.saveEdit = function(){
      const isNew = !APP.currentEdit;
      const nikEl = document.getElementById('e_nik');
      const nama = document.getElementById('e_nama')?.value?.trim() || '';
      
      if(nikEl && nikEl.value.trim()){
        const nik = nikEl.value.trim();
        if(!/^\d{16}$/.test(nik)){
          toast('⚠️ NIK harus 16 digit angka', 'error');
          nikEl.focus();
          return;
        }
        const existing = (APP.state.cases||[]).find(c => c.nik === nik && c.id !== (APP.currentEdit?.id||''));
        if(existing){
          if(!confirm(`⚠️ NIK ${nik} sudah terdaftar untuk "${existing.nama}".\n\nTetap lanjutkan?`)) return;
        }
      }
      
      origSaveEdit.call(this);
      
      setTimeout(() => {
        if(nama) log2(isNew ? 'ADD_CASE' : 'EDIT_CASE', `${isNew?'Tambah':'Edit'}: ${nama}`);
      }, 500);
    };
  }
  
  function enhanceFormNIK(){
    const origBuildForm = window.buildForm;
    if(!origBuildForm) return;
    window.buildForm = function(x, lock){
      let html = origBuildForm.call(this, x, lock);
      if(!html.includes('id="e_nik"')){
        html = html.replace(
          /(<div class="form-group"><label>Nama Balita \*<\/label>[\s\S]*?<\/div>)/,
          `$1<div class="form-group"><label>NIK (16 digit)</label><input type="text" id="e_nik" maxlength="16" value="${escapeHtml(x.nik||'')}" placeholder="7304xxxxxxxxxxxx" inputmode="numeric"></div>`
        );
      }
      return html;
    };
    
    const origSaveEdit = window.saveEdit;
    if(!origSaveEdit) return;
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
     4. BULK ASSIGN + BULK VERIFIKASI (🔥 FIXED ROLE-BASED)
     ============================================================ */
  function enhanceBulkActions(){
    window._bulkSelected = new Set();
    
    const origKasus = window.renderKasus;
    if(!origKasus) return;
    window.renderKasus = function(c){
      origKasus.call(this, c);
      setTimeout(() => addBulkUI(c), 250);
    };
    
    function addBulkUI(c){
      const card = c.querySelector('.card');
      if(!card) return;
      if(card.querySelector('.bulk-toolbar')) return;
      
      const tableWrap = card.querySelector('.table-wrap');
      if(!tableWrap) return;
      
      // 🔥 CEK ROLE: Admin atau bukan?
      const admin = isAdmin();
      
      const toolbar = document.createElement('div');
      toolbar.className = 'bulk-toolbar';
      toolbar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;background:linear-gradient(135deg,#e0f2fe,#cffafe);border-radius:12px;margin-bottom:12px;font-size:12.5px';
      
      // 🔥 Tombol Verifikasi & Assign HANYA untuk Admin
      const adminButtons = admin ? `
        <button class="btn btn-sm" onclick="bulkAssign()" style="background:linear-gradient(135deg,#a78bfa,#8b5cf6);color:#fff">👥 Assign ke TPK</button>
        <button class="btn btn-sm" onclick="bulkVerify()" style="background:linear-gradient(135deg,#16a34a,#059669);color:#fff">✅ Verifikasi</button>
      ` : '';
      
      toolbar.innerHTML = `
        <b style="color:#0369a1">⚡ Aksi Massal:</b>
        <span id="bulkCount" style="color:#0369a1;font-weight:700">0 dipilih</span>
        <button class="btn btn-sm" onclick="selectAllOnPage()" style="background:#fff;color:#0369a1;border:1px solid #bae6fd">☑️ Pilih Semua Halaman Ini</button>
        <button class="btn btn-sm" onclick="clearBulkSelection()" style="background:#fff;color:#64748b;border:1px solid #cbd5e1">❌ Bersihkan</button>
        ${adminButtons}
        <button class="btn btn-sm" onclick="bulkExport()" style="background:linear-gradient(135deg,#4dd0e1,#26c6da);color:#fff">📤 Ekspor Terpilih</button>
      `;
      tableWrap.parentNode.insertBefore(toolbar, tableWrap);
      
      // Checkbox per baris
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
      // 🔥 PROTEKSI GANDA: cek role
      if(!isAdmin()){
        toast('⛔ Hanya admin yang bisa assign ke TPK', 'error');
        return;
      }
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
      // 🔥 PROTEKSI GANDA: cek role
      if(!isAdmin()){
        toast('⛔ Hanya admin yang bisa memverifikasi', 'error');
        return;
      }
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
      
      log2('BULK_VERIFY', `Verifikasi ${count} kasus oleh ${APP.user.nama}`);
      saveState();
      window._bulkSelected.clear();
      toast(`✅ ${count} kasus berhasil diverifikasi`, 'success');
      renderKasus(document.getElementById('content'));
    };
    
    window.bulkExport = function(){
      if(!window._bulkSelected.size){ toast('Pilih kasus dulu', 'warning'); return; }
      const ids = Array.from(window._bulkSelected);
      const cases = ids.map(id => APP.state.cases.find(c => c.id === id)).filter(Boolean);
      
      const headers = ['nik','nama','jk','tgl_lahir','usia_bulan','nama_ibu','nama_ayah','desa','kecamatan','status_gizi','status_verifikasi','team_id'];
      const rows = cases.map(c => headers.map(h => {
        const v = c[h] ?? '';
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(','));
      
      const csv = headers.join(',') + '\n' + rows.join('\n');
      const fname = `Z-STUNTING_terpilih_${Date.now()}.csv`;
      downloadFile(fname, '\ufeff' + csv, 'text/csv;charset=utf-8');
      
      log2('BULK_EXPORT', `Ekspor ${cases.length} kasus terpilih`);
      toast(`📤 ${cases.length} kasus diekspor`, 'success');
    };
  }
  
  /* ============================================================
     5. LOG AKTIVITAS LENGKAP
     ============================================================ */
  function enhanceLogAktivitas(){
    window.renderLog = function(c){
      const logs = APP.state.auditLog || [];
      
      c.innerHTML = `
        <div class="page-head">
          <div>
            <h1>📜 Log Aktivitas</h1>
            <p>Total ${logs.length} aktivitas tercatat</p>
          </div>
          <button class="btn btn-primary" onclick="exportLog()">📤 Ekspor Log</button>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>Riwayat Aktivitas</h3>
            <button class="btn btn-sm btn-outline" onclick="clearLogConfirm()" style="color:#dc2626;border-color:#fecaca">🗑️ Bersihkan Log</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Waktu</th><th>User</th><th>Role</th><th>Aksi</th><th>Detail</th></tr>
              </thead>
              <tbody>
                ${logs.length ? logs.slice(0, 200).map(l => `
                  <tr>
                    <td style="white-space:nowrap;font-size:11.5px">${new Date(l.ts).toLocaleString('id-ID')}</td>
                    <td><b>${escapeHtml(l.nama)}</b><br><span style="font-size:11px;color:#64748b">@${escapeHtml(l.user)}</span></td>
                    <td><span class="badge" style="background:#e0f2fe;color:#0369a1">${escapeHtml(l.role)}</span></td>
                    <td><span class="badge" style="background:#fef3c7;color:#92400e">${escapeHtml(l.action)}</span></td>
                    <td style="font-size:12px">${escapeHtml(l.detail)}</td>
                  </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center;padding:30px;color:#94a3b8">Belum ada aktivitas</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    };
    
    window.exportLog = function(){
      const logs = APP.state.auditLog || [];
      if(!logs.length){ toast('Log kosong','warning'); return; }
      const headers = ['ts','user','nama','role','action','detail'];
      const rows = logs.map(l => headers.map(h => `"${String(l[h]||'').replace(/"/g,'""')}"`).join(','));
      const csv = headers.join(',') + '\n' + rows.join('\n');
      downloadFile(`log_aktivitas_${Date.now()}.csv`, '\ufeff' + csv, 'text/csv;charset=utf-8');
      toast('📤 Log diekspor', 'success');
    };
    
    window.clearLogConfirm = function(){
      if(!isAdmin()){ toast('⛔ Hanya admin','error'); return; }
      if(!confirm('🗑️ Yakin hapus semua log aktivitas?')) return;
      APP.state.auditLog = [];
      saveState();
      renderLog(document.getElementById('content'));
      toast('Log dibersihkan', 'success');
    };
  }
  
  /* ============================================================
     6. AUTO BACKUP
     ============================================================ */
  function setupAutoBackup(){
    const BACKUP_KEY = 'zst_last_auto_backup';
    const INTERVAL = 24 * 60 * 60 * 1000; // 24 jam
    
    function doAutoBackup(){
      try {
        const last = parseInt(localStorage.getItem(BACKUP_KEY) || '0');
        if(Date.now() - last < INTERVAL) return;
        
        const data = {
          cases: APP.state.cases || [],
          tpk: APP.state.tpk || [],
          accounts: APP.state.accounts || [],
          auditLog: (APP.state.auditLog||[]).slice(0, 500),
          savedAt: new Date().toISOString(),
          auto: true
        };
        
        localStorage.setItem('zst_auto_backup_data', JSON.stringify(data));
        localStorage.setItem(BACKUP_KEY, String(Date.now()));
        console.log('✅ Auto-backup lokal tersimpan');
      } catch(e){
        console.warn('Auto-backup error:', e);
      }
    }
    
    // Jalankan 30 detik setelah app ready
    setTimeout(doAutoBackup, 30000);
    
    // Cek ulang tiap 1 jam
    setInterval(doAutoBackup, 60 * 60 * 1000);
    
    window.downloadAutoBackup = function(){
      const raw = localStorage.getItem('zst_auto_backup_data');
      if(!raw){ toast('Belum ada auto-backup','warning'); return; }
      const data = JSON.parse(raw);
      downloadFile(`Z-STUNTING_autobackup_${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json');
      toast('📤 Auto-backup diunduh', 'success');
    };
  }
  
  /* ============================================================
     7. NOTIFIKASI PUSH PWA
     ============================================================ */
  function setupPushNotification(){
    if(!('Notification' in window)) return;
    
    window.requestPushPermission = async function(){
      try {
        const perm = await Notification.requestPermission();
        if(perm === 'granted'){
          toast('🔔 Notifikasi diaktifkan', 'success');
          new Notification('Z-STUNTING Jeneponto', {
            body: '✅ Notifikasi berhasil diaktifkan!',
            icon: 'icon-192.png',
            badge: 'icon-192.png'
          });
          localStorage.setItem('zst_push_enabled', '1');
          return true;
        } else {
          toast('⚠️ Notifikasi ditolak', 'warning');
          return false;
        }
      } catch(e){
        console.warn('Push error:', e);
        return false;
      }
    };
    
    window.sendLocalNotif = function(title, body){
      if(Notification.permission !== 'granted') return;
      try {
        new Notification(title, {
          body,
          icon: 'icon-192.png',
          badge: 'icon-192.png',
          tag: 'zst-' + Date.now()
        });
      } catch(e){ console.warn(e); }
    };
    
    // Auto-request pertama kali
    if(localStorage.getItem('zst_push_enabled') !== '1' && Notification.permission === 'default'){
      setTimeout(() => {
        if(confirm('🔔 Aktifkan notifikasi untuk pengingat jadwal posyandu & update data?')){
          window.requestPushPermission();
        }
      }, 60000); // 1 menit setelah buka
    }
  }
  
  /* ============================================================
     8. TREN BULANAN
     ============================================================ */
  function enhanceTrenBulanan(){
    const origDashboard = window.renderDashboard;
    if(!origDashboard) return;
    
    window.renderDashboard = function(c){
      origDashboard.call(this, c);
      setTimeout(() => injectTrenChart(c), 300);
    };
    
    function injectTrenChart(c){
      const cards = c.querySelectorAll('.card');
      if(!cards.length) return;
      if(c.querySelector('#trenBulananCard')) return;
      
      // Hitung tren 6 bulan terakhir dari tgl_lahir/created
      const now = new Date();
      const months = [];
      for(let i = 5; i >= 0; i--){
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
          key: `${d.getFullYear()}-${pad(d.getMonth()+1, 2)}`,
          stunting: 0, giziKurang: 0, total: 0
        });
      }
      
      (APP.state.cases||[]).forEach(x => {
        const created = x.created_at || x.tanggal || x.tgl_lahir;
        if(!created) return;
        const d = new Date(created);
        const key = `${d.getFullYear()}-${pad(d.getMonth()+1, 2)}`;
        const m = months.find(m => m.key === key);
        if(!m) return;
        m.total++;
        if(x.status_gizi === 'Stunting') m.stunting++;
        else if(x.status_gizi === 'Gizi Kurang') m.giziKurang++;
      });
      
      const maxVal = Math.max(1, ...months.map(m => m.total));
      
      const card = document.createElement('div');
      card.id = 'trenBulananCard';
      card.className = 'card';
      card.style.marginTop = '16px';
      card.innerHTML = `
        <div class="card-header">
          <h3>📈 Tren 6 Bulan Terakhir</h3>
          <span style="font-size:12px;color:#64748b">Berdasarkan tanggal input data</span>
        </div>
        <div style="padding:16px 8px">
          <div style="display:flex;align-items:flex-end;gap:10px;height:180px;padding:0 8px;border-bottom:2px solid #e2e8f0">
            ${months.map(m => {
              const hTotal = (m.total / maxVal) * 100;
              const hStunting = m.total ? (m.stunting / m.total) * hTotal : 0;
              const hGizi = m.total ? (m.giziKurang / m.total) * hTotal : 0;
              return `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                  <div style="font-size:11px;font-weight:700;color:#334155">${m.total}</div>
                  <div style="width:100%;max-width:44px;height:${hTotal}%;background:linear-gradient(180deg,#cffafe,#4dd0e1);border-radius:6px 6px 0 0;position:relative;overflow:hidden;min-height:4px">
                    <div style="position:absolute;bottom:0;left:0;right:0;height:${(hStunting/hTotal)*100}%;background:linear-gradient(180deg,#ef4444,#dc2626)"></div>
                    <div style="position:absolute;bottom:${(hStunting/hTotal)*100}%;left:0;right:0;height:${(hGizi/hTotal)*100}%;background:linear-gradient(180deg,#f59e0b,#d97706)"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="display:flex;gap:10px;padding:8px">
            ${months.map(m => `<div style="flex:1;text-align:center;font-size:11px;color:#64748b;font-weight:600">${m.label}</div>`).join('')}
          </div>
          <div style="display:flex;gap:16px;justify-content:center;padding:12px;font-size:12px">
            <span><span style="display:inline-block;width:12px;height:12px;background:#dc2626;border-radius:3px;margin-right:4px;vertical-align:middle"></span>Stunting</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#d97706;border-radius:3px;margin-right:4px;vertical-align:middle"></span>Gizi Kurang</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#4dd0e1;border-radius:3px;margin-right:4px;vertical-align:middle"></span>Total Kasus</span>
          </div>
        </div>
      `;
      
      const firstCard = cards[0];
      if(firstCard && firstCard.parentNode){
        firstCard.parentNode.insertBefore(card, firstCard.nextSibling);
      }
    }
  }
  
  /* ============================================================
     9. EXPORT FORMAT BKKBN
     ============================================================ */
  function enhanceExportBKKBN(){
    const origRenderLaporan = window.renderLaporan;
    if(!origRenderLaporan) return;
    
    window.renderLaporan = function(c){
      origRenderLaporan.call(this, c);
      setTimeout(() => {
        const cards = c.querySelectorAll('.card');
        let exportCard = null;
        cards.forEach(card => { if(card.textContent.includes('Ekspor') || card.textContent.includes('Export')) exportCard = card; });
        if(!exportCard) return;
        if(exportCard.querySelector('.btn-bkkbn')) return;
        
        const btn = document.createElement('button');
        btn.className = 'btn btn-bkkbn';
        btn.innerHTML = '📊 Ekspor Format BKKBN';
        btn.style.cssText = 'background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;margin-top:8px';
        btn.onclick = exportBKKBN;
        
        const parent = exportCard.querySelector('.card-header');
        if(parent) parent.after(btn);
      }, 250);
    };
    
    window.exportBKKBN = function(){
      const cases = APP.state.cases || [];
      if(!cases.length){ toast('Tidak ada data untuk diekspor','warning'); return; }
      
      // Format kolom standar BKKBN / e-HDW
      const headers = [
        'No','Provinsi','Kabupaten','Kecamatan','Desa/Kelurahan',
        'Nama Balita','NIK','Jenis Kelamin','Tanggal Lahir','Usia (Bulan)',
        'Nama Ibu','Nama Ayah','Berat Badan (kg)','Tinggi Badan (cm)',
        'LILA (cm)','Lingkar Kepala (cm)','Status Gizi','Status Stunting',
        'Tanggal Pengukuran','Petugas','Keterangan'
      ];
      
      const rows = cases.map((x, i) => {
        const row = [
          i + 1,
          'Sulawesi Selatan',
          'Jeneponto',
          x.kecamatan || '',
          x.desa || '',
          x.nama || '',
          x.nik || '',
          x.jk || '',
          x.tgl_lahir || '',
          x.usia_bulan || '',
          x.nama_ibu || '',
          x.nama_ayah || '',
          x.bb || x.berat_badan || '',
          x.tb || x.tinggi_badan || '',
          x.lila || '',
          x.lingkar_kepala || '',
          x.status_gizi || '',
          x.status_gizi === 'Stunting' ? 'Ya' : 'Tidak',
          x.tanggal_ukur || x.created_at || '',
          x.petugas || x.nama_petugas || '',
          x.keterangan || ''
        ];
        return row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',');
      });
      
      const csv = headers.join(',') + '\n' + rows.join('\n');
      const fname = `Z-STUNTING_BKKBN_${new Date().toISOString().slice(0,10)}.csv`;
      downloadFile(fname, '\ufeff' + csv, 'text/csv;charset=utf-8');
      
      log2('EXPORT_BKKBN', `Ekspor ${cases.length} kasus format BKKBN`);
      toast(`📊 ${cases.length} kasus diekspor (Format BKKBN)`, 'success');
    };
  }
  
  /* ============================================================
     INIT
     ============================================================ */
  function init(){
    try { loadCustomAdminPasswords(); } catch(e){ console.warn(e); }
    try { enhanceProfilPassword(); } catch(e){ console.warn(e); }
    try { enhancePengaturanRestore(); } catch(e){ console.warn(e); }
    try { enhanceFormNIK(); } catch(e){ console.warn(e); }
    try { enhanceValidasiNIK(); } catch(e){ console.warn(e); }
    try { enhanceBulkActions(); } catch(e){ console.warn(e); }
    try { enhanceLogAktivitas(); } catch(e){ console.warn(e); }
    try { setupAutoBackup(); } catch(e){ console.warn(e); }
    try { setupPushNotification(); } catch(e){ console.warn(e); }
    try { enhanceTrenBulanan(); } catch(e){ console.warn(e); }
    try { enhanceExportBKKBN(); } catch(e){ console.warn(e); }
    
    console.log('✅ Supplement 2 loaded (FIXED: role-based bulk actions)');
  }
  
  // Jalankan setelah APP ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
  } else {
    setTimeout(init, 800);
  }
  
})();
