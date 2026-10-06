const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  PageOrientation,
  TableLayoutType,
} = require('docx');

const FONT = 'Calibri';
const RED = 'FF0000';
const WHITE = 'FFFFFF';
const BLACK = '000000';
const LABEL_SIZE = 22; // 11pt
const VALUE_SIZE = 22; // 11pt
const SMALL_SIZE = 20; // 10pt
const EVIDENCE_TABLE_SIZE = 16; // 8pt (tablas de datos de los Examples)

const PAGE_WIDTH_TWIPS = 11906;
const PAGE_MARGIN_TWIPS = 1701;
const CONTENT_WIDTH_TWIPS = PAGE_WIDTH_TWIPS - PAGE_MARGIN_TWIPS * 2;

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
};

function headerLabelCell(text, columnSpan = 1, options = {}) {
  return new TableCell({
    columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    width: options.width,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: RED },
    borders: CELL_BORDER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: true,
            color: WHITE,
            font: FONT,
            size: options.size || LABEL_SIZE,
          }),
        ],
      }),
    ],
  });
}

function valueCell(text, columnSpan = 1, options = {}) {
  return new TableCell({
    columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    borders: CELL_BORDER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    width: options.width,
    children: [
      new Paragraph({
        alignment: options.alignment || AlignmentType.LEFT,
        children: [
          new TextRun({ text: text || '', font: FONT, size: options.size || VALUE_SIZE, color: BLACK }),
        ],
      }),
    ],
  });
}

/**
 * SECCIÓN 1 — Tabla de cabecera (12 columnas virtuales para poder combinar 3 y 4 celdas por fila).
 */
