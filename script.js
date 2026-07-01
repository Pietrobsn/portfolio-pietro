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

  let scrollQueued = false;
  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 16);
    scrollQueued = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      window.requestAnimationFrame(updateHeader);
      scrollQueued = true;
    }
  }, { passive: true });
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
})();
