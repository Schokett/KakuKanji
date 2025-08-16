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

    window.App = window.App || {};
    App.svgTemplateText = App.svgTemplateText || "";
    App.svgLoaded = App.svgLoaded || false;
    App.tableCount = App.tableCount || 0;
    App.selectorEl = App.selectorEl || document.getElementById("tableSelector");
    
  