// Externe Libs laden (ohne Sortable — das macht ui.js exakt einmal)
[
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"
  ].forEach(src => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    document.head.appendChild(s);
  });
  
  // Globale Zustände
  window.App = {
    svgTemplateText: "",
    svgLoaded: false,
    tableCount: 0,
    selectorEl: null,
  };
  
  // kleines Log (schaltbar)
  window.DEBUG = false;
  window.log = (...a) => { if (window.DEBUG) console.log('[App]', ...a); };
  
  // Logo einsetzen
  window.addEventListener('DOMContentLoaded', () => {
    App.selectorEl = document.getElementById("tableSelector");
    const logoDiv = document.getElementById("kanjiLogo");
    if (logoDiv) {
      const img = document.createElement("img");
      img.src = "kanjiLogo.svg";
      img.alt = "Kanji Logo";
      Object.assign(img.style, { width: "500px", height: "auto", display: "block", margin: "0 auto" });
      logoDiv.appendChild(img);
    }
  });
  
  // SVG-Template laden
  fetch('KanjiRaster.svg')
    .then(r => r.text())
    .then(txt => {
      App.svgTemplateText = txt;
      App.svgLoaded = true;
    })
    .catch(console.error);
  