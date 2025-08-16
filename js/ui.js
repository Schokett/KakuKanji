// Tabellen-UI, Inputs, Import, Sortable, Fill

function markActiveTable(offset = 50) {
    const selectedId = App.selectorEl.value;
    const allTables = document.querySelectorAll(".svg-container");
  
    allTables.forEach(table => {
      if (table.dataset.tableId === selectedId) {
        table.classList.add("active");
        const tableTop = table.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: tableTop - offset, behavior: 'smooth' });
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
    markActiveTable();
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
  
  function fillSVG() {
    if (!App.svgLoaded) { alert("Bitte warten – SVG wird noch geladen."); return; }
  
    const selectedId = App.selectorEl.value;
    const allTables = document.querySelectorAll(".svg-container");
    const selectedTable = Array.from(allTables).find(t => t.dataset.tableId === selectedId);
    if (!selectedTable) { alert("Keine gültige Tabelle ausgewählt."); return; }
  
    const kanji  = document.getElementById("kanjiInput").value;
    const on     = document.getElementById("onInput").value;
    const kun    = document.getElementById("kunInput").value;
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
  
  // Events & Init wenn DOM bereit
  window.addEventListener('DOMContentLoaded', () => {
    // Dropdown-Änderung
    App.selectorEl.addEventListener("change", markActiveTable);
  
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
      input.addEventListener('blur',  () => input.placeholder = ph);
    });
  
    // Import Button
    const fileDropArea = document.getElementById('fileDropArea');
    const fileInput    = document.getElementById('fileInput');
    const importBtn    = document.getElementById('importBtn');
    const fileDropText = document.getElementById('fileDropText');
    let selectedFile   = null;
  
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
    window.addNewTable   = addNewTable;
    window.deleteTable   = deleteTable;
    window.fillSVG       = fillSVG;
  
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
  
  // Excel/XML Import (gleich geblieben)
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
  
        document.getElementById("kanjiInput").value  = values[0] || "";
        document.getElementById("romajiInput").value = values[1] || "";
        document.getElementById("kunInput").value    = values[2] || "";
        document.getElementById("onInput").value     = values[3] || "";
  
        fillSVG();
      }
      markActiveTable();
    };
    reader.readAsArrayBuffer(file);
  }
  