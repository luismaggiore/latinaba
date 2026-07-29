document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText);

  // Initialize ScrollSmoother
  ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5,
    effects: true,
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



  gsap.utils.toArray(".section-description").forEach((parrafo)=>{
    const splitP = new SplitText(parrafo, {type: "lines"});

    gsap.from(splitP.lines, {
      duration: 0.4,
      opacity: 0,
      x: 40,
      stagger: 0.3,
      scrollTrigger: {
        trigger: parrafo,
        start: "top bottom",
        end: "center 65%",
        toggleActions: "play none none reverse",
      },
    });


  })

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
        toggleActions: "play none none reverse",

      },
    });
  });

  const statCols = document.querySelectorAll('.stats-display > div');

  // 1. Animación de entrada con Stagger para las columnas
  gsap.from(statCols, {
    opacity: 0,
    delay:0.4,
    y: 30,
    duration: 0.4,
    stagger: 0.2,
    ease: "power2.out"
  });

  // 2. Animación de conteo adaptativa (soporta números, rangos 60-70%, sufijos 650M+ y texto FDA NAI / 1/3)
  statCols.forEach((col, index) => {
    const span = col.querySelector('span');
    if (!span) return;

    const originalText = span.textContent.trim();
    const rangeMatch = originalText.match(/^(\d+)\s*-\s*(\d+)(%|\+)?$/);
    const numMatch = originalText.match(/^(\d+)([A-Za-z%+\s]*)$/);

    if (rangeMatch) {
      const minVal = parseInt(rangeMatch[1], 10);
      const maxVal = parseInt(rangeMatch[2], 10);
      const suffix = rangeMatch[3] || '';
      const counter = { min: 0, max: 0 };

      gsap.to(counter, {
        min: minVal,
        max: maxVal,
        duration: 1.8,
        delay: index * 0.2,
        ease: "power2.out",
        onUpdate: () => {
          span.textContent = Math.floor(counter.min) + '-' + Math.floor(counter.max) + suffix + ' ';
        }
      });
    } else if (numMatch) {
      const targetValue = parseInt(numMatch[1], 10);
      const suffix = numMatch[2] || '';
      const counter = { val: 0 };

      gsap.to(counter, {
        val: targetValue,
        duration: 1.8,
        delay: index * 0.2,
        ease: "power2.out",
        onUpdate: () => {
          span.textContent = Math.floor(counter.val) + suffix + ' ';
        }
      });
    } else {
      // Texto no numérico o fracciones (ej. "FDA NAI", "1/3"): mantener texto original e intácto con entrada suave
      span.textContent = originalText + ' ';
      gsap.from(span, {
        opacity: 0,
        y: 10,
        duration: 1,
        delay: index * 0.2,
        ease: "power2.out"
      });
    }
  });

  if (document.querySelector(".panel")) {
    gsap.from(".panel",{
      scale:0.9,
      x:130,
      scrollTrigger: {
        trigger: ".panel",
        start: "top 95%",
        end: "bottom 90%",
        toggleActions: "play none none reverse",
        scrub:"true"
      },
    });
  }
  if (document.querySelector(".panel-2")) {
    gsap.from(".panel-2", {
      scale: 0.9,
      x: -130,
      autoAlpha: 0,
      scrollTrigger: {
        trigger: ".panel-2",
        start: "top 95%",
        end: "bottom 90%",
        toggleActions: "play none none reverse",
        scrub: "true"
      },
    });
  }

  // Animación GSAP para imágenes de Leadership (from scale: 0.8 con scrub: true)
  gsap.utils.toArray(".leadership-img").forEach((img) => {
    gsap.from(img, {
      scale: 0.8,
      opacity: 0.8,
      scrollTrigger: {
        trigger: img,
        start: "top 90%",
        end: "center 55%",
        scrub: true,
      },
    });
  });
});
