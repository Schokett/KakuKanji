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
// pdf.js – Export & Druck (Vector bevorzugt via svg2pdf.js, sonst Raster via html2canvas + jsPDF)

// ---- Welche <text>-Elemente im SVG dürfen ins PDF? (Whitelist nach IDs) ----
// pdf.js – Export & Druck (Vector bevorzugt; Raster Fallback)
// ----------------------------------------------------------
// Ziele:
// - Strichfolge finalisieren (App.finalizeKanjiStrokes)
// - Tabellen-Nummer/Badge niemals exportieren
// - Vektor (svg2pdf) wenn vorhanden, sonst hochauflösendes Raster (html2canvas)

const KEEP_TEXT_IDS = new Set([
  "MainKanji",
  "OnLesung",
  "KunLesung",
  "Romaji",
  "Kanjitr", "Kanjitr1", "Kanjitr2", "Kanjitr3", "Kanjitr4",
  "Kanjitr5", "Kanjitr6", "Kanjitr7", "Kanjitr8", "Kanjitr9"
]);

// --------- Hilfen ---------
function ensurePDFLibs(mode = "auto") {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error("jsPDF ist noch nicht geladen");
  }
  if ((mode === "raster" || mode === "auto") && typeof window.html2canvas !== "function") {
    // Im Auto-Mode nur warnen, wir versuchen evtl. Vector
    if (mode === "raster") throw new Error("html2canvas ist noch nicht geladen");
  }
  if (mode === "vector" && typeof window.svg2pdf !== "function") {
    throw new Error("svg2pdf.js ist nicht geladen");
  }
}

// Holt ein „fertiges“ SVG (Strichfolge final), dann säubert es (Badge/Nummer raus)
async function getPreparedCleanSvg(container) {
  // 1) Offscreen-Klon bauen & Striche finalisieren
  const cloneContainer = await App.makeOffscreenClone(container);
  await App.finalizeKanjiStrokes(cloneContainer);

  // 2) SVG aus dem fertigen Klon holen
  const baseSvg = cloneContainer.querySelector("svg");
  if (!baseSvg) {
    cloneContainer.remove();
    return null;
  }

  // 3) Saubere Kopie erstellen
  const clean = baseSvg.cloneNode(true);
  cloneContainer.remove();

  // 4) Nummern/Badges & fremde Texte entfernen
  clean.querySelectorAll(".table-badge, [data-role='table-badge']").forEach(n => n.remove());
  clean.querySelectorAll("text").forEach(t => {
    const id = t.getAttribute("id") || "";
    const txt = (t.textContent || "").trim();
    const isNumberish =
      /^#\s*\d+$/i.test(txt) ||
      /^tabelle\s*\d+$/i.test(txt) ||
      /^\d+$/.test(txt) ||
      /#\s*\d+\s*·/i.test(txt); // z.B. "#1 · 魚"
    if (!KEEP_TEXT_IDS.has(id) || isNumberish) {
      t.remove();
    }
  });

  // 5) Animations-Attribute neutralisieren → alles „fertig gezeichnet“
  clean.querySelectorAll("[stroke-dasharray], [stroke-dashoffset]").forEach(el => {
    el.removeAttribute("stroke-dasharray");
    el.removeAttribute("stroke-dashoffset");
    el.style.strokeDasharray = "none";
    el.style.strokeDashoffset = "0";
  });

  return clean;
}

// --------- VECTOR (svg2pdf.js) ---------
async function renderAllTablesToPdfPagesVector(pdf) {
  const containers = document.querySelectorAll(".svg-container");
  const tablesPerPage = 5;
  const spacing = 5;
  const pageWidth = 210, pageHeight = 297, margin = 10; // mm
  const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
  const singleHeight = usableHeight / tablesPerPage;
  const usableWidth = pageWidth - 2 * margin;

  for (let i = 0; i < containers.length; i++) {
    const cleanSvg = await getPreparedCleanSvg(containers[i]);
    if (!cleanSvg) continue;

    // BBox (Fallback wenn getBBox zickt)
    let bbox;
    try {
      bbox = cleanSvg.getBBox();
      if (!bbox || !isFinite(bbox.width) || !isFinite(bbox.height) || bbox.width === 0 || bbox.height === 0) {
        throw new Error("Invalid bbox");
      }
    } catch {
      bbox = { width: 800, height: 600 }; // px
    }

    const svgWidthMm  = bbox.width  * 0.2645833333;
    const svgHeightMm = bbox.height * 0.2645833333;
    const scale = Math.min(usableWidth / svgWidthMm, singleHeight / svgHeightMm);

    const scaledWidth  = svgWidthMm  * scale;
    const scaledHeight = svgHeightMm * scale;
    const row = i % tablesPerPage;
    const x = margin + (usableWidth - scaledWidth) / 2;
    const y = margin + row * (scaledHeight + spacing);

    if (i > 0 && row === 0) pdf.addPage();

    // Nur das bereinigte SVG in PDF (Vektor)
    window.svg2pdf(cleanSvg, pdf, {
      x, y, width: scaledWidth, height: scaledHeight,
      useCSS: true
      // -> Wenn du Fonts einbetten/mapen willst, hier optional fontCallback setzen
    });
  }
}

// --------- RASTER (html2canvas) ---------
async function renderAllTablesToPdfPagesRaster(pdf) {
  const containers = document.querySelectorAll(".svg-container");
  const tablesPerPage = 5;
  const spacing = 5;
  const pageWidth = 210, pageHeight = 297, margin = 10; // mm
  const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
  const singleHeight = usableHeight / tablesPerPage;
  const usableWidth = pageWidth - 2 * margin;

  for (let i = 0; i < containers.length; i++) {
    const cleanSvg = await getPreparedCleanSvg(containers[i]);
    if (!cleanSvg) continue;

    // Offscreen-Host nur mit dem bereinigten SVG
    const host = document.createElement("div");
    host.style.position = "absolute";
    host.style.left = "-99999px";
    host.style.top = "0";
    document.body.appendChild(host);
    host.appendChild(cleanSvg);

    // Fonts/Render stabilisieren
    if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
    document.body.offsetHeight;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // Hochauflösendes Raster (scale=3 ist guter Kompromiss)
    const canvas = await html2canvas(host, { useCORS: true, scale: 3 });
    host.remove();

    const imgData = canvas.toDataURL("image/png");
    const imgWidthMm  = canvas.width  * 0.2645833333;
    const imgHeightMm = canvas.height * 0.2645833333;
    const scale = Math.min(usableWidth / imgWidthMm, singleHeight / imgHeightMm);

    const scaledWidth  = imgWidthMm  * scale;
    const scaledHeight = imgHeightMm * scale;
    const row = i % tablesPerPage;
    const x = margin + (usableWidth - scaledWidth) / 2;
    const y = margin + row * (scaledHeight + spacing);

    if (i > 0 && row === 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);
  }
}

// --------- Öffentliche API ---------
// mode: "auto" (default) → Vector wenn svg2pdf vorhanden, sonst Raster
//       "vector"         → Vektor erzwingen
//       "raster"         → Raster erzwingen
async function downloadPDF(mode = "auto") {
  const vectorAvailable = typeof window.svg2pdf === "function";
  const finalMode = (mode === "auto") ? (vectorAvailable ? "vector" : "raster") : mode;

  ensurePDFLibs(finalMode);
  document.body.classList.add("exporting");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("portrait", "mm", "a4");

  // aktive Hervorhebung ausblenden, damit sie nicht in die PDF kommt
  const activeEl = document.querySelector(".svg-container.active");
  if (activeEl) activeEl.classList.remove("active");

  try {
    if (finalMode === "vector") {
      await renderAllTablesToPdfPagesVector(pdf);
    } else {
      await renderAllTablesToPdfPagesRaster(pdf);
    }
    pdf.save("kanji-raster.pdf");
  } finally {
    if (activeEl) activeEl.classList.add("active");
    document.body.classList.remove("exporting");
  }
}

async function printPDF(mode = "auto") {
  const vectorAvailable = typeof window.svg2pdf === "function";
  const finalMode = (mode === "auto") ? (vectorAvailable ? "vector" : "raster") : mode;

  ensurePDFLibs(finalMode);
  document.body.classList.add("exporting");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("portrait", "mm", "a4");

  const activeEl = document.querySelector(".svg-container.active");
  if (activeEl) activeEl.classList.remove("active");

  try {
    if (finalMode === "vector") {
      await renderAllTablesToPdfPagesVector(pdf);
    } else {
      await renderAllTablesToPdfPagesRaster(pdf);
    }

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const w = window.open(url);
    if (w) { w.onload = () => { w.focus(); w.print(); }; }
  } finally {
    if (activeEl) activeEl.classList.add("active");
    document.body.classList.remove("exporting");
  }
}

// HTML onclick Hooks
window.downloadPDF = downloadPDF;
window.printPDF = printPDF;

