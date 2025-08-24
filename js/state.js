  // Globale Zustände
window.App = {
  svgTemplateText: "",   // Text-Inhalt des SVG-Templates (KanjiRaster.svg)
  svgLoaded: false,       // Flag: Template geladen?
  tableCount: 0,          // Laufende Nummer für neue Tabellen
  selectorEl: null        // Referenz auf <select id="tableSelector">
};

// Kleines Debug-Log (abschaltbar)
window.DEBUG = false;
window.log = (...a) => { if (window.DEBUG) console.log('[App]', ...a); };

// Beim DOM-Start: Logo einsetzen & selectorEl referenzieren
window.addEventListener('DOMContentLoaded', () => {
  App.selectorEl = document.getElementById('tableSelector');

  const logoDiv = document.getElementById('kanjiLogo');
  if (logoDiv) {
    const img = document.createElement('img');
    img.src = 'kanjiLogo.svg';
    img.alt = 'Kanji Logo';
    Object.assign(img.style, { width: '500px', height: 'auto', display: 'block', margin: '0 auto' });
    logoDiv.appendChild(img);
  }
});

// SVG-Template laden (asynchron)
fetch('KanjiRaster.svg')
  .then(r => r.text())
  .then(txt => { App.svgTemplateText = txt; App.svgLoaded = true; })
  .catch(console.error);
