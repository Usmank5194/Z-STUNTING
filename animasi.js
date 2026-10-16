/* ================================================================
   Z-STUNTING · ANIMASI PREMIUM
   Efek cinematic saat pindah menu & interaksi
   ✅ Fade + slide up
   ✅ Stagger animation (card muncul satu-satu)
   ✅ Ripple effect di nav
   ✅ Counter animation untuk angka
   ✅ Smooth tab transition
   ================================================================ */
(function(){
  console.log('%c✨ Animasi Premium loading...', 'color:#00C9FF;font-weight:bold');

  /* ============================================================
     1. INJECT CSS ANIMASI
     ============================================================ */
  function injectCSS(){
    if(document.getElementById('_zstAnimStyle')) return;
    const style = document.createElement('style');
    style.id = '_zstAnimStyle';
    style.textContent = `
      /* ============ KEYFRAMES ============ */
      @keyframes zstFadeInUp {
        0% {
          opacity: 0;
          transform: translateY(20px) scale(0.98);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes zstFadeInDown {
        0% { opacity: 0; transform: translateY(-15px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes zstZoomIn {
        0% { opacity: 0; transform: scale(0.92); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes zstSlideInRight {
        0% { opacity: 0; transform: translateX(30px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes zstShimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      @keyframes zstRipple {
        0% { transform: scale(0); opacity: 0.6; }
        100% { transform: scale(4); opacity: 0; }
      }
      
      @keyframes zstPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0,201,255,0.4); }
        50% { box-shadow: 0 0 0 8px rgba(0,201,255,0); }
      }
      
      @keyframes zstBounceIn {
        0% { opacity: 0; transform: scale(0.3); }
        50% { opacity: 1; transform: scale(1.05); }
        70% { transform: scale(0.95); }
        100% { transform: scale(1); }
      }
      
      /* ============ PAGE TRANSITION ============ */
      .zst-page-enter {
        animation: zstFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      
      .zst-page-exit {
        animation: zstFadeInUp 0.2s ease reverse forwards;
        opacity: 0;
      }
      
      /* ============ STAGGER — CARD MUNCUL SATU-SATU ============ */
      .zst-stagger > * {
        opacity: 0;
        animation: zstFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      
      .zst-stagger > *:nth-child(1) { animation-delay: 0.05s; }
      .zst-stagger > *:nth-child(2) { animation-delay: 0.10s; }
      .zst-stagger > *:nth-child(3) { animation-delay: 0.15s; }
      .zst-stagger > *:nth-child(4) { animation-delay: 0.20s; }
      .zst-stagger > *:nth-child(5) { animation-delay: 0.25s; }
      .zst-stagger > *:nth-child(6) { animation-delay: 0.30s; }
      .zst-stagger > *:nth-child(7) { animation-delay: 0.35s; }
      .zst-stagger > *:nth-child(8) { animation-delay: 0.40s; }
      
      /* Stats grid stagger */
      .zst-stagger-stats > * {
        opacity: 0;
        animation: zstBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      
      .zst-stagger-stats > *:nth-child(1) { animation-delay: 0.05s; }
      .zst-stagger-stats > *:nth-child(2) { animation-delay: 0.12s; }
      .zst-stagger-stats > *:nth-child(3) { animation-delay: 0.19s; }
      .zst-stagger-stats > *:nth-child(4) { animation-delay: 0.26s; }
      .zst-stagger-stats > *:nth-child(5) { animation-delay: 0.33s; }
      
      /* Table row stagger */
      .zst-stagger-rows tbody tr {
        opacity: 0;
        animation: zstFadeInUp 0.35s ease forwards;
      }
      
      .zst-stagger-rows tbody tr:nth-child(1) { animation-delay: 0.05s; }
      .zst-stagger-rows tbody tr:nth-child(2) { animation-delay: 0.10s; }
      .zst-stagger-rows tbody tr:nth-child(3) { animation-delay: 0.15s; }
      .zst-stagger-rows tbody tr:nth-child(4) { animation-delay: 0.20s; }
      .zst-stagger-rows tbody tr:nth-child(5) { animation-delay: 0.25s; }
      .zst-stagger-rows tbody tr:nth-child(6) { animation-delay: 0.30s; }
      .zst-stagger-rows tbody tr:nth-child(7) { animation-delay: 0.35s; }
      .zst-stagger-rows tbody tr:nth-child(8) { animation-delay: 0.40s; }
      .zst-stagger-rows tbody tr:nth-child(9) { animation-delay: 0.45s; }
      .zst-stagger-rows tbody tr:nth-child(10) { animation-delay: 0.50s; }
      
      /* ============ NAV ITEM RIPPLE ============ */
      .nav-item {
        position: relative !important;
        overflow: hidden !important;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
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
      
      /* Nav indicator line — garis kiri yang bergerak */
      .nav-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%) scaleY(0);
        width: 4px;
        height: 60%;
        background: linear-gradient(180deg, #00C9FF, #0091EA);
        border-radius: 0 4px 4px 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 2;
      }
      
      .nav-item.active::before {
        transform: translateY(-50%) scaleY(1);
      }
      
      /* Icon bounce on hover */
      .nav-item:hover .ic {
        animation: zstBounceIn 0.4s ease;
        display: inline-block;
      }
      
      /* ============ CARD HOVER LIFT ============ */
      .card {
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      
      .card:hover {
        transform: translateY(-2px);
      }
      
      .stat-card {
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        cursor: pointer;
      }
      
      .stat-card:hover {
        transform: translateY(-5px) scale(1.02) !important;
      }
      
      .stat-card:active {
        transform: translateY(-2px) scale(0.99) !important;
      }
      
      /* ============ BUTTON PRESS EFFECT ============ */
      .btn {
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        position: relative;
        overflow: hidden;
      }
      
      .btn:active {
        transform: scale(0.96) !important;
      }
      
      /* ============ TAB SWITCHER SLIDE ============ */
      .zst-tab-slide {
        animation: zstZoomIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      
      /* ============ SMOOTH SCROLL ============ */
      html {
        scroll-behavior: smooth;
      }
      
      /* ============ LOADING SHIMMER ============ */
      .zst-shimmer {
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(255,255,255,0.8) 50%, 
          transparent 100%);
        background-size: 200% 100%;
        animation: zstShimmer 1.5s infinite;
      }
      
      /* ============ ICON PULSE (untuk notif) ============ */
      .zst-pulse {
        animation: zstPulse 2s infinite;
      }
      
      /* ============ STAT VALUE COUNT-UP GLOW ============ */
      .zst-count-glow {
        animation: zstFadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      
      /* ============ FADE OUT OLD CONTENT ============ */
      #content {
        transition: opacity 0.15s ease;
      }
      
      #content.zst-fading {
        opacity: 0;
      }
      
      /* ============ HILANGKAN ANIMASI DI MOBILE JARINGAN LEMOT ============ */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS animasi terpasang');
  }

  /* ============================================================
     2. RIPPLE EFFECT SAAT NAV DIKLIK
     ============================================================ */
  function attachRipple(){
    document.querySelectorAll('.nav-item').forEach(nav => {
      if(nav._zstRippleAttached) return;
      nav._zstRippleAttached = true;
      
      nav.addEventListener('click', function(e){
        const ripple = document.createElement('span');
        ripple.className = 'zst-ripple';
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  /* ============================================================
     3. PAGE TRANSITION — DETEKSI PERUBAHAN ISI CONTENT
     ============================================================ */
  function animateContent(){
    const content = document.getElementById('content');
    if(!content) return;
    
    // Fade in + slide up halaman
    content.classList.remove('zst-page-enter');
    // Trigger reflow supaya animation restart
    void content.offsetWidth;
    content.classList.add('zst-page-enter');
    
    // Stagger untuk semua card di dalam content
    setTimeout(() => {
      content.querySelectorAll('.card').forEach(card => {
        card.style.opacity = '0';
        card.style.animation = 'none';
        setTimeout(() => {
          card.style.animation = 'zstFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        }, 30);
      });
      
      // Stagger untuk stats grid
      const statsGrid = content.querySelector('.stats-grid');
      if(statsGrid && !statsGrid._zstAnimated){
        statsGrid._zstAnimated = true;
        statsGrid.querySelectorAll('.stat-card').forEach((card, i) => {
          card.style.opacity = '0';
          card.style.animation = `zstBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.05 + i * 0.07}s forwards`;
        });
      }
      
      // Stagger untuk table rows
      content.querySelectorAll('table tbody').forEach(tbody => {
        tbody.querySelectorAll('tr').forEach((row, i) => {
          if(i > 15) return; // max 15 baris pertama biar tidak lemot
          row.style.opacity = '0';
          row.style.animation = `zstFadeInUp 0.35s ease ${0.05 + i * 0.04}s forwards`;
        });
      });
      
      // Counter animation untuk angka
      animateCounters(content);
    }, 100);
  }

  /* ============================================================
     4. COUNTER ANIMATION — ANGKA NAIK DARI 0
     ============================================================ */
  function animateCounters(container){
    container.querySelectorAll('.stat-card .value, .value').forEach(el => {
      const text = el.textContent.trim();
      // Cek apakah angka murni
      const match = text.match(/^(\d+)(.*)$/);
      if(!match) return;
      if(el._zstCounted) return;
      el._zstCounted = true;
      
      const target = parseInt(match[1]);
      const suffix = match[2] || '';
      if(target === 0) return;
      
      const duration = 600;
      const startTime = performance.now();
      
      function animate(now){
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = current + suffix;
        if(progress < 1) requestAnimationFrame(animate);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(animate);
    });
  }

  /* ============================================================
     5. HOOK showView() — INTERCEPT KLIK MENU
     ============================================================ */
  function hookShowView(){
    if(!window.showView || window._zstShowViewHooked) return;
    window._zstShowViewHooked = true;
    
    const orig = window.showView;
    window.showView = function(view, btn){
      const content = document.getElementById('content');
      
      // Fade out content
      if(content){
        content.classList.add('zst-fading');
      }
      
      // Tunggu sebentar, baru swap
      setTimeout(() => {
        try {
          orig.call(this, view, btn);
        } catch(e){ console.warn('showView err:', e); }
        
        if(content){
          content.classList.remove('zst-fading');
        }
        
        // Animasi masuk
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            animateContent();
            attachRipple();
          });
        });
      }, 120);
    };
    console.log('✅ showView di-hook untuk animasi');
  }

  /* ============================================================
     6. OBSERVER — DETEKSI PERUBAHAN CONTENT (untuk view yang custom)
     ============================================================ */
  function setupObserver(){
    const content = document.getElementById('content');
    if(!content) return;
    if(content._zstObserved) return;
    content._zstObserved = true;
    
    let lastHTML = '';
    let animating = false;
    
    const observer = new MutationObserver(() => {
      if(animating) return;
      const currentHTML = content.innerHTML.length;
      if(currentHTML !== lastHTML && currentHTML > 100){
        lastHTML = currentHTML;
        animating = true;
        setTimeout(() => {
          animateContent();
          attachRipple();
          animating = false;
        }, 50);
      }
    });
    
    observer.observe(content, { childList: true, subtree: false });
  }

  /* ============================================================
     7. TAMBAH EFEK RIPPLE KE BUTTON JUGA
     ============================================================ */
  function attachButtonRipple(){
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.btn');
      if(!btn || btn._zstRippleSkip) return;
      // Skip tombol navigasi biar tidak dobel
      if(btn.classList.contains('nav-item')) return;
      
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position:absolute;
        border-radius:50%;
        background:rgba(255,255,255,0.4);
        width:${size}px;
        height:${size}px;
        left:${x}px;
        top:${y}px;
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
     8. BOOT
     ============================================================ */
  function boot(){
    injectCSS();
    attachRipple();
    attachButtonRipple();
    hookShowView();
    setupObserver();
    
    // Trigger animasi pertama kali
    setTimeout(() => {
      animateContent();
    }, 500);
    
    // Re-attach kalau ada nav baru (contoh: Jadwal Posyandu)
    setInterval(() => {
      attachRipple();
      hookShowView();
    }, 2000);
    
    console.log('✨ Animasi Premium aktif!');
  }
  
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }
})();
