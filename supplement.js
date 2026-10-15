/* ================================================================
   Z-STUNTING · SUPPLEMENT PATCH
   Splash Screen + Offline Mode + Sertifikat Top 10 + Auto Backup
   ================================================================ */
(function(){
  
  /* ============================================================
     1. SPLASH SCREEN
     ============================================================ */
  function showSplash(){
    if(sessionStorage.getItem('zst_splash_shown')) return;
    sessionStorage.setItem('zst_splash_shown', '1');
    
    const splash = document.createElement('div');
    splash.id = 'zSplash';
    splash.innerHTML = `
      <style>
        #zSplash {
          position: fixed; inset: 0; z-index: 99999;
          background: linear-gradient(135deg, #e8eef5 0%, #d9e4f0 50%, #e8eef5 100%);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          transition: opacity 0.5s ease;
        }
        #zSplash.hide { opacity: 0; pointer-events: none; }
        #zSplash .z-logo {
          width: 140px; height: 140px; background: #f0f5fb; border-radius: 36px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 20px 20px 60px rgba(174,191,212,.5), -20px -20px 60px rgba(255,255,255,.95);
          margin-bottom: 26px; animation: zPulse 2s ease-in-out infinite;
        }
        #zSplash .z-logo img { width: 110px; height: 110px; object-fit: contain; filter: drop-shadow(0 10px 30px rgba(77,208,225,.4)); }
        #zSplash .z-title {
          font-size: 38px; font-weight: 900; letter-spacing: 2px;
          background: linear-gradient(135deg, #26c6da, #8b5cf6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          margin-bottom: 10px;
        }
        #zSplash .z-sub { font-size: 12.5px; color: #7c8ba3; font-weight: 600; letter-spacing: 1px; margin-bottom: 34px; }
        #zSplash .z-loader { width: 180px; height: 4px; background: rgba(174,191,212,.3); border-radius: 4px; overflow: hidden; position: relative; }
        #zSplash .z-loader::after {
          content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 40%;
          background: linear-gradient(90deg, #4dd0e1, #a78bfa);
          border-radius: 4px; animation: zLoad 1.5s ease-in-out infinite;
        }
        #zSplash .z-quote { margin-top: 34px; font-size: 11px; color: #a3b1c6; font-style: italic; letter-spacing: .5px; }
        @keyframes zPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes zLoad { 0% { left: -40%; } 100% { left: 100%; } }
      </style>
      <div class="z-logo"><img src="logo.png" alt="Z" onerror="this.style.display='none'"></div>
      <div class="z-title">Z-STUNTING</div>
      <div class="z-sub">DP2KBP3A Kabupaten Jeneponto</div>
      <div class="z-loader"></div>
      <div class="z-quote">"Satu Data, Satu Aksi Menuju Jeneponto Bahagia"</div>
    `;
    document.body.insertBefore(splash, document.body.firstChild);
    setTimeout(() => {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 600);
    }, 2200);
  }
  
  /* ============================================================
     2. OFFLINE MODE — Indikator + Draft Auto-Save
     ============================================================ */
  function installOfflineMode(){
    // Indicator di topbar
    const addNetIndicator = () => {
      const topbar = document.querySelector('.topbar-actions');
      if(!topbar || document.getElementById('netStatus')) return false;
      const el = document.createElement('span');
      el.id = 'netStatus';
      el.style.cssText = 'font-size:11px;padding:5px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:5px;font-weight:700;box-shadow:2px 2px 5px rgba(174,191,212,.3),-2px -2px 5px rgba(255,255,255,.7)';
      topbar.insertBefore(el, topbar.firstChild);
      updateNet();
      return true;
    };
    
    const updateNet = () => {
      const el = document.getElementById('netStatus');
      if(!el) return;
      if(navigator.onLine){
        el.style.background = 'linear-gradient(135deg,#c8e6c9,#a5d6a7)';
        el.style.color = '#1b5e20';
        el.innerHTML = '🟢 Online';
      } else {
        el.style.background = 'linear-gradient(135deg,#ffe0b2,#ffcc80)';
        el.style.color = '#e65100';
        el.innerHTML = '🔴 Offline · Data Lokal';
      }
    };
    
    window.addEventListener('online', () => {
      updateNet();
      if(typeof toast === 'function') toast('🟢 Kembali online — sinkronisasi...', 'success');
      if(typeof Cloud !== 'undefined' && typeof Cloud.pull === 'function') setTimeout(() => Cloud.pull(true), 1000);
    });
    window.addEventListener('offline', () => {
      updateNet();
      if(typeof toast === 'function') toast('🔴 Offline — data disimpan lokal', 'warning');
    });
    
    // Retry check sampai topbar muncul
    if(!addNetIndicator()){
      const t = setInterval(() => { if(addNetIndicator()) clearInterval(t); }, 800);
      setTimeout(() => clearInterval(t), 20000);
    }
    
    // Auto-save draft kunjungan
    document.addEventListener('input', e => {
      if(e.target && e.target.id && e.target.id.startsWith('k_') && typeof APP !== 'undefined' && APP.currentKunjungan){
        const x = APP.currentKunjungan;
        if(!APP.state.drafts) APP.state.drafts = {};
        const d = APP.state.drafts[x.id] || { caseId: x.id };
        ['k_bb','k_tb','k_lk','k_lila','k_gizi','k_cat','k_desa'].forEach(id => {
          const el = document.getElementById(id);
          if(el) d[id.replace('k_','')] = el.value;
        });
        d.savedAt = new Date().toISOString();
        APP.state.drafts[x.id] = d;
        try { localStorage.setItem('zstunting_state', JSON.stringify(APP.state)); } catch(err){}
      }
    });
    
    // Restore draft saat form kunjungan dibuka
    const origOpenKunjungan = window.openKunjungan;
    if(typeof origOpenKunjungan === 'function'){
      window.openKunjungan = function(id){
        origOpenKunjungan.call(this, id);
        setTimeout(() => {
          if(!APP.state.drafts || !APP.state.drafts[id]) return;
          const d = APP.state.drafts[id];
          const label = `💾 Ada draft kunjungan (${new Date(d.savedAt).toLocaleString('id-ID')}).\n\nMuat draft?`;
          if(confirm(label)){
            if(document.getElementById('k_bb') && d.bb) document.getElementById('k_bb').value = d.bb;
            if(document.getElementById('k_tb') && d.tb) document.getElementById('k_tb').value = d.tb;
            if(document.getElementById('k_lk') && d.lk) document.getElementById('k_lk').value = d.lk;
            if(document.getElementById('k_lila') && d.lila) document.getElementById('k_lila').value = d.lila;
            if(document.getElementById('k_gizi') && d.gizi) document.getElementById('k_gizi').value = d.gizi;
            if(document.getElementById('k_cat') && d.cat) document.getElementById('k_cat').value = d.cat;
            if(document.getElementById('k_desa') && d.desa) document.getElementById('k_desa').value = d.desa;
            if(typeof hitungZ === 'function') hitungZ();
          }
        }, 400);
      };
    }
    
    // Hapus draft setelah save berhasil
    const origSaveKunjungan = window.saveKunjungan;
    if(typeof origSaveKunjungan === 'function'){
      window.saveKunjungan = function(){
        if(APP.currentKunjungan && APP.state.drafts){
          delete APP.state.drafts[APP.currentKunjungan.id];
        }
        return origSaveKunjungan.call(this);
      };
    }
  }
  
  /* ============================================================
     3. SERTIFIKAT TOP 10 TPK
     ============================================================ */
  function installSertifikat(){
    // Load html2pdf
    if(!document.querySelector('script[src*="html2pdf"]')){
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(s);
    }
    
    // Tambah tombol di header card Top 10
    const addCertButton = () => {
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        if(card.textContent.includes('Top 10 TPK Paling Aktif') && !card.querySelector('.btn-sertifikat')){
          const header = card.querySelector('.card-header');
          if(header){
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-sertifikat';
            btn.innerHTML = '🏆 Sertifikat Top 10';
            btn.style.cssText = 'background:linear-gradient(135deg,#ffd54f,#ffb300);color:#5d4037;padding:8px 14px;border-radius:10px;border:none;font-weight:700;font-size:12px;cursor:pointer;box-shadow:0 3px 10px rgba(255,179,0,.35);margin-right:6px';
            btn.onclick = showCertMenu;
            header.insertBefore(btn, header.firstChild.nextSibling);
          }
        }
      });
    };
    
    // Cek terus sampai card Top 10 muncul
    const t = setInterval(addCertButton, 1500);
    setTimeout(() => clearInterval(t), 30000);
    
    window.showCertMenu = function(){
      const top10 = window._top10Data || [];
      if(!top10.length){ 
        if(typeof toast === 'function') toast('Belum ada data ranking','warning'); 
        return; 
      }
      const modal = document.getElementById('modalConfirm');
      if(!modal) return;
      document.getElementById('confirmTitle').textContent = '🏆 Sertifikat Top 10 TPK';
      document.getElementById('confirmBody').innerHTML = `
        <div style="background:#fff9e6;padding:14px;border-radius:10px;margin-bottom:14px;font-size:12.5px;color:#92400e;line-height:1.6">
          Pilih siapa yang akan dibuatkan sertifikat apresiasi.<br>
          <b>File otomatis terunduh sebagai PDF.</b>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-wa" style="padding:12px;font-weight:700" onclick="closeModal('modalConfirm'); generateSertifikat('semua')">🏆 Generate SEMUA Top 10 (10 sertifikat)</button>
          ${top10.slice(0,3).map((t,i) => {
            const medals = ['🥇','🥈','🥉'];
            return `<button class="btn btn-outline" style="padding:10px;text-align:left;justify-content:flex-start" onclick="closeModal('modalConfirm'); generateSertifikat(${i})">${medals[i]} ${t.t.bidan?.nama||'-'} — Tim ${t.t.tim}, ${t.t.desa}</button>`;
          }).join('')}
        </div>`;
      const btn = document.getElementById('confirmBtn');
      btn.style.display = 'none';
      modal.classList.add('show');
    };
    
    window.generateSertifikat = async function(mode){
      const top10 = window._top10Data || [];
      let list = [];
      let startRank = 1;
      if(mode === 'semua'){ list = top10.slice(0, 10); startRank = 1; }
      else if(typeof mode === 'number' && top10[mode]){ list = [top10[mode]]; startRank = mode + 1; }
      else return;
      if(!list.length){ return; }
      if(list.length > 1 && !confirm(`Generate ${list.length} sertifikat PDF?`)) return;
      
      for(let i = 0; i < list.length; i++){
        await generateOne(list[i], startRank + i);
        await new Promise(r => setTimeout(r, 1200));
      }
      if(typeof toast === 'function') toast(`✅ ${list.length} sertifikat berhasil dibuat`, 'success');
    };
    
    async function generateOne(data, rank){
      const t = data.t;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      const tanggal = new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
      const nomor = `ZST/${String(rank).padStart(3,'0')}/DP2KBP3A/${new Date().getFullYear()}`;
      
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;left:-9999px;top:0';
      wrap.innerHTML = `
        <div style="width:1123px;height:794px;background:#fff;position:relative;font-family:Georgia,serif;box-sizing:border-box;padding:0">
          <div style="position:absolute;inset:18px;border:8px double #d4af37;border-radius:12px"></div>
          <div style="position:absolute;inset:36px;border:2px solid #d4af37;border-radius:8px"></div>
          <div style="position:absolute;top:26px;left:26px;font-size:56px;color:#d4af37;line-height:1">❦</div>
          <div style="position:absolute;top:26px;right:26px;font-size:56px;color:#d4af37;line-height:1">❦</div>
          <div style="position:absolute;bottom:26px;left:26px;font-size:56px;color:#d4af37;line-height:1">❦</div>
          <div style="position:absolute;bottom:26px;right:26px;font-size:56px;color:#d4af37;line-height:1">❦</div>
          <div style="position:relative;padding:64px 80px;height:100%;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;text-align:center">
            <div>
              <div style="font-size:13px;font-weight:700;color:#0f172a;letter-spacing:2px;margin-top:4px">DP2KBP3A KABUPATEN JENEPONTO</div>
              <div style="font-size:10.5px;color:#7c8ba3;margin-top:3px;letter-spacing:1px">DINAS PENGENDALIAN PENDUDUK DAN KELUARGA BERENCANA</div>
            </div>
            <div style="margin:14px 0">
              <div style="font-size:52px;font-weight:900;color:#0f172a;letter-spacing:6px">SERTIFIKAT</div>
              <div style="font-size:16px;color:#d4af37;letter-spacing:7px;font-weight:700;margin-top:6px">APRESIASI KINERJA</div>
              <div style="width:180px;height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:10px auto"></div>
              <div style="font-size:11px;color:#7c8ba3;letter-spacing:1px">Nomor: ${nomor}</div>
            </div>
            <div style="font-size:52px;margin:6px 0">${medal}</div>
            <div style="margin:8px 0">
              <div style="font-size:12px;color:#7c8ba3;margin-bottom:10px">Diberikan kepada:</div>
              <div style="font-size:32px;font-weight:900;color:#0f172a;font-style:italic;border-bottom:2px solid #d4af37;display:inline-block;padding:0 26px 6px">${esc(t.bidan?.nama || '-')}</div>
              <div style="font-size:13px;color:#3b4a63;margin-top:12px;font-weight:600">Tim ${t.t.tim} · ${esc(t.t.desa)}, ${esc(t.t.kecamatan)}</div>
              <div style="font-size:11px;color:#7c8ba3;margin-top:3px">Kabupaten Jeneponto</div>
            </div>
            <div style="font-size:12px;color:#3b4a63;line-height:1.7;max-width:820px;margin:10px auto">
              Sebagai <b style="color:#d4af37">Tim Pendamping Keluarga (TPK) Peringkat ${rank}</b><br>
              dalam sistem penilaian aktivitas pendampingan stunting<br>
              pada program <b>Z-STUNTING DP2KBP3A Kabupaten Jeneponto</b><br>
              dengan <b>Skor ${data.skor}</b>
            </div>
            <div style="display:flex;justify-content:center;gap:26px;margin:8px 0;font-size:10.5px;color:#3b4a63">
              <div style="text-align:center"><div style="font-size:20px;font-weight:900;color:#26c6da">${data.visited}/${data.total}</div><div style="letter-spacing:1px">🏠 KUNJUNGAN</div></div>
              <div style="text-align:center"><div style="font-size:20px;font-weight:900;color:#66bb6a">${data.verified}</div><div style="letter-spacing:1px">✅ VERIFIKASI</div></div>
              <div style="text-align:center"><div style="font-size:20px;font-weight:900;color:#ff9800">${data.foto}</div><div style="letter-spacing:1px">📸 FOTO</div></div>
              <div style="text-align:center"><div style="font-size:20px;font-weight:900;color:#8b5cf6">${data.gps}</div><div style="letter-spacing:1px">📍 GPS</div></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;padding:0 20px">
              <div style="text-align:center;font-size:10.5px;color:#7c8ba3">
                <div style="margin-bottom:38px">Jeneponto, ${tanggal}</div>
                <div style="border-top:1px solid #3b4a63;padding-top:5px;font-weight:700;color:#0f172a">Kepala DP2KBP3A</div>
                <div>Kabupaten Jeneponto</div>
              </div>
              <div style="text-align:center;font-size:10.5px;color:#7c8ba3">
                <div style="margin-bottom:38px">Disahkan oleh,</div>
                <div style="border-top:1px solid #3b4a63;padding-top:5px;font-weight:700;color:#0f172a">Penyuluh KB</div>
                <div>Koordinator Z-STUNTING</div>
              </div>
            </div>
            <div style="margin-top:10px;font-style:italic;color:#d4af37;font-size:11px;font-weight:600">
              "Bersinergi Mendampingi Keluarga, Wujudkan Jeneponto Zero Stunting"
            </div>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      
      try {
        if(typeof html2pdf === 'undefined'){
          await new Promise(r => setTimeout(r, 2000));
        }
        await html2pdf().set({
          margin: 0,
          filename: `Sertifikat_${rank}_${(t.bidan?.nama||'TPK').replace(/[^a-z0-9]/gi,'_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'px', format: [1123, 794], orientation: 'landscape' }
        }).from(wrap.firstElementChild).save();
      } catch(e){
        console.error('Sertifikat error:', e);
        if(typeof toast === 'function') toast('❌ Gagal generate sertifikat', 'error');
      } finally {
        document.body.removeChild(wrap);
      }
    }
  }
  
  /* ============================================================
     4. AUTO BACKUP KE FILE JSON (per 24 jam)
     ============================================================ */
  function installAutoBackup(){
    const KEY = 'zst_lastBackup';
    const last = localStorage.getItem(KEY);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if(!last || (now - parseInt(last)) > oneDay){
      setTimeout(() => {
        if(!APP || !APP.state || !APP.state.cases) return;
        // Tampilkan reminder (tidak auto-download, biar tidak ganggu)
        if(typeof toast === 'function'){
          toast('💡 Sudah 24 jam — jangan lupa ekspor Backup JSON', 'warning');
        }
        localStorage.setItem(KEY, now.toString());
      }, 8000);
    }
  }
  
  /* ============================================================
     BOOT
     ============================================================ */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  
  function boot(){
    showSplash();
    // Tunggu APP siap
    const t = setInterval(() => {
      if(typeof APP !== 'undefined' && typeof window.Cloud !== 'undefined'){
        clearInterval(t);
        installOfflineMode();
        installSertifikat();
        installAutoBackup();
        console.log('✅ Z-STUNTING Supplement aktif');
      }
    }, 500);
    setTimeout(() => clearInterval(t), 30000);
  }
})();
