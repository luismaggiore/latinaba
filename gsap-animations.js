// use a script tag or an external JS file
document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText);

  // Initialize ScrollSmoother
  ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5,
    effects: true,
  });

  // gsap code here!
  gsap.from(".hero-text-content", {
    duration: 0.8,
    opacity: 0,
    x: 40,
  });
  const splitTextDescription = new SplitText(".section-description", {
    type: "lines",
  });
  gsap.from(splitTextDescription.lines, {
    duration: 0.4,
    opacity: 0,
    x: 40,
    stagger: 0.3,
    scrollTrigger: {
      trigger: ".section-description",
      start: "top bottom",
      end: "center 65%",
      scrub: "true",
    },
  });

  const splitText = new SplitText("h1", { type: "words" });
  gsap.from(splitText.words, {
    duration: 0.2,
    opacity: 0,
    x: 20,
    stagger: 0.1,
  });

  gsap.utils.toArray("h2").forEach((texto) => {
    // 3. Dividir el texto de este h2 en caracteres (letras)
    const miSplit = new SplitText(texto, { type: "words" });

    // 4. Crear la animación para este h2 específico
    gsap.from(miSplit.words, {
      opacity: 0,
      y: 50,
      stagger: 0.02, // Retraso entre cada letra para el efecto cascada
      duration: 0.6,

      // 5. Vincularlo al scroll
      scrollTrigger: {
        trigger: texto, // El h2 actual es su propio activador
        start: "top 85%", // Empieza cuando el h2 está cerca de entrar por abajo
        toggleActions: "play none none none", // Se reproduce una sola vez al entrar
      },
    });
  });
});
