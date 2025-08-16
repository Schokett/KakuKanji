// function ensurePDFLibs() {
//     if (!window.jspdf || !window.jspdf.jsPDF) {
//       throw new Error('jsPDF ist noch nicht geladen');
//     }
//     if (!window.html2canvas) {
//       throw new Error('html2canvas ist noch nicht geladen');
//     }
//   }

//   async function downloadPDF() {
//     ensurePDFLibs();
//     const { jsPDF } = window.jspdf;
//     const pdf = new jsPDF("portrait", "mm", "a4");

//     const activeEl = document.querySelector(".svg-container.active");
//     if (activeEl) activeEl.classList.remove("active");

//     try {
//       const containers = document.querySelectorAll(".svg-container");
//       const tablesPerPage = 5;
//       const spacing = 5;
//       const pageWidth = 210, pageHeight = 297, margin = 10;
//       const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
//       const singleHeight = usableHeight / tablesPerPage;
//       const usableWidth = pageWidth - 2 * margin;

//       for (let i = 0; i < containers.length; i++) {
//         const clone = await App.makeOffscreenClone(containers[i]);
//         await App.finalizeKanjiStrokes(clone);

//         if (document.fonts?.ready) { try { await document.fonts.ready; } catch(_){} }
//         document.body.offsetHeight;
//         await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

//         const canvas = await html2canvas(clone, { useCORS: true, scale: 2 });
//         clone.remove();

//         const imgData = canvas.toDataURL("image/png");
//         const imgWidthMm = canvas.width * 0.2646;
//         const imgHeightMm = canvas.height * 0.2646;
//         const scale = Math.min(usableWidth / imgWidthMm, singleHeight / imgHeightMm);

//         const scaledWidth = imgWidthMm * scale;
//         const scaledHeight = imgHeightMm * scale;
//         const columnX = margin + (usableWidth - scaledWidth) / 2;
//         const row = i % tablesPerPage;
//         const columnY = margin + row * (scaledHeight + spacing);

//         if (i > 0 && row === 0) pdf.addPage();
//         pdf.addImage(imgData, "PNG", columnX, columnY, scaledWidth, scaledHeight);
//       }

//       pdf.save("kanji-raster.pdf");
//     } finally {
//       if (activeEl) activeEl.classList.add("active");
//     }
//   }

//   async function printPDF() {
//     ensurePDFLibs();
//     const { jsPDF } = window.jspdf;
//     const pdf = new jsPDF("portrait", "mm", "a4");

//     const activeEl = document.querySelector(".svg-container.active");
//     if (activeEl) activeEl.classList.remove("active");

//     try {
//       const containers = document.querySelectorAll(".svg-container");
//       const tablesPerPage = 5;
//       const spacing = 5;
//       const pageWidth = 210, pageHeight = 297, margin = 10;
//       const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
//       const singleHeight = usableHeight / tablesPerPage;
//       const usableWidth = pageWidth - 2 * margin;

//       for (let i = 0; i < containers.length; i++) {
//         const clone = await App.makeOffscreenClone(containers[i]);
//         await App.finalizeKanjiStrokes(clone);

//         if (document.fonts?.ready) { try { await document.fonts.ready; } catch(_){} }
//         document.body.offsetHeight;
//         await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

//         const canvas = await html2canvas(clone, { useCORS: true, scale: 2 });
//         clone.remove();

//         const imgData = canvas.toDataURL("image/png");
//         const imgWidthMm = canvas.width * 0.2646;
//         const imgHeightMm = canvas.height * 0.2646;
//         const scale = Math.min(usableWidth / imgWidthMm, singleHeight / imgHeightMm);

//         const scaledWidth = imgWidthMm * scale;
//         const scaledHeight = imgHeightMm * scale;
//         const columnX = margin + (usableWidth - scaledWidth) / 2;
//         const row = i % tablesPerPage;
//         const columnY = margin + row * (scaledHeight + spacing);

//         if (i > 0 && row === 0) pdf.addPage();
//         pdf.addImage(imgData, "PNG", columnX, columnY, scaledWidth, scaledHeight);
//       }

//       const blob = pdf.output("blob");
//       const url = URL.createObjectURL(blob);
//       const w = window.open(url);
//       w.onload = () => { w.focus(); w.print(); };
//     } finally {
//       if (activeEl) activeEl.classList.add("active");
//     }
//   }

//   window.downloadPDF = downloadPDF;
//   window.printPDF = printPDF;

// pdf.js – Export & Druck als PDF über html2canvas + jsPDF
// --------------------------------------------------------
// Hinweis: Für perfekte Vektorqualität müsste direktes SVG -> PDF Rendering erfolgen.
//          Hier wird aus Kompatibilitätsgründen Canvas (Raster) verwendet.
// import { svg2pdf } from "svg2pdf.js";
// svg2pdf(svgElement, pdf, { x: 10, y: 10, width: 200, height: 200 });


