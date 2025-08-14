const scripts = [
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js",
    "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"
];

scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
});

// ==============================
// Globale Variablen & Initialisierung
// ==============================
let svgTemplateText = "";   // Vorlage für die SVG-Tabelle
let svgLoaded = false;      // Status, ob die SVG-Datei geladen ist
let tableCount = 0;         // Interner Zähler für eindeutige IDs
const selector = document.getElementById("tableSelector"); // Dropdown für aktive Tabelle

// ==============================
// Logo einfügen
// ==============================
const logoDiv = document.getElementById("kanjiLogo");
const img = document.createElement("img");
img.src = "kanjiLogo.svg";
img.alt = "Kanji Logo";
img.style.width = "500px";
img.style.height = "auto";
img.style.display = "block";
img.style.margin = "0 auto";
logoDiv.appendChild(img);

// ==============================
// SVG laden
// ==============================
fetch('KanjiRaster.svg')
    .then(response => response.text())
    .then(data => {
        svgTemplateText = data;
        svgLoaded = true;
        addNewTable(); // Erste Tabelle automatisch erstellen
    });

// ==============================
// Tabelle verwalten
// ==============================

// Funktion: Aktive Tabelle markieren und scrollen
function markActiveTable(offset = 50) { // offset in Pixel
    const selectedId = selector.value;
    const allTables = document.querySelectorAll(".svg-container");

    allTables.forEach(table => {
        if (table.dataset.tableId === selectedId) {
            table.classList.add("active");

            // scrollen mit Offset
            const tableTop = table.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: tableTop - offset,
                behavior: 'smooth'
            });

        } else {
            table.classList.remove("active");
        }
    });
}

// Event Listener für Dropdown-Änderung
selector.addEventListener("change", markActiveTable);

// Funktion: Neue Tabelle hinzufügen
function addNewTable() {
    if (!svgLoaded) return;

    const container = document.getElementById("svg-pages");
    const wrapper = document.createElement("div");
    wrapper.classList.add("svg-container");

    const tableId = `table-${tableCount++}`; // interne ID bleibt eindeutig
    wrapper.dataset.tableId = tableId;
    wrapper.innerHTML = svgTemplateText;

    container.appendChild(wrapper);

    updateTableSelector();       // Dropdown aktualisieren
    selector.value = tableId;    // Neue Tabelle automatisch auswählen
    markActiveTable();           // Aktiv markieren
}

// Funktion: Dropdown dynamisch aktualisieren
function updateTableSelector() {
    const tables = document.querySelectorAll(".svg-container");
    selector.innerHTML = ''; // alte Optionen löschen

    tables.forEach((table, index) => {
        const option = document.createElement("option");
        option.value = table.dataset.tableId;
        option.textContent = `Tabelle ${index + 1}`; // Nummerierung dynamisch
        selector.appendChild(option);
    });
}

// Funktion: Tabelle löschen
function deleteTable() {
    const selectedId = selector.value;
    const tableToDelete = document.querySelector(`.svg-container[data-table-id="${selectedId}"]`);
    const optionToDelete = selector.querySelector(`option[value="${selectedId}"]`);

    if (tableToDelete && optionToDelete) {
        tableToDelete.remove();
        optionToDelete.remove();
    }

    // Neue Auswahl festlegen
    if (selector.options.length > 0) {
        selector.value = selector.options[0].value;
    } else {
        addNewTable(); // Falls keine Tabelle übrig, neue erstellen
    }

    markActiveTable();
}

// ==============================
// Tabelle mit Input füllen
// ==============================
function fillSVG() {
    if (!svgLoaded) {
        alert("Bitte warten – SVG wird noch geladen.");
        return;
    }

    const selectedId = selector.value;
    const allTables = document.querySelectorAll(".svg-container");
    const selectedTable = Array.from(allTables).find(t => t.dataset.tableId === selectedId);

    if (!selectedTable) {
        alert("Keine gültige Tabelle ausgewählt.");
        return;
    }

    // Werte aus Input-Feldern holen
    const kanji = document.getElementById("kanjiInput").value;
    const on = document.getElementById("onInput").value;
    const kun = document.getElementById("kunInput").value;
    const romaji = document.getElementById("romajiInput").value;

    // IDs in SVG, die befüllt werden
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
}

