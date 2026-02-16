/* =============================================================
   PORTFOLIO — Main JavaScript
   Author: Yahya Boukhmira
   Description: Theme toggle, scroll animations, GitHub API,
                mobile nav, smooth scroll, and stat counters.
   ============================================================= */

(function () {
  'use strict';

  // ========================
  // CONSTANTS
  // ========================
  const GITHUB_USERNAME = 'Tweakkin';
  const GITHUB_API = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`;

  // Repos to exclude from the project grid (profile readme, github.io page, etc.)
  const EXCLUDED_REPOS = ['Tweakkin', 'Tweakkin.github.io'];

  // Maximum number of project cards to display
  const MAX_PROJECTS = 6;

  // ========================
  // DOM REFERENCES
  // ========================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const themeToggle = $('#theme-toggle');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobile-menu');
  const navbar = $('#navbar');
  const projectsGrid = $('#projects-grid');
  const contactForm = $('#contact-form');


  // ========================
  // 1. THEME MANAGEMENT
  // ========================

  /**
   * Detects the user's preferred theme from localStorage or system preference.
   * Sets the [data-theme] attribute on <html>.
   */
  function initTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      // Respect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  /** Toggles between dark and light themes */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  themeToggle.addEventListener('click', toggleTheme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });


  // ========================
  // 2. MOBILE NAVIGATION
  // ========================

  /** Toggles the mobile hamburger menu */
  function toggleMobileMenu() {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileMenu.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  /** Closes the mobile menu */
  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', toggleMobileMenu);

  // Close mobile menu when a link is clicked
  $$('.mobile-menu__link').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });


  // ========================
  // 3. NAVBAR SCROLL EFFECTS
  // ========================

  /** Adds a shadow to the navbar on scroll and highlights the active section */
  function handleNavScroll() {
    const scrollY = window.scrollY;

    // Add shadow when scrolled
    if (scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Highlight active nav link based on scroll position
    const sections = $$('section[id]');
    const navLinks = $$('.navbar__link');
    const navHeight = navbar.offsetHeight + 100;

    let currentSection = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - navHeight;
      if (scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });


  // ========================
  // 4. SCROLL ANIMATIONS
  // ========================

  /**
   * Uses IntersectionObserver to trigger CSS animations
   * when elements enter the viewport.
   */
  function initScrollAnimations() {
    const animatedElements = $$('.animate-on-scroll');

    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements immediately
      animatedElements.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  }


  // ========================
  // 5. STAT COUNTER ANIMATION
  // ========================

  /**
   * Animates stat numbers counting up from 0 to their target value.
   */
  function initStatCounters() {
    const statNumbers = $$('.stat-card__number[data-count]');

    if (!('IntersectionObserver' in window)) {
      statNumbers.forEach((el) => {
        el.textContent = el.getAttribute('data-count');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = parseInt(entry.target.getAttribute('data-count'), 10);
            animateCount(entry.target, 0, target, 1200);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNumbers.forEach((el) => observer.observe(el));
  }

  /**
   * Smoothly animates a number from `start` to `end`.
   * @param {HTMLElement} element - The DOM element to update
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} duration - Animation duration in ms
   */
  function animateCount(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }


  // ========================
  // 6. GITHUB PROJECTS
  // ========================

  /**
   * Fetches repositories from the GitHub API and renders project cards.
   */
  async function loadGitHubProjects() {
    try {
      const response = await fetch(GITHUB_API);

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const repos = await response.json();

      // Filter out excluded repos and forks, sort by stars then by updated date
      const filteredRepos = repos
        .filter((repo) => !EXCLUDED_REPOS.includes(repo.name) && !repo.fork)
        .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, MAX_PROJECTS);

      renderProjects(filteredRepos);
    } catch (error) {
      console.error('Failed to load GitHub projects:', error);
      renderProjectsFallback();
    }
  }

  /**
   * Renders project cards from GitHub repo data.
   * @param {Array} repos - Array of GitHub repo objects
   */
  function renderProjects(repos) {
    projectsGrid.innerHTML = repos
      .map((repo) => {
        const langClass = getLangClass(repo.language);
        const description = repo.description || 'No description provided.';

        return `
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer"
             class="project-card animate-on-scroll slide-up" style="--delay: ${repos.indexOf(repo) * 0.08}s">
            <div class="project-card__header">
              <div class="project-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div class="project-card__external">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
            </div>
            <h3 class="project-card__title">${formatRepoName(repo.name)}</h3>
            <p class="project-card__description">${escapeHTML(description)}</p>
            <div class="project-card__footer">
              ${repo.language ? `
                <span class="project-card__lang">
                  <span class="lang-dot ${langClass}"></span>
                  ${repo.language}
                </span>
              ` : '<span></span>'}
              <span class="project-card__stars">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                ${repo.stargazers_count}
              </span>
            </div>
          </a>
        `;
      })
      .join('');

    // Re-observe the new cards for scroll animation
    initScrollAnimations();
  }

  /**
   * Renders fallback project cards when the GitHub API is unavailable.
   */
  function renderProjectsFallback() {
    const fallbackProjects = [
      { name: 'Dating-program', description: 'A school project that I really did put time and effort into.', language: 'C++', stars: 1 },
      { name: 'Who_threw_rocks', description: 'Who Threw Rocks? is an exciting arcade-style survival game built with Python and Pygame.', language: 'Python', stars: 1 },
      { name: 'So_Long_1337', description: '2D game project built with MiniLibX as part of the 42 curriculum.', language: 'C', stars: 1 },
      { name: 'push_swap_1337', description: 'Sorting algorithm optimization project from the 42 curriculum.', language: 'C', stars: 0 },
      { name: 'Python_FreeCodeCamp', description: 'Scientific Computing with Python certification projects.', language: 'Python', stars: 1 },
      { name: 'A-Maze-ing', description: 'Maze generation and solving project built with Python.', language: 'Python', stars: 0 },
    ];

    projectsGrid.innerHTML = fallbackProjects
      .map((repo, index) => {
        const langClass = getLangClass(repo.language);
        return `
          <a href="https://github.com/${GITHUB_USERNAME}/${repo.name}" target="_blank" rel="noopener noreferrer"
             class="project-card animate-on-scroll slide-up" style="--delay: ${index * 0.08}s">
            <div class="project-card__header">
              <div class="project-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div class="project-card__external">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
            </div>
            <h3 class="project-card__title">${formatRepoName(repo.name)}</h3>
            <p class="project-card__description">${escapeHTML(repo.description)}</p>
            <div class="project-card__footer">
              <span class="project-card__lang">
                <span class="lang-dot ${langClass}"></span>
                ${repo.language}
              </span>
              <span class="project-card__stars">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                ${repo.stars}
              </span>
            </div>
          </a>
        `;
      })
      .join('');

    initScrollAnimations();
  }

  /**
   * Returns a CSS class for the language dot color.
   * @param {string|null} language
   * @returns {string}
   */
  function getLangClass(language) {
    if (!language) return 'lang-dot--default';
    const map = {
      C: 'lang-dot--c',
      'C++': 'lang-dot--cpp',
      Python: 'lang-dot--python',
      Shell: 'lang-dot--shell',
      JavaScript: 'lang-dot--javascript',
      HTML: 'lang-dot--html',
    };
    return map[language] || 'lang-dot--default';
  }

  /**
   * Formats a repo name into a human-readable title.
   * e.g., "push_swap_1337" → "Push Swap 1337"
   * @param {string} name
   * @returns {string}
   */
  function formatRepoName(name) {
    return name
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Escapes HTML entities to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  // ========================
  // 7. CONTACT FORM
  // ========================

  /**
   * Handles the contact form submission.
   * Falls back to mailto: if Formspree isn't configured.
   */
  function initContactForm() {
    if (!contactForm) return;

    contactForm.addEventListener('submit', function (e) {
      const action = contactForm.getAttribute('action');

      // If Formspree isn't configured, use mailto fallback
      if (!action || action.includes('yourformid')) {
        e.preventDefault();

        const name = $('#name').value;
        const email = $('#email').value;
        const message = $('#message').value;

        const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);

        window.location.href = `mailto:contact@yahyaboukhira.com?subject=${subject}&body=${body}`;
      }
      // Otherwise, let Formspree handle it naturally
    });
  }


  // ========================
  // 8. SMOOTH SCROLL (fallback)
  // ========================

  /**
   * Adds smooth scroll behavior for anchor links
   * (supplements CSS scroll-behavior for older browsers).
   */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = $(targetId);
        if (target) {
          e.preventDefault();
          const offset = navbar.offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });
        }
      });
    });
  }


  // ========================
  // INITIALIZATION
  // ========================

  function init() {
    initTheme();
    initScrollAnimations();
    initStatCounters();
    initSmoothScroll();
    initContactForm();
    loadGitHubProjects();

    // Run scroll handler once on load to set initial state
    handleNavScroll();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