function ensurePDFLibs() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('jsPDF ist noch nicht geladen');
  }
  if (!window.html2canvas) {
    throw new Error('html2canvas ist noch nicht geladen');
  }
}

async function downloadPDF() {
  ensurePDFLibs();
  document.body.classList.add('exporting');

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('portrait', 'mm', 'a4');

  const activeEl = document.querySelector('.svg-container.active');
  if (activeEl) activeEl.classList.remove('active');

  try {
    await renderAllTablesToPdfPages(pdf);
    pdf.save('kanji-raster.pdf');
  } finally {
    if (activeEl) activeEl.classList.add('active');

    document.body.classList.remove('exporting');
  }
}

async function printPDF() {
  ensurePDFLibs();
  document.body.classList.add('exporting');

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('portrait', 'mm', 'a4');

  const activeEl = document.querySelector('.svg-container.active');
  if (activeEl) activeEl.classList.remove('active');

  try {
    await renderAllTablesToPdfPages(pdf);
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const w = window.open(url);
    if (w) { w.onload = () => { w.focus(); w.print(); }; }
  } finally {
    if (activeEl) activeEl.classList.add('active');

    document.body.classList.remove('exporting');
  }
}


async function renderAllTablesToPdfPages(pdf) {
  const containers = document.querySelectorAll('.svg-container');
  const tablesPerPage = 5;     // Anzahl Tabellen pro A4-Seite
  const spacing = 5;           // vertikaler Abstand zwischen Tabellen
  const pageWidth = 210, pageHeight = 297, margin = 10; // mm (A4)
  const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
  const singleHeight = usableHeight / tablesPerPage;
  const usableWidth = pageWidth - 2 * margin;

  for (let i = 0; i < containers.length; i++) {
    // Offscreen-Klon für sauberes Rendering (z. B. fertige Strichreihenfolge)
    const clone = await App.makeOffscreenClone(containers[i]);
    await App.finalizeKanjiStrokes(clone);

    // 1) Nur das <svg> exportieren
    const svg = clone.querySelector('svg');
    if (!svg) {
      // Fallback: wenn kein <svg> gefunden → Badges sicher entfernen
      clone.querySelectorAll('.table-badge, [data-role="table-badge"]').forEach(n => n.remove());
    }

    // 2) Eigenen, leeren Wrapper bauen und NUR das SVG hinein kopieren
    const exportHost = document.createElement('div');
    exportHost.style.position = 'absolute';
    exportHost.style.left = '-99999px';
    exportHost.style.top = '0';
    document.body.appendChild(exportHost);

    let exportNode;
    if (svg) {
      exportNode = svg.cloneNode(true);   // reines SVG
      exportHost.appendChild(exportNode);
      clone.remove();                     // Klon nicht mehr nötig
    } else {
      exportNode = clone;                 // Fallback: ganzer Klon
      exportNode.querySelectorAll('.table-badge, [data-role="table-badge"]').forEach(n => n.remove());
      exportHost.appendChild(exportNode);
    }

    // 3) Optional: Nummern wie "#1", "#2" etc. (falls doch im SVG) entfernen
    exportHost.querySelectorAll('text').forEach(t => {
      const s = (t.textContent || '').trim();
      if (/^#\s*\d+/.test(s)) t.remove();
    });

    // 4) Fonts laden & Render stabilisieren
    if (document.fonts?.ready) {
      try { await document.fonts.ready; } catch {}
    }
    document.body.offsetHeight;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 5) In Canvas rendern (nur unser exportHost-Inhalt)
    const canvas = await html2canvas(exportHost, { useCORS: true, scale: 3 });

    // 6) Aufräumen
    exportHost.remove();

    // --- ab hier wie gehabt: Bild skalieren & ins PDF setzen ---
    const imgData = canvas.toDataURL('image/png');
    const imgWidthMm = canvas.width * 0.2646;
    const imgHeightMm = canvas.height * 0.2646;
    const scale = Math.min(usableWidth / imgWidthMm, singleHeight / imgHeightMm);

    const scaledWidth = imgWidthMm * scale;
    const scaledHeight = imgHeightMm * scale;
    const columnX = margin + (usableWidth - scaledWidth) / 2;
    const row = i % tablesPerPage;
    const columnY = margin + row * (scaledHeight + spacing);

    if (i > 0 && row === 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', columnX, columnY, scaledWidth, scaledHeight);
  }
}


// Buttons global verfügbar, da HTML onclick nutzt
window.downloadPDF = downloadPDF;
window.printPDF = printPDF;