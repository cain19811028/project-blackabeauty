/**
 * Black A Beauty - Frontend Logic
 * Agents: CanvasRenderer, ScrollManager, DOMHandler
 */

document.addEventListener('DOMContentLoaded', () => {
    CanvasRenderer.init();
    ScrollManager.init();
    DOMHandler.init();
});

// =========================================
// 1. CanvasRenderer (Algorithmic Art - Youthful)
// =========================================
const CanvasRenderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    particles: [],

    init() {
        this.canvas = document.getElementById('bg-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());

        // Create initial particles
        const particleCount = window.innerWidth < 768 ? 20 : 50;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(this.width, this.height));
        }

        this.animate();
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    },

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.particles.forEach(p => {
            p.update(this.width, this.height);
            p.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
};

class Particle {
    constructor(w, h) {
        this.reset(w, h, true);
    }

    reset(w, h, initial = false) {
        this.x = Math.random() * w;
        this.y = initial ? Math.random() * h : h + 20;
        this.size = Math.random() * 15 + 5;
        this.speedY = Math.random() * 1.5 + 0.5; // Faster
        this.speedX = (Math.random() - 0.5) * 1.5; // More horizontal movement
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
        this.type = Math.floor(Math.random() * 3); // 0: Circle, 1: Square, 2: Triangle

        // Vibrant Youthful Colors (Low Opacity)
        const colors = [
            'rgba(37, 99, 235, 0.1)',   // Royal Blue
            'rgba(245, 158, 11, 0.15)', // Amber/Gold
            'rgba(236, 72, 153, 0.1)',  // Pink
            'rgba(16, 185, 129, 0.1)'   // Emerald
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update(w, h) {
        this.y -= this.speedY; // Float up
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;

        if (this.y < -50) {
            this.reset(w, h);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.fillStyle = this.color;

        ctx.beginPath();
        if (this.type === 0) {
            // Circle
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        } else if (this.type === 1) {
            // Square
            ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            // Triangle
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
    }
}

// =========================================
// 2. ScrollManager (Scroll Reveal)
// =========================================
const ScrollManager = {
    init() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-reveal').forEach(el => {
            observer.observe(el);
        });

        // Handle Header Background on Scroll
        window.addEventListener('scroll', () => {
            const header = document.getElementById('main-header');
            if (window.scrollY > 50) {
                header.style.boxShadow = "var(--glass-shadow)";
                header.style.background = "rgba(255, 255, 255, 0.95)";
            } else {
                header.style.boxShadow = "none";
                header.style.background = "rgba(255, 255, 255, 0.95)"; // Keep it relatively solid for cleanliness
            }
        });
    }
};

// =========================================
// 3. DOMHandler (Interactions)
// =========================================
const DOMHandler = {
    init() {
        // Mobile Menu
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const overlay = document.querySelector('.mobile-menu-overlay');
        const mobileLinks = document.querySelectorAll('.mobile-link');
        const bars = document.querySelectorAll('.bar');

        menuBtn.addEventListener('click', () => {
            const isActive = overlay.classList.contains('active');
            this.toggleMenu(!isActive, overlay, bars);
        });

        // Close menu when a link is clicked
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.toggleMenu(false, overlay, bars);
            });
        });

        // Smooth scrolling for anchor links (handling header offset)
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            });
        });
    },

    toggleMenu(show, overlay, bars) {
        if (show) {
            overlay.classList.add('active');
            bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.remove('active');
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        }
    }
};
