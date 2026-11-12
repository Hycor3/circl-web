/* =============================================================
   CIRCL. — Scroll Animation Engine
   Intersection Observer + Parallax + Progress Bar
   ============================================================= */

(function() {
  'use strict';

  // ----- Scroll Progress Bar -----
  const progressBar = document.getElementById('scroll-progress');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  // ----- Floating Nav + Section Nav Visibility -----
  const floatingNav = document.querySelector('.floating-nav');
  const sectionNav = document.getElementById('section-nav');
  const heroSection = document.querySelector('.hero');

  function updateNav() {
    if (!heroSection) return;
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    const pastHero = heroBottom < 0;
    if (floatingNav) floatingNav.classList.toggle('visible', pastHero);
    if (sectionNav) sectionNav.classList.toggle('visible', pastHero);
  }

  // ----- Parallax for Hero Shapes -----
  const heroShapes = document.querySelectorAll('.hero-shape');

  function updateParallax() {
    const scrollTop = window.scrollY;
    heroShapes.forEach((shape, i) => {
      const speed = 0.15 + i * 0.08;
      shape.style.transform = `translateY(${scrollTop * speed}px)`;
    });
  }

  // ----- Combined Scroll Handler (throttled via rAF) -----
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        updateNav();
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ----- Intersection Observer for Reveal Animations -----
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ----- Stat Counter Animation -----
  const statNumbers = document.querySelectorAll('.stat-number');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => counterObserver.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // ----- Neural Canvas (Simplified Ambient) -----
  const canvas = document.getElementById('neural-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let nodes = [];
    let mouse = { x: null, y: null, active: false };
    const NODE_COUNT = 40;
    const CONNECT_DIST = 120;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    }

    class Node {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.r = Math.random() * 1.5 + 0.8;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx += (Math.random() - 0.5) * 0.015;
        this.vy += (Math.random() - 0.5) * 0.015;
        const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
        if (speed > 0.4) {
          this.vx = (this.vx / speed) * 0.4;
          this.vy = (this.vy / speed) * 0.4;
        }
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        if (mouse.active && mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const pull = (160 - dist) / 160;
            this.vx += (dx / dist) * pull * 0.06;
            this.vy += (dy / dist) * pull * 0.06;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fill();
      }
    }

    function initNodes() {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => { n.update(); n.draw(); });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (CONNECT_DIST - dist) / CONNECT_DIST;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.04})`;
            ctx.lineWidth = alpha * 0.6;
            ctx.stroke();
          }
        }
      }

      if (mouse.active && mouse.x !== null) {
        nodes.forEach(n => {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (130 - dist) / 130;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            const grad = ctx.createLinearGradient(mouse.x, mouse.y, n.x, n.y);
            grad.addColorStop(0, `rgba(10,207,131,${alpha * 0.2})`);
            grad.addColorStop(1, `rgba(162,89,255,${alpha * 0.04})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = alpha * 0.8;
            ctx.stroke();
          }
        });
      }

      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
    window.addEventListener('mouseleave', () => { mouse.active = false; });

    resize();
    animate();
  }

  // ----- Smooth scroll for nav links -----
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ----- Section Nav Active Tracking -----
  const sectionNavItems = document.querySelectorAll('.section-nav-item');
  const trackedSections = document.querySelectorAll('section[id]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        sectionNavItems.forEach(item => {
          item.classList.toggle('active', item.getAttribute('data-section') === id);
        });
      }
    });
  }, { threshold: 0.2, rootMargin: '-80px 0px -40% 0px' });

  trackedSections.forEach(section => sectionObserver.observe(section));

  // Initial calls
  updateProgress();
  updateNav();

})();
