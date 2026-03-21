const cursor = document.querySelector('.cursor');
const ring = document.querySelector('.cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; if(cursor){cursor.style.left=mx+'px';cursor.style.top=my+'px';} });
function animRing(){rx+=(mx-rx)*.15;ry+=(my-ry)*.15;if(ring){ring.style.left=rx+'px';ring.style.top=ry+'px';}requestAnimationFrame(animRing);}
animRing();

const obs = new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

const replOutput = document.getElementById('repl-output');
const replInput = document.getElementById('repl-input');
const replBtn = document.getElementById('repl-run');

const tstntEval = src => {
  const s = src.trim();
  if(/^print\((.+)\)$/.test(s)){
    const inner = s.match(/^print\((.+)\)$/)[1];
    if(/^".*"$/.test(inner)) return inner.slice(1,-1).replace(/\{(\w+)\}/g,(_,k)=>vars[k]??k);
    if(/^\d+(\.\d+)?$/.test(inner)) return inner;
    const v = evalExpr(inner);
    return v !== undefined ? String(v) : '';
  }
  if(/^let\s+(mut\s+)?(\w+)\s*=\s*(.+)$/.test(s)){
    const m = s.match(/^let\s+(?:mut\s+)?(\w+)\s*=\s*(.+)$/);
    vars[m[1]] = evalExpr(m[2]);
    return null;
  }
  if(/^(\w+)\s*([+\-*\/]?=)\s*(.+)$/.test(s)){
    const m = s.match(/^(\w+)\s*([+\-*\/]?=)\s*(.+)$/);
    const v = evalExpr(m[3]);
    if(m[2]==='=') vars[m[1]]=v;
    else if(m[2]==='+=') vars[m[1]]=(vars[m[1]]??0)+v;
    else if(m[2]==='-=') vars[m[1]]=(vars[m[1]]??0)-v;
    else if(m[2]==='*=') vars[m[1]]=(vars[m[1]]??0)*v;
    else if(m[2]==='/=') vars[m[1]]=(vars[m[1]]??0)/v;
    return null;
  }
  const r = evalExpr(s);
  return r !== undefined && r !== null ? String(r) : null;
};

const vars = {};
const evalExpr = s => {
  s = s.trim();
  if(/^".*"$/.test(s)) return s.slice(1,-1);
  if(/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  if(s==='true') return true; if(s==='false') return false;
  if(s in vars) return vars[s];
  try { return Function(...Object.keys(vars),'return '+s)(...Object.values(vars)); } catch(e){ return undefined; }
};

const addLine = (prompt, text, color) => {
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:10px;margin-bottom:2px;';
  div.innerHTML = `<span style="color:var(--accent)">${prompt}</span><span style="color:${color||'var(--text)'}">${text}</span>`;
  replOutput.appendChild(div);
  replOutput.scrollTop = replOutput.scrollHeight;
};

const runRepl = () => {
  const code = replInput.value.trim();
  if(!code) return;
  addLine('tstnt>', code, 'var(--text)');
  try {
    const result = tstntEval(code);
    if(result !== null && result !== undefined) addLine('', result, 'var(--accent4)');
  } catch(e) { addLine('error:', e.message, 'var(--accent2)'); }
  replInput.value = '';
};

if(replBtn) replBtn.addEventListener('click', runRepl);
if(replInput) replInput.addEventListener('keydown', e => { if(e.key==='Enter') runRepl(); });

const tabs = document.querySelectorAll('.syntax-tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.syntax-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('pane-'+tab.dataset.tab)?.classList.add('active');
  });
});

const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if(window.scrollY > 20) nav?.classList.add('scrolled');
  else nav?.classList.remove('scrolled');
});
