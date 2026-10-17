/* ================================================================
   Z-STUNTING · ANIMASI ZOOM IN v7 (STABLE)
   ✅ Zoom hanya per-card (bukan #content)
   ✅ Reset scroll ke atas
   ✅ No layout jump, no lock height
   ================================================================ */
(function(){
  console.log('%c✨ Animasi ZOOM v7 (STABLE) loading...', 'color:#00C9FF;font-weight:bold');

  function injectCSS(){
    if(document.getElementById('_zstAnimStyle')) return;
    const style = document.createElement('style');
    style.id = '_zstAnimStyle';
    style.textContent = `
      #content {
        will-change: opacity;
        transition: opacity 0.2s ease;
      }
      
      #content .card {
        will-change: opacity, transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform-origin: center top;
      }
      
      .stat-card {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      .stat-card:hover {
        transform: translate3d(0, -3px, 0) !important;
        box-shadow: 0 10px 25px rgba(30, 42, 120, 0.12) !important;
      }
      
      .nav-item {
        position: relative !important;
        overflow: hidden !important;
        transition: background 0.25s ease, color 0.25s ease !important;
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
        animation: zstRippleAnim 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
      }
      
      .btn {
        transition: transform 0.2s ease, box-shadow 0.25s ease !important;
        position: relative;
        overflow: hidden;
      }
      
      .btn:active { transform: scale(0.96) !important; }
      
      html { scroll-behavior: smooth; }
      
      @media (prefers-reduced-motion: reduce) {
        #content, #content .card, .stat-card, .btn {
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ============================================================
     TRANSISI ZOOM PER-CARD (STABLE)
     ============================================================ */
  function doTransition(renderFn){
    const content = document.getElementById('content');
    if(!content){ if(renderFn) renderFn(); return; }
    if(content._zstAnimating){ if(renderFn) renderFn(); return; }
    content._zstAnimating = true;
    
    // ✅ Reset scroll ke atas (biar tidak "lompat" dari posisi lama)
    try { window.scrollTo(0, 0); } catch(e){}
    
    // ============================================================
    // FASE 1 — Fade out #content (opacity saja, TANPA transform)
    // ============================================================
    content.style.transition = 'opacity 0.22s ease';
    content.style.opacity = '0';
    
    setTimeout(() => {
      // ============================================================
      // Render konten baru (masih invisible karena #content opacity 0)
      // ============================================================
      if(renderFn){
        try { renderFn(); }
        catch(e){ console.warn('render err:', e); }
      }
      
      // Tunggu 1 frame — supaya DOM siap
      setTimeout(() => {
        // Setup card untuk zoom in (hanya 6 card pertama biar ringan)
        const cards = Array.from(content.querySelectorAll('.card')).slice(0, 6);
        
        cards.forEach(card => {
          card.style.transition = 'none';
          card.style.opacity = '0';
          card.style.transform = 'scale3d(0.92, 0.92, 1)';
        });
        
        // Force reflow
        void content.offsetHeight;
        
        // ============================================================
        // FASE 2 — Content fade in + card zoom in
        // ============================================================
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Content fade in
            content.style.transition = 'opacity 0.3s ease';
            content.style.opacity = '1';
            
            // Card zoom in (stagger)
            cards.forEach((card, i) => {
              const delay = i * 0.06;
              card.style.transition = 
                `opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, ` +
                `transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s`;
              card.style.opacity = '1';
              card.style.transform = 'scale3d(1, 1, 1)';
            });
            
            // Cleanup
            setTimeout(() => {
              content.style.transition = '';
              content.style.opacity = '';
              cards.forEach(card => {
                card.style.transition = '';
                card.style.transform = '';
                card.style.opacity = '';
              });
              content._zstAnimating = false;
            }, 800);
          });
        });
      }, 20);
    }, 230);
  }

  /* ============================================================
     HOOK showView()
     ============================================================ */
  function hookShowView(){
    if(!window.showView || window._zstShowViewHooked) return;
    window._zstShowViewHooked = true;
    const orig = window.showView;
    window.showView = function(view, btn){
      doTransition(() => orig.call(this, view, btn));
    };
    console.log('✅ showView di-hook (v7)');
  }

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

  function attachButtonRipple(){
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.btn');
      if(!btn || btn.classList.contains('nav-item')) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute;border-radius:50%;background:rgba(255,255,255,0.4);
        width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;
        transform:scale(0);animation:zstRippleAnim 0.6s ease-out;
        pointer-events:none;z-index:0;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  window.zstTransition = doTransition;

  function boot(){
    injectCSS();
    attachRipple();
    attachButtonRipple();
    hookShowView();
    setInterval(() => { attachRipple(); hookShowView(); }, 3000);
    console.log('✨ Animasi ZOOM v7 aktif!');
  }
  
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }
})();
