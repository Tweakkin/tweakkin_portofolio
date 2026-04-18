document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('interactive-bg');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Adapts to window resize seamlessly
    function initCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', initCanvas);
    initCanvas();

    function getColors() {
        // Detect current theme to ensure high visibility in both modes
        const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLightMode) {
            return {
                // PREMIUM LIGHT MODE: Soft, glassy pastel violet instead of harsh dark purple.
                // It looks much cleaner, more modern, and doesn't clutter the bright UI.
                particle: (alpha) => `rgba(150, 120, 255, ${alpha * 0.45})`, 
                // Background connections are incredibly delicate faint violet/silver
                line: (alpha) => `rgba(170, 150, 240, ${alpha * 0.25})`, 
                // The mouse acts as a vibrant highlighter to bring it to life
                mouseLine: (alpha) => `rgba(120, 80, 255, ${alpha * 0.6})`,
                // A very subtle, clean lavender glow
                mouseGlowColor1: 'rgba(160, 130, 255, 0.08)', 
                mouseGlowColor2: 'rgba(160, 130, 255, 0)'
            };
        } else {
            return {
                particle: (alpha) => `rgba(180, 140, 255, ${alpha * 0.6})`, // Subtler pastel purple for dark state
                line: (alpha) => `rgba(140, 100, 255, ${alpha * 0.5})`,
                mouseLine: (alpha) => `rgba(200, 160, 255, ${alpha * 0.6})`,
                mouseGlowColor1: 'rgba(150, 100, 255, 0.1)',
                mouseGlowColor2: 'rgba(150, 100, 255, 0)'
            };
        }
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseSize = Math.random() * 2 + 1.0; // Slightly larger average size
            this.size = this.baseSize;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.angle = Math.random() * Math.PI * 2;
            this.spin = (Math.random() - 0.5) * 0.02;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.angle += this.spin;
            this.size = this.baseSize + Math.sin(this.angle) * 1.5;

            // Infinite canvas wrap (with a 50px buffer so they don't pop out visibly at the edges)
            while (this.x < -50) this.x += width + 100;
            while (this.x > width + 50) this.x -= width + 100;
            while (this.y < -50) this.y += height + 100;
            while (this.y > height + 50) this.y -= height + 100;
        }

        draw(colors) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
            ctx.fillStyle = colors.particle(0.5 + 0.5 * Math.sin(this.angle));
            ctx.fill();
        }
    }

    // Adjusted particle density to respond to screen size
    function initParticles() {
        particles = [];
        // Determine a reasonable amount of particles for mobile vs desktop
        const area = width * height;
        // Desktop is around 1920x1080 ~ 2M pixels -> ~200 particles
        // Mobile is around 390x844 ~ 330k pixels -> ~35 particles
        let count = Math.max(40, Math.floor(area / 10000));
        if (count > 220) count = 220; // Cap at 220

        for(let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }
    initParticles();
    
    // Re-initialize particles on major resize to prevent stacking
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initCanvas();
            initParticles();
        }, 200);
    });

    let mouse = { x: null, y: null };
    
    // Listen to actual mouse movements 
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Mobile Touch Events for interactivity
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Make the background scroll when the user scrolls (Parallax effect)
    let lastScrollY = window.scrollY || document.documentElement.scrollTop;
    window.addEventListener('scroll', () => {
        let currentScrollY = window.scrollY || document.documentElement.scrollTop;
        let deltaY = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
        
        // Disable parallax effect on mobile screens to prevent terrible scrolling experience
        if (window.innerWidth <= 768) return;

        // Shift all particles to create parallax depth
        for(let i = 0; i < particles.length; i++) {
            particles[i].y -= deltaY * 0.6; // 0.6 speed ratio
        }
    }, { passive: true });

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Get colors dynamically each frame to respond smoothly to the theme toggler
        const colors = getColors();

        for(let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw(colors);

            // Connections between nodes
            for(let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < 130) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    // Made opacity higher than before but kept it faded relative to mouse lines
                    ctx.strokeStyle = colors.line(0.35 * (1 - dist/130));
                    ctx.stroke();
                }
            }

            // Mouse interaction physics
            if (mouse.x !== null && mouse.y !== null) {
                let mdx = particles[i].x - mouse.x;
                let mdy = particles[i].y - mouse.y;
                let mdist = Math.sqrt(mdx*mdx + mdy*mdy);

                if(mdist < 220) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = colors.mouseLine(0.4 * (1 - mdist/220));
                    ctx.lineWidth = 1 + (1 - mdist/220) * 1.5;
                    ctx.stroke();
                    ctx.lineWidth = 1;

                    // Subtle pull towards cursor
                    particles[i].vx -= (mdx / mdist) * 0.008;
                    particles[i].vy -= (mdy / mdist) * 0.008;
                    
                    // Velocity limiter
                    let speed = Math.sqrt(particles[i].vx**2 + particles[i].vy**2);
                    if(speed > 1.2) {
                        particles[i].vx = (particles[i].vx/speed) * 1.2;
                        particles[i].vy = (particles[i].vy/speed) * 1.2;
                    }
                }
            }
        }

        // Draw soft cursor glow
        if (mouse.x !== null && mouse.y !== null) {
            let gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150);
            gradient.addColorStop(0, colors.mouseGlowColor1);
            gradient.addColorStop(1, colors.mouseGlowColor2);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 150, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }
    animate();
});
