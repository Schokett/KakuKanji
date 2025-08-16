const scripts = [
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"
    // Sortable NICHT hier laden – wir laden/initialisieren es weiter unten genau einmal
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

    if (kanji && kanji.trim()) {
        injectKanjiIntoMain(selectedTable, kanji).catch(console.error);
    }
}

// ==============================
// PDF Export / Drucken
// ==============================

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
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("portrait", "mm", "a4");

    const activeEl = document.querySelector(".svg-container.active");
    if (activeEl) activeEl.classList.remove("active");

    try {
        const containers = document.querySelectorAll(".svg-container");
        const tablesPerPage = 5;
        const spacing = 5;
        const pageWidth = 210, pageHeight = 297, margin = 10;
        const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
        const singleHeight = usableHeight / tablesPerPage;
        const usableWidth = pageWidth - 2 * margin;

        for (let i = 0; i < containers.length; i++) {
            const clone = await makeOffscreenClone(containers[i]);
            await finalizeKanjiStrokes(clone);

            // Fonts/Layout sicher anwenden lassen
            if (document.fonts && document.fonts.ready) {
                try { await document.fonts.ready; } catch (_) { }
            }
            document.body.offsetHeight; // Reflow
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const canvas = await html2canvas(clone, { useCORS: true, scale: 2 });
            clone.remove();

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

        pdf.save("kanji-raster.pdf");
    } finally {
        if (activeEl) activeEl.classList.add("active");
    }
}

async function printPDF() {
    ensurePDFLibs();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("portrait", "mm", "a4");

    const activeEl = document.querySelector(".svg-container.active");
    if (activeEl) activeEl.classList.remove("active");

    try {
        const containers = document.querySelectorAll(".svg-container");
        const tablesPerPage = 5;
        const spacing = 5;
        const pageWidth = 210, pageHeight = 297, margin = 10;
        const usableHeight = pageHeight - 2 * margin - (spacing * (tablesPerPage - 1));
        const singleHeight = usableHeight / tablesPerPage;
        const usableWidth = pageWidth - 2 * margin;

        for (let i = 0; i < containers.length; i++) {
            const clone = await makeOffscreenClone(containers[i]);
            await finalizeKanjiStrokes(clone);

            // Fonts/Layout sicher anwenden lassen
            if (document.fonts && document.fonts.ready) {
                try { await document.fonts.ready; } catch (_) { }
            }
            document.body.offsetHeight; // Reflow
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const canvas = await html2canvas(clone, { useCORS: true, scale: 2 });
            clone.remove();

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

        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        const w = window.open(url);
        w.onload = () => { w.focus(); w.print(); };
    } finally {
        if (activeEl) activeEl.classList.add("active");
    }
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

    const isExcelLike = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".xml");
    if (!isExcelLike) {
        alert("Nur Excel-Dateien (.xlsx, .xls) oder Excel-XML (.xml) werden unterstützt.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        for (let i = 0; i < json.length; i++) {
            const values = json[i];
            if (!values || values.length === 0) continue;

            addNewTable();
            selector.value = selector.options[selector.options.length - 1].value;

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
// Scrollen zum Anfang der Seite beim Laden
// ==============================
// Ganz oben starten beim Laden
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.onload = () => {
    window.scrollTo(0, 0);
};

// ==============================
// Drag & Drop für Datei-Upload
// ==============================
const fileDropArea = document.getElementById('fileDropArea');
const fileInput = document.getElementById('fileInput');
const importBtn = document.getElementById('importBtn');
const fileDropText = document.getElementById('fileDropText');

let selectedFile = null;

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
        fileInput.files = e.dataTransfer.files;
        fileDropText.textContent = `Ausgewählt: ${selectedFile.name}`;
    }
});

// Import Button: Datei importieren
importBtn.addEventListener('click', () => {
    if (!selectedFile) {
        alert("Bitte zuerst eine Datei auswählen!");
        return;
    }
    importFile(); // (Funktion liest selbst aus dem <input>)
});

// ==============================
// Sortable EINMAL laden & initialisieren
// ==============================
(function loadAndInitSortableOnce() {
    const s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js";
    s.onload = () => {
        const svgPagesContainer = document.getElementById('svg-pages');
        new Sortable(svgPagesContainer, {
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
    document.head.appendChild(s);
})();
// ==============================
// KanjiVG laden & als <g> zurückgeben
// ==============================
async function getKanjiVGGroup(kanji) {
    const index = await fetch('kvg-index.json').then(r => r.json());
    const uKey = 'u' + kanji.codePointAt(0).toString(16);
    const files = index[kanji] || index[uKey];
    if (!files || !files.length) throw new Error('Kein Eintrag im Index für: ' + kanji);
    const svgFile = files[0];

    let res = await fetch(`kanji/${svgFile}`);
    if (!res.ok) res = await fetch(svgFile);
    if (!res.ok) throw new Error(`SVG nicht gefunden: kanji/${svgFile} oder ./${svgFile}`);

    let svgText = await res.text();

    const start = svgText.indexOf('<svg');
    const end = svgText.lastIndexOf('</svg>');
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

// --- Einbetten in die aktive Tabelle an Stelle von #MainKanji ---
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

// finalisiert Striche in einem Root (hier auf dem KLON!)
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
    document.body.offsetHeight; // reflow
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

// erzeugt einen Offscreen-Klon eines Elements
async function makeOffscreenClone(el) {
    const clone = el.cloneNode(true);
    Object.assign(clone.style, {
        position: 'fixed',
        left: '-100000px',   // weit außerhalb
        top: '-100000px',
        // WICHTIG: KEIN opacity:0 und KEIN visibility:hidden!
        pointerEvents: 'none',
        zIndex: '-1'
    });
    document.body.appendChild(clone);
    return clone;
}

