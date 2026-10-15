/* ================================================================
   Z-STUNTING · SUPPLEMENT 4
   Fix: Integrasi menu Jadwal Posyandu ke showView()
   ================================================================ */
(function(){
  function patchShowView(){
    if(typeof window.showView !== 'function'){
      setTimeout(patchShowView, 500);
      return;
    }
    if(window._jadwalShowViewPatched) return;
    window._jadwalShowViewPatched = true;
    
    const origShowView = window.showView;
    
    window.showView = function(view, btn){
      // Handle view jadwal khusus (karena ada di supplement3)
      if(view === 'jadwal'){
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        if(btn) btn.classList.add('active');
        const sb = document.getElementById('sidebar');
        if(sb) sb.classList.remove('open');
        
        const pageTitle = document.getElementById('pageTitle');
        const pageCrumb = document.getElementById('pageCrumb');
        if(pageTitle) pageTitle.textContent = 'Jadwal Posyandu';
        if(pageCrumb) pageCrumb.textContent = 'Kalender kegiatan Posyandu';
        
        const c = document.getElementById('content');
        if(typeof window.renderJadwal === 'function'){
          window.renderJadwal(c);
        } else {
          c.innerHTML = '<div class="card"><div class="empty"><div class="ic">⏳</div><div>Modul Jadwal Posyandu sedang dimuat...</div><div style="font-size:12px;margin-top:8px">Tunggu 3 detik, lalu klik menu lagi.</div></div></div>';
        }
        return;
      }
      
      // View lain: fallback ke original
      return origShowView.call(this, view, btn);
    };
    
    console.log('✅ Patch showView untuk Jadwal Posyandu aktif');
  }
  
  // Tunggu APP + renderJadwal siap
  const checkInterval = setInterval(() => {
    if(typeof APP !== 'undefined' && typeof window.showView === 'function'){
      clearInterval(checkInterval);
      patchShowView();
    }
  }, 500);
  setTimeout(() => clearInterval(checkInterval), 30000);
  
  // Re-patch setiap 5 detik untuk jaga-jaga kalau showView di-override lagi
  setInterval(() => {
    if(typeof window.showView === 'function' && !window._jadwalShowViewPatched){
      patchShowView();
    }
  }, 5000);
})();
