/* ================================================================
   Z-STUNTING · SUPPLEMENT 5
   Syarat wajib sebelum verifikasi kasus
   ================================================================ */
(function(){
  function patchVerify(){
    if(typeof window.verifyCase !== 'function'){
      setTimeout(patchVerify, 500);
      return;
    }
    if(window._verifyPatched) return;
    window._verifyPatched = true;
    
    const origVerify = window.verifyCase;
    
    window.verifyCase = function(id, status){
      const x = (APP.state.cases||[]).find(c => c.id === id);
      if(!x) return;
      
      // Hanya cek syarat kalau status = Terverifikasi (bukan Ditolak)
      if(status === 'Terverifikasi'){
        const errors = [];
        
        // 1. Cek NIK
        const nik = String(x.nik || '').trim();
        if(!nik){ 
          errors.push('❌ NIK kosong — belum diinput kader'); 
        } else if(!/^\d{16}$/.test(nik)){
          errors.push(`❌ NIK tidak valid (${nik.length} digit) — harus 16 digit angka`);
        }
        
        // 2. Cek hasil ukur BB
        if(!x.bb || parseFloat(x.bb) <= 0){
          errors.push('❌ Berat Badan (BB) belum diisi');
        }
        
        // 3. Cek hasil ukur TB
        if(!x.tb || parseFloat(x.tb) <= 0){
          errors.push('❌ Tinggi Badan (TB) belum diisi');
        }
        
        // 4. Cek foto
        const photos = (x.riwayat||[]).flatMap(r => r.foto || []);
        if(photos.length === 0){
          errors.push('❌ Foto bukti kunjungan belum ada');
        }
        
        // 5. Cek GPS
        const hasGps = (x.riwayat||[]).some(r => r.gps && r.gps.lat);
        if(!hasGps){
          errors.push('❌ GPS lokasi kunjungan belum ada');
        }
        
        // 6. Cek desa/alamat (bonus)
        if(!x.desa || !x.alamat){
          errors.push('❌ Desa atau alamat belum lengkap');
        }
        
        // Kalau ada error → tolak verifikasi
        if(errors.length > 0){
          showVerifyError(x, errors);
          return;
        }
      }
      
      // Kalau lolos semua cek → panggil original
      return origVerify.call(this, id, status);
    };
    
    function showVerifyError(x, errors){
      const modal = document.getElementById('modalConfirm');
      document.getElementById('confirmTitle').textContent = '⚠️ Tidak Bisa Verifikasi';
      document.getElementById('confirmBody').innerHTML = `
        <div style="background:#fee2e2;padding:14px;border-radius:10px;margin-bottom:14px;font-size:13px;color:#991b1b;line-height:1.6">
          <b>Kasus ini belum memenuhi syarat verifikasi.</b><br>
          Mohon lengkapi dulu sebelum diverifikasi.
        </div>
        
        <div style="background:#fef3c7;padding:14px;border-radius:10px;margin-bottom:14px;font-size:12.5px;color:#92400e">
          <b>👶 ${escapeHtmlLocal(x.nama)}</b><br>
          NIK: ${escapeHtmlLocal(x.nik || '-')} · Desa: ${escapeHtmlLocal(x.desa || '-')}
        </div>
        
        <div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#0f172a">Yang perlu dilengkapi:</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${errors.map(e => `
            <div style="background:var(--soft-bg);padding:10px 12px;border-radius:8px;font-size:12.5px;color:var(--soft-text);border-left:3px solid #ef5350">
              ${e}
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top:14px;padding:12px;background:#dcfce7;border-radius:10px;font-size:12px;color:#166534;line-height:1.6">
          💡 <b>Solusi:</b><br>
          1. Kader buka aplikasi → Edit Kasus → lengkapi NIK, BB, TB<br>
          2. Kader buka form Kunjungan → upload foto + aktifkan GPS<br>
          3. Simpan → status jadi "Menunggu Verifikasi"<br>
          4. Baru admin verifikasi
        </div>
      `;
      const btn = document.getElementById('confirmBtn');
      btn.textContent = '✏️ Edit Kasus Sekarang';
      btn.className = 'btn btn-primary-solid';
      btn.style.display = 'inline-flex';
      btn.onclick = () => {
        closeModal('modalConfirm');
        closeModal('modalDetail');
        if(typeof openEdit === 'function') openEdit(x.id);
      };
      modal.classList.add('show');
    }
    
    function escapeHtmlLocal(s){
      return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    
    console.log('✅ Patch Syarat Verifikasi aktif');
  }
  
  // Tunggu APP siap
  const t = setInterval(() => {
    if(typeof APP !== 'undefined' && typeof window.verifyCase === 'function'){
      clearInterval(t);
      patchVerify();
    }
  }, 500);
  setTimeout(() => clearInterval(t), 30000);
})();
