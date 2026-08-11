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

// Global Therapeutic Areas Dataset (original 21 categories kept exactly as
// before — same id/title/icon/pillar, same order). Conditions lists are
// enriched with new items sourced from LATINABA_PPT_CORPORATE_PRESENTATION_
// May2026.pptx ("Therapeutic Areas Experience" slides); items that were just
// a reworded duplicate of something already listed were skipped. Gastroenterology
// is the only new category added, since the PPT covers it and nothing before did.
window.therapeuticAreasData = [
  {
    id: 'cardio',
    title: 'Cardiovascular Diseases',
    icon: 'bi-heart-pulse-fill',
    pillar: 'Internal Medicine',
    conditions: ['Atrial Fibrillation', 'Cardiovascular Heart Failure', 'Revascularization', 'Aortic Valve Disease', 'Amyloid Cardiomyopathy', 'Acute Heart Failure', 'Coronary Lesions', 'Hypertension', 'Cardiovascular Risk & Diabetes', 'Cardiovascular Risk & Osteoporosis']
  },
  {
    id: 'critical',
    title: 'Critical Care & Nutrition',
    icon: 'bi-hospital-fill',
    pillar: 'Internal Medicine',
    conditions: ['Community Acquired Pneumonia', 'ARDS (Acute Respiratory Distress)', 'Enteral Nutrition in Critical Care']
  },
  {
    id: 'derm',
    title: 'Dermatology',
    icon: 'bi-person-badge-fill',
    pillar: 'Specialties',
    conditions: ['Acne Vulgaris', 'Actinic Keratosis', 'Psoriasis', 'Cutaneous Leishmaniasis', 'Melasma', 'Tinea Pedis', 'Impetigo', 'Esthetics']
  },
  {
    id: 'endocrine',
    title: 'Endocrine & Metabolic Disorders',
    icon: 'bi-droplet-half',
    pillar: 'Internal Medicine',
    conditions: ['Diabetes Mellitus', 'Osteoporosis', 'Hypercholesterolemia', 'Growth Hormone Deficiency', 'Precocious Puberty', 'Congenital Adrenal Hyperplasia', 'Wilson Disease']
  },
  {
    id: 'infectious',
    title: 'Infectious Diseases',
    icon: 'bi-virus',
    pillar: 'Infectious & Vaccines',
    conditions: ['HIV/AIDS', 'Hepatitis B', 'Hepatitis C', 'Otitis Media', 'Herpes Simplex', 'Chagas Disease', 'Influenza', 'Enterobacterial Infection', 'COVID-19', 'In Vitro Diagnostics']
  },
  {
    id: 'immuno',
    title: 'Immunology',
    icon: 'bi-shield-check',
    pillar: 'Oncology & Immunology',
    conditions: ['Hereditary Angioedema', 'Juvenile Rheumatoid Arthritis', 'Dermatomyositis']
  },
  {
    id: 'musculo',
    title: 'Musculoskeletal Diseases',
    icon: 'bi-person-walking',
    pillar: 'Specialties',
    conditions: ['Osteoarthritis', 'Rheumatoid Arthritis']
  },
  {
    id: 'neuro',
    title: 'Neurology',
    icon: 'bi-cpu-fill',
    pillar: 'Neuro & Psychiatry',
    conditions: ['Alzheimer Disease', 'Post Herpetic Neuralgia', "Duchenne's MD", 'Epilepsy', 'Traumatic Brain Injury', 'Huntington Disease', 'Spasticity', 'Relapsing Multiple Sclerosis', 'Amyloid Polyneuropathy', 'Acute Ischemic Stroke', 'Brain Aneurysm', 'Narcolepsy']
  },
  {
    id: 'nephro-renal',
    title: 'Nephrology & Renal',
    icon: 'bi-water',
    pillar: 'Internal Medicine',
    conditions: ['Nephrotoxicity', 'Chronic Kidney Disease', 'Diabetic Kidney Disease', 'Renal Impairment']
  },
  {
    id: 'onco',
    title: 'Oncology',
    icon: 'bi-pie-chart-fill',
    pillar: 'Oncology & Immunology',
    conditions: ['Pancreatic Cancer', 'AML (Acute Myeloid Leukemia)', 'Melanoma', 'Breast Cancer', 'Neuroblastoma', 'Cervical Cancer', 'Chronic Myeloid Leukemia', 'Colorectal Cancer', 'GIST', 'Head & Neck Cancer', 'Lung Cancer', 'Prostate Cancer', 'Primary CNS Lymphoma']
  },
  {
    id: 'ophthalmo',
    title: 'Ophthalmology',
    icon: 'bi-eye-fill',
    pillar: 'Specialties',
    conditions: ['Uveitis', 'Glaucoma', 'Age Related Macular Degeneration', 'Diabetic Retinopathy', 'Keratoconjunctivitis', 'Cataract Surgery']
  },
  {
    id: 'psychiatry',
    title: 'Psychiatry',
    icon: 'bi-emoji-smile-fill',
    pillar: 'Neuro & Psychiatry',
    conditions: ['Bipolar Disorder', 'Depression', 'Smoking Cessation', 'Anxiety Disorder']
  },
  {
    id: 'respiratory',
    title: 'Respiratory',
    icon: 'bi-wind',
    pillar: 'Internal Medicine',
    conditions: ['Asthma', 'COPD', 'Acute Bronchitis', 'Emphysema']
  },
  {
    id: 'vaccines',
    title: 'Vaccines',
    icon: 'bi-shield-plus',
    pillar: 'Infectious & Vaccines',
    conditions: ['H1N1', 'Rotavirus', 'Meningococcal B', 'Lung Carcinoma Vaccine', 'Zika', 'Leprosy', 'Respiratory Syncytial Virus (RSV)', 'Hookworm Disease', 'Epidemic Influenza', 'Polio (IPV)', 'COVID-19']
  },
  {
    id: 'vascular',
    title: 'Vascular Diseases',
    icon: 'bi-diagram-3-fill',
    pillar: 'Internal Medicine',
    conditions: ['DVT (Deep Vein Thrombosis)', 'PE (Pulmonary Embolism)', 'Abdominal Aorta Aneurysm']
  },
  {
    id: 'reproductive',
    title: 'Reproductive Health',
    icon: 'bi-heart-fill',
    pillar: 'Specialties',
    conditions: ['Contraception', 'Preeclampsia Prevention']
  },
  {
    id: 'genetic',
    title: 'Genetic',
    icon: 'bi-fingerprint',
    pillar: 'Specialties',
    conditions: ['Adrenoleukodystrophy', 'Pompe Disease']
  },
  {
    id: 'celltherapy',
    title: 'Cell Therapy & Transplant',
    icon: 'bi-boxes',
    pillar: 'Oncology & Immunology',
    conditions: ['PTLD (Post-Transplant Lymphoproliferative Disorder)', 'Bone Marrow Transplant']
  },
  {
    id: 'hemato',
    title: 'Hematology',
    icon: 'bi-droplet-fill',
    pillar: 'Oncology & Immunology',
    conditions: ['Von Willebrand Disease', 'Haemophilia']
  },
  {
    id: 'ortho',
    title: 'Orthopaedics',
    icon: 'bi-bandaid-fill',
    pillar: 'Specialties',
    conditions: ['Spinal Fusion']
  },
  {
    id: 'urology',
    title: 'Urology',
    icon: 'bi-gender-male',
    pillar: 'Specialties',
    conditions: ['Erectile Dysfunction']
  },
  {
    id: 'gastro',
    title: 'Gastroenterology',
    icon: 'bi-capsule',
    pillar: 'Internal Medicine',
    conditions: ['Primary Biliary Cirrhosis', 'Ulcerative Colitis', "Crohn's Disease", 'Irritable Bowel Syndrome', 'Childhood Diarrheal Disease']
  }
];

