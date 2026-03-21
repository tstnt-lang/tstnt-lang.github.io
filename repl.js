const BUILTINS = {
  print: (args) => args.map(a => String(a)).join(' '),
  str: ([v]) => String(v ?? ''),
  int: ([v]) => isNaN(parseInt(v)) ? 0 : parseInt(v),
  float: ([v]) => isNaN(parseFloat(v)) ? 0 : parseFloat(v),
  len: ([v]) => typeof v === 'string' ? v.length : (Array.isArray(v) ? v.length : 0),
  type_of: ([v]) => typeof v === 'number' ? (Number.isInteger(v) ? 'int' : 'float') : typeof v === 'string' ? 'str' : typeof v === 'boolean' ? 'bool' : Array.isArray(v) ? 'array' : 'null',
  range: (args) => { const [s,e] = args.length===1?[0,args[0]]:args; const r=[]; for(let i=s;i<e;i++) r.push(i); return r; },
  map: ([arr, fn]) => Array.isArray(arr) ? arr.map(fn) : [],
  filter: ([arr, fn]) => Array.isArray(arr) ? arr.filter(fn) : [],
  sum: ([arr]) => Array.isArray(arr) ? arr.reduce((a,b)=>a+b,0) : 0,
  max: ([arr]) => Array.isArray(arr) ? Math.max(...arr) : 0,
  min: ([arr]) => Array.isArray(arr) ? Math.min(...arr) : 0,
  abs: ([v]) => Math.abs(v),
  sqrt: ([v]) => Math.sqrt(v),
  assert: ([v, msg]) => { if (!v) throw new Error(msg || 'Assertion failed'); return null; },
  assert_eq: ([a, b]) => { if (String(a) !== String(b)) throw new Error(`assert_eq failed: ${a} != ${b}`); return null; },
  concat: (args) => [].concat(...args.map(a => Array.isArray(a) ? a : [a])),
  reverse: ([v]) => Array.isArray(v) ? [...v].reverse() : typeof v === 'string' ? v.split('').reverse().join('') : v,
  sort: ([v]) => Array.isArray(v) ? [...v].sort((a,b)=>String(a).localeCompare(String(b))) : v,
  unique: ([arr]) => [...new Set(arr)],
  flatten: ([arr]) => arr.flat(),
  zip: ([a,b]) => a.map((v,i)=>[v,b[i]]),
  keys: ([obj]) => Object.keys(obj||{}),
  values: ([obj]) => Object.values(obj||{}),
  not_null: ([v]) => v !== null && v !== undefined,
  is_null: ([v]) => v === null || v === undefined,
  clamp: ([v,lo,hi]) => Math.max(lo, Math.min(hi, v)),
  repeat_str: ([s,n]) => s.repeat(n),
  sprintf: ([tpl,...args]) => { let r=tpl; for(const a of args) r=r.replace('{}',a); return r; },
};

function evalTSTNT(code) {
  const lines = code.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const env = {};
  const output = [];

  function evalExpr(expr) {
    expr = expr.trim();
    if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1,-1).replace(/\\n/g,'\n');
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (!isNaN(expr) && expr !== '') return Number(expr);
    if (expr.startsWith('[') && expr.endsWith(']')) {
      const inner = expr.slice(1,-1).trim();
      if (!inner) return [];
      return splitArgs(inner).map(evalExpr);
    }
    const callMatch = expr.match(/^([a-zA-Z_]\w*)\((.*)\)$/s);
    if (callMatch) {
      const [, name, argsStr] = callMatch;
      const args = argsStr.trim() ? splitArgs(argsStr).map(evalExpr) : [];
      if (BUILTINS[name]) {
        const r = BUILTINS[name](args);
        if (name === 'print') { output.push(String(r)); return null; }
        return r;
      }
      throw new Error(`Unknown function: ${name}`);
    }
    const binOps = [['||','||'],['&&','&&'],['==','==='],['!=','!=='],['<=','<='],['>=','>='],['<','<'],['>','>'],['+',' + '],['-',' - '],['*',' * '],['/',' / '],['%',' % ']];
    for (const [op] of binOps) {
      const idx = expr.lastIndexOf(op);
      if (idx > 0) {
        const l = expr.slice(0, idx).trim();
        const r = expr.slice(idx + op.length).trim();
        if (l && r) {
          const lv = evalExpr(l), rv = evalExpr(r);
          switch(op) {
            case '+': return typeof lv === 'string' || typeof rv === 'string' ? String(lv)+String(rv) : lv+rv;
            case '-': return lv-rv; case '*': return lv*rv; case '/': return lv/rv; case '%': return lv%rv;
            case '==': return lv===rv; case '!=': return lv!==rv;
            case '<': return lv<rv; case '>': return lv>rv; case '<=': return lv<=rv; case '>=': return lv>=rv;
            case '&&': return lv&&rv; case '||': return lv||rv;
          }
        }
      }
    }
    if (expr in env) return env[expr];
    throw new Error(`Undefined: ${expr}`);
  }

  function splitArgs(s) {
    const parts = []; let depth = 0, cur = '';
    for (const c of s) {
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      if (c === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }

  for (const line of lines) {
    try {
      if (line.startsWith('let ') || line.startsWith('let mut ') || line.startsWith('const ')) {
        const m = line.match(/^(?:let\s+(?:mut\s+)?|const\s+)(\w+)(?:\s*:\s*\w+)?\s*=\s*(.+)$/);
        if (m) env[m[1]] = evalExpr(m[2]);
      } else if (line.match(/^\w+\s*[+\-*\/]?=\s*.+/)) {
        const m = line.match(/^(\w+)\s*([+\-*\/]?)=\s*(.+)$/);
        if (m && m[2]) env[m[1]] = evalExpr(`${m[1]} ${m[2]} ${m[3]}`);
        else if (m) env[m[1]] = evalExpr(m[3]);
      } else {
        const r = evalExpr(line);
        if (r !== null && r !== undefined && line.includes('(')) {
          if (!line.startsWith('print')) output.push(String(r));
        }
      }
    } catch(e) {
      output.push(`\x1b[error\x1b]${e.message}`);
    }
  }
  return output;
}

function initRepl(outputId, inputId, runId) {
  const out = document.getElementById(outputId);
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(runId);
  if (!out || !inp || !btn) return;

  function run() {
    const code = inp.value.trim();
    if (!code) return;
    const promptLine = document.createElement('div');
    promptLine.className = 'repl-line';
    promptLine.innerHTML = `<span style="color:var(--accent)">tstnt&gt;</span> <span style="color:var(--text)">${code.replace(/</g,'&lt;')}</span>`;
    out.appendChild(promptLine);
    try {
      const results = evalTSTNT(code);
      for (const r of results) {
        const line = document.createElement('div');
        line.className = 'repl-line';
        if (r.includes('\x1b[error\x1b]')) {
          line.innerHTML = `<span style="color:var(--accent2)">${r.replace('\x1b[error\x1b]','error: ')}</span>`;
        } else {
          line.innerHTML = `<span style="color:#c3e88d">${r.replace(/</g,'&lt;')}</span>`;
        }
        out.appendChild(line);
      }
    } catch(e) {
      const line = document.createElement('div');
      line.className = 'repl-line';
      line.innerHTML = `<span style="color:var(--accent2)">error: ${e.message}</span>`;
      out.appendChild(line);
    }
    inp.value = '';
    out.scrollTop = out.scrollHeight;
  }

  btn.addEventListener('click', run);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
}

window.initRepl = initRepl;
