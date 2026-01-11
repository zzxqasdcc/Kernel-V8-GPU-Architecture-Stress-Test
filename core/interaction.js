import { Engine } from './engine.js';

const canvas = document.getElementById('c');
const engine = new Engine(canvas);

let heavy = false, q = 2, zoom = 4.0, tZoom = 4.0, rotX = 0.5, rotY = 0.5, tRotX = 0.5, tRotY = 0.5;
let moving = false, lx, ly, lDist = 0, isBench = false, bStart = 0, bDur = 20, fpsData = [];

// 将函数暴露给 window，修复 HTML 中的 onclick 引用
window.setMode = (m) => { heavy = m; updateUI(); };
window.updateQ = (newQ) => { q = newQ; updateUI(); };
window.runBenchmark = () => {
    isBench = true; bStart = performance.now(); fpsData = [];
    const btn = document.getElementById('bench-trigger');
    btn.innerText = "TESTING..."; btn.classList.add('running');
};

function updateUI() {
    document.getElementById('m-std').className = !heavy ? 'active' : '';
    document.getElementById('m-pwr').className = heavy ? 'active' : '';
    const qs = ["Linear", "Sparse", "Dense", "Turbo", "Deep", "Atomic"];
    document.getElementById('q-grid').innerHTML = qs.map((l, i) => 
        `<button class="${i===q?'active':''}" onclick="updateQ(${i})">${l}</button>`).join('');
    resize();
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    const ss = (heavy ? [0.6, 0.8, 1.0, 1.2, 1.5, 1.8] : [0.4, 0.6, 0.8, 1.0, 1.2, 1.5])[q];
    canvas.width = window.innerWidth * dpr * ss; canvas.height = window.innerHeight * dpr * ss;
    engine.gl.viewport(0, 0, canvas.width, canvas.height);
}

const start = e => { 
    moving = true; 
    const t = e.touches ? e.touches[0] : e; 
    lx = t.clientX; ly = t.clientY; 
    if(e.touches?.length==2) lDist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
};

const move = e => { 
    if(!moving || isBench) return; 
    const t = e.touches ? e.touches[0] : e; 
    if(e.touches?.length==2) { 
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); 
        tZoom=Math.max(1.1, Math.min(tZoom-(d-lDist)*0.01, 10)); lDist=d; 
    } else { 
        tRotY-=(t.clientX-lx)*0.005; tRotX-=(t.clientY-ly)*0.005; lx=t.clientX; ly=t.clientY; 
    } 
    if(e.cancelable) e.preventDefault(); 
};

canvas.addEventListener('mousedown', start);
window.addEventListener('mousemove', move);
window.addEventListener('mouseup', () => moving = false);
canvas.addEventListener('touchstart', start, {passive:false});
canvas.addEventListener('touchmove', move, {passive:false});
window.addEventListener('touchend', () => moving = false);
window.addEventListener('wheel', e => { if(!isBench) tZoom=Math.max(1.1, Math.min(tZoom+e.deltaY*0.005, 10)); }, {passive:true});
window.addEventListener('dblclick', () => document.getElementById('ui-panel').classList.toggle('hidden'));
window.addEventListener('resize', resize);

let lt = 0, f = 0;
function frame(now) {
    f++; if(now - lt >= 1000) { document.getElementById('fps').innerText = f + " FPS"; if(isBench) fpsData.push(f); f = 0; lt = now; }
    
    if(isBench) {
        const el = (now - bStart) / 1000;
        document.getElementById('bench-progress').style.width = (el / bDur) * 100 + '%';
        tRotY += 0.04; tRotX = 0.5 + Math.sin(el * 0.5) * 0.4; tZoom = 3.5 + Math.sin(el * 0.8) * 2.0;
        if(el >= bDur) {
            isBench = false;
            document.getElementById('bench-trigger').innerText = "EXECUTE STRESS TEST";
            document.getElementById('bench-trigger').classList.remove('running');
            document.getElementById('bench-progress').style.width = '0%';
            const avg = (fpsData.reduce((a, b) => a + b, 0) / fpsData.length).toFixed(1);
            alert(`STRESS TEST ANALYTICS\nAverage Score: ${avg} FPS`);
        }
    } else if(!moving) tRotY += 0.003;

    rotX += (tRotX - rotX) * 0.1;
    rotY += (tRotY - rotY) * 0.1;
    zoom += (tZoom - zoom) * 0.1;
    
    const cx=Math.cos(rotX), sx=Math.sin(rotX), cy=Math.cos(rotY), sy=Math.sin(rotY);
    engine.render({
        rotMat: new Float32Array([cy, sx*sy, cx*sy, 0, cx, -sx, -sy, sx*cy, cx*cy]),
        time: now * 0.001,
        width: canvas.width,
        height: canvas.height,
        zoom: zoom,
        heavy: heavy,
        q: q
    });
    requestAnimationFrame(frame);
}

const ext = engine.gl.getExtension('WEBGL_debug_renderer_info');
if(ext) document.getElementById('gpu-id').innerText = engine.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL).split(' / ')[0].toUpperCase();

updateUI();
requestAnimationFrame(frame);
