/* ui.js — Tabellen-UI, Inputs, Import, Sortable, Fill + Tour */

// ==============================
// Tabellen / Auswahl / Scroll
// ==============================
function markActiveTable(offset = 50, doScroll = true) {
  const selectedId = App.selectorEl.value;
  const allTables = document.querySelectorAll(".svg-container");

  allTables.forEach(table => {
    if (table.dataset.tableId === selectedId) {
      table.classList.add("active");
      if (doScroll) {
        const tableTop = table.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: tableTop - offset, behavior: 'smooth' });
      }
    } else {
      table.classList.remove("active");
    }
  });
}

function updateTableSelector() {
  const tables = document.querySelectorAll(".svg-container");
  App.selectorEl.innerHTML = '';
  tables.forEach((table, index) => {
    const option = document.createElement("option");
    option.value = table.dataset.tableId;
    option.textContent = `Tabelle ${index + 1}`;
    App.selectorEl.appendChild(option);
  });
}

function addNewTable() {
  if (!App.svgLoaded) return;
  const container = document.getElementById("svg-pages");
  const wrapper = document.createElement("div");
  wrapper.classList.add("svg-container");
  const tableId = `table-${App.tableCount++}`;
  wrapper.dataset.tableId = tableId;
  wrapper.innerHTML = App.svgTemplateText;
  container.appendChild(wrapper);

  updateTableSelector();
  App.selectorEl.value = tableId;
  markActiveTable(50, false);
}

function deleteTable() {
  const selectedId = App.selectorEl.value;
  const tableToDelete = document.querySelector(`.svg-container[data-table-id="${selectedId}"]`);
  const optionToDelete = App.selectorEl.querySelector(`option[value="${selectedId}"]`);
  if (tableToDelete) tableToDelete.remove();
  if (optionToDelete) optionToDelete.remove();

  if (App.selectorEl.options.length > 0) {
    App.selectorEl.value = App.selectorEl.options[0].value;
  } else {
    addNewTable();
  }
  markActiveTable();
}

// ==============================
// SVG füllen
// ==============================
function fillSVG() {
  if (!App.svgLoaded) { alert("Bitte warten – SVG wird noch geladen."); return; }

  const selectedId = App.selectorEl.value;
  const allTables = document.querySelectorAll(".svg-container");
  const selectedTable = Array.from(allTables).find(t => t.dataset.tableId === selectedId);
  if (!selectedTable) { alert("Keine gültige Tabelle ausgewählt."); return; }

  const kanji = document.getElementById("kanjiInput").value;
  const on = document.getElementById("onInput").value;
  const kun = document.getElementById("kunInput").value;
  const romaji = document.getElementById("romajiInput").value;

  const ids = [
    ["MainKanji", kanji],
    ["OnLesung", on],
    ["KunLesung", kun],
    ["Romaji", romaji],
    ["Kanjitr", kanji],
    ["Kanjitr1", kanji],
    ["Kanjitr2", kanji],
    ["Kanjitr3", kanji],
    ["Kanjitr4", kanji],
    ["Kanjitr5", kanji],
    ["Kanjitr6", kanji],
    ["Kanjitr7", kanji],
    ["Kanjitr8", kanji],
    ["Kanjitr9", kanji],
  ];
  ids.forEach(([id, value]) => {
    const el = selectedTable.querySelector(`#${id}`);
    if (el) el.textContent = value;
  });

  if (kanji && kanji.trim()) {
    App.injectKanjiIntoMain(selectedTable, kanji).catch(console.error);
  }
}