function buildHeaderTable(data) {
  const columnWidths = Array(12).fill(Math.floor(CONTENT_WIDTH_TWIPS / 12));

  return new Table({
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
    width: { size: CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
    columnWidths,
    rows: [
      new TableRow({
        children: [
          headerLabelCell('JIRA ID', 4),
          headerLabelCell('Descripción de la historia de usuario', 4),
          headerLabelCell('ENTIDAD (SBP/CSF)', 4),
        ],
      }),
      new TableRow({
        children: [
          valueCell(data.jiraId, 4, { alignment: AlignmentType.CENTER }),
          valueCell(data.descripcion, 4),
          valueCell(data.entidad, 4, { alignment: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          headerLabelCell('Fecha', 3),
          headerLabelCell('Analista QA', 3),
          headerLabelCell('Analista Desarrollador', 3),
          headerLabelCell('Browser o Plataforma', 3),
        ],
      }),
      new TableRow({
        children: [
          valueCell(data.fecha, 3, { alignment: AlignmentType.CENTER }),
          valueCell(data.analistasQA, 3),
          valueCell(data.analistasDev, 3),
          valueCell(data.plataforma, 3, { alignment: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          headerLabelCell('Usuario (s) - PO', 4),
          headerLabelCell('Tipo', 4),
          headerLabelCell('Ambiente de Pruebas', 4),
        ],
      }),
      new TableRow({
        children: [
          valueCell(data.usuario, 4),
          valueCell(data.tipo, 4, { alignment: AlignmentType.CENTER }),
          valueCell(data.ambiente, 4, { alignment: AlignmentType.CENTER }),
        ],
      }),
    ],
  });
}

/**
 * SECCIÓN 2 — Tabla de casos de prueba (una fila por cada fila de datos de cada Examples).
 */
function buildCasosTable(casos) {
  // Anchos explícitos en tblGrid y en cada celda: Google Docs/Drive ignoran el ancho
  // de la tabla si no existe la rejilla de columnas y colapsa las columnas.
  const colWidths = [0.13, 0.32, 0.4, 0.15].map((p) => Math.floor(CONTENT_WIDTH_TWIPS * p));
  const width = (i) => ({ size: colWidths[i], type: WidthType.DXA });

  const rows = [
    new TableRow({
      children: [
        headerLabelCell('N°', 1, { width: width(0) }),
        headerLabelCell('Casos de prueba', 1, { width: width(1) }),
        headerLabelCell('Resultado esperado', 1, { width: width(2) }),
        headerLabelCell('Resultado', 1, { width: width(3) }),
      ],
    }),
  ];

  for (const caso of casos) {
    rows.push(
      new TableRow({
        children: [
          valueCell(caso.numero, 1, { alignment: AlignmentType.CENTER, width: width(0) }),
          valueCell(caso.nombreCaso, 1, { width: width(1) }),
          valueCell(caso.resultadoEsperado, 1, { width: width(2) }),
          valueCell('', 1, { width: width(3) }),
        ],
      })
    );
  }

  return new Table({
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
    width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: colWidths,
    rows,
  });
}

/**
 * Mini tabla de evidencia: 2 filas (cabeceras del datatable + valores de una fila de datos).
 */
function buildEvidenceRowTable(headers, values) {
  // Regresión no tiene encabezados: la tabla solo lleva la fila de valores.
  const hasHeaders = Array.isArray(headers) && headers.length > 0;
  const columnCount = hasHeaders ? headers.length : values.length;
  if (columnCount === 0) {
    return null;
  }
  const colWidth = Math.floor(CONTENT_WIDTH_TWIPS / columnCount);

  const rows = [];
  if (hasHeaders) {
    rows.push(
      new TableRow({
        children: headers.map((h) =>
          headerLabelCell(h, 1, { size: EVIDENCE_TABLE_SIZE, width: { size: colWidth, type: WidthType.DXA } })
        ),
      })
    );
  }
  rows.push(
    new TableRow({
      children: values.map((v) =>
        valueCell(v, 1, {
          alignment: AlignmentType.CENTER,
          size: EVIDENCE_TABLE_SIZE,
          width: { size: colWidth, type: WidthType.DXA },
        })
      ),
    })
  );

  return new Table({
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
    width: { size: colWidth * columnCount, type: WidthType.DXA },
    columnWidths: Array(columnCount).fill(colWidth),
    rows,
  });
}

function screenshotPlaceholder() {
  return [
    new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: 'Evidencia (captura de pantalla):',
          italics: true,
          color: '666666',
          font: FONT,
          size: SMALL_SIZE,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Observaciones:', italics: true, color: '666666', font: FONT, size: SMALL_SIZE }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
  ];
}

/**
 * Intenta derivar el resultado esperado a nivel de Scenario Outline, a partir del
 * último bloque Then/And/But. No sustituye valores de ninguna fila de Examples en
 * particular (la Sección 2 es por escenario, no por caso de datos individual).
 */
function deriveExpectedResult(steps) {
  const lastThenIdx = steps.map((s) => s.keyword).lastIndexOf('Then');
  if (lastThenIdx === -1) return '';

  const relevant = steps
    .slice(lastThenIdx)
    .filter((s) => s.keyword === 'Then' || s.keyword === 'And' || s.keyword === 'But');

  if (relevant.length === 0) return '';

  // Un Then + una aserción adicional se puede resumir con precisión.
  // Más que eso deja de ser "breve y preciso", así que se prefiere dejar en blanco
  // para que el QA lo complete a mano.
  if (relevant.length > 2) return '';

  const sentences = relevant.map((step) => {
    let text = step.text.replace(/"/g, '').trim();
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text)) text += '.';
    return text;
  });

  const combined = sentences.join(' ');

  // Si queda algún placeholder <col> sin resolver, el texto no es autocontenido
  // a nivel de escenario -> se deja en blanco para que el QA lo complete.
  if (/<[^>]+>/.test(combined)) return '';

  return combined;
}

/**
 * Convierte la fecha del input type="date" (AAAA-MM-DD) a DD-MM-AAAA.
 * Si el valor no tiene ese formato se devuelve tal cual.
 */
function formatFecha(fecha) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : fecha || '';
}

function padNumero(n) {
  return String(n).padStart(3, '0');
}

/**
 * Construye el bloque completo (Secciones 1, 2 y 3) para un único feature parseado.
 */
function buildFeatureSections(featureResult, formData, warnings) {
  const { scenarios } = featureResult;
  const baseJiraId = formData.jiraId || 'SIN-ID';

  const platformSet = new Set();
  scenarios.forEach((sc) =>
    sc.examples.forEach((ex) => {
      if (!ex.platformTag) return;
      // platformTag puede venir como string compuesto ("android, ios") si el
      // bloque Examples tiene varios tags de plataforma a la vez; se separa en
      // tokens individuales para garantizar deduplicación real sin importar el
      // orden o cómo se combinaron los tags entre distintos Examples/escenarios.
      ex.platformTag
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => platformSet.add(t));
    })
  );
  const plataforma = [...platformSet].join(', ');

  const headerData = {
    jiraId: baseJiraId,
    descripcion: formData.jiraDescription || '',
    entidad: formData.entidad || '',
    fecha: formatFecha(formData.fecha),
    analistasQA: formData.analistasQA || '',
    analistasDev: formData.analistasDev || '',
    plataforma,
    usuario: formData.usuario || '',
    tipo: formData.tipo || '',
    ambiente: formData.ambiente || '',
  };

  // --- Sección 2: una fila por Scenario Outline (no por fila de datos) ---
  const casos = [];
  const scenarioBlocks = [];

  scenarios.forEach((scenario, scenarioIdx) => {
    // En Regresión el ID viene del CSV (REGRE-0001, CONV-0002...).
    const numero = scenario.regressionId || `${baseJiraId}-${padNumero(scenarioIdx + 1)}`;

    casos.push({
      numero,
      nombreCaso: scenario.name,
      resultadoEsperado: deriveExpectedResult(scenario.steps),
    });

    // --- Sección 3: sigue detallando cada example / fila de datos como evidencia ---
    // Cada fila de datos es un caso de prueba: se numera de forma consecutiva por
    // plataforma (Example 1 – @chrome, Example 2 – @chrome, Example 1 – @safari, ...).
    const contadorPorPlataforma = {};
    const exampleBlocks = [];
    for (const example of scenario.examples) {
      const plataformaEx = example.platformTag || '';
      for (const row of example.rows) {
        contadorPorPlataforma[plataformaEx] = (contadorPorPlataforma[plataformaEx] || 0) + 1;
        exampleBlocks.push({
          titulo: `Example ${contadorPorPlataforma[plataformaEx]}${plataformaEx ? ` – @${plataformaEx}` : ''}`,
          rowTables: [{ table: buildEvidenceRowTable(example.headers, row.values) }],
        });
      }
    }

    scenarioBlocks.push({
      tituloId: numero,
      nombre: scenario.name,
      exampleBlocks,
    });
  });

  // --- Construye los children (Paragraphs/Tables) del documento ---
  const children = [];

  children.push(buildHeaderTable(headerData));
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  children.push(buildCasosTable(casos));
  children.push(new Paragraph({ text: '', spacing: { after: 300 } }));

  for (const block of scenarioBlocks) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: `${block.tituloId} ${block.nombre}`,
            bold: true,
            font: FONT,
            size: LABEL_SIZE,
          }),
        ],
      })
    );

    for (const example of block.exampleBlocks) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: example.titulo,
              bold: true,
              italics: true,
              font: FONT,
              size: VALUE_SIZE,
            }),
          ],
        })
      );

      for (const rt of example.rowTables) {
        if (rt.table) {
          children.push(rt.table);
        }
        children.push(...screenshotPlaceholder());
      }
    }
  }

  return { children, plataforma };
}

