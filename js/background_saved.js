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

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseSize = Math.random() * 2 + 0.5;
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

            // Fluid bouncing
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 140, 255, ${0.4 + 0.6 * Math.sin(this.angle)})`;
            ctx.fill();
        }
    }

    // Initialize floating particles
    for(let i = 0; i < 120; i++) {
        particles.push(new Particle());
    }

    let mouse = { x: null, y: null };
    
    // Listen to actual mouse movements 
    // We use clientX/clientY because the canvas is position:fixed
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function animate() {
        // Clear background entirely to show original portfolio body gradient
        ctx.clearRect(0, 0, width, height);

        for(let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Connections between nodes
            for(let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(140, 100, 255, ${0.15 * (1 - dist/110)})`;
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
                    ctx.strokeStyle = `rgba(200, 160, 255, ${0.35 * (1 - mdist/220)})`;
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
            gradient.addColorStop(0, 'rgba(150, 100, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(150, 100, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 150, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }
    animate();
});