window.renderTherapeuticAreas = function() {
  const grid = document.getElementById('ta-cards-grid');
  if (!grid || !window.therapeuticAreasData) return;
  grid.innerHTML = window.therapeuticAreasData.map(area => `
    <div class="col-lg-4 col-md-6 ta-card-item" data-title="${area.title.toLowerCase()}" data-conditions="${area.conditions.join(' ').toLowerCase()}">
      <div class="ta-card p-4 h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="ta-icon-wrapper">
              <i class="bi ${area.icon}"></i>
            </div>
            <div>
              <h3 class="h5 mb-0 fw-bold text-dark">
                ${area.title}
                ${area.isNew ? '<span class="badge bg-success text-white ms-1 align-middle" style="font-size: 0.65rem;">NEW</span>' : ''}
                ${area.isFused ? '<span class="badge bg-cyan text-dark fw-bold ms-1 align-middle" style="font-size: 0.65rem;">FUSED</span>' : ''}
              </h3>
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2 mb-3">
            ${area.conditions.map(c => `<span class="condition-badge">${c}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `).join('');
};

window.filterCards = function() {
  const input = document.getElementById('ta-search-input');
  if (!input) return;
  const query = input.value.toLowerCase().trim();
  const items = document.querySelectorAll('.ta-card-item');

  items.forEach(item => {
    const title = item.getAttribute('data-title') || '';
    const conditions = item.getAttribute('data-conditions') || '';
    if (title.includes(query) || conditions.includes(query)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
};

function onInitApp() {
  initNavLinkAnimations();
  if (typeof window.renderTherapeuticAreas === 'function') {
    window.renderTherapeuticAreas();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onInitApp);
} else {
  onInitApp();
}
