(function () {
  'use strict';

  /* ── DOM refs ─────────────────────────────────────────────── */
  const header    = document.querySelector('.header');
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  /* ── Header: scroll state ─────────────────────────────────── */
  function handleHeaderScroll() {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  /* ── Mobile nav ───────────────────────────────────────────── */
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('click', e => {
      if (navLinks.classList.contains('open') &&
          !navLinks.contains(e.target) &&
          !navToggle.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════════
     CONSTELAÇÃO DE PARTÍCULAS — segue o cursor no hero
     Canvas leve, atrás do conteúdo, pointer-events: none.
     Sutil de propósito: não compete com o texto.
  ══════════════════════════════════════════════════════════ */
  (function initParticles() {
    const canvas = document.getElementById('heroParticles');
    const hero   = document.querySelector('.hero');
    if (!canvas || !hero) return;

    /* Com reduced-motion: partículas ficam paradas (sem deriva
       autônoma), mas ainda reagem ao cursor — interação direta
       do usuário, não animação decorativa de fundo. */
    const drift = prefersReduced ? 0 : 1;

    const ctx = canvas.getContext('2d');
    let width, height, dpr;
    let particles = [];
    let raf = null;

    /* Posição do mouse (alvo) e versão suavizada que "persegue" */
    const mouse  = { x: -9999, y: -9999, active: false };
    const smooth = { x: -9999, y: -9999 };

    const LINK_DIST  = 125;   // distância máxima p/ ligar 2 partículas
    const MOUSE_DIST = 210;   // raio de influência do cursor

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width  = hero.offsetWidth;
      height = hero.offsetHeight;
      canvas.width  = width  * dpr;
      canvas.height = height * dpr;
      canvas.style.width  = width  + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }

    function buildParticles() {
      /* Densidade proporcional à área, com teto p/ performance */
      const count = Math.min(Math.round((width * height) / 13000), 120);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25 * drift,
          vy: (Math.random() - 0.5) * 0.25 * drift,
          r: Math.random() * 1.6 + 0.6
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      /* Suaviza o movimento do "cursor" (efeito de perseguição) */
      smooth.x += (mouse.x - smooth.x) * 0.08;
      smooth.y += (mouse.y - smooth.y) * 0.08;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        /* Deriva natural */
        p.x += p.vx;
        p.y += p.vy;

        /* Wrap nas bordas */
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        /* Atração suave em direção ao cursor quando perto */
        if (mouse.active) {
          const dx = smooth.x - p.x;
          const dy = smooth.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_DIST && dist > 0.5) {
            const force = (1 - dist / MOUSE_DIST) * 0.6;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        /* Ponto */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79,142,247,0.55)';
        ctx.fill();

        /* Linhas entre partículas próximas */
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(79,142,247,${(1 - dist / LINK_DIST) * 0.18})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        /* Linha da partícula até o cursor (destaque ao redor do mouse) */
        if (mouse.active) {
          const dx = p.x - smooth.x;
          const dy = p.y - smooth.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_DIST) {
            const k = 1 - dist / MOUSE_DIST;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(smooth.x, smooth.y);
            ctx.strokeStyle = `rgba(79,142,247,${k * 0.5})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            /* Partícula perto do cursor "acende" um pouco */
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r + k * 1.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(120,170,255,${k * 0.6})`;
            ctx.fill();
          }
        }
      }

      /* Halo suave que segue o cursor — feedback visível de
         "algo te acompanha", sem ofuscar o conteúdo */
      if (mouse.active) {
        const grad = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, 90);
        grad.addColorStop(0, 'rgba(79,142,247,0.18)');
        grad.addColorStop(1, 'rgba(79,142,247,0)');
        ctx.beginPath();
        ctx.arc(smooth.x, smooth.y, 90, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        /* Núcleo do cursor */
        ctx.beginPath();
        ctx.arc(smooth.x, smooth.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120,170,255,0.9)';
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    /* O cursor é rastreado em toda a janela, mas convertido p/
       coordenadas do hero — o efeito vive só dentro dele */
    function onMove(e) {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = mouse.y >= 0 && mouse.y <= rect.height;
      if (smooth.x < -9000) { smooth.x = mouse.x; smooth.y = mouse.y; }
    }
    function onLeave() { mouse.active = false; }

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);

    resize();
    draw();
  })();

  /* ══════════════════════════════════════════════════════════
     GSAP ANIMATIONS
     Estratégia: animamos os próprios .reveal elements (como
     o sistema CSS fazia), mas com GSAP para ter stagger real,
     spring e controle fino. Isso evita conflito de opacidade
     em elementos pai/filho.
  ══════════════════════════════════════════════════════════ */

  const gsapLoaded = typeof gsap !== 'undefined';
  const gsapReady  = gsapLoaded && !prefersReduced;

  if (!gsapReady) {
    /* Fallback sem animação */
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('.skill-bar').forEach(bar => bar.classList.add('animate'));
  }

  if (gsapReady) {
  gsap.registerPlugin(ScrollTrigger);

  /* 1. Estabelece estado inicial de TODOS os .reveal via GSAP
        (inline style sobrescreve a classe CSS — GSAP controla tudo) */
  gsap.set('.reveal', { opacity: 0, y: 28 });

  /* 2. Stack tags: estado inicial separado */
  gsap.set('.tag', { opacity: 0, y: 12, scale: 0.85 });

  /* ── HERO: timeline em cascata ───────────────────────────── */
  gsap.timeline({ delay: 0.1 })
    .to('.hero__badge',   { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' })
    .to('.hero__name',    { opacity: 1, y: 0, duration: 0.72, ease: 'power3.out' }, '-=0.38')
    .to('.hero__title',   { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, '-=0.44')
    .to('.hero__desc',    { opacity: 1, y: 0, duration: 0.52, ease: 'power3.out' }, '-=0.40')
    .to('.hero__actions', { opacity: 1, y: 0, duration: 0.5,  ease: 'power3.out' }, '-=0.38')
    .to('.hero__stack',   { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, '-=0.35')
    .to('.tag', {
      opacity: 1, y: 0, scale: 1,
      duration: 0.35, stagger: 0.05, ease: 'back.out(1.6)'
    }, '-=0.25');

  /* ── Seções: revela .reveal em stagger quando entra na tela ─ */
  document.querySelectorAll('section[id]:not(#inicio)').forEach(section => {
    const revEls = gsap.utils.toArray(section.querySelectorAll('.reveal'));
    if (!revEls.length) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top 78%',
      once: true,
      onEnter() {
        gsap.to(revEls, {
          opacity: 1,
          y: 0,
          duration: 0.62,
          stagger: 0.11,
          ease: 'power3.out'
        });

        /* Counter nos números do Sobre */
        if (section.id === 'sobre') scheduleCounters();

        /* Skill bars: dispara a animação CSS */
        if (section.id === 'habilidades') {
          setTimeout(() => {
            section.querySelectorAll('.skill-bar').forEach(b => b.classList.add('animate'));
          }, 350);
        }
      }
    });
  });

  /* ── COUNTER: anima os números nos cards do Sobre ────────────
     Chamado após .about__cards entrar na tela               */
  function scheduleCounters() {
    document.querySelectorAll('.about__card').forEach(card => {
      const numEl = card.querySelector('.about__card-number');
      if (!numEl) return;
      const text  = numEl.textContent.trim();
      const match = text.match(/^(\d+)(\+?)$/);
      if (!match) return;

      const target = parseInt(match[1], 10);
      const suffix = match[2] || '';
      const pad    = match[1].length;
      const obj    = { val: 0 };

      gsap.to(obj, {
        val: target,
        delay: 0.6,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate() {
          numEl.textContent = String(Math.ceil(obj.val)).padStart(pad, '0') + suffix;
        }
      });
    });
  }

  /* ── Section labels: linha decorativa animada ────────────── */
  document.querySelectorAll('.section__label').forEach(label => {
    ScrollTrigger.create({
      trigger: label,
      start: 'top 88%',
      once: true,
      onEnter() { label.classList.add('in-view'); }
    });
  });

  } /* fim if (gsapReady) */

  /* ══════════════════════════════════════════════════════════
     EFEITOS DE CURSOR — rodam SEMPRE que o GSAP carregou,
     mesmo com reduced-motion: são reações diretas ao input do
     usuário (hover/move), não animação decorativa autônoma.
  ══════════════════════════════════════════════════════════ */
  if (gsapLoaded) {

    /* ── 3D TILT nos cards de projeto ──────────────────────── */
    document.querySelectorAll('.project-card').forEach(card => {

      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -8, duration: 0.28, ease: 'power2.out' });
      });

      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const dx   = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
        const dy   = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);

        gsap.to(card, {
          rotateX: -dy * 9,
          rotateY:  dx * 9,
          transformPerspective: 900,
          duration: 0.2,
          ease: 'power2.out'
        });

        /* Glow circular segue o cursor */
        const gx = ((e.clientX - rect.left) / rect.width)  * 100;
        const gy = ((e.clientY - rect.top)  / rect.height) * 100;
        card.style.setProperty('--glow-x', `${gx}%`);
        card.style.setProperty('--glow-y', `${gy}%`);
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0, rotateY: 0, y: 0,
          duration: 0.65,
          ease: 'elastic.out(1, 0.5)'
        });
      });
    });

    /* ── MAGNETIC BUTTONS ──────────────────────────────────── */
    document.querySelectorAll('.btn--primary, .btn--ghost').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const dx   = e.clientX - (rect.left + rect.width  / 2);
        const dy   = e.clientY - (rect.top  + rect.height / 2);
        gsap.to(btn, { x: dx * 0.3, y: dy * 0.3, duration: 0.28, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' });
      });
    });

  } /* fim if (gsapLoaded) */

  /* ══════════════════════════════════════════════════════════
     SPOTLIGHTS DE CURSOR — um efeito diferente por seção.
     CSS puro acionado por JS leve (apenas atualiza variáveis
     --mx / --my / --sheen). Roda sempre: é reação ao cursor.
  ══════════════════════════════════════════════════════════ */

  /* Atualiza --mx / --my com a posição do cursor dentro do elemento.
     Usado pelo spotlight (Sobre), borda-glow (Habilidades) e
     glow colorido (Contato). */
  function trackPointer(el) {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top)  + 'px');
    }, { passive: true });
  }

  /* Sobre → spotlight preenchido */
  document.querySelectorAll('.about__card').forEach(trackPointer);

  /* Habilidades → borda iluminada que segue o cursor */
  document.querySelectorAll('.skill-group').forEach(trackPointer);

  /* Contato → glow na cor da rede social */
  document.querySelectorAll('.contact-card').forEach(trackPointer);

  /* Formação → reflexo de vidro (sheen) acompanha o cursor na horizontal */
  document.querySelectorAll('.education__card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 200 - 100; // -100% … 100%
      card.style.setProperty('--sheen', pct + '%');
    }, { passive: true });
  });

  /* ══════════════════════════════════════════════════════════
     PARALLAX DE CURSOR — as decorações de cada seção deslizam
     conforme o mouse, cada camada numa "profundidade" diferente.
     Dá sensação de 3D/vida. Lerp p/ suavidade. Roda sempre.
  ══════════════════════════════════════════════════════════ */
  (function initParallax() {
    const groups = [...document.querySelectorAll('[data-parallax]')].map(group => {
      const section = group.closest('section') || group;
      const items = [...group.querySelectorAll('.px')].map(el => ({
        el,
        depth: parseFloat(el.dataset.depth) || 3,
        cx: 0, cy: 0   // posição atual (suavizada)
      }));
      return { section, items, top: 0, height: 0, midX: 0 };
    });
    if (!groups.length) return;

    /* Cacheia geometria das seções (evita reflow por frame).
       Recalcula só quando o layout pode ter mudado. */
    function measure() {
      const sy = window.scrollY;
      groups.forEach(g => {
        const r = g.section.getBoundingClientRect();
        g.top    = r.top + sy;
        g.height = r.height;
        g.midX   = r.left + r.width / 2;
        g.width  = r.width;
      });
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    const pointer = { x: 0, y: 0, seen: false };
    window.addEventListener('mousemove', e => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.seen = true;
    }, { passive: true });

    const clamp = v => (v < -0.6 ? -0.6 : v > 0.6 ? 0.6 : v);

    function tick() {
      const sy = window.scrollY;
      const vh = window.innerHeight;
      groups.forEach(g => {
        const topRel = g.top - sy;                 // topo relativo à viewport
        /* Pula seções fora da tela */
        if (topRel + g.height < -50 || topRel > vh + 50) return;

        const cy = topRel + g.height / 2;
        const nx = pointer.seen ? clamp((pointer.x - g.midX) / g.width)  : 0;
        const ny = pointer.seen ? clamp((pointer.y - cy)     / g.height) : 0;

        g.items.forEach(it => {
          const tx = nx * it.depth * 16;
          const ty = ny * it.depth * 16;
          it.cx += (tx - it.cx) * 0.07;            // lerp (perseguição suave)
          it.cy += (ty - it.cy) * 0.07;
          it.el.style.transform = `translate(${it.cx.toFixed(2)}px, ${it.cy.toFixed(2)}px)`;
        });
      });
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ══════════════════════════════════════════════════════════
     NAVEGAÇÃO
  ══════════════════════════════════════════════════════════ */

  /* Active nav highlight */
  const navAnchors = document.querySelectorAll('.nav__link:not(.nav__link--cta)');
  const sections   = document.querySelectorAll('section[id]');

  function setActiveNav() {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 110) current = s.getAttribute('id');
    });
    navAnchors.forEach(link => {
      link.classList.toggle('nav__link--active', link.getAttribute('href') === `#${current}`);
    });
  }
  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();

  /* Smooth scroll com compensação do header fixo */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth'
      });
    });
  });

})();
