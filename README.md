# Yahya Boukhmira — Personal Portfolio

A modern, responsive single-page portfolio website built with **HTML**, **CSS**, and **vanilla JavaScript**. No frameworks — just clean, production-ready code.

![Portfolio Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Features

- **Single-Page Application** with smooth scroll navigation
- **Dark / Light Mode** toggle with system preference detection
- **Responsive Design** — mobile, tablet, and desktop
- **Scroll Animations** — fade-in, slide-up on viewport entry
- **Live GitHub Projects** — fetched from the GitHub API (repo name, description, language, stars)
- **Experience Timeline** — professional journey at a glance
- **Contact Form** — integrated with Formspree (or mailto fallback)
- **SEO-Optimized** — meta tags, Open Graph, semantic HTML
- **Accessible** — ARIA labels, keyboard navigation, skip links

---

## 📂 Project Structure

```
porto/
├── index.html          # Main HTML file with all sections
├── css/
│   └── style.css       # All styles, dark/light mode, responsive
├── js/
│   └── main.js         # Theme toggle, scroll animations, GitHub API, nav
├── assets/
│   └── favicon.svg     # Site favicon
└── README.md           # You are here
```

---

## 🚀 Getting Started

### Option 1 — Open Directly

Just open `index.html` in any modern browser. No build step required.

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

### Option 2 — Local Dev Server (recommended)

Using Python:

```bash
cd porto
python3 -m http.server 8000
# Visit http://localhost:8000
```

Using Node.js:

```bash
npx serve .
# Visit http://localhost:3000
```

Using VS Code:

1. Install the **Live Server** extension
2. Right-click `index.html` → **Open with Live Server**

---

## 🎨 Customization

| What                | Where                                      |
| ------------------- | ------------------------------------------ |
| Personal info       | `index.html` — Hero & About sections       |
| Colors / Fonts      | `css/style.css` — `:root` CSS variables    |
| GitHub username     | `js/main.js` — `GITHUB_USERNAME` constant  |
| Contact form action | `index.html` — `<form>` action attribute   |
| Social links        | `index.html` — footer & hero section       |

---

## 🛠 Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — ES6+, Intersection Observer, Fetch API
- **GitHub REST API** — For live project data

---

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

---

> Built with ☕ and clean code by **Yahya Boukhmira**
