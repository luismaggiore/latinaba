const canvas = document.getElementById('hero-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');

    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // The 3 circles
    const circles = [
        { x: width * 0.7, y: height * 0.15, r: height * 0.4, color: '#e2e8f0', originX: width * 0.7, originY: height * 0.15 },
        { x: width * 0.8, y: height * 0.5, r: height * 0.45, color: '#cbd5e1', originX: width * 0.8, originY: height * 0.5 },
        { x: width * 0.6, y: height * 0.4, r: height * 0.35, color: '#00a8cc', originX: width * 0.6, originY: height * 0.4 }
    ];

    // Animation with GSAP
    circles.forEach(circle => {
        animateCircle(circle);
    });

    function animateCircle(circle) {
        if (typeof gsap !== 'undefined') {
            gsap.to(circle, {
                x: circle.originX + (Math.random() - 0.5) * 700,
                y: circle.originY + (Math.random() - 0.5) * 700,
                duration: 4 + Math.random() * 4,
                ease: "sine.inOut",
                onComplete: () => animateCircle(circle)
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        const baseColor = '#e2e8f0';
        const twoOverlapColor = '#00a8cc';
        const threeOverlapColor = '#0f172a';

        const c1 = circles[0];
        const c2 = circles[1];
        const c3 = circles[2];

        ctx.fillStyle = baseColor;
        circles.forEach(circle => {
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = twoOverlapColor;
        ctx.save();
        ctx.beginPath(); ctx.arc(c1.x, c1.y, c1.r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(c2.x, c2.y, c2.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.arc(c2.x, c2.y, c2.r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(c3.x, c3.y, c3.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.arc(c1.x, c1.y, c1.r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(c3.x, c3.y, c3.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.fillStyle = threeOverlapColor;
        ctx.save();
        ctx.beginPath(); ctx.arc(c1.x, c1.y, c1.r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(c2.x, c2.y, c2.r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(c3.x, c3.y, c3.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        requestAnimationFrame(draw);
    }

    draw();
}

// Nav Link Text Roll-Up Animation Initializer
function initNavLinkAnimations() {
  const links = document.querySelectorAll('.nav-link, .hero-nav a');
  links.forEach((link) => {
    if (link.dataset.navInitialized) return;
    const text = link.textContent.trim();
    if (text) {
      if (!link.getAttribute('data-text')) {
        link.setAttribute('data-text', text);
      }
      if (!link.querySelector('.nav-text')) {
        link.innerHTML = `<span class="nav-text">${text}</span>`;
      }
      link.dataset.navInitialized = "true";
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavLinkAnimations);
} else {
  initNavLinkAnimations();
}
