document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText);

  // Initialize ScrollSmoother
  ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5,
    effects: true,
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

  gsap.from(".line", {
    duration: 1,
    width: "-10%",
    ease: "power2.inOut",
  });

  const splitText = new SplitText("h1", { type: "words" });
  gsap.from(splitText.words, {
    duration: 0.6,
    delay: 0.2,
    opacity: 0,
    x: 20,
    stagger: 0.1,
  });

  gsap.utils.toArray("h2").forEach((texto) => {
    const miSplit = new SplitText(texto, { type: "words" });

    gsap.from(miSplit.words, {
      opacity: 0,
      y: 50,
      stagger: 0.02,
      duration: 0.6,
      scrollTrigger: {
        trigger: texto,
        start: "top 85%",
        end: "bottom 60%",
        toggleActions: "play none none none",
        scrub: true,
      },
    });
  });
});