function wrapAsDocument(children) {
  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE_WIDTH_TWIPS,
              height: 16838,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: PAGE_MARGIN_TWIPS,
              bottom: PAGE_MARGIN_TWIPS,
              left: PAGE_MARGIN_TWIPS,
              right: PAGE_MARGIN_TWIPS,
            },
          },
        },
        children,
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: FONT, size: VALUE_SIZE },
        },
      },
    },
  });
}

function sanitizeFileNamePart(text, maxLength = 60) {
  let result = (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes/diacríticos
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
    const lastDash = result.lastIndexOf('-');
    // Corta en el último guión completo (palabra completa) si no se pierde demasiado.
    if (lastDash > maxLength * 0.5) {
      result = result.slice(0, lastDash);
    }
  }

  return result;
}

/**
 * Genera un documento .docx independiente por cada feature parseado.
 * Nombre de archivo: {nombreDelArchivo.feature}-{Plataforma}.docx
 * @param {{features: Array, formData: Object}} params
 * @returns {Promise<{documents: Array<{fileName: string, buffer: Buffer}>, warnings: string[]}>}
 */
async function generateEvidenceDocuments({ features, formData, modo = 'certificacion' }) {
  const warnings = [];
  const documents = [];

  for (const featureResult of features) {
    const originalBaseName = featureResult.fileName.replace(/\.(feature|csv)$/i, '');

    // Certificación: un documento por archivo.
    // Regresión: un documento por tipo de escenario (prefijo del ID: REGRE, CONV...),
    // con todos sus escenarios en secuencia dentro del mismo documento.
    let parts = [{ featureResult, nameBase: originalBaseName }];
    if (modo === 'regresion') {
      const grupos = new Map();
      featureResult.scenarios.forEach((sc) => {
        const tipo = sc.regressionId.split('-')[0].toUpperCase();
        if (!grupos.has(tipo)) grupos.set(tipo, []);
        grupos.get(tipo).push(sc);
      });
      parts = [...grupos].map(([tipo, scenarios]) => ({
        featureResult: { ...featureResult, scenarios },
        nameBase: tipo,
      }));
    }

    for (const part of parts) {
      const { children, plataforma } = buildFeatureSections(part.featureResult, formData, warnings);
      const doc = wrapAsDocument(children);
      // eslint-disable-next-line no-await-in-loop
      const buffer = await Packer.toBuffer(doc);

      const namePart = sanitizeFileNamePart(part.nameBase, 80) || 'Feature';
      const platformPart = sanitizeFileNamePart(plataforma, 30) || 'SinPlataforma';
      const fileName = `${namePart}-${platformPart}.docx`;

      documents.push({ fileName, buffer });
    }
  }

  return { documents, warnings };
}

module.exports = {
  generateEvidenceDocuments,
  deriveExpectedResult,
};
