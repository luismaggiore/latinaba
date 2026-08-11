// Register GSAP Plugins
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText);
}

// Swup Instance
const swup = new Swup({
  containers: ['#swup'],
  animateHistoryBrowsing: true,
});

let smootherInstance = null;

// Helper to force scroll reset to top across native window & GSAP ScrollSmoother
function resetScrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  if (smootherInstance) {
    smootherInstance.scrollTo(0, false);
    smootherInstance.scrollTop(0);
  }
}

// Re-initialize GSAP & ScrollSmoother
function initGsapAnimations() {
  if (!window.gsap) return;

  // 1. Reset scroll position to top
  resetScrollToTop();

  // 2. Kill the previous ScrollSmoother FIRST (it owns an internal ScrollTrigger).
  //    Killing ScrollTrigger.getAll() without killing the smoother first leaves the
  //    smoother's own trigger dead, and since it can only be created once, smooth
  //    scrolling would silently stop working after the first swup navigation.
  if (smootherInstance) {
    smootherInstance.kill();
    smootherInstance = null;
  }

  // 3. Kill remaining ScrollTriggers to prevent duplicate triggers
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  // 4. Recreate ScrollSmoother so it can pick up any new effects/content on this page
  if (window.ScrollSmoother) {
    smootherInstance = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.5,
      effects: true,
    });
    smootherInstance.scrollTo(0, false);
  }

  // 5. Line width animation
  gsap.from(".line", {
    duration: 1,
    width: "-10%",
    ease: "power2.inOut",
  });

  // 6. SplitText H1 animation
  const h1Elements = document.querySelectorAll("h1");
  if (h1Elements.length > 0) {
    const splitText = new SplitText("h1", { type: "words" });
    gsap.from(splitText.words, {
      duration: 0.6,
      delay: 0.2,
      opacity: 0,
      x: 20,
      stagger: 0.1,
    });
  }

  // 7. Enter element scale animation
  if (document.querySelector(".enter")) {
    gsap.from(".enter", {
      duration: 1,
      scale: 0.9,
    });
  }

  // 8. Insert images clip-path scrub animations
  const imgs = gsap.utils.toArray(".insert-img");
  if (imgs[0]) {
    gsap.fromTo(
      imgs[0],
      { clipPath: "inset(0% 100% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        scrollTrigger: {
          trigger: imgs[0],
          start: "top 180%",
          end: "top 80%",
          scrub: true,
        },
      }
    );
  }
  if (imgs[1]) {
    gsap.fromTo(
      imgs[1],
      { clipPath: "inset(0% 0% 0% 100%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        scrollTrigger: {
          trigger: imgs[1],
          start: "top 180%",
          end: "top 60%",
          scrub: true,
        },
      }
    );
  }

  // 9. Section description lines reveal
  gsap.utils.toArray(".section-description").forEach((parrafo) => {
    const splitP = new SplitText(parrafo, { type: "lines" });
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
  });

  // 10. H2 words reveal
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

  // 11. Stats display stagger & counter animation
  const statCols = document.querySelectorAll(".stats-display > div");
  if (statCols.length > 0) {
    gsap.from(statCols, {
      opacity: 0,
      delay: 0.4,
      y: 30,
      duration: 0.4,
      stagger: 0.2,
      ease: "power2.out",
    });

    statCols.forEach((col, index) => {
      const span = col.querySelector("span");
      if (!span) return;

      const originalText = span.textContent.trim();
      const rangeMatch = originalText.match(/^(\d+)\s*-\s*(\d+)(%|\+)?$/);
      const numMatch = originalText.match(/^(\d+)([A-Za-z%+\s]*)$/);

      if (rangeMatch) {
        const minVal = parseInt(rangeMatch[1], 10);
        const maxVal = parseInt(rangeMatch[2], 10);
        const suffix = rangeMatch[3] || "";
        const counter = { min: 0, max: 0 };

        gsap.to(counter, {
          min: minVal,
          max: maxVal,
          duration: 1.8,
          delay: index * 0.2,
          ease: "power2.out",
          onUpdate: () => {
            span.textContent =
              Math.floor(counter.min) +
              "-" +
              Math.floor(counter.max) +
              suffix +
              " ";
          },
        });
      } else if (numMatch) {
        const targetValue = parseInt(numMatch[1], 10);
        const suffix = numMatch[2] || "";
        const counter = { val: 0 };

        gsap.to(counter, {
          val: targetValue,
          duration: 1.8,
          delay: index * 0.2,
          ease: "power2.out",
          onUpdate: () => {
            span.textContent = Math.floor(counter.val) + suffix + " ";
          },
        });
      } else {
        span.textContent = originalText + " ";
        gsap.from(span, {
          opacity: 0,
          y: 10,
          duration: 1,
          delay: index * 0.2,
          ease: "power2.out",
        });
      }
    });
  }

  // 12. Map Panel scrub animation
  if (document.querySelector(".panel")) {
    gsap.from(".panel", {
      scale: 0.9,
      x: 130,
      scrollTrigger: {
        trigger: ".panel",
        start: "top 95%",
        end: "bottom 90%",
        toggleActions: "play none none reverse",
        scrub: true,
      },
    });
  }

  // 13. Donut Chart Panel-2 scrub animation
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
        scrub: true,
      },
    });
  }

  // 14. Leadership images scale animation
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

  // Refresh ScrollTrigger calculations after DOM layout settles
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 100);
}

// Helper function to re-trigger component scripts on page load
// `isSwupNavigation` distinguishes a swup-driven page:view from the very
// first DOMContentLoaded: script.js, latam-map.js, donut-chart.js and
// logo-marquee.js each already self-initialize (#ta-cards-grid, #svg1,
// #donut-chart, #logo-marquee) on that first DOMContentLoaded, so re-running
// them here too would double-init on first load (duplicate SVGs, doubled
// autoplay intervals, a second stacked marquee rAF loop).
function onPageLoaded(isSwupNavigation) {
  // 1. Update active navigation link styling
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav .nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  if (isSwupNavigation) {
    // 2. Re-initialize LATAM Map if element #svg1 is present
    if (document.getElementById('svg1') && typeof window.initLatamMap === 'function') {
      window.initLatamMap();
    }

    // 3. Re-initialize Donut Chart if element #donut-chart is present
    if (document.getElementById('donut-chart') && typeof window.initDonutChart === 'function') {
      window.initDonutChart();
    }

    // 4. Re-initialize therapeutic areas grid if ta-cards-grid is present
    if (document.getElementById('ta-cards-grid') && typeof window.renderTherapeuticAreas === 'function') {
      window.renderTherapeuticAreas();
    }

    // 4b. Re-initialize the Client Portfolio logo marquee if present
    if (document.getElementById('logo-marquee') && typeof window.initLogoMarquee === 'function') {
      window.initLogoMarquee();
    }
  }

  // 5. Run GSAP & ScrollSmoother suite
  initGsapAnimations();
}

// Initial execution on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  onPageLoaded(false);
});

// Swup hooks for scroll reset and page view
swup.hooks.on('visit:start', () => {
  resetScrollToTop();
});

swup.hooks.on('content:replace', () => {
  resetScrollToTop();
});

swup.hooks.on('page:view', () => {
  onPageLoaded(true);
});