// ==============================
// Events & Init (DOM ready)
// ==============================
window.addEventListener('DOMContentLoaded', () => {
  // Dropdown-Änderung
  App.selectorEl.addEventListener("change", () => markActiveTable(50, true));

  // Erste Tabelle automatisch erstellen, sobald Template geladen ist
  const tryInit = setInterval(() => {
    if (App.svgLoaded) {
      clearInterval(tryInit);
      addNewTable();
    }
  }, 50);

  // Input-UX
  document.querySelectorAll('.input-group input[type="text"]').forEach(input => {
    const ph = input.placeholder;
    input.addEventListener('focus', () => input.placeholder = '');
    input.addEventListener('blur', () => input.placeholder = ph);
  });

  // Import Button
  const fileDropArea = document.getElementById('fileDropArea');
  const fileInput = document.getElementById('fileInput');
  const importBtn = document.getElementById('importBtn');
  const fileDropText = document.getElementById('fileDropText');
  let selectedFile = null;

  fileDropArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      fileDropText.textContent = `Ausgewählt: ${selectedFile.name}`;
    }
  });
  fileDropArea.addEventListener('dragover', (e) => { e.preventDefault(); fileDropArea.classList.add('dragover'); });
  fileDropArea.addEventListener('dragleave', (e) => { e.preventDefault(); fileDropArea.classList.remove('dragover'); });
  fileDropArea.addEventListener('drop', (e) => {
    e.preventDefault(); fileDropArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      selectedFile = e.dataTransfer.files[0];
      fileInput.files = e.dataTransfer.files;
      fileDropText.textContent = `Ausgewählt: ${selectedFile.name}`;
    }
  });
  importBtn.addEventListener('click', () => {
    if (!selectedFile) { alert("Bitte zuerst eine Datei auswählen!"); return; }
    importFile();
  });

  // „Alle Tabellen löschen“
  document.getElementById('deleteAllBtn').addEventListener('click', () => {
    if (!confirm("Bist du sicher, dass du **alle Tabellen** löschen möchtest?")) return;
    document.querySelectorAll('.svg-container').forEach(t => t.remove());
    App.selectorEl.innerHTML = '';
    addNewTable();
    markActiveTable();
  });

  // Buttons mit globalen Funktionen verknüpfen, falls du onclick nutzt
  window.addNewTable = addNewTable;
  window.deleteTable = deleteTable;
  window.fillSVG = fillSVG;

  // Sortable EINMAL laden & initialisieren
  const s = document.createElement('script');
  s.src = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js";
  s.onload = () => {
    const svgPagesContainer = document.getElementById('svg-pages');
    new Sortable(svgPagesContainer, {
      animation: 150,
      handle: '.svg-container',
      draggable: '.svg-container',
      onStart: (evt) => evt.item.classList.add('dragging'),
      onEnd: (evt) => { evt.item.classList.remove('dragging'); updateTableSelector(); markActiveTable(); }
    });
  };
  document.head.appendChild(s);
});

// Scrollposition kontrollieren
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('load', () => window.scrollTo(0, 0));

// ==============================
// Excel/XML Import
// ==============================
function importFile() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) { alert("Keine Datei ausgewählt!"); return; }

  const ok = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".xml");
  if (!ok) { alert("Nur Excel-Dateien (.xlsx, .xls) oder Excel-XML (.xml) werden unterstützt."); return; }

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (let i = 0; i < json.length; i++) {
      const values = json[i];
      if (!values?.length) continue;

      addNewTable();
      App.selectorEl.value = App.selectorEl.options[App.selectorEl.options.length - 1].value;

      document.getElementById("kanjiInput").value = values[0] || "";
      document.getElementById("romajiInput").value = values[1] || "";
      document.getElementById("kunInput").value = values[2] || "";
      document.getElementById("onInput").value = values[3] || "";

      fillSVG();
    }
    markActiveTable();
  };
  reader.readAsArrayBuffer(file);
}

// ==============================
// Tour-Guide (repariert)
// ==============================

