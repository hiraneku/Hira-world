import './style.css';
import { Camera, Renderer } from './world/Renderer';
import { TOOLS, ToolCategory, ToolId } from './world/types';
import { SEASONS, World } from './world/World';

const canvas = document.getElementById('world-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const world = new World(160, 100);
const renderer = new Renderer(world);

const camera: Camera = {
  x: world.width * 0.5,
  y: world.height * 0.5,
  zoom: 8,
};

let activeCategory: ToolCategory = 'terrain';
let activeTool: ToolId = 'grass';
let brushRadius = 3;
let simSpeed = 1;
let hoverTile: { x: number; y: number } | null = null;

// Resize handling
function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Center camera nicely on initial load
camera.zoom = Math.max(
  4,
  Math.min(12, Math.floor(Math.min(window.innerWidth / world.width, window.innerHeight / world.height) * 1.15))
);

// Coordinate conversion
function screenToTile(clientX: number, clientY: number): { x: number; y: number } {
  const offsetX = canvas.width * 0.5 - camera.x * camera.zoom;
  const offsetY = canvas.height * 0.5 - camera.y * camera.zoom;
  return {
    x: Math.floor((clientX - offsetX) / camera.zoom),
    y: Math.floor((clientY - offsetY) / camera.zoom),
  };
}

// Mouse controls
let isPainting = false;
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    isPainting = true;
    const t = screenToTile(e.clientX, e.clientY);
    hoverTile = t;
    world.applyTool(activeTool, t.x, t.y, brushRadius);
  } else if (e.button === 1 || e.button === 2) {
    isPanning = true;
    lastPanX = e.clientX;
    lastPanY = e.clientY;
  }
});

window.addEventListener('mousemove', (e) => {
  const t = screenToTile(e.clientX, e.clientY);
  hoverTile = t;

  if (isPainting) {
    const toolDef = TOOLS.find((x) => x.id === activeTool);
    if (!toolDef?.isInstant) {
      world.applyTool(activeTool, t.x, t.y, brushRadius);
    }
  } else if (isPanning) {
    const dx = e.clientX - lastPanX;
    const dy = e.clientY - lastPanY;
    camera.x -= dx / camera.zoom;
    camera.y -= dy / camera.zoom;
    lastPanX = e.clientX;
    lastPanY = e.clientY;
  }
});

window.addEventListener('mouseup', () => {
  isPainting = false;
  isPanning = false;
});

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    camera.zoom = Math.max(2, Math.min(32, camera.zoom * zoomFactor));
  },
  { passive: false }
);

// Touch controls (1-finger paint, 2-finger pan + pinch zoom)
let lastTouchDist = 0;
let lastTouchCenter: { x: number; y: number } | null = null;

canvas.addEventListener(
  'touchstart',
  (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      isPainting = true;
      const t = screenToTile(e.touches[0].clientX, e.touches[0].clientY);
      hoverTile = t;
      world.applyTool(activeTool, t.x, t.y, brushRadius);
    } else if (e.touches.length === 2) {
      isPainting = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
      lastTouchCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) * 0.5,
        y: (e.touches[0].clientY + e.touches[1].clientY) * 0.5,
      };
    }
  },
  { passive: false }
);

canvas.addEventListener(
  'touchmove',
  (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isPainting) {
      const t = screenToTile(e.touches[0].clientX, e.touches[0].clientY);
      hoverTile = t;
      const toolDef = TOOLS.find((x) => x.id === activeTool);
      if (!toolDef?.isInstant) {
        world.applyTool(activeTool, t.x, t.y, brushRadius);
      }
    } else if (e.touches.length === 2 && lastTouchCenter) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) * 0.5,
        y: (e.touches[0].clientY + e.touches[1].clientY) * 0.5,
      };

      if (lastTouchDist > 0) {
        camera.zoom = Math.max(2, Math.min(32, camera.zoom * (dist / lastTouchDist)));
      }
      camera.x -= (center.x - lastTouchCenter.x) / camera.zoom;
      camera.y -= (center.y - lastTouchCenter.y) / camera.zoom;

      lastTouchDist = dist;
      lastTouchCenter = center;
    }
  },
  { passive: false }
);

canvas.addEventListener('touchend', () => {
  isPainting = false;
  lastTouchDist = 0;
  lastTouchCenter = null;
});

// Keyboard pan
const keysDown = new Set<string>();
window.addEventListener('keydown', (e) => keysDown.add(e.key.toLowerCase()));
window.addEventListener('keyup', (e) => keysDown.delete(e.key.toLowerCase()));

// UI Wiring
const dockToolsEl = document.getElementById('dock-tools')!;
const statDateEl = document.getElementById('stat-date')!;
const statTilesEl = document.getElementById('stat-tiles')!;

function renderDockTools(): void {
  dockToolsEl.innerHTML = '';
  const filtered = TOOLS.filter((t) => t.category === activeCategory);
  for (const tool of filtered) {
    const btn = document.createElement('button');
    btn.className = `tool-btn${tool.id === activeTool ? ' active' : ''}`;
    btn.innerHTML = `<span class="tool-icon">${tool.icon}</span><span class="tool-name">${tool.name}</span>`;
    btn.addEventListener('click', () => {
      activeTool = tool.id;
      renderDockTools();
    });
    dockToolsEl.appendChild(btn);
  }
}

document.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.tab as ToolCategory;
    const first = TOOLS.find((t) => t.category === activeCategory);
    if (first) activeTool = first.id;
    renderDockTools();
  });
});

document.querySelectorAll<HTMLButtonElement>('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    brushRadius = Number(btn.dataset.size) || 3;
  });
});

document.querySelectorAll<HTMLButtonElement>('.speed-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    simSpeed = Number(btn.dataset.speed);
  });
});

document.getElementById('btn-new-world')?.addEventListener('click', () => {
  world.generate();
});

renderDockTools();

// Main Loop
let lastTime = performance.now();
function loop(now: number): void {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const panSpeed = (300 / camera.zoom) * dt;
  if (keysDown.has('w') || keysDown.has('arrowup')) camera.y -= panSpeed;
  if (keysDown.has('s') || keysDown.has('arrowdown')) camera.y += panSpeed;
  if (keysDown.has('a') || keysDown.has('arrowleft')) camera.x -= panSpeed;
  if (keysDown.has('d') || keysDown.has('arrowright')) camera.x += panSpeed;

  world.update(dt, simSpeed);
  renderer.render(
    ctx,
    canvas.width,
    canvas.height,
    world,
    camera,
    now / 1000,
    hoverTile,
    brushRadius
  );

  statDateEl.textContent = `Year ${world.year} · ${SEASONS[world.seasonIndex]}`;
  statTilesEl.textContent = `Trees: ${world.treeCount}`;

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
