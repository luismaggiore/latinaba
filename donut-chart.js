function initDonutChart() {
  const chartContainer = document.getElementById('donut-chart');
  if (!chartContainer) return;

  const data = [
    {name:'Acne Vulgaris', phase:'Phase III'},
    {name:'Anemia in Renal Impairment', phase:'Phase III'},
    {name:'Cardiology', phase:'Phase III'},
    {name:'Cardiovascular Megatrial', phase:'Phase III'},
    {name:'Childhood Diarrheal Disease', phase:'Phase III'},
    {name:'Early Puberty', phase:'Phase III'},
    {name:'GH Deficiency', phase:'Phase III'},
    {name:'Hepatic Diseases (PBC)', phase:'Phase III'},
    {name:'Herpes Simplex + HIV', phase:'Phase III'},
    {name:'Hypertriglyceridemia and Diabetes', phase:'Phase III'},
    {name:'Narcolepsy', phase:'Phase III'},
    {name:'Pediatric Impetigo', phase:'Phase III'},
    {name:'Post Transplant PTLD', phase:'Phase III'},
    {name:'Preeclampsia Prevention', phase:'Phase III'},
    {name:'Pulmonary Enfisema', phase:'Phase III'},
    {name:'Severe Osteoporosis', phase:'Phase IV'},
    {name:'Traumatic Brain Injury', phase:'Phase IV'},
    {name:'Ulcerative Colitis', phase:'Phase IV'},
    {name:'Wilson Disease', phase:'Phase IV'},
    {name:'Acne Vulgaris', phase:'Phase IV'},
    {name:'Cardiovascular Holter', phase:'Phase IV'},
    {name:'H1N1 vaccine', phase:'Obs'},
    {name:'Imaging Contrast & Nephrotoxicity', phase:'Obs'},
    {name:'Neurovascular Holter', phase:'Obs'},
    {name:'Allergic diseases', phase:'Obs'},
    {name:'Breast Cancer', phase:'Obs'},
    {name:'Hemophilia A', phase:'Obs'},
    {name:'Infectious Diseases', phase:'Obs'},
    {name:'Acute Ischemic Stroke', phase:'Obs'},
    {name:'Childhood ALD', phase:'Phase II'},
    {name:'Congenital Adrenal Hyperplasia', phase:'Phase II'},
    {name:'Neuroblastoma', phase:'Phase II'},
    {name:'Rheumatoid Arthritis', phase:'Phase II'},
    {name:'Rheumatoid Arthritis', phase:'Phase II'},
    {name:'Zika Virus', phase:'Phase II'},
    {name:'Acute pain', phase:'N/A'},
    {name:'ALL postmarketing', phase:'N/A'},
    {name:'Cardiology', phase:'N/A'},
    {name:'Latin America Clinical Trials', phase:'N/A'},
    {name:'Dengue, Zika, Chicungunya', phase:'N/A'},
    {name:'GCP Oncology Trials', phase:'N/A'},
    {name:'N/A', phase:'N/A'},
    {name:'Abdominal aorta Aneurysm', phase:'FIM'},
    {name:'Cardiovascular Device', phase:'FIM'},
    {name:'Glaucoma/IOP Device', phase:'FIM'},
    {name:'Hypertension', phase:'FIM'},
    {name:'Post Cataract Pain', phase:'FIM'}
  ];

  const phaseColors = {
    'Phase III': '#2563eb',
    'Phase IV': '#475569',
    'Obs': '#059669',
    'Phase II': '#d97706',
    'N/A': '#7c3aed',
    'FIM': '#dc2626'
  };

  const width = 960, height = 560;
  const cx = width / 2, cy = height / 2;
  const radius = 200;
  const innerRadius = 110;

  const svg = d3.select('#donut-chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('role', 'img')
    .attr('aria-label', 'Donut chart of projects by phase and indication');

  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  const pie = d3.pie().value(() => 1).sort(null).padAngle(0.004);
  const arcsData = pie(data);

  const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);
  const outerArc = d3.arc().innerRadius(radius + 14).outerRadius(radius + 14);

  const tooltip = d3.select('#donut-tooltip');

  g.selectAll('path.slice')
    .data(arcsData)
    .join('path')
    .attr('d', arc)
    .attr('fill', d => phaseColors[d.data.phase])
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mousemove', function(event, d) {
      const [mx, my] = d3.pointer(event, event.currentTarget.ownerSVGElement.parentNode);
      tooltip.style('opacity', 1)
        .style('left', (mx + 12) + 'px')
        .style('top', (my + 12) + 'px')
        .html('<strong>' + d.data.name + '</strong><br>' + d.data.phase);
      d3.select(this).attr('opacity', 0.8);
    })
    .on('mouseleave', function() {
      tooltip.style('opacity', 0);
      d3.select(this).attr('opacity', 1);
    });

  const labelData = arcsData.map(d => {
    const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
    const side = midAngle < Math.PI ? 'right' : 'left';
    const pos = outerArc.centroid(d);
    return Object.assign({}, d, { midAngle, side, y: pos[1] });
  });

  const minGap = 13;
  ['left', 'right'].forEach(side => {
    const arr = labelData.filter(l => l.side === side).sort((a, b) => a.y - b.y);
    for (let i = 1; i < arr.length; i++) {
      if (arr[i].y - arr[i - 1].y < minGap) {
        arr[i].y = arr[i - 1].y + minGap;
      }
    }
  });

  const labelRadius = radius + 52;

  g.selectAll('polyline')
    .data(labelData)
    .join('polyline')
    .attr('points', d => {
      const start = arc.centroid(d);
      const pivot = outerArc.centroid(d);
      const end = [labelRadius * (d.side === 'right' ? 1 : -1), d.y];
      return [start, pivot, end];
    })
    .attr('fill', 'none')
    .attr('stroke', '#94a3b8')
    .attr('stroke-width', 1);

  g.selectAll('text.label')
    .data(labelData)
    .join('text')
    .attr('x', d => (labelRadius + 6) * (d.side === 'right' ? 1 : -1))
    .attr('y', d => d.y)
    .attr('text-anchor', d => d.side === 'right' ? 'start' : 'end')
    .attr('dy', '0.32em')
    .style('font-size', '10.5px')
    .style('fill', '#0f172a')
    .text(d => d.data.name);

  const legend = d3.select('#donut-legend');
  Object.entries(phaseColors).forEach(([phase, color]) => {
    const item = legend.append('span').style('display', 'flex').style('align-items', 'center').style('gap', '4px');
    item.append('span').style('width', '10px').style('height', '10px').style('border-radius', '2px').style('background', color).style('display', 'inline-block');
    item.append('span').text(phase);
  });
}

document.addEventListener("DOMContentLoaded", initDonutChart);
