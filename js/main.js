/* =============================================================
   PORTFOLIO — Main JavaScript
   Author: Yahya Boukhmira
   Description: Theme toggle, scroll animations, GitHub API,
				mobile nav, smooth scroll, stat counters, toast
				notifications, blog, contact form, and more.
   ============================================================= */

(function () {
	'use strict';

	// ========================
	// CONSTANTS
	// ========================
	const GITHUB_USERNAME = 'Tweakkin';
	const GITHUB_API = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;
	const GITHUB_USER_API = `https://api.github.com/users/${GITHUB_USERNAME}`;
	const GITHUB_EVENTS_API = `https://api.github.com/users/${GITHUB_USERNAME}/events/public`;
	const GITHUB_CONTRIBUTIONS_API = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}`;

	// Repos to exclude from the project grid
	const EXCLUDED_REPOS = ['Tweakkin', 'Tweakkin.github.io'];

	// Maximum number of project cards to display
	const MAX_PROJECTS = 6;

	// Toast auto-dismiss time
	const TOAST_DURATION = 5000;

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
	const toastContainer = $('#toast-container');
	const blogGrid = $('#blog-grid');
	const blogModal = $('#blog-modal');
	const blogModalBody = $('#blog-modal-body');
	const blogModalClose = $('#blog-modal-close');

	let navSections = [];
	let navLinks = [];
	let navScrollQueued = false;
	let markedLoadPromise = null;


	// ========================
	// 1. TOAST NOTIFICATION SYSTEM
	// ========================

	/** Toast counter for unique IDs */
	let toastCounter = 0;

	/**
	 * Shows a toast notification.
	 * @param {string} message - The toast message
	 * @param {'success'|'error'|'info'} type - Toast type
	 * @param {number} duration - Duration in ms (default 5000)
	 */
	function showToast(message, type, duration) {
		if (typeof type === 'undefined') type = 'info';
		if (typeof duration === 'undefined') duration = TOAST_DURATION;

		toastCounter++;
		var id = 'toast-' + toastCounter;

		var iconSVG = '';
		if (type === 'success') {
			iconSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="20 6 9 17 4 12"></polyline></svg>';
		} else if (type === 'error') {
			iconSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
		} else {
			iconSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
		}

		var toast = document.createElement('div');
		toast.className = 'toast toast--' + type;
		toast.id = id;
		toast.setAttribute('role', 'alert');
		toast.innerHTML =
			'<div class="toast__icon">' + iconSVG + '</div>' +
			'<p class="toast__message">' + escapeHTML(message) + '</p>' +
			'<button class="toast__close" aria-label="Dismiss">&times;</button>' +
			'<div class="toast__progress" style="animation-duration: ' + duration + 'ms"></div>';

		toastContainer.appendChild(toast);

		// Trigger entrance animation
		requestAnimationFrame(function () {
			toast.classList.add('toast--visible');
		});

		// Close button
		toast.querySelector('.toast__close').addEventListener('click', function () {
			dismissToast(id);
		});

		// Auto-dismiss
		setTimeout(function () {
			dismissToast(id);
		}, duration);
	}

	/**
	 * Dismisses a toast by ID.
	 * @param {string} id
	 */
	function dismissToast(id) {
		var toast = document.getElementById(id);
		if (!toast) return;
		toast.classList.remove('toast--visible');
		toast.classList.add('toast--exit');
		setTimeout(function () {
			if (toast.parentNode) toast.parentNode.removeChild(toast);
		}, 300);
	}


	// ========================
	// 2. THEME MANAGEMENT
	// ========================

	function initTheme() {
		var stored = localStorage.getItem('theme');
		if (stored) {
			document.documentElement.setAttribute('data-theme', stored);
		} else {
			var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
		}
	}

	function toggleTheme() {
		var current = document.documentElement.getAttribute('data-theme');
		var next = current === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', next);
		localStorage.setItem('theme', next);
	}

	themeToggle.addEventListener('click', toggleTheme);

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
		if (!localStorage.getItem('theme')) {
			document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
		}
	});


	// ========================
	// 3. MOBILE NAVIGATION
	// ========================

	function toggleMobileMenu() {
		var isOpen = mobileMenu.classList.toggle('open');
		hamburger.classList.toggle('active');
		hamburger.setAttribute('aria-expanded', isOpen);
		mobileMenu.setAttribute('aria-hidden', !isOpen);
		document.body.style.overflow = isOpen ? 'hidden' : '';
	}

	function closeMobileMenu() {
		mobileMenu.classList.remove('open');
		hamburger.classList.remove('active');
		hamburger.setAttribute('aria-expanded', 'false');
		mobileMenu.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
	}

	hamburger.addEventListener('click', toggleMobileMenu);

	$$('.mobile-menu__link').forEach(function (link) {
		link.addEventListener('click', closeMobileMenu);
	});


	// ========================
	// 4. NAVBAR SCROLL EFFECTS
	// ========================

	function refreshNavTargets() {
		navSections = Array.prototype.slice.call($$('section[id]'));
		navLinks = Array.prototype.slice.call($$('.navbar__link'));
	}

	function handleNavScroll() {
		var scrollY = window.scrollY;

		if (scrollY > 20) {
			navbar.classList.add('scrolled');
		} else {
			navbar.classList.remove('scrolled');
		}

		if (!navSections.length || !navLinks.length) refreshNavTargets();

		var navHeight = navbar.offsetHeight + 100;
		var currentSection = '';

		navSections.forEach(function (section) {
			var sectionTop = section.offsetTop - navHeight;
			if (scrollY >= sectionTop) {
				currentSection = section.getAttribute('id');
			}
		});

		navLinks.forEach(function (link) {
			link.classList.remove('active');
			if (link.getAttribute('href') === '#' + currentSection) {
				link.classList.add('active');
			}
		});
	}

	function scheduleNavScroll() {
		if (navScrollQueued) return;
		navScrollQueued = true;
		requestAnimationFrame(function () {
			navScrollQueued = false;
			handleNavScroll();
		});
	}

	window.addEventListener('scroll', scheduleNavScroll, { passive: true });
	window.addEventListener('resize', refreshNavTargets);


	// ========================
	// 5. SCROLL ANIMATIONS
	// ========================

	function initScrollAnimations() {
		var animatedElements = $$('.animate-on-scroll:not(.visible)');

		if (!('IntersectionObserver' in window)) {
			animatedElements.forEach(function (el) { el.classList.add('visible'); });
			return;
		}

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
		);

		animatedElements.forEach(function (el) { observer.observe(el); });
	}


	// ========================
	// 6. STAT COUNTER ANIMATION
	// ========================

	function initStatCounters() {
		var statNumbers = $$('.stat-card__number[data-count]');

		if (!('IntersectionObserver' in window)) {
			statNumbers.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
			return;
		}

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						var target = parseInt(entry.target.getAttribute('data-count'), 10);
						animateCount(entry.target, 0, target, 1200);
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.5 }
		);

		statNumbers.forEach(function (el) { observer.observe(el); });
	}

	function animateCount(element, start, end, duration) {
		var startTime = performance.now();

		function update(currentTime) {
			var elapsed = currentTime - startTime;
			var progress = Math.min(elapsed / duration, 1);
			var eased = 1 - Math.pow(1 - progress, 3);
			var current = Math.round(start + (end - start) * eased);
			element.textContent = current;
			if (progress < 1) requestAnimationFrame(update);
		}

		requestAnimationFrame(update);
	}


	// ========================
	// 7. LIVE GITHUB STATS
	// ========================

	/**
	 * Fetches live GitHub stats and updates the stat cards.
	 */
	async function loadLiveGitHubStats() {
		try {
			// Fetch user profile and repos in parallel
			var results = await Promise.allSettled([
				fetch(GITHUB_USER_API).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
				fetch(GITHUB_API).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
				fetch(GITHUB_CONTRIBUTIONS_API).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
			]);

			// Public repos count
			if (results[0].status === 'fulfilled') {
				var userData = results[0].value;
				var repoCount = userData.public_repos || 14;
				var statRepos = $('#stat-repos');
				if (statRepos) statRepos.setAttribute('data-count', repoCount);
			}

			// Unique languages count
			if (results[1].status === 'fulfilled') {
				var repos = results[1].value;
				var languages = new Set();
				repos.forEach(function (repo) {
					if (repo.language) languages.add(repo.language);
				});
				var langCount = languages.size || 5;
				var statLangs = $('#stat-languages');
				if (statLangs) statLangs.setAttribute('data-count', langCount);
			}

			// Contributions count (all years)
			if (results[2].status === 'fulfilled') {
				var contribData = results[2].value;
				var totalContribs = 0;
				if (contribData.total) {
					// Sum all years
					totalContribs = Object.values(contribData.total).reduce(function (sum, val) { return sum + val; }, 0);
				}
				var statContribs = $('#stat-contributions');
				if (statContribs) statContribs.setAttribute('data-count', totalContribs);
			}
		} catch (error) {
			console.error('Failed to load GitHub stats:', error);
		}
	}


	// ========================
	// 8. CURRENTLY WORKING ON
	// ========================

	/**
	 * Fetches the latest public event from GitHub and displays it.
	 */
	async function loadCurrentActivity() {
		var activityEl = $('#current-activity');
		if (!activityEl) return;

		try {
			var response = await fetch(GITHUB_EVENTS_API);
			if (!response.ok) throw new Error('Events API returned ' + response.status);

			var events = await response.json();

			// Find the most recent PushEvent or CreateEvent
			var relevantEvent = null;
			for (var i = 0; i < events.length; i++) {
				var evt = events[i];
				if (evt.type === 'PushEvent' || evt.type === 'CreateEvent' || evt.type === 'PullRequestEvent') {
					relevantEvent = evt;
					break;
				}
			}

			if (!relevantEvent) {
				activityEl.querySelector('.currently-working__text').textContent = 'Exploring new projects...';
				activityEl.querySelector('.currently-working__time').textContent = '';
				return;
			}

			var repoName = relevantEvent.repo.name.split('/')[1] || relevantEvent.repo.name;
			var message = '';
			var timeAgo = getTimeAgo(new Date(relevantEvent.created_at));

			if (relevantEvent.type === 'PushEvent' && relevantEvent.payload.commits && relevantEvent.payload.commits.length > 0) {
				message = relevantEvent.payload.commits[0].message.split('\n')[0]; // first line only
			} else if (relevantEvent.type === 'CreateEvent') {
				message = 'Created ' + (relevantEvent.payload.ref_type || 'repository');
			} else if (relevantEvent.type === 'PullRequestEvent') {
				message = relevantEvent.payload.pull_request.title || 'Pull request activity';
			}

			activityEl.querySelector('.currently-working__text').innerHTML =
				'Currently working on: <strong>' + escapeHTML(repoName) + '</strong>' +
				(message ? ' \u2014 ' + escapeHTML(message) : '');
			activityEl.querySelector('.currently-working__time').textContent = timeAgo;

		} catch (error) {
			console.error('Failed to load current activity:', error);
			activityEl.querySelector('.currently-working__text').textContent = 'Building something awesome...';
			activityEl.querySelector('.currently-working__time').textContent = '';
		}
	}

	/**
	 * Returns a human-readable "time ago" string.
	 * @param {Date} date
	 * @returns {string}
	 */
	function getTimeAgo(date) {
		var seconds = Math.floor((new Date() - date) / 1000);
		if (seconds < 60) return 'just now';
		var minutes = Math.floor(seconds / 60);
		if (minutes < 60) return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
		var hours = Math.floor(minutes / 60);
		if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
		var days = Math.floor(hours / 24);
		if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
		var months = Math.floor(days / 30);
		return months + (months === 1 ? ' month ago' : ' months ago');
	}


	// ========================
	// 9. GITHUB PROJECTS
	// ========================

	async function loadGitHubProjects() {
		try {
			var response = await fetch(GITHUB_API);
			if (!response.ok) throw new Error('GitHub API returned ' + response.status);

			var repos = await response.json();

			var filteredRepos = repos
				.filter(function (repo) { return !EXCLUDED_REPOS.includes(repo.name) && !repo.fork; })
				.sort(function (a, b) { return b.stargazers_count - a.stargazers_count || new Date(b.updated_at) - new Date(a.updated_at); })
				.slice(0, MAX_PROJECTS);

			renderProjects(filteredRepos);
		} catch (error) {
			console.error('Failed to load GitHub projects:', error);
			renderProjectsFallback();
		}
	}

	function renderProjects(repos) {
		projectsGrid.innerHTML = repos
			.map(function (repo, index) {
				var langClass = getLangClass(repo.language);
				var description = repo.description || 'No description provided.';

				return '<a href="' + repo.html_url + '" target="_blank" rel="noopener noreferrer" ' +
					'class="project-card animate-on-scroll slide-up" style="--delay: ' + (index * 0.08) + 's">' +
					'<div class="project-card__header">' +
					'<div class="project-card__icon">' +
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' +
					'</div>' +
					'<div class="project-card__external">' +
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>' +
					'</div>' +
					'</div>' +
					'<h3 class="project-card__title">' + formatRepoName(repo.name) + '</h3>' +
					'<p class="project-card__description">' + escapeHTML(description) + '</p>' +
					'<div class="project-card__footer">' +
					(repo.language
						? '<span class="project-card__lang"><span class="lang-dot ' + langClass + '"></span>' + repo.language + '</span>'
						: '<span></span>') +
					'<span class="project-card__stars">' +
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' +
					repo.stargazers_count +
					'</span>' +
					'</div>' +
					'</a>';
			})
			.join('');

		initScrollAnimations();
	}

	function renderProjectsFallback() {
		var fallbackProjects = [
			{ name: 'Dating-program', description: 'A school project that I really did put time and effort into.', language: 'C++', stars: 1 },
			{ name: 'Who_threw_rocks', description: 'Who Threw Rocks? is an exciting arcade-style survival game built with Python and Pygame.', language: 'Python', stars: 1 },
			{ name: 'So_Long_1337', description: '2D game project built with MiniLibX as part of the 42 curriculum.', language: 'C', stars: 1 },
			{ name: 'push_swap_1337', description: 'Sorting algorithm optimization project from the 42 curriculum.', language: 'C', stars: 0 },
			{ name: 'Python_FreeCodeCamp', description: 'Scientific Computing with Python certification projects.', language: 'Python', stars: 1 },
			{ name: 'A-Maze-ing', description: 'Maze generation and solving project built with Python.', language: 'Python', stars: 0 },
		];

		projectsGrid.innerHTML = fallbackProjects
			.map(function (repo, index) {
				var langClass = getLangClass(repo.language);
				return '<a href="https://github.com/' + GITHUB_USERNAME + '/' + repo.name + '" target="_blank" rel="noopener noreferrer" ' +
					'class="project-card animate-on-scroll slide-up" style="--delay: ' + (index * 0.08) + 's">' +
					'<div class="project-card__header">' +
					'<div class="project-card__icon">' +
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' +
					'</div>' +
					'<div class="project-card__external">' +
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>' +
					'</div>' +
					'</div>' +
					'<h3 class="project-card__title">' + formatRepoName(repo.name) + '</h3>' +
					'<p class="project-card__description">' + escapeHTML(repo.description) + '</p>' +
					'<div class="project-card__footer">' +
					'<span class="project-card__lang"><span class="lang-dot ' + langClass + '"></span>' + repo.language + '</span>' +
					'<span class="project-card__stars">' +
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' +
					repo.stars +
					'</span>' +
					'</div>' +
					'</a>';
			})
			.join('');

		initScrollAnimations();
	}

	function getLangClass(language) {
		if (!language) return 'lang-dot--default';
		var map = {
			C: 'lang-dot--c',
			'C++': 'lang-dot--cpp',
			Python: 'lang-dot--python',
			Shell: 'lang-dot--shell',
			JavaScript: 'lang-dot--javascript',
			HTML: 'lang-dot--html',
		};
		return map[language] || 'lang-dot--default';
	}

	function formatRepoName(name) {
		return name
			.replace(/[_-]/g, ' ')
			.replace(/\b\w/g, function (char) { return char.toUpperCase(); });
	}

	function escapeHTML(str) {
		var div = document.createElement('div');
		div.textContent = str;
		return div.innerHTML;
	}


	// ========================
	// 10. CONTACT FORM (with validation, AJAX, toast)
	// ========================

	function initContactForm() {
		if (!contactForm) return;

		var submitBtn = $('#submit-btn');

		contactForm.addEventListener('submit', async function (e) {
			e.preventDefault();

			// Validate
			if (!validateForm()) return;

			var action = contactForm.getAttribute('action');
			var nameVal = $('#name').value.trim();
			var emailVal = $('#email').value.trim();
			var messageVal = $('#message').value.trim();

			// Show loading state
			setFormLoading(true);

			// Submitting via Web3Forms/Formspree AJAX API
			if (action && action.startsWith('http')) {
				try {
					var accessKeyEl = $('#access_key');
					var botcheckEl = $('#botcheck');
					var payload = { name: nameVal, email: emailVal, message: messageVal };
					
					if (accessKeyEl) {
						payload.access_key = accessKeyEl.value; // Required for Web3Forms
					}
					if (botcheckEl && botcheckEl.checked) {
						payload.botcheck = true; // Web3Forms will silently drop the email if this is true
					}

					var response = await fetch(action, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
						body: JSON.stringify(payload)
					});

					if (response.ok) {
						showToast('Message sent successfully! I\'ll get back to you soon.', 'success');
						contactForm.reset();
						clearFormErrors();
					} else {
						var errData = await response.json().catch(function() { return {}; });
						throw new Error(errData.message || 'API Error');
					}
				} catch (error) {
					console.error('API submission failed, falling back to mailto:', error);
					showToast('Form service unavailable. Opening email client instead...', 'info');
					mailtoFallback(nameVal, emailVal, messageVal);
				}
			} else {
				// Mailto fallback
				mailtoFallback(nameVal, emailVal, messageVal);
				showToast('Opening your email client...', 'info');
			}

			setFormLoading(false);
		});

		// Live validation on blur
		['name', 'email', 'message'].forEach(function (fieldId) {
			var field = $('#' + fieldId);
			if (field) {
				field.addEventListener('blur', function () { validateField(fieldId); });
				field.addEventListener('input', function () {
					var errorEl = $('#' + fieldId + '-error');
					if (errorEl && errorEl.textContent) validateField(fieldId);
				});
			}
		});
	}

	function validateForm() {
		var valid = true;
		if (!validateField('name')) valid = false;
		if (!validateField('email')) valid = false;
		if (!validateField('message')) valid = false;
		return valid;
	}

	function validateField(fieldId) {
		var field = $('#' + fieldId);
		var errorEl = $('#' + fieldId + '-error');
		if (!field || !errorEl) return true;

		var value = field.value.trim();
		var errorMsg = '';

		if (fieldId === 'name') {
			if (!value) errorMsg = 'Please enter your name.';
			else if (value.length < 2) errorMsg = 'Name must be at least 2 characters.';
		} else if (fieldId === 'email') {
			if (!value) errorMsg = 'Please enter your email.';
			else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMsg = 'Please enter a valid email address.';
		} else if (fieldId === 'message') {
			if (!value) errorMsg = 'Please enter a message.';
			else if (value.length < 10) errorMsg = 'Message must be at least 10 characters.';
		}

		errorEl.textContent = errorMsg;
		field.classList.toggle('form-input--error', !!errorMsg);
		return !errorMsg;
	}

	function clearFormErrors() {
		['name', 'email', 'message'].forEach(function (id) {
			var err = $('#' + id + '-error');
			if (err) err.textContent = '';
			var field = $('#' + id);
			if (field) field.classList.remove('form-input--error');
		});
	}

	function setFormLoading(loading) {
		var submitBtn = $('#submit-btn');
		if (!submitBtn) return;
		submitBtn.disabled = loading;
		submitBtn.classList.toggle('btn--loading', loading);
	}

	function mailtoFallback(name, email, message) {
		var subject = encodeURIComponent('Portfolio Contact from ' + name);
		var body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message);
		var gmailUrl = 'https://mail.google.com/mail/?view=cm&to=yahyaboukhmira7@gmail.com&su=' + subject + '&body=' + body;
		window.open(gmailUrl, '_blank');
	}


	// ========================
	// 11. BLOG SECTION
	// ========================

	/**
	 * Fetches blog/posts.json and renders blog cards.
	 */
	async function loadBlogPosts() {
		if (!blogGrid) return;

		try {
			var response = await fetch('blog/posts.json');
			if (!response.ok) throw new Error('Blog posts not found');
			var posts = await response.json();
			renderBlogPosts(posts);
		} catch (error) {
			console.error('Failed to load blog posts:', error);
			blogGrid.innerHTML = '<p class="blog__empty">Blog posts coming soon...</p>';
		}
	}

	function renderBlogPosts(posts) {
		blogGrid.innerHTML = posts.map(function (post, index) {
			var dateStr = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
			var tagsHTML = post.tags.map(function (tag) {
				return '<span class="skill-tag skill-tag--sm">' + escapeHTML(tag) + '</span>';
			}).join('');

			return '<button class="blog-card animate-on-scroll slide-up" style="--delay: ' + (index * 0.1) + 's" ' +
				'data-slug="' + escapeHTML(post.slug) + '" ' + (post.externalUrl ? 'data-url="' + escapeHTML(post.externalUrl) + '" ' : '') + 'aria-label="Read ' + escapeHTML(post.title) + '">' +
				'<div class="blog-card__header">' +
				'<span class="blog-card__date">' +
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' +
				dateStr +
				'</span>' +
				'<div class="blog-card__icon">' +
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>' +
				'</div>' +
				'</div>' +
				'<h3 class="blog-card__title">' + escapeHTML(post.title) + '</h3>' +
				'<p class="blog-card__excerpt">' + escapeHTML(post.excerpt) + '</p>' +
				'<div class="blog-card__tags">' + tagsHTML + '</div>' +
				'<span class="blog-card__read-more">Read more &rarr;</span>' +
				'</button>';
		}).join('');

		initScrollAnimations();

		// Attach click handlers
		$$('.blog-card').forEach(function (card) {
			card.addEventListener('click', function () {
				var url = this.getAttribute('data-url');
				if (url) {
					window.open(url, '_blank');
				} else {
					var slug = this.getAttribute('data-slug');
					openBlogPost(slug);
				}
			});
		});
	}

	/**
	 * Opens a blog post in the modal overlay.
	 * @param {string} slug
	 */
	async function openBlogPost(slug) {
		if (!blogModal || !blogModalBody) return;

		blogModalBody.innerHTML = '<div class="blog-modal__loading"><div class="btn__spinner btn__spinner--large"></div><p>Loading post...</p></div>';
		blogModal.classList.add('blog-modal--open');
		blogModal.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';

		try {
			var response = await fetch('blog/' + slug + '.md');
			if (!response.ok) throw new Error('Post not found');
			var markdown = await response.text();

			await loadMarked();
			marked.setOptions({
				breaks: true,
				gfm: true,
				headerIds: false,
				mangle: false
			});
			blogModalBody.innerHTML = '<div class="blog-modal__article">' + marked.parse(markdown) + '</div>';
		} catch (error) {
			console.error('Failed to load blog post:', error);
			if (typeof markdown !== 'undefined') {
				blogModalBody.innerHTML = '<pre class="blog-modal__raw">' + escapeHTML(markdown) + '</pre>';
			} else {
				blogModalBody.innerHTML = '<p class="blog-modal__error">Failed to load blog post. Please try again.</p>';
				showToast('Failed to load blog post.', 'error');
			}
		}
	}

	function loadMarked() {
		if (typeof marked !== 'undefined') return Promise.resolve();
		if (markedLoadPromise) return markedLoadPromise;

		markedLoadPromise = new Promise(function (resolve, reject) {
			var script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
			script.async = true;
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});

		return markedLoadPromise;
	}

	function closeBlogModal() {
		if (!blogModal) return;
		blogModal.classList.remove('blog-modal--open');
		blogModal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
	}

	if (blogModalClose) {
		blogModalClose.addEventListener('click', closeBlogModal);
	}

	if (blogModal) {
		blogModal.querySelector('.blog-modal__overlay').addEventListener('click', closeBlogModal);

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && blogModal.classList.contains('blog-modal--open')) {
				closeBlogModal();
			}
		});
	}


	// ========================
	// 12. RESUME DOWNLOAD COUNTER
	// ========================

	function initResumeDownload() {
		var resumeBtn = $('#resume-btn');
		var badge = $('#download-badge');
		if (!resumeBtn || !badge) return;

		// Load count from localStorage
		var count = parseInt(localStorage.getItem('resume_downloads') || '0', 10);
		badge.textContent = count;

		resumeBtn.addEventListener('click', function () {
			count++;
			localStorage.setItem('resume_downloads', count.toString());
			badge.textContent = count;
			showToast('Resume download started!', 'success');
		});
	}


	// ========================
	// 13. FOOTER LAST UPDATED
	// ========================

	/**
	 * Fetches the last commit date from GitHub to show "Last updated".
	 */
	async function loadLastUpdated() {
		var el = $('#footer-updated');
		if (!el) return;

		try {
			var response = await fetch('https://api.github.com/repos/' + GITHUB_USERNAME + '/Portofolio/commits?per_page=1');
			if (!response.ok) throw new Error('API error');
			var commits = await response.json();
			if (commits.length > 0) {
				var date = new Date(commits[0].commit.committer.date);
				el.textContent = 'Last updated: ' + date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
			} else {
				el.textContent = 'Last updated: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
			}
		} catch (error) {
			el.textContent = 'Last updated: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
		}
	}


	// ========================
	// 14. SMOOTH SCROLL (fallback)
	// ========================

	function initSmoothScroll() {
		$$('a[href^="#"]').forEach(function (anchor) {
			anchor.addEventListener('click', function (e) {
				var targetId = this.getAttribute('href');
				if (targetId === '#') return;

				var target = $(targetId);
				if (target) {
					e.preventDefault();
					var offset = navbar.offsetHeight;
					var targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

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
		refreshNavTargets();
		initScrollAnimations();
		initSmoothScroll();
		initContactForm();
		initResumeDownload();

		// Load live data (don't block init)
		loadLiveGitHubStats().then(function () {
			// Init stat counters after live data is loaded
			initStatCounters();
		}).catch(function () {
			initStatCounters();
		});

		// loadGitHubProjects(); // Projects section is now static
		loadCurrentActivity();
		loadBlogPosts();
		loadLastUpdated();

		// Run scroll handler once on load
		handleNavScroll();
	}

	// Wait for DOM
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