// ==============================
// PDF Export / Drucken
// ==============================
async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("portrait", "mm", "a4");

    // Temporär Hervorhebung entfernen
    const activeEl = document.querySelector(".svg-container.active");
    if (activeEl) activeEl.classList.remove("active");

    const containers = document.querySelectorAll(".svg-container");
    const tablesPerPage = 5;
    const spacing = 5;
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
    const singleHeight = usableHeight / tablesPerPage;
    const usableWidth = pageWidth - 2 * margin;

    for (let i = 0; i < containers.length; i++) {
        const canvas = await html2canvas(containers[i], { useCORS: true, scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const imgWidthMm = canvas.width * 0.2646;
        const imgHeightMm = canvas.height * 0.2646;
        const scale = Math.min(usableWidth / imgWidthMm, singleHeight / imgHeightMm);

        const scaledWidth = imgWidthMm * scale;
        const scaledHeight = imgHeightMm * scale;
        const columnX = margin + (usableWidth - scaledWidth) / 2;
        const row = i % tablesPerPage;
        const columnY = margin + row * (scaledHeight + spacing);

        if (i > 0 && row === 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", columnX, columnY, scaledWidth, scaledHeight);
    }

    // Hervorhebung wiederherstellen
    if (activeEl) activeEl.classList.add("active");

    pdf.save("kanji-raster.pdf");
}

async function printPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("portrait", "mm", "a4");

    // Temporär Hervorhebung entfernen
    const activeEl = document.querySelector(".svg-container.active");
    if (activeEl) activeEl.classList.remove("active");

    const containers = document.querySelectorAll(".svg-container");
    const tablesPerPage = 5;
    const spacing = 5;
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
    const singleHeight = usableHeight / tablesPerPage;
    const usableWidth = pageWidth - 2 * margin;

    for (let i = 0; i < containers.length; i++) {
        const canvas = await html2canvas(containers[i], { useCORS: true, scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const imgWidthMm = canvas.width * 0.2646;
        const imgHeightMm = canvas.height * 0.2646;
        const scale = Math.min(usableWidth / imgWidthMm, singleHeight / imgHeightMm);

        const scaledWidth = imgWidthMm * scale;
        const scaledHeight = imgHeightMm * scale;
        const columnX = margin + (usableWidth - scaledWidth) / 2;
        const row = i % tablesPerPage;
        const columnY = margin + row * (scaledHeight + spacing);

        if (i > 0 && row === 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", columnX, columnY, scaledWidth, scaledHeight);
    }

    // Hervorhebung wiederherstellen
    if (activeEl) activeEl.classList.add("active");

    const pdfBlob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl);

    printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
    };
}


// ==============================
// Input-Felder: Placeholder verschwinden beim Fokus
// ==============================
document.querySelectorAll('.input-group input[type="text"]').forEach(input => {
    const originalPlaceholder = input.placeholder;

    input.addEventListener('focus', () => {
        input.placeholder = '';
    });

    input.addEventListener('blur', () => {
        input.placeholder = originalPlaceholder;
    });
});

// ==============================
// Datei importieren (XML oder Excel)
// ==============================
function importFile() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) {
        alert("Keine Datei ausgewählt!");
        return;
    }

    // Prüfen, ob die Datei ein unterstütztes Format ist
    const isExcelLike = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".xml");

    if (!isExcelLike) {
        alert("Nur Excel-Dateien (.xlsx, .xls) oder Excel-XML (.xml) werden unterstützt.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        // Datei als ArrayBuffer für SheetJS einlesen
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Erstes Tabellenblatt auslesen
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Falls die erste Zeile nur Überschriften enthält → bei Zeile 1 starten
        for (let i = 0; i < json.length; i++) {
            const values = json[i];
            if (!values || values.length === 0) continue; // Überspringen, wenn leer

            // Neue Tabelle anlegen
            addNewTable();
            selector.value = selector.options[selector.options.length - 1].value;

            // Input-Felder befüllen
            document.getElementById("kanjiInput").value = values[0] || "";
            document.getElementById("romajiInput").value = values[1] || "";
            document.getElementById("kunInput").value = values[2] || "";
            document.getElementById("onInput").value = values[3] || "";

            // SVG befüllen
            fillSVG();
        }

        markActiveTable();
    };

    reader.readAsArrayBuffer(file);
}

// ==============================
// Scrollen zum Anfang der Seite beim Laden
// ==============================
// Ganz oben starten beim Laden
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'; // verhindert, dass der Browser die Scrollposition merkt
}

window.onload = () => {
    window.scrollTo(0, 0); // ganz oben starten
};

// ==============================
// Drag & Drop für Datei-Upload
// ==============================


const fileDropArea = document.getElementById('fileDropArea');
const fileInput = document.getElementById('fileInput');
const importBtn = document.getElementById('importBtn');
const fileDropText = document.getElementById('fileDropText');

let selectedFile = null; // Datei speichern, ohne sofort importieren

// Klick auf Bereich öffnet File Dialog
fileDropArea.addEventListener('click', () => fileInput.click());

// Datei auswählen (über Dialog)
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        fileDropText.textContent = `Ausgewählt: ${selectedFile.name}`;
    }
});

// Drag & Drop Events
fileDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropArea.classList.add('dragover');
});

fileDropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileDropArea.classList.remove('dragover');
});

fileDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropArea.classList.remove('dragover');

    if (e.dataTransfer.files.length > 0) {
        selectedFile = e.dataTransfer.files[0];
        fileInput.files = e.dataTransfer.files; // Input aktualisieren
        fileDropText.textContent = `Ausgewählt: ${selectedFile.name}`;
    }
});

// Import Button: Datei importieren
importBtn.addEventListener('click', () => {
    if (!selectedFile) {
        alert("Bitte zuerst eine Datei auswählen!");
        return;
    }
    importFile(selectedFile); // importFile anpassen, dass sie die Datei als Parameter nimmt
});

// Button zum Löschen aller Tabellen
document.getElementById('deleteAllBtn').addEventListener('click', () => {
    const confirmDelete = confirm("Bist du sicher, dass du **alle Tabellen** löschen möchtest?");
    if (!confirmDelete) return; // Abbrechen, wenn Nutzer "Abbrechen" klickt

    const allTables = document.querySelectorAll('.svg-container');
    allTables.forEach(table => table.remove()); // alle Tabellen löschen

    // Dropdown leeren
    selector.innerHTML = '';

    // Optional: Eine neue Tabelle automatisch erstellen
    addNewTable();

    markActiveTable(); // Aktive Tabelle markieren
});

// #svg-pages sortierbar machen
const sortableScript = document.createElement('script');
sortableScript.src = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js";
sortableScript.onload = () => {
    const svgPagesContainer = document.getElementById('svg-pages');

    const sortable = new Sortable(svgPagesContainer, {
        animation: 150,
        handle: '.svg-container',
        draggable: '.svg-container',
        onStart: function (evt) {
            evt.item.classList.add('dragging');
        },
        onEnd: function (evt) {
            evt.item.classList.remove('dragging');
            updateTableSelector();
            markActiveTable();
        }
    });
};
document.head.appendChild(sortableScript);
