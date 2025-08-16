// Hilfsfunktionen für KanjiVG

async function getKanjiVGGroup(kanji) {
    const index = await fetch('kvg-index.json').then(r => r.json());
    const uKey = 'u' + kanji.codePointAt(0).toString(16);
    const files = index[kanji] || index[uKey];
    if (!files?.length) throw new Error('Kein Eintrag im Index für: ' + kanji);
    const svgFile = files[0];
  
    let res = await fetch(`kanji/${svgFile}`);
    if (!res.ok) res = await fetch(svgFile);
    if (!res.ok) throw new Error(`SVG nicht gefunden: kanji/${svgFile} oder ./${svgFile}`);
  
    let svgText = await res.text();
  
    const start = svgText.indexOf('<svg');
    const end   = svgText.lastIndexOf('</svg>');
    if (start === -1 || end === -1) throw new Error('Ungültiges SVG');
    let onlySvg = svgText.slice(start, end + 6);
  
    onlySvg = onlySvg.replace(/<svg([^>]*)>/i, (m, attrs) => {
      let a = attrs;
      if (!/xmlns=/.test(a)) a += ' xmlns="http://www.w3.org/2000/svg"';
      if (!/xmlns:kvg=/.test(a)) a += ' xmlns:kvg="http://kanjivg.tagaini.net"';
      if (!/xmlns:xlink=/.test(a)) a += ' xmlns:xlink="http://www.w3.org/1999/xlink"';
      return `<svg${a}>`;
    });
  
    const doc = new DOMParser().parseFromString(onlySvg, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('SVG Parse Error');
  
    const srcSvg = doc.documentElement;
    const vb = (srcSvg.getAttribute('viewBox') || '0 0 109 109').split(/\s+/).map(Number);
    const vbW = vb[2] || 109;
    const vbH = vb[3] || 109;
  
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    Array.from(srcSvg.childNodes).forEach(n => {
      if (n.nodeType === 1 || n.nodeType === 3) g.appendChild(n.cloneNode(true));
    });
  
    g.querySelectorAll('path').forEach(p => {
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'black');
      p.setAttribute('stroke-width', '5');
      p.setAttribute('stroke-linecap', 'round');
    });
  
    return { group: g, vbW, vbH };
  }
  
  async function injectKanjiIntoMain(selectedTable, kanjiChar) {
    const main = selectedTable.querySelector('#MainKanji');
    if (!main) return;
  
    const rootSvg = selectedTable.querySelector('svg');
    if (rootSvg && !rootSvg.getAttribute('xmlns:kvg')) {
      rootSvg.setAttribute('xmlns:kvg', 'http://kanjivg.tagaini.net');
    }
  
    const box = main.getBBox();
    const targetSize = Math.min(box.width, box.height);
  
    const { group, vbW, vbH } = await getKanjiVGGroup(kanjiChar);
  
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapper.setAttribute('id', 'KanjiVGMain');
    wrapper.setAttribute('pointer-events', 'none');
  
    const scale = Math.min(targetSize / vbW, targetSize / vbH);
    const drawW = vbW * scale;
    const drawH = vbH * scale;
    const tx = box.x + (box.width - drawW) / 2;
    const ty = box.y + (box.height - drawH) / 2;
    wrapper.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
  
    wrapper.appendChild(group);
  
    selectedTable.querySelectorAll('#KanjiVGMain').forEach(n => n.remove());
    main.parentNode.appendChild(wrapper);
    main.setAttribute('opacity', '0');
  
    const strokes = wrapper.querySelectorAll('path');
    strokes.forEach((p, i) => {
      const len = p.getTotalLength?.() ?? 0;
      if (!len) return;
      p.classList.add('kvg-stroke');
      p.dataset.strokeLen = String(len);
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      setTimeout(() => {
        p.style.transition = 'stroke-dashoffset 0.5s ease';
        p.style.strokeDashoffset = '0';
      }, i * 600);
    });
  }
  
  // Für PDF: Animation „finalisieren“
  async function finalizeKanjiStrokes(root = document) {
    const paths = root.querySelectorAll('.kvg-stroke, g path');
    paths.forEach(p => {
      p.style.transition = 'none';
      const len = Number(p.dataset.strokeLen || p.getTotalLength?.() || 0);
      if (len) {
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = '0';
      }
    });
    document.body.offsetHeight;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }
  
  // Offscreen-Klon (sichtbar, aber außerhalb — kein opacity/visibility!)
  async function makeOffscreenClone(el) {
    const clone = el.cloneNode(true);
    Object.assign(clone.style, {
      position: 'fixed',
      left: '-100000px',
      top: '-100000px',
      pointerEvents: 'none',
      zIndex: '-1'
    });
    document.body.appendChild(clone);
    return clone;
  }
  
  // Export ins globale App-Namespace (falls du’s woanders brauchst)
  App.injectKanjiIntoMain = injectKanjiIntoMain;
  App.finalizeKanjiStrokes = finalizeKanjiStrokes;
  App.makeOffscreenClone = makeOffscreenClone;
  