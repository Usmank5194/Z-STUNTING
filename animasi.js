/* ================================================================
   Z-STUNTING · ANIMASI v5 (ULTRA SMOOTH — GPU)
   ✅ translate3d (GPU)
   ✅ Lock height (no layout jump)
   ✅ Material easing
   ✅ No scale, no flicker
   ================================================================ */
(function(){
  console.log('%c✨ Animasi v5 (ULTRA SMOOTH) loading...', 'color:#00C9FF;font-weight:bold');

  /* ============================================================
     INJECT CSS
     ============================================================ */
  function injectCSS(){
    if(document.getElementById('_zstAnimStyle')) return;
    const style = document.createElement('style');
    style.id = '_zstAnimStyle';
    style.textContent = `
      /* ============ #CONTENT — GPU ACCELERATED ============ */
      #content {
        will-change: opacity, transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: translate3d(0, 0, 0);
        perspective: 1000px;
      }
      
      /* ============ CARD — GPU ============ */
      #content .card {
        will-change: opacity, transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      
      /* ============ STAT CARD HOVER ============ */
      .stat-card {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
      }
      
      .stat-card:hover {
        transform: translate3d(0, -3px, 0) !important;
        box-shadow: 0 10px 25px rgba(30, 42, 120, 0.12) !important;
      }
      
      .stat-card:active {
        transform: translate3d(0, -1px, 0) !important;
      }
      
      /* ============ NAV ITEM ============ */
      .nav-item {
        position: relative !important;
        overflow: hidden !important;
        transition: background 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.15s ease !important;
        backface-visibility: hidden;
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
        animation: zstRippleAnim 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        z-index: 1;
        backface-visibility: hidden;
      }
      
      /* ============ BUTTON ============ */
      .btn {
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                    background 0.25s ease, color 0.25s ease !important;
        position: relative;
        overflow: hidden;
        backface-visibility: hidden;
      }
      
      .btn:active {
        transform: scale(0.96) !important;
      }
      
      /* ============ SCROLL SMOOTH ============ */
      html { scroll-behavior: smooth; }
      
      /* ============ ACCESSIBILITY ============ */
      @media (prefers-reduced-motion: reduce) {
        #content, #content .card, .stat-card, .btn, .nav-item {
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS v5 terpasang');
  }

  /* ============================================================
     TRANSISI 2-FASE ULTRA SMOOTH
     ============================================================ */
  function doTransition(renderFn){
    const content = document.getElementById('content');
    if(!content){
      if(renderFn) renderFn();
      return;
    }
    
    // Cegah dobel trigger
    if(content._zstAnimating){
      if(renderFn) renderFn();
      return;
    }
    content._zstAnimating = true;
    
    // ============================================================
     // LOCK HEIGHT — cegah layout jump
     // ============================================================
    const startHeight = content.offsetHeight;
    content.style.minHeight = startHeight + 'px';
    content.style.overflow = 'hidden';
    
    // ============================================================
    // FASE 1 — Konten lama fade out + slide keluar (ke kiri)
    // ============================================================
    content.style.transition = 
      'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), ' +
      'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    
    content.style.opacity = '0';
    content.style.transform = 'translate3d(-30px, 0, 0)';
    
    // Tunggu fase 1 selesai
    setTimeout(() => {
      // ============================================================
      // STEP TENGAH — siapkan posisi awal konten baru (dari kanan)
      // ============================================================
      content.style.transition = 'none';
      content.style.opacity = '0';
      content.style.transform = 'translate3d(40px, 0, 0)';
      
      // Render konten baru (masih invisible)
      if(renderFn){
        try { renderFn(); }
        catch(e){ console.warn('render error:', e); }
      }
      
      // Force reflow — biar browser render dulu
      void content.offsetHeight;
      
      // Setup card untuk stagger (5 card pertama)
      const cards = Array.from(content.querySelectorAll('.card')).slice(0, 5);
      cards.forEach(card => {
        card.style.transition = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translate3d(0, 20px, 0)';
      });
      
      // ============================================================
      // FASE 2 — Konten baru fade in + slide masuk dari kanan
      // ============================================================
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // #content utama
          content.style.transition = 
            'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), ' +
            'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)';
          content.style.opacity = '1';
          content.style.transform = 'translate3d(0, 0, 0)';
          
          // Card stagger
          setTimeout(() => {
            cards.forEach((card, i) => {
              const delay = i * 0.06;
              card.style.transition = 
                `opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, ` +
                `transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s`;
              card.style.opacity = '1';
              card.style.transform = 'translate3d(0, 0, 0)';
            });
          }, 60);
          
          // ============================================================
          // CLEANUP
          // ============================================================
          setTimeout(() => {
            // Reset #content
            content.style.transition = '';
            content.style.transform = '';
            content.style.opacity = '';
            content.style.minHeight = '';
            content.style.overflow = '';
            
            // Reset cards
            cards.forEach(card => {
              card.style.transition = '';
              card.style.transform = '';
              card.style.opacity = '';
            });
            
            content._zstAnimating = false;
          }, 900);
        });
      });
    }, 340);
  }

  /* ============================================================
     HOOK showView()
     ============================================================ */
  function hookShowView(){
    if(!window.showView || window._zstShowViewHooked) return;
    window._zstShowViewHooked = true;
    
    const orig = window.showView;
    window.showView = function(view, btn){
      doTransition(() => {
        orig.call(this, view, btn);
      });
    };
    console.log('✅ showView di-hook (v5)');
  }

  /* ============================================================
     RIPPLE PADA NAV
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
        setTimeout(() => ripple.remove(), 700);
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
        animation:zstRippleAnim 0.6s cubic-bezier(0.4,0,0.2,1);
        pointer-events:none;
        z-index:0;
        backface-visibility:hidden;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  }

  /* ============================================================
     EXPOSE untuk view custom
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
    
    setInterval(() => {
      attachRipple();
      hookShowView();
    }, 3000);
    
    console.log('✨ Animasi v5 (ULTRA SMOOTH) aktif!');
  }
  
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }
})();
