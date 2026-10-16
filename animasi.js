/* ================================================================
   Z-STUNTING · ANIMASI 2-FASE (PREMIUM SLIDE)
   Fase 1: Konten lama fade out + slide keluar
   Fase 2: Konten baru fade in + slide masuk + card stagger
   ✅ Tidak ada kedip (pakai flag & setTimeout)
   ✅ Transisi sesuai permintaan: hilang dulu baru muncul
   ================================================================ */
(function(){
  console.log('%c✨ Animasi 2-Fase loading...', 'color:#00C9FF;font-weight:bold');

  /* ============================================================
     INJECT CSS
     ============================================================ */
  function injectCSS(){
    if(document.getElementById('_zstAnimStyle')) return;
    const style = document.createElement('style');
    style.id = '_zstAnimStyle';
    style.textContent = `
      /* ============ #CONTENT TRANSITION ============ */
      #content {
        will-change: opacity, transform;
      }
      
      /* ============ CARD TRANSITION (untuk stagger) ============ */
      #content .card {
        will-change: opacity, transform;
      }
      
      /* ============ STAT CARD HOVER ============ */
      .stat-card {
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.25s ease !important;
      }
      
      .stat-card:hover {
        transform: translateY(-3px) scale(1.01) !important;
        box-shadow: 0 8px 22px rgba(30, 42, 120, 0.12) !important;
      }
      
      .stat-card:active {
        transform: translateY(-1px) scale(0.99) !important;
      }
      
      /* ============ CARD HOVER ============ */
      .card {
        transition: box-shadow 0.25s ease !important;
      }
      
      .card:hover {
        box-shadow: 0 8px 24px rgba(30, 42, 120, 0.08) !important;
      }
      
      /* ============ NAV ITEM ============ */
      .nav-item {
        position: relative !important;
        overflow: hidden !important;
        transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease !important;
      }
      
      .nav-item:active {
        transform: scale(0.98) !important;
      }
      
      /* ============ RIPPLE ============ */
      @keyframes zstRippleAnim {
        0%   { transform: scale(0); opacity: 0.5; }
        100% { transform: scale(3.5); opacity: 0; }
      }
      
      .nav-item .zst-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(0, 201, 255, 0.35);
        transform: scale(0);
        animation: zstRippleAnim 0.55s ease-out;
        pointer-events: none;
        z-index: 1;
      }
      
      /* ============ BUTTON PRESS ============ */
      .btn {
        transition: transform 0.15s ease, box-shadow 0.2s ease,
                    background 0.2s ease, color 0.2s ease !important;
        position: relative;
        overflow: hidden;
      }
      
      .btn:active {
        transform: scale(0.96) !important;
      }
      
      /* ============ SMOOTH SCROLL ============ */
      html { scroll-behavior: smooth; }
      
      /* ============ ACCESSIBILITY ============ */
      @media (prefers-reduced-motion: reduce) {
        #content, #content .card, .stat-card, .btn, .nav-item {
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS terpasang');
  }

  /* ============================================================
     TRANSISI 2-FASE UTAMA
     ============================================================ */
  function doTransition(renderFn){
    const content = document.getElementById('content');
    if(!content){
      if(renderFn) renderFn();
      return;
    }
    
    // Cegah double-trigger (kalau user klik cepat)
    if(content._zstAnimating){
      // Kalau sedang animasi, langsung render tanpa animasi
      if(renderFn) renderFn();
      return;
    }
    content._zstAnimating = true;
    
    // ============================================================
    // FASE 1: Konten lama fade out + slide keluar ke kiri
    // ============================================================
    content.style.transition = 'opacity 0.22s ease, transform 0.25s cubic-bezier(0.4, 0, 1, 1)';
    content.style.opacity = '0';
    content.style.transform = 'translateX(-25px) scale(0.98)';
    
    // Tunggu fase 1 selesai (250ms)
    setTimeout(() => {
      // ============================================================
      // STEP TENGAH: Siapkan posisi awal untuk konten baru (dari kanan)
      // ============================================================
      content.style.transition = 'none';
      content.style.opacity = '0';
      content.style.transform = 'translateX(30px) scale(0.98)';
      
      // Render konten baru (masih invisible)
      if(renderFn){
        try { renderFn(); }
        catch(e){ console.warn('render error:', e); }
      }
      
      // Paksa browser render dulu sebelum animasi masuk
      void content.offsetHeight;
      
      // Siapkan card dalam konten baru untuk stagger
      const cards = content.querySelectorAll('.card');
      cards.forEach((card, i) => {
        if(i > 4) return;
        card.style.transition = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';
      });
      
      // ============================================================
      // FASE 2: Konten baru fade in + slide masuk dari kanan
      // ============================================================
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Animasi #content utama
          content.style.transition = 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          content.style.opacity = '1';
          content.style.transform = 'translateX(0) scale(1)';
          
          // Animasi card stagger
          setTimeout(() => {
            cards.forEach((card, i) => {
              if(i > 4) return;
              card.style.transition = `opacity 0.4s ease ${i * 0.06}s, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s`;
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          }, 50);
          
          // ============================================================
          // CLEANUP setelah semua selesai
          // ============================================================
          setTimeout(() => {
            content.style.transition = '';
            content.style.transform = '';
            content.style.opacity = '';
            cards.forEach(card => {
              card.style.transition = '';
              card.style.transform = '';
              card.style.opacity = '';
            });
            content._zstAnimating = false;
          }, 700);
        });
      });
    }, 260);
  }

  /* ============================================================
     HOOK showView() — OVERRIDE FUNGSI UTAMA
     ============================================================ */
  function hookShowView(){
    if(!window.showView || window._zstShowViewHooked) return;
    window._zstShowViewHooked = true;
    
    const orig = window.showView;
    window.showView = function(view, btn){
      // Jalankan transisi 2-fase
      doTransition(() => {
        orig.call(this, view, btn);
      });
    };
    console.log('✅ showView di-hook untuk transisi 2-fase');
  }

  /* ============================================================
     RIPPLE PADA NAV ITEM
     ============================================================ */
  function attachRipple(){
    document.querySelectorAll('.nav-item').forEach(nav => {
      if(nav._zstRippleAttached) return;
      nav._zstRippleAttached = true;
      
      nav.addEventListener('click', function(e){
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'zst-ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  /* ============================================================
     RIPPLE PADA TOMBOL
     ============================================================ */
  function attachButtonRipple(){
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.btn');
      if(!btn || btn.classList.contains('nav-item')) return;
      
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute;
        border-radius:50%;
        background:rgba(255,255,255,0.4);
        width:${size}px;
        height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
        transform:scale(0);
        animation:zstRippleAnim 0.55s ease-out;
        pointer-events:none;
        z-index:0;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  /* ============================================================
     EXPOSE untuk dipakai view custom (contoh: Jadwal Posyandu)
     ============================================================ */
  window.zstTransition = doTransition;

  /* ============================================================
     BOOT
     ============================================================ */
  function boot(){
    injectCSS();
    attachRipple();
    attachButtonRipple();
    hookShowView();
    
    // Re-attach ripple untuk nav baru (Jadwal Posyandu dll)
    setInterval(() => {
      attachRipple();
      hookShowView();
    }, 3000);
    
    console.log('✨ Animasi 2-Fase aktif!');
  }
  
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }
})();
