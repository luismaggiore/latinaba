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
        { x: width * 0.7, y: height * 0.15, r: height * 0.4, color: '#034159', originX: width * 0.7, originY: height * 0.15 },
        { x: width * 0.8, y: height * 0.5, r: height * 0.45, color: '#034159', originX: width * 0.8, originY: height * 0.5 },
        { x: width * 0.6, y: height * 0.4, r: height * 0.35, color: '#034159', originX: width * 0.6, originY: height * 0.4 }
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
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const baseColor = '#063953'; // Color base de los círculos
        const twoOverlapColor = '#00a8cc'; // Celeste más fuerte (2 círculos)
        const threeOverlapColor = '#01061b'; // Azul profundo (3 círculos)

        const c1 = circles[0];
        const c2 = circles[1];
        const c3 = circles[2];

        // 1. Dibujar círculos base (1 círculo)
        ctx.fillStyle = baseColor;
        circles.forEach(circle => {
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // 2. Dibujar intersecciones de 2 círculos
        ctx.fillStyle = twoOverlapColor;
        
        // Intersección C1 y C2
        ctx.save();
        ctx.beginPath(); ctx.arc(c1.x, c1.y, c1.r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(c2.x, c2.y, c2.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Intersección C2 y C3
        ctx.save();
        ctx.beginPath(); ctx.arc(c2.x, c2.y, c2.r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(c3.x, c3.y, c3.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Intersección C1 y C3
        ctx.save();
        ctx.beginPath(); ctx.arc(c1.x, c1.y, c1.r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(c3.x, c3.y, c3.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 3. Dibujar intersección de 3 círculos
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
