(() => {
  'use strict';

  const header = document.querySelector('.header');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navigationLinks = [...document.querySelectorAll('.nav__link')];
  const dotLinks = [...document.querySelectorAll('.section-dots a')];
  const sections = [...document.querySelectorAll('main section[id]')];

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
  const heroSection = document.querySelector('.hero');
  const heroGrid = document.querySelector('.hero__grid');
  let heroHeight = heroSection ? heroSection.offsetHeight : 0;

  let scrollQueued = false;
  const updateHeader = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 16);
    heroSection?.classList.toggle('is-scrolled', y > 60);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }

    /* Grid de fundo desliza levemente com o scroll (profundidade) */
    document.body.style.setProperty('--grid-shift', `${(-y * 0.06).toFixed(1)}px`);

    /* Hero: conteúdo sobe mais devagar e esmaece ao rolar (parallax de saída) */
    if (heroGrid && heroHeight && !prefersReduced && finePointer) {
      if (y <= heroHeight) {
        const k = y / heroHeight;
        heroGrid.style.transform = `translateY(${(y * 0.22).toFixed(1)}px)`;
        heroGrid.style.opacity = String(Math.max(1 - k * 1.2, 0).toFixed(3));
      } else {
        heroGrid.style.opacity = '0';
      }
    }

    scrollQueued = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      window.requestAnimationFrame(updateHeader);
      scrollQueued = true;
    }
  }, { passive: true });
  window.addEventListener('resize', () => {
    heroHeight = heroSection ? heroSection.offsetHeight : 0;
    updateHeader();
  });
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

      dotLinks.forEach((dot) => {
        dot.classList.toggle('is-active', dot.getAttribute('href') === `#${visibleSection.target.id}`);
      });
    }, {
      rootMargin: '-25% 0px -60% 0px',
      threshold: [0, 0.15, 0.4]
    });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const currentYear = document.getElementById('currentYear');
  if (currentYear) currentYear.textContent = String(new Date().getFullYear());

  /* ── Título do hero: entrada palavra por palavra ──────────── */
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle && !prefersReduced) {
    const tokens = [];
    heroTitle.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
          if (/^[.,!?;:]+$/.test(word) && tokens.length) tokens[tokens.length - 1].suffix += word;
          else tokens.push({ text: word, highlight: false, suffix: '' });
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        tokens.push({ text: node.textContent, highlight: true, suffix: '' });
      }
    });

    heroTitle.classList.remove('reveal', 'reveal--delay-2');
    heroTitle.textContent = '';
    tokens.forEach((token, index) => {
      const word = document.createElement('span');
      word.className = 'word';
      word.style.animationDelay = `${140 + index * 70}ms`;
      if (token.highlight) {
        const inner = document.createElement('span');
        inner.className = 'hero__highlight';
        inner.textContent = token.text;
        word.appendChild(inner);
        if (token.suffix) word.appendChild(document.createTextNode(token.suffix));
      } else {
        word.textContent = token.text + token.suffix;
      }
      heroTitle.appendChild(word);
      if (index < tokens.length - 1) heroTitle.appendChild(document.createTextNode(' '));
    });
  }

  /* ── Linha com efeito de digitação ────────────────────────── */
  const typingEl = document.getElementById('typingText');
  if (typingEl) {
    const phrases = [
      'Construindo sistemas web',
      'Organizando operações reais',
      'Criando painéis administrativos',
      'Transformando rotinas em software'
    ];

    if (prefersReduced) {
      typingEl.textContent = phrases[0];
    } else {
      let phraseIndex = 0;
      let charIndex = 0;
      let erasing = false;

      const tick = () => {
        const phrase = phrases[phraseIndex];
        if (!erasing) {
          charIndex += 1;
          typingEl.textContent = phrase.slice(0, charIndex);
          if (charIndex === phrase.length) {
            erasing = true;
            setTimeout(tick, 2100);
            return;
          }
          setTimeout(tick, 52);
        } else {
          charIndex -= 1;
          typingEl.textContent = phrase.slice(0, charIndex);
          if (charIndex === 0) {
            erasing = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(tick, 320);
            return;
          }
          setTimeout(tick, 26);
        }
      };

      setTimeout(tick, 900);
    }
  }

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
            `perspective(950px) rotateX(${(-dy * 5.5).toFixed(2)}deg) rotateY(${(dx * 5.5).toFixed(2)}deg) translateY(-4px)`;
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

  /* ── Parallax de scroll nos blobs decorativos ──────────────── */
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  if (parallaxEls.length && !prefersReduced && finePointer) {
    let parallaxQueued = false;

    const updateParallax = () => {
      const viewportCenter = window.innerHeight / 2;
      parallaxEls.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
        const offset = (rect.top + rect.height / 2 - viewportCenter) * parseFloat(el.dataset.parallax);
        el.style.transform = `translateY(${offset.toFixed(1)}px)`;
      });
      parallaxQueued = false;
    };

    window.addEventListener('scroll', () => {
      if (!parallaxQueued) {
        window.requestAnimationFrame(updateParallax);
        parallaxQueued = true;
      }
    }, { passive: true });
    updateParallax();
  }

  /* ── Contador animado no "4+" do Sobre ─────────────────────── */
  const factNumber = document.querySelector('.about-facts dt.mono');
  if (factNumber && !prefersReduced && 'IntersectionObserver' in window) {
    const match = factNumber.textContent.trim().match(/^(\d+)(\+?)$/);
    if (match) {
      const target = Number(match[1]);
      const suffix = match[2];
      factNumber.textContent = `0${suffix}`;

      const counterObserver = new IntersectionObserver((entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 1200;
        const step = (now) => {
          const k = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - k, 3);
          factNumber.textContent = `${Math.round(eased * target)}${suffix}`;
          if (k < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      }, { threshold: 0.6 });

      counterObserver.observe(factNumber);
    }
  }

  /* ══════════════════════════════════════════════════════════
     GALÁXIA GLOBAL — estrelas orbitando o cursor + rastro de
     poeira estelar, na página inteira. Canvas fixo, atrás do
     header, pointer-events: none. Desktop apenas.
  ══════════════════════════════════════════════════════════ */
  if (!prefersReduced && finePointer) {
    const galaxy = document.getElementById('galaxyCanvas');

    if (galaxy) {
      const gtx = galaxy.getContext('2d');
      let vw, vh;

      const resizeGalaxy = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        vw = window.innerWidth;
        vh = window.innerHeight;
        galaxy.width = vw * dpr;
        galaxy.height = vh * dpr;
        galaxy.style.width = `${vw}px`;
        galaxy.style.height = `${vh}px`;
        gtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resizeGalaxy();
      window.addEventListener('resize', resizeGalaxy);

      const pointer = { x: -9999, y: -9999, seen: false };
      const core = { x: -9999, y: -9999 };
      const dust = [];
      const DUST_MAX = 150;

      const orbiters = [];
      for (let i = 0; i < 16; i += 1) {
        orbiters.push({
          radius: 16 + Math.random() * 96,
          angle: Math.random() * Math.PI * 2,
          speed: (0.004 + Math.random() * 0.013) * (Math.random() < 0.5 ? 1 : -1),
          size: 0.7 + Math.random() * 1.3,
          twinkle: Math.random() * Math.PI * 2,
          squash: 0.4 + Math.random() * 0.35
        });
      }

      window.addEventListener('mousemove', (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (!pointer.seen) {
          core.x = pointer.x;
          core.y = pointer.y;
          pointer.seen = true;
        }
        for (let n = 0; n < 2; n += 1) {
          if (dust.length >= DUST_MAX) dust.shift();
          const angle = Math.random() * Math.PI * 2;
          dust.push({
            x: pointer.x + (Math.random() - 0.5) * 16,
            y: pointer.y + (Math.random() - 0.5) * 16,
            vx: Math.cos(angle) * 0.4,
            vy: Math.sin(angle) * 0.4 + 0.14,
            life: 1,
            decay: 0.012 + Math.random() * 0.02,
            size: 0.6 + Math.random() * 1.5
          });
        }
      }, { passive: true });

      let time = 0;

      const drawGalaxy = () => {
        gtx.clearRect(0, 0, vw, vh);
        time += 0.016;

        if (pointer.seen) {
          core.x += (pointer.x - core.x) * 0.1;
          core.y += (pointer.y - core.y) * 0.1;

          /* Núcleo: glow suave no centro da galáxia */
          const glow = gtx.createRadialGradient(core.x, core.y, 0, core.x, core.y, 140);
          glow.addColorStop(0, 'rgba(115, 168, 255, 0.13)');
          glow.addColorStop(1, 'rgba(115, 168, 255, 0)');
          gtx.beginPath();
          gtx.arc(core.x, core.y, 140, 0, Math.PI * 2);
          gtx.fillStyle = glow;
          gtx.fill();

          /* Estrelas em órbita elíptica, com twinkle */
          orbiters.forEach((star) => {
            star.angle += star.speed;
            const x = core.x + Math.cos(star.angle) * star.radius;
            const y = core.y + Math.sin(star.angle) * star.radius * star.squash;
            const alpha = 0.45 + Math.sin(time * 2 + star.twinkle) * 0.35;
            gtx.beginPath();
            gtx.arc(x, y, star.size, 0, Math.PI * 2);
            gtx.fillStyle = `rgba(190, 215, 255, ${alpha.toFixed(3)})`;
            gtx.fill();
          });
        }

        /* Poeira estelar: rastro que o cursor deixa ao se mover */
        for (let i = dust.length - 1; i >= 0; i -= 1) {
          const p = dust[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          if (p.life <= 0) {
            dust.splice(i, 1);
            continue;
          }
          gtx.beginPath();
          gtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          gtx.fillStyle = `rgba(166, 200, 255, ${(p.life * 0.65).toFixed(3)})`;
          gtx.fill();
        }

        window.requestAnimationFrame(drawGalaxy);
      };

      drawGalaxy();
    }
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

      const LINK_DIST = 140;
      const MOUSE_DIST = 220;

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
        const count = Math.min(Math.round((width * height) / 11500), 110);
        particles = [];
        for (let i = 0; i < count; i += 1) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.34,
            vy: (Math.random() - 0.5) * 0.34,
            r: Math.random() * 2 + 0.8
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
          ctx.fillStyle = 'rgba(115, 168, 255, 0.65)';
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
              ctx.strokeStyle = `rgba(115, 168, 255, ${(1 - dist / LINK_DIST) * 0.22})`;
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

        /* O glow do cursor fica por conta da galáxia global —
           aqui só a constelação e as ligações até o mouse. */

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