// Schritte
const TOUR_STEPS = [
  { selector: '#kanjiInput', title: 'Kanji eingeben', text: 'Schreibe hier das Zeichen, das du üben möchtest (z. B. 魚).' },
  // { selector: '#romajiInput',  title: 'Romaji',               text: 'Optional: Romaji hinzufügen (z. B. “sakana”).' },
  // { selector: '#kunInput',     title: 'Kun-Lesung',           text: 'Optional: Kun-Lesung eintragen (japanische Lesung).' },
  // { selector: '#onInput',      title: 'On-Lesung',            text: 'Optional: On-Lesung eintragen (chinesische Lesung).' },
  {
    selector: '#romajiInput, #kunInput, #onInput',
    title: 'Optionale Felder',
    text: 'Diese drei Felder sind optional. Du kannst Romaji, Kun- und On-Lesung eintragen, musst aber nicht.'
  },
  // Schritt-Definition: Anker-Element extra angeben
  {
    selector: '#fillBtn, #svg-pages',
    anchor: '#fillBtn',
    title: 'In Tabelle eintragen',
    text: 'Füllt die aktuelle Tabelle aus und fügt das Kanji mit Strichreihenfolge ein.'
  },
  { selector: '#tableSelector', title: 'Tabelle wechseln', text: 'Über dieses Menü kannst du zwischen deinen Tabellen wechseln.' },
  { selector: '#addTableBtn', title: 'Weitere Tabelle', text: 'Erzeuge zusätzliche Übungsblätter. Aktive Tabelle leuchet rot auf' },
  { selector: '#fileDropArea', title: 'Excel/XML Import', text: 'Ziehe Excel/XML hierher oder wähle eine Datei — jede Zeile wird eine Tabelle.' },
  // { selector: '#downloadBtn', title: 'PDF speichern', text: 'Exportiert als PDF. Striche werden fürs PDF fertig gezeichnet.' },
  // { selector: '#printBtn', title: 'Direkt drucken', text: 'Druckt die Seiten direkt aus dem Browser.' },
  // { selector: '#deleteAllBtn', title: 'Aufräumen', text: 'Löscht alle Tabellen. Danach kannst du sofort neue anlegen.' },
];

let tourState = { step: 0, overlay: null, highlights: [], popover: null };

