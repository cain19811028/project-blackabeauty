/**
 * Black A Beauty - Frontend Logic
 * Libraries: P5.js, WOW.js, Rellax.js
 */

// =========================================
// 1. Initialization (WOW & Rellax)
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Scroll Reveal (WOW.js)
    new WOW().init();

    // Initialize Parallax (Rellax.js)
    // Check if element exists to avoid errors on pages without parallax shapes
    if (document.querySelector('.rellax')) {
        new Rellax('.rellax', {
            speed: -2,
            center: false,
            wrapper: null,
            round: true,
            vertical: true,
            horizontal: false
        });
    }

    // Initialize DOM Handler
    DOMHandler.init();
});

// =========================================
// 2. DOMHandler (Interactions)
// =========================================
const DOMHandler = {
    init() {
        // Mobile Menu
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const overlay = document.querySelector('.mobile-menu-overlay');
        const mobileLinks = document.querySelectorAll('.mobile-link');
        const bars = document.querySelectorAll('.bar');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                const isActive = overlay.classList.contains('active');
                this.toggleMenu(!isActive, overlay, bars);
            });
        }

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
                if (targetElement) {
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            });
        });

        // Handle Header Background on Scroll
        window.addEventListener('scroll', () => {
            const header = document.getElementById('main-header');
            if (header) {
                if (window.scrollY > 50) {
                    header.style.boxShadow = "var(--card-shadow)";
                } else {
                    header.style.boxShadow = "none";
                }
            }
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

// =========================================
// 3. P5.js Background Sketch
// =========================================
let particles = [];

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-container');

    // Create initial particles
    let particleCount = windowWidth < 768 ? 20 : 40;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    noStroke();
}

function draw() {
    clear(); // Transparent background

    // Mouse Interaction Vector
    let mouse = createVector(mouseX, mouseY);

    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.update(mouse);
        p.display();
        p.checkEdges();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Particle Class
class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = p5.Vector.random2D().mult(random(0.5, 1.5));
        this.acc = createVector(0, 0);
        this.size = random(10, 30);

        // Random Youthful Colors (RGBA)
        const colors = [
            color(37, 99, 235, 30),   // Royal Blue
            color(245, 158, 11, 40),  // Amber/Gold
            color(236, 72, 153, 30),  // Pink
            color(16, 185, 129, 30)   // Emerald
        ];
        this.color = random(colors);
        this.maxSpeed = 2;
    }

    update(mouse) {
        // Mouse Repulsion
        let dir = p5.Vector.sub(this.pos, mouse);
        if (dir.mag() < 150) {
            dir.normalize();
            dir.mult(0.2); // Repulsion force
            this.acc.add(dir);
        }

        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0); // Reset accel
    }

    display() {
        fill(this.color);
        ellipse(this.pos.x, this.pos.y, this.size);
    }

    checkEdges() {
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }
}
