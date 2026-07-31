function getVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

const CATEGORY_COLOR = {
  latinaba: getVar("--latinaba"),
  hub: getVar("--hub"),
  ior: getVar("--ior"),
  experience: getVar("--experience"),
  none: getVar("--none"),
};

const CATEGORY_LABEL = {
  latinaba: "LATINABA (own legal entity)",
  hub: "Contracting Hub (LATINABA LLC)",
  ior: "IoR Partners",
  experience: "Prior experience",
};
const LEGEND_CATS = ["latinaba", "hub", "ior", "experience"];

// ISO-3166 numeric id (world-atlas topojson) -> country data
const countryData = {
  840: {
    name: "United States",
    category: "hub",
    note: "LATINABA LLC — Contracting Hub",
  },
  "032": {
    name: "Argentina",
    category: "latinaba",
    note: "LATINABA — legal presence",
  },
  "076": {
    name: "Brazil",
    category: "latinaba",
    note: "LATINABA — legal presence",
  },
  152: {
    name: "Chile",
    category: "latinaba",
    note: "LATINABA — legal presence",
  },
  484: {
    name: "Mexico",
    category: "latinaba",
    note: "LATINABA — legal presence",
  },
  320: {
    name: "Guatemala",
    category: "ior",
    note: "IoR Partners — Central America",
  },
  340: {
    name: "Honduras",
    category: "ior",
    note: "IoR Partners — Central America",
  },
  222: {
    name: "El Salvador",
    category: "ior",
    note: "IoR Partners — Central America",
  },
  558: {
    name: "Nicaragua",
    category: "ior",
    note: "IoR Partners — Central America",
  },
  170: {
    name: "Colombia",
    category: "ior",
    note: "IoR Partners",
  },
  604: {
    name: "Peru",
    category: "ior",
    note: "IoR Partners",
  },
  862: {
    name: "Venezuela",
    category: "experience",
    note: "Prior experience providing services",
  },
  591: {
    name: "Panama",
    category: "experience",
    note: "Prior experience providing services",
  },
  188: {
    name: "Costa Rica",
    category: "experience",
    note: "Prior experience providing services",
  },
  600: {
    name: "Paraguay",
    category: "experience",
    note: "Prior experience providing services",
  },
  "068": {
    name: "Bolivia",
    category: "experience",
    note: "Prior experience providing services",
  },
  "084": {
    name: "Belize",
    category: "experience",
    note: "Prior experience providing services",
  },
  858: {
    name: "Uruguay",
    category: "experience",
    note: "Prior experience providing services",
  },
};

// Context countries shown in grey/navy (no direct presence)
const AMERICAS_IDS = [
  "840",
  "484",
  "320",
  "084",
  "340",
  "222",
  "558",
  "188",
  "591",
  "192",
  "388",
  "332",
  "214",
  "044",
  "630",
  "780",
  "170",
  "862",
  "328",
  "740",
  "218",
  "604",
  "076",
  "068",
  "600",
  "152",
  "032",
  "858",
];