function createTourLayer() {
  const overlay = document.createElement('div');
  overlay.className = 'tour-overlay';

  const pop = document.createElement('div');
  pop.className = 'tour-popover';
  pop.innerHTML = `
    <h4></h4>
    <p></p>
    <div class="tour-actions">
      <button class="tour-skip">Skip</button>
      <button class="tour-prev">Zurück</button>
      <button class="tour-next">Weiter</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(pop);

  pop.querySelector('.tour-skip').addEventListener('click', endTour);
  pop.querySelector('.tour-prev').addEventListener('click', prevStep);
  pop.querySelector('.tour-next').addEventListener('click', nextStep);

  tourState.overlay = overlay;
  tourState.popover = pop;

  window.addEventListener('resize', positionCurrentStep, { passive: true });
  window.addEventListener('scroll', positionCurrentStep, { passive: true });
}

function destroyTourLayer() {
  window.removeEventListener('resize', positionCurrentStep);
  window.removeEventListener('scroll', positionCurrentStep);
  tourState.overlay?.remove();
  tourState.popover?.remove();
  tourState.highlights.forEach(h => h.remove());
  tourState = { step: 0, overlay: null, highlights: [], popover: null };
}

function positionCurrentStep() {
  const step = TOUR_STEPS[tourState.step];
  if (!step) return;

  const els = document.querySelectorAll(step.selector);
  if (!els.length) return;

  // Alte Highlights entfernen
  tourState.highlights.forEach(h => h.remove());
  tourState.highlights = [];

  // Einzelne Highlights zeichnen UND gleichzeitig die gemeinsame Bounding-Box berechnen
  const pad = 8; // kleiner Rand um jedes Feld
  let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;

  els.forEach(el => {
    const r = el.getBoundingClientRect();

    // Einzelnes Highlight
    const hl = document.createElement('div');
    hl.className = 'tour-highlight';
    Object.assign(hl.style, {
      top: (r.top + window.scrollY - pad) + 'px',
      left: (r.left + window.scrollX - pad) + 'px',
      width: (r.width + pad * 2) + 'px',
      height: (r.height + pad * 2) + 'px',
      zIndex: 10001
    });
    document.body.appendChild(hl);
    tourState.highlights.push(hl);

    // Union-Box updaten (ohne pad, Popover richtet sich an der echten Gruppe aus)
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  });

  // in Dokument-Koordinaten umrechnen
  top += window.scrollY;
  left += window.scrollX;
  right += window.scrollX;
  bottom += window.scrollY;

  const groupRect = {
    top, left, right, bottom,
    width: right - left,
    height: bottom - top
  };

  // Popover-Inhalt setzen
  const pop = tourState.popover;
  pop.querySelector('h4').textContent = step.title || '';
  pop.querySelector('p').textContent = step.text || '';

  // === NEU: Anchor-Logik ===
  // Falls ein "anchor" im Step angegeben ist → Popover daran ausrichten
  let anchorEl = step.anchor ? document.querySelector(step.anchor) : null;
  let rect;

  if (anchorEl) {
    rect = anchorEl.getBoundingClientRect();
    rect = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  } else {
    rect = groupRect; // fallback: gesamte Gruppe
  }

  // Popover-Position berechnen
  const margin = 12;
  const maxWidth = 360;     // entspricht .tour-popover max-width
  const approxHeight = 140; // geschätzte Höhe

  let popTop = rect.bottom + margin;
  let popLeft = rect.left;

  // Horizontal innerhalb des Viewports halten
  const viewportLeft = window.scrollX + 16;
  const viewportRight = window.scrollX + window.innerWidth - 16;

  if (popLeft + maxWidth > viewportRight) {
    popLeft = viewportRight - maxWidth;
  }
  if (popLeft < viewportLeft) {
    popLeft = viewportLeft;
  }

  // Wenn unten kein Platz → oberhalb anzeigen
  const viewportBottom = window.scrollY + window.innerHeight - 16;
  if (popTop + approxHeight > viewportBottom) {
    popTop = rect.top - approxHeight - margin;
  }

  // Popover sichtbar platzieren (über den Highlights)
  Object.assign(pop.style, {
    top: popTop + 'px',
    left: popLeft + 'px',
    zIndex: 10002
  });

  // Gruppe in den Viewport holen (falls sie außerhalb liegt)
  const viewportTop = window.scrollY;
  const desiredTop = rect.top - 80; // kleiner Offset unter die Top-Leiste
  const groupOutOfView =
    rect.top < viewportTop ||
    rect.bottom > viewportBottom + 16;

  if (groupOutOfView) {
    window.scrollTo({ top: Math.max(desiredTop, 0), behavior: 'smooth' });
  }
}






function showStep(i) {
  tourState.step = i;

  let tries = 0;
  while (tries < TOUR_STEPS.length) {
    const s = TOUR_STEPS[tourState.step];
    if (document.querySelector(s.selector)) break;
    tourState.step = (tourState.step + 1) % TOUR_STEPS.length;
    tries++;
  }

  if (tries >= TOUR_STEPS.length) { endTour(); return; }

  positionCurrentStep();

  const el = document.querySelector(TOUR_STEPS[tourState.step].selector);
  const rect = el.getBoundingClientRect();
  const scrollY = rect.top + window.scrollY - 80;
  window.scrollTo({ top: scrollY, behavior: 'smooth' });
}

function nextStep() {
  if (tourState.step >= TOUR_STEPS.length - 1) endTour();
  else showStep(tourState.step + 1);
}

function prevStep() {
  if (tourState.step <= 0) return;
  showStep(tourState.step - 1);
}

// *** Repariert: keine Namenskollision mehr ***
// interne Startfunktion
function startTourReal(force = false) {
  if (!force && localStorage.getItem('seenTourV1') === '1') return;
  createTourLayer();
  showStep(0);
  localStorage.setItem('seenTourV1', '1');
}

function endTour() {
  destroyTourLayer();
}

// // Autostart, sobald DOM & erstes Layout durch sind
// window.addEventListener('DOMContentLoaded', () => {
//   requestAnimationFrame(() => {
//     setTimeout(() => startTourReal(false), 200);
//   });
// });

// window.addEventListener('DOMContentLoaded', () => {
//   setTimeout(() => {
//     if (confirm("Brauchst du Hilfe beim Einstieg?")) {
//       startTourReal(true);
//     }
//   }, 1000); // nach 0,5s
// });
window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('helpModal');
  const helpBtn = document.getElementById('helpBtn');

  // Klick auf Hilfe-Button → Modal öffnen
  helpBtn.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  document.getElementById('helpYes').addEventListener('click', () => {
    modal.style.display = 'none';
    startTourReal(true); // Tour starten
  });

  document.getElementById('helpNo').addEventListener('click', () => {
    modal.style.display = 'none';
  });
});


// Für Konsole/Buttons
window.resetTour = () => localStorage.removeItem('seenTourV1');
window.startTour = () => startTourReal(true); // erzwingt Start
window.endTour = endTour;
