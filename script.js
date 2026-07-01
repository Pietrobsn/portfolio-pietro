(() => {
  'use strict';

  const header = document.querySelector('.header');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navigationLinks = [...document.querySelectorAll('.nav__link')];
  const sections = [...document.querySelectorAll('main section[id]')];

  const closeMenu = () => {
    if (!navToggle || !navLinks) return;
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('nav-open');
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navLinks.classList.toggle('is-open', !isOpen);
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
      document.body.classList.toggle('nav-open', !isOpen);
    });

    navigationLinks.forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        navToggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (
        navLinks.classList.contains('is-open') &&
        !navLinks.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 840) closeMenu();
    });
  }

  const progressBar = document.getElementById('scrollProgress');

  let scrollQueued = false;
  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 16);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }
    scrollQueued = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      window.requestAnimationFrame(updateHeader);
      scrollQueued = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updateHeader);
  updateHeader();

  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleSection) return;

      navigationLinks.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${visibleSection.target.id}`;
        link.classList.toggle('is-active', isCurrent);
        if (isCurrent) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, {
      rootMargin: '-25% 0px -60% 0px',
      threshold: [0, 0.15, 0.4]
    });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const currentYear = document.getElementById('currentYear');
  if (currentYear) currentYear.textContent = String(new Date().getFullYear());

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Scroll reveal ────────────────────────────────────────── */
  const revealTargets = [...document.querySelectorAll('.reveal')];
  if (revealTargets.length) {
    if ('IntersectionObserver' in window && !prefersReduced) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

      revealTargets.forEach((el) => revealObserver.observe(el));
    } else {
      revealTargets.forEach((el) => el.classList.add('is-visible'));
    }
  }

  /* ── Glow que segue o cursor nos cards ────────────────────── */
  if (finePointer) {
    const glowTargets = document.querySelectorAll(
      '.project-card, .skill-group, .education-row, .contact-list a, .profile-summary'
    );
    glowTargets.forEach((el) => {
      el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        el.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  /* ── Botões com leve efeito magnético ──────────────────────── */
  if (!prefersReduced && finePointer) {
    document.querySelectorAll('.button--primary, .button--secondary').forEach((btn) => {
      btn.addEventListener('mousemove', (event) => {
        const rect = btn.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        btn.style.transform = `translate(${dx * 0.16}px, ${dy * 0.32 - 2}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ── Tilt 3D sutil nos cards em destaque ───────────────────── */
  if (!prefersReduced && finePointer) {
    document.querySelectorAll('.project-card--featured').forEach((card) => {
      let tiltRaf = null;

      card.addEventListener('mousemove', (event) => {
        if (tiltRaf) return;
        tiltRaf = window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const dx = (event.clientX - rect.left) / rect.width - 0.5;
          const dy = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.transform =
            `perspective(950px) rotateX(${(-dy * 3.5).toFixed(2)}deg) rotateY(${(dx * 3.5).toFixed(2)}deg) translateY(-3px)`;
          tiltRaf = null;
        });
      });

      card.addEventListener('mouseleave', () => {
        if (tiltRaf) {
          window.cancelAnimationFrame(tiltRaf);
          tiltRaf = null;
        }
        card.style.transform = '';
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     CONSTELAÇÃO DE PARTÍCULAS — segue o cursor no hero.
     Canvas leve, atrás do conteúdo, pointer-events: none.
     Desativado sob prefers-reduced-motion e em telas touch
     (economia de bateria/CPU no mobile).
  ══════════════════════════════════════════════════════════ */
  if (!prefersReduced && finePointer) {
    const canvas = document.getElementById('heroParticles');
    const hero = document.querySelector('.hero');

    if (canvas && hero) {
      const ctx = canvas.getContext('2d');
      let width, height, dpr;
      let particles = [];

      const mouse = { x: -9999, y: -9999, active: false };
      const smooth = { x: -9999, y: -9999 };

      const LINK_DIST = 125;
      const MOUSE_DIST = 200;

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = hero.offsetWidth;
        height = hero.offsetHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildParticles();
      }

      function buildParticles() {
        const count = Math.min(Math.round((width * height) / 15000), 90);
        particles = [];
        for (let i = 0; i < count; i += 1) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            r: Math.random() * 1.6 + 0.6
          });
        }
      }

      function draw() {
        ctx.clearRect(0, 0, width, height);

        smooth.x += (mouse.x - smooth.x) * 0.08;
        smooth.y += (mouse.y - smooth.y) * 0.08;

        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];

          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(115, 168, 255, 0.5)';
          ctx.fill();

          for (let j = i + 1; j < particles.length; j += 1) {
            const q = particles[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const dist = Math.hypot(dx, dy);
            if (dist < LINK_DIST) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(115, 168, 255, ${(1 - dist / LINK_DIST) * 0.16})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          if (mouse.active) {
            const dx = p.x - smooth.x;
            const dy = p.y - smooth.y;
            const dist = Math.hypot(dx, dy);
            if (dist < MOUSE_DIST) {
              const k = 1 - dist / MOUSE_DIST;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(smooth.x, smooth.y);
              ctx.strokeStyle = `rgba(115, 168, 255, ${k * 0.45})`;
              ctx.lineWidth = 1.1;
              ctx.stroke();
            }
          }
        }

        if (mouse.active) {
          const grad = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, 80);
          grad.addColorStop(0, 'rgba(115, 168, 255, 0.16)');
          grad.addColorStop(1, 'rgba(115, 168, 255, 0)');
          ctx.beginPath();
          ctx.arc(smooth.x, smooth.y, 80, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        requestAnimationFrame(draw);
      }

      function onMove(event) {
        const rect = hero.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
        mouse.active = mouse.y >= 0 && mouse.y <= rect.height;
        if (smooth.x < -9000) {
          smooth.x = mouse.x;
          smooth.y = mouse.y;
        }
      }

      function onLeave() {
        mouse.active = false;
      }

      window.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseleave', onLeave);
      window.addEventListener('resize', resize);

      resize();
      draw();
    }
  }
})();