function initLatamMap() {
  const svg = d3.select("#svg1");
  if (svg.empty()) return;

  function showTooltip(html, evt) {
    d3.select("#tooltip")
      .html(html)
      .style("left", evt.clientX + "px")
      .style("top", evt.clientY + "px")
      .classed("show", true);
  }
  function hideTooltip() {
    d3.select("#tooltip").classed("show", false);
  }
  function detailHtml(id, fallbackName) {
    const d = countryData[id];
    if (!d)
      return `<b>${fallbackName}</b><br>No direct presence listed`;
    return `<b>${d.name}</b><br>${d.note}`;
  }

  function buildLegend(containerSel, onClick) {
    const sel = d3
      .select(containerSel)
      .selectAll(".legend-item")
      .data(LEGEND_CATS)
      .join("div")
      .attr("class", "legend-item")
      .attr("data-cat", (d) => d)
      .on("click", function (evt, cat) {
        onClick(cat);
      });
    sel.selectAll("*").remove();
    sel
      .append("span")
      .attr("class", "swatch")
      .style("background", (d) => CATEGORY_COLOR[d]);
    sel.append("span").text((d) => CATEGORY_LABEL[d]);
    return sel;
  }

  // Inject hint badge and selected status pill into map-wrap if present
  let selectedPill = null;
  const mapWrap = document.querySelector(".map-wrap");
  if (mapWrap) {
    if (!mapWrap.querySelector(".map-hint-badge")) {
      const hintBadge = document.createElement("div");
      hintBadge.className = "map-hint-badge";
      hintBadge.innerHTML = `
        <span class="pulse-dot"></span>
        <span class="hint-text">Click to explore</span>
      `;
      mapWrap.appendChild(hintBadge);
    }
    
    selectedPill = mapWrap.querySelector(".map-selected-pill");
    if (!selectedPill) {
      selectedPill = document.createElement("div");
      selectedPill.className = "map-selected-pill";
      mapWrap.appendChild(selectedPill);
    }
  }

  d3.json("https://unpkg.com/world-atlas@2/countries-110m.json")
    .then((topo) => {
      const all = topojson.feature(
        topo,
        topo.objects.countries,
      ).features;
      const americas = all.filter((f) =>
        AMERICAS_IDS.includes(f.id),
      );
      americas.forEach((f) => {
        if (
          (f.id === "840" || f.id === 840) &&
          f.geometry &&
          f.geometry.type === "MultiPolygon"
        ) {
          f.geometry.coordinates = f.geometry.coordinates.filter(
            (poly) => {
              const ring = poly[0];
              let maxLat = -90,
                maxLng = -180;
              ring.forEach(([lng, lat]) => {
                if (lat > maxLat) maxLat = lat;
                if (lng > maxLng) maxLng = lng;
              });
              const isAlaska = maxLat > 50;
              const isHawaii = maxLng < -130 && maxLat < 35;
              return !isAlaska && !isHawaii;
            },
          );
        }
      });
      const colorOf = (f) =>
        CATEGORY_COLOR[
          countryData[f.id]
            ? countryData[f.id].category
            : "none"
        ];

      const W = 860,
        H = 620;
      const projection = d3.geoMercator().fitExtent(
        [
          [16, 16],
          [W - 16, H - 16],
        ],
        { type: "FeatureCollection", features: americas },
      );
      const path = d3.geoPath(projection);

      const paths = svg
        .selectAll("path")
        .data(americas)
        .join("path")
        .attr("class", "country-path")
        .attr("data-id", (d) => d.id)
        .attr("d", path)
        .attr("fill", colorOf)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.75)
        .on("mousemove", (evt, d) =>
          showTooltip(detailHtml(d.id, d.properties.name), evt),
        )
        .on("mouseleave", hideTooltip)
        .on("mouseenter", function () {
          d3.select(this).attr("stroke-width", 2.2).attr("stroke", "#0f172a");
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke-width", 0.75).attr("stroke", "#ffffff");
        });

      let filter = null;
      const categories = ["latinaba", "hub", "ior", "experience"];
      let currentIndex = -1;
      let isPaused = false;
      let autoPlayInterval = null;

      function applyFilter(cat) {
        filter = cat;
        paths.classed("dim", function () {
          if (!filter) return false;
          const id = d3.select(this).attr("data-id");
          const c = countryData[id]
            ? countryData[id].category
            : "none";
          return c !== filter;
        });

        // Bring active category paths to front for visual crispness
        if (filter) {
          paths.each(function () {
            const el = d3.select(this);
            const id = el.attr("data-id");
            const c = countryData[id] ? countryData[id].category : "none";
            if (c === filter) {
              el.raise();
            }
          });
        }

        d3.select("#legend1")
          .selectAll(".legend-item")
          .classed("dim", (d2) => filter && d2 !== filter)
          .classed("active-cat", (d2) => filter === d2);

        // Update selected status pill
        if (selectedPill) {
          const color = cat ? CATEGORY_COLOR[cat] : "#94a3b8";
          const label = cat ? CATEGORY_LABEL[cat] : "Showing All Countries";
          selectedPill.innerHTML = `
            <span class="status-dot" style="background-color: ${color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
            <span class="status-text">${label}</span>
          `;
        }
      }

      function startAutoplay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
          if (!isPaused) {
            currentIndex = (currentIndex + 1) % categories.length;
            const cat = categories[currentIndex];
            applyFilter(cat);

            // Animate legend item button pulse
            const btn = document.querySelector(`.legend-item[data-cat="${cat}"]`);
            if (btn && typeof gsap !== "undefined") {
              gsap.fromTo(
                btn,
                { scale: 1.12, translateY: -3 },
                { scale: 1, translateY: 0, duration: 0.3, ease: "back.out(2)" }
              );
            }
          }
        }, 2000);
      }

      buildLegend("#legend1", (cat) => {
        const nextFilter = filter === cat ? null : cat;
        applyFilter(nextFilter);
        if (nextFilter) {
          currentIndex = categories.indexOf(nextFilter);
        } else {
          currentIndex = -1;
        }
      });

      // Clicking directly on map countries sets filter & updates index
      paths.on("click", (evt, d) => {
        const cat = countryData[d.id] ? countryData[d.id].category : null;
        if (cat && cat !== "none") {
          const nextFilter = filter === cat ? null : cat;
          applyFilter(nextFilter);
          if (nextFilter) {
            currentIndex = categories.indexOf(nextFilter);
          } else {
            currentIndex = -1;
          }
        }
      });

      // Hover to pause auto-rotation
      const pauseTargets = [
        document.querySelector(".map-wrap"),
        document.querySelector("#legend1")
      ];

      pauseTargets.forEach(target => {
        if (target) {
          target.addEventListener("mouseenter", () => {
            isPaused = true;
          });
          target.addEventListener("mouseleave", () => {
            isPaused = false;
          });
        }
      });

      // Start autoplay when map is scrolled into view (using ScrollTrigger)
      if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        const triggerTarget = document.querySelector("#map-section") || document.querySelector(".map-wrap");
        if (triggerTarget) {
          ScrollTrigger.create({
            trigger: triggerTarget,
            start: "top 70%",
            once: true,
            onEnter: () => {
              currentIndex = 0;
              applyFilter(categories[currentIndex]);
              startAutoplay();
            }
          });
        }
      } else {
        currentIndex = 0;
        applyFilter(categories[currentIndex]);
        startAutoplay();
      }
    })
    .catch((err) => {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<p style="color:red;padding:0 28px;">Could not load the base map (check your internet connection): ${err}</p>`,
      );
    });
}

document.addEventListener("DOMContentLoaded", initLatamMap);
