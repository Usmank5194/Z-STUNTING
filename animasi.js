/* ================================================================
   Z-STUNTING · ANIMASI SLIDE/PUSH v4 (ULTRA SMOOTH)
   ✅ 1 fase animasi — tidak ada kedip
   ✅ Konten masuk dari kanan dengan halus
   ✅ Tidak ada MutationObserver, tidak ada dobel trigger
   ✅ Ripple + hover tetap ada
   ================================================================ */
(function(){
  console.log('%c✨ Animasi v4 (SLIDE/PUSH) loading...', 'color:#00C9FF;font-weight:bold');

  /* ============================================================
     INJECT CSS
     ============================================================ */
  function injectCSS(){
    if(document.getElementById('_zstSlideStyle')) return;
    const style = document.createElement('style');
    style.id = '_zstSlideStyle';
    style.textContent = `
      /* ============ CONTENT WRAPPER ============ */
      #content {
        will-change: opacity, transform;
      }
      
      /* ============ CARD HOVER LIFT ============ */
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
      
      /* ============ CARD HOVER (umum) ============ */
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
        #content { transition: none !important; }
        .stat-card, .btn, .nav-item { transition: none !important; }
      }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS v4 terpasang');
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
     SLIDE TRANSITION — INTERCEPT KLIK MENU (CAPTURE PHASE)
     ============================================================ */
  function setupSlideTransition(){
    // Capture phase — jalan SEBELUM handler nav
    document.addEventListener('click', function(e){
      const nav = e.target.closest('.nav-item[data-view], [data-view]');
      if(!nav) return;
      
      const content = document.getElementById('content');
      if(!content) return;
      
      // Cegah double-trigger
      if(content._zstAnimating) return;
      content._zstAnimating = true;
      
      // STEP 1: Sembunyikan konten saat ini (instant, tanpa animasi)
      content.style.transition = 'none';
      content.style.opacity = '0';
      content.style.transform = 'translateX(20px)';
      
      // Force reflow — biar browser render kondisi tersembunyi dulu
      void content.offsetHeight;
      
      // STEP 2: Tunggu sebentar supaya handler nav sempat render konten baru
      setTimeout(() => {
        // STEP 3: Animasi masuk — fade in + slide dari kanan
        content.style.transition = 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        content.style.opacity = '1';
        content.style.transform = 'translateX(0)';
        
        // STEP 4: Cleanup setelah selesai
        setTimeout(() => {
          content.style.transition = '';
          content.style.transform = '';
          content.style.opacity = '';
          content._zstAnimating = false;
        }, 500);
      }, 30);
    }, true); // ← capture phase, WAJIB
  }

  /* ============================================================
     SLIDE UNTUK HASHCHANGE (kalau ada navigasi pakai hash)
     ============================================================ */
  function setupHashTransition(){
    window.addEventListener('hashchange', function(){
      const content = document.getElementById('content');
      if(!content || content._zstAnimating) return;
      
      content._zstAnimating = true;
      content.style.transition = 'none';
      content.style.opacity = '0';
      content.style.transform = 'translateX(20px)';
      
      setTimeout(() => {
        content.style.transition = 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        content.style.opacity = '1';
        content.style.transform = 'translateX(0)';
        setTimeout(() => {
          content.style.transition = '';
          content.style.transform = '';
          content.style.opacity = '';
          content._zstAnimating = false;
        }, 500);
      }, 30);
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot(){
    injectCSS();
    attachRipple();
    attachButtonRipple();
    setupSlideTransition();
    setupHashTransition();
    
    // Re-attach ripple untuk nav baru (contoh: Jadwal Posyandu)
    setInterval(attachRipple, 3000);
    
    console.log('✨ Animasi v4 (SLIDE/PUSH) aktif!');
  }
  
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }
})();
