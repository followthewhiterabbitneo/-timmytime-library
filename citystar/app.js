const DATA_URL = './data/brokers.json';
const US_TOPO  = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const DEPT_COLORS = {
  Sales:         getCss('--dept-sales'),
  Underwriting:  getCss('--dept-underwriting'),
  Welcome:       getCss('--dept-welcome'),
  Operations:    getCss('--dept-operations'),
  Closing:       getCss('--dept-closing'),
};

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

async function boot() {
  const [topo, brokers] = await Promise.all([
    fetch(US_TOPO).then(r => r.json()),
    fetch(DATA_URL).then(r => r.json()),
  ]);
  renderMap(topo, brokers);
  document.getElementById('legend').textContent =
    `${brokers.length} brokers lit · tap a light`;
}

function renderMap(topo, brokers) {
  const svg = d3.select('#map');
  const { width, height } = svg.node().getBoundingClientRect();
  const land = topojson.feature(topo, topo.objects.states);
  const projection = d3.geoAlbersUsa().fitSize([width, height], land);
  const path = d3.geoPath(projection);

  svg.selectAll('*').remove();

  svg.append('g')
    .selectAll('path')
    .data(land.features)
    .join('path')
    .attr('class', 'state')
    .attr('d', path);

  const dots = svg.append('g');

  brokers.forEach((b, i) => {
    const xy = projection([b.lng, b.lat]);
    if (!xy) return;
    const [x, y] = xy;
    const r = 3 + b.volumeIdx * 1.2;

    dots.append('circle')
      .attr('class', 'city-glow')
      .attr('cx', x).attr('cy', y)
      .attr('r', 14 + b.volumeIdx * 3);

    dots.append('circle')
      .attr('class', 'city-pulse')
      .attr('cx', x).attr('cy', y)
      .attr('r', 4)
      .style('animation-delay', (i * 320) + 'ms');

    dots.append('circle')
      .attr('class', 'city-dot')
      .attr('cx', x).attr('cy', y)
      .attr('r', r)
      .on('click', () => openBroker(b))
      .on('touchstart', () => openBroker(b));
  });
}

function openBroker(b) {
  const overlay = document.getElementById('overlay');
  const card = document.getElementById('broker-card');

  card.innerHTML = `
    <div class="avatar">${initials(b.name)}</div>
    <div class="who">
      <h2>${b.name}</h2>
      <div class="sub">${b.brokerage} &middot; ${b.city}, ${b.state}</div>
      <div class="meta-row">
        <span class="pill">NMLS <strong>${b.nmls}</strong></span>
        <span class="pill">Last touch <strong>${b.lastTouch}</strong></span>
        <span class="pill">LTM funded <strong>${b.ltmVolume}</strong></span>
      </div>
    </div>
  `;

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => fanOutTeam(b.team));
}

function fanOutTeam(team) {
  const stage = document.getElementById('team-stage');
  stage.innerHTML = '';
  const rect = stage.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.36;

  team.forEach((t, i) => {
    const angle = (i / team.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    const sizePx = 46 + Math.min(40, Math.round(t.volume / 60));
    const color = DEPT_COLORS[t.role] || '#888';

    const bubble = document.createElement('div');
    bubble.className = 'team-bubble';
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    bubble.style.animationDelay = (i * 70) + 'ms';

    bubble.innerHTML = `
      <div class="circle ${t.recent ? 'recent' : ''}"
           style="background:${color}; width:${sizePx}px; height:${sizePx}px; font-size:${Math.max(13, sizePx * 0.32)}px;">
        ${initials(t.name)}
      </div>
      <div class="name">${t.name}</div>
      <div class="role">${t.role}</div>
      <div class="stats">${t.volume} clients &middot; ${t.collaborators} teammates</div>
    `;
    stage.appendChild(bubble);
  });
}

function closeOverlay() {
  const overlay = document.getElementById('overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

document.getElementById('close').addEventListener('click', closeOverlay);
document.getElementById('overlay').addEventListener('click', (e) => {
  if (e.target.id === 'overlay') closeOverlay();
});

window.addEventListener('resize', () => boot());
boot().catch(err => {
  console.error(err);
  document.getElementById('legend').textContent = 'failed to load';
});
