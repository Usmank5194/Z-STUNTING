/* ================================================================
   Z-STUNTING · ANIMASI PREMIUM v2 (SAFE)
   ✅ Tidak ada opacity:0 yang nyangkut
   ✅ Auto-recovery kalau animasi gagal
   ✅ Animasi tetap cinematic
   ================================================================ */
(function(){
  console.log('%c✨ Animasi Premium v2 (SAFE) loading...', 'color:#00C9FF;font-weight:bold');

  /* ============================================================
     INJECT CSS ANIMASI (SAFE)
     ============================================================ */
  function injectCSS(){
    if(document.getElementById('_zstAnimStyle')) return;
    const style = document.createElement('style');
    style.id = '_zstAnimStyle';
    style.textContent = `
      /* ============ KEYFRAMES ============ */
      @keyframes zstFadeInUp {
        0%   { opacity: 0; transform: translateY(15px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes zstFadeIn {
        0%   { opacity: 0; }
        100% { opacity: 1; }
      }
      
      @keyframes zstSlideInRight {
        0%   { opacity: 0; transform: translateX(20px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes zstRipple {
        0%   { transform: scale(0); opacity: 0.6; }
        100% { transform: scale(4); opacity: 0; }
      }
      
      @keyframes zstBounceIcon {
        0%   { transform: scale(1); }
        50%  { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
      
      /* ============ PAGE ENTER — pakai fill-mode both ============ */
      .zst-anim-page {
        animation: zstFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      
      /* ============ STAGGER CARDS ============ */
      .zst-anim-card {
        animation: zstFadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      
      .zst-anim-card[data-zst-delay="1"] { animation-delay: 0.05s; }
      .zst-anim-card[data-zst-delay="2"] { animation-delay: 0.10s; }
      .zst-anim-card[data-zst-delay="3"] { animation-delay: 0.15s; }
      .zst-anim-card[data-zst-delay="4"] { animation-delay: 0.20s; }
      .zst-anim-card[data-zst-delay="5"] { animation-delay: 0.25s; }
      .zst-anim-card[data-zst-delay="6"] { animation-delay: 0.30s; }
      
      /* ============ STAT CARDS ============ */
      .zst-anim-stat {
        animation: zstFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      
      .zst-anim-stat[data-zst-delay="1"] { animation-delay: 0.05s; }
      .zst-anim-stat[data-zst-delay="2"] { animation-delay: 0.10s; }
      .zst-anim-stat[data-zst-delay="3"] { animation-delay: 0.15s; }
      .zst-anim-stat[data-zst-delay="4"] { animation-delay: 0.20s; }
      .zst-anim-stat[data-zst-delay="5"] { animation-delay: 0.25s; }
      
      /* ============ TABLE ROWS ============ */
      .zst-anim-row {
        animation: zstFadeIn 0.3s ease both;
      }
      
      /* ============ NAV ITEM RIPPLE ============ */
      .nav-item {
        position: relative !important;
        overflow: hidden !important;
        transition: background 0.25s ease, color 0.25s ease !important;
      }
      
      .nav-item .zst-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(0, 201, 255, 0.35);
        transform: scale(0);
        animation: zstRipple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
      }
      
      /* Icon bounce saat hover */
      .nav-item:hover .ic {
        display: inline-block;
        animation: zstBounceIcon 0.4s ease;
      }
      
      /* ============ CARD HOVER LIFT ============ */
      .card {
        transition: box-shadow 0.3s ease, transform 0.3s ease !important;
      }
      
      .card:hover {
        transform: translateY(-2px);
      }
      
      .stat-card {
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
                    box-shadow 0.3s ease !important;
        cursor: pointer;
      }
      
      .stat-card:hover {
        transform: translateY(-4px) scale(1.02) !important;
        box-shadow: 0 10px 25px rgba(30, 42, 120, 0.15) !important;
      }
      
      .stat-card:active {
        transform: translateY(-1px) scale(0.99) !important;
      }
      
      /* ============ BUTTON PRESS EFFECT ============ */
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
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS animasi v2 terpasang');
  }

  /* ============================================================
     RIPPLE EFFECT SAAT NAV DIKLIK
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
     ANIMASI UTAMA — TAMBAH CLASS, TIDAK SET OPACITY
     ============================================================ */
  function animateContent(){
    const content = document.getElementById('content');
    if(!content) return;
    
    // Reset class animasi lama (kalau ada)
    content.querySelectorAll('.zst-anim-card, .zst-anim-stat, .zst-anim-row')
      .forEach(el => el.classList.remove('zst-anim-card', 'zst-anim-stat', 'zst-anim-row'));
    
    // Page fade-in (hanya #content, pakai animation-fill-mode both)
    content.classList.remove('zst-anim-page');
    void content.offsetWidth; // reflow
    content.classList.add('zst-anim-page');
    
    // Card stagger
    let cardIdx = 0;
    content.querySelectorAll('.card').forEach(card => {
      cardIdx++;
      if(cardIdx > 6) return;
      card.classList.add('zst-anim-card');
      card.dataset.zstDelay = Math.min(cardIdx, 6);
    });
    
    // Stats stagger
    content.querySelectorAll('.stats-grid .stat-card').forEach((card, i) => {
      if(i > 4) return;
      card.classList.add('zst-anim-stat');
      card.dataset.zstDelay = i + 1;
    });
    
    // Table rows stagger (maks 10 baris)
    content.querySelectorAll('table tbody tr').forEach((row, i) => {
      if(i > 9) return;
      row.classList.add('zst-anim-row');
      row.style.animationDelay = (0.03 + i * 0.04) + 's';
    });
    
    // Counter animation
    setTimeout(() => animateCounters(content), 200);
    
    // ===== SAFETY NET: 1.5 detik kemudian, paksa semua visible =====
    setTimeout(() => {
      content.querySelectorAll('*').forEach(el => {
        // Hanya reset kalau benar-benar nyangkut di opacity 0
        const computed = window.getComputedStyle(el);
        if(computed.opacity === '0' && el.offsetParent !== null){
          // Cek apakah ini karena animasi yang belum jalan
          if(!el.classList.contains('zst-ripple')){
            el.style.opacity = '1';
            el.style.transform = 'none';
          }
        }
      });
      content.style.opacity = '1';
    }, 1500);
  }

  /* ============================================================
     COUNTER ANIMATION — ANGKA NAIK DARI 0
     ============================================================ */
  function animateCounters(container){
    container.querySelectorAll('.stat-card .value, .value').forEach(el => {
      const text = el.textContent.trim();
      const match = text.match(/^(\d+)(.*)$/);
      if(!match) return;
      if(el._zstCounted) return;
      el._zstCounted = true;
      
      const target = parseInt(match[1]);
      const suffix = match[2] || '';
      if(target === 0) return;
      
      const startTime = performance.now();
      const duration = 500;
      
      function animate(now){
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if(progress < 1) requestAnimationFrame(animate);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(animate);
    });
  }

  /* ============================================================
     HOOK showView() — TANPA FADE OUT (yang bikin hilang)
     ============================================================ */
  function hookShowView(){
    if(!window.showView || window._zstShowViewHooked) return;
    window._zstShowViewHooked = true;
    
    const orig = window.showView;
    window.showView = function(view, btn){
      // Panggil original dulu — langsung render
      try {
        orig.call(this, view, btn);
      } catch(e){ console.warn('showView err:', e); }
      
      // Baru animasikan
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          animateContent();
          attachRipple();
        });
      });
    };
    console.log('✅ showView di-hook (safe mode)');
  }

  /* ============================================================
     OBSERVER — untuk view custom (jadwal, dll)
     ============================================================ */
  function setupObserver(){
    const content = document.getElementById('content');
    if(!content || content._zstObserved) return;
    content._zstObserved = true;
    
    let lastLen = 0;
    let timer = null;
    
    const observer = new MutationObserver(() => {
      const len = content.innerHTML.length;
      if(Math.abs(len - lastLen) < 100) return;
      lastLen = len;
      
      // Debounce
      if(timer) clearTimeout(timer);
      timer = setTimeout(() => {
        animateContent();
        attachRipple();
      }, 100);
    });
    
    observer.observe(content, { childList: true, subtree: false });
  }

  /* ============================================================
     RIPPLE DI TOMBOL
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
        animation:zstRipple 0.6s ease-out;
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
    setupObserver();
    
    // Animasi awal
    setTimeout(animateContent, 600);
    
    // Re-attach tiap 2 detik (untuk nav baru seperti Jadwal Posyandu)
    setInterval(() => {
      attachRipple();
      hookShowView();
    }, 2000);
    
    // SAFETY GLOBAL: setiap 5 detik, pastikan #content opacity = 1
    setInterval(() => {
      const content = document.getElementById('content');
      if(content && window.getComputedStyle(content).opacity === '0'){
        console.warn('⚠️ Safety: force content opacity = 1');
        content.style.opacity = '1';
      }
    }, 5000);
    
    console.log('✨ Animasi Premium v2 (SAFE) aktif!');
  }
  
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }
})();
