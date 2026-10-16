/* ================================================================
   Z-STUNTING · ANIMASI PREMIUM v3 (SMOOTH)
   ✅ Cuma 1 trigger per ganti menu
   ✅ Pakai CSS transition — tidak restart
   ✅ Ripple + hover lift tetap ada
   ✅ No MutationObserver, no safety net, no kedip
   ================================================================ */
(function(){
  console.log('%c✨ Animasi v3 (SMOOTH) loading...', 'color:#00C9FF;font-weight:bold');

  /* ============================================================
     INJECT CSS — PAKAI TRANSITION, BUKAN KEYFRAMES
     ============================================================ */
  function injectCSS(){
    if(document.getElementById('_zstAnimStyle')) return;
    const style = document.createElement('style');
    style.id = '_zstAnimStyle';
    style.textContent = `
      /* ============ PAGE TRANSITION (opacity + transform) ============ */
      #content {
        transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        will-change: opacity, transform;
      }
      
      #content.zst-hidden {
        opacity: 0;
        transform: translateY(8px);
      }
      
      #content.zst-showing {
        opacity: 1;
        transform: translateY(0);
      }
      
      /* ============ CARD FADE (transition, bukan animasi) ============ */
      #content .card {
        transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.25s ease;
        will-change: opacity, transform;
      }
      
      #content .card.zst-card-hidden {
        opacity: 0;
        transform: translateY(10px);
      }
      
      #content .card.zst-card-show {
        opacity: 1;
        transform: translateY(0);
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
      
      /* ============ NAV ITEM ============ */
      .nav-item {
        position: relative !important;
        overflow: hidden !important;
        transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease !important;
      }
      
      .nav-item:active {
        transform: scale(0.98) !important;
      }
      
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
      
      /* ============ TABLE ROW HOVER ============ */
      tbody tr {
        transition: background 0.15s ease !important;
      }
      
      /* ============ SMOOTH SCROLL ============ */
      html { scroll-behavior: smooth; }
      
      /* ============ ACCESSIBILITY ============ */
      @media (prefers-reduced-motion: reduce) {
        #content, #content .card, .stat-card, .btn, .nav-item {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS v3 terpasang');
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
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  /* ============================================================
     ANIMASI UTAMA — DIPANGGIL SEKALI SAJA PER GANTI MENU
     ============================================================ */
  let _animating = false;
  
  function animateContent(){
    if(_animating) return; // cegah dobel trigger
    _animating = true;
    
    const content = document.getElementById('content');
    if(!content){ _animating = false; return; }
    
    // Reset semua class dulu
    content.classList.remove('zst-showing', 'zst-hidden');
    content.querySelectorAll('.card').forEach(c => 
      c.classList.remove('zst-card-show', 'zst-card-hidden'));
    
    // Set kondisi awal (hidden)
    content.classList.add('zst-hidden');
    content.querySelectorAll('.card').forEach(c => c.classList.add('zst-card-hidden'));
    
    // Paksa browser render kondisi awal
    void content.offsetHeight;
    
    // Trigger animasi masuk di frame berikutnya
    requestAnimationFrame(() => {
      content.classList.remove('zst-hidden');
      content.classList.add('zst-showing');
      
      // Card stagger pakai transition-delay
      const cards = content.querySelectorAll('.card');
      cards.forEach((card, i) => {
        if(i > 4) return; // max 5 card pertama biar tidak lemot
        card.style.transitionDelay = (i * 0.06) + 's';
        card.classList.remove('zst-card-hidden');
        card.classList.add('zst-card-show');
      });
      
      // Cleanup: hapus transition-delay setelah selesai
      setTimeout(() => {
        cards.forEach(c => {
          c.style.transitionDelay = '';
          c.classList.remove('zst-card-show');
        });
        _animating = false;
      }, 600);
    });
  }

  /* ============================================================
     HOOK showView() — CUMA SATU TRIGGER DI SINI
     ============================================================ */
  function hookShowView(){
    if(!window.showView || window._zstShowViewHooked) return;
    window._zstShowViewHooked = true;
    
    const orig = window.showView;
    window.showView = function(view, btn){
      // Panggil original dulu (render konten)
      try { orig.call(this, view, btn); }
      catch(e){ console.warn('showView err:', e); }
      
      // Animasi masuk setelah DOM ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          animateContent();
          attachRipple();
        });
      });
    };
    console.log('✅ showView di-hook (v3)');
  }

  /* ============================================================
     TOMBOL RIPPLE
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
     BOOT
     ============================================================ */
  function boot(){
    injectCSS();
    attachRipple();
    attachButtonRipple();
    hookShowView();
    
    // Re-attach untuk nav baru (contoh: Jadwal Posyandu)
    setInterval(() => {
      attachRipple();
      hookShowView();
    }, 3000);
    
    console.log('✨ Animasi v3 (SMOOTH) aktif!');
  }
  
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }
})();
