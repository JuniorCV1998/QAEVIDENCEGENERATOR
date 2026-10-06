/**
 * Parser del CSV de Regresión.
 *
 * Formato esperado (los separadores pueden ser "|", ";" o ","):
 *
 *   REGRE-0001  @Scenario Outline:  Validar flujo de incremento exitoso
 *   AND@|LIQUIDEZ SOLES|vencido|PUSH
 *   IOS@|LIQUIDEZ DOLARES|vencido|AS IS
 *
 *   CONV-0002  @Scenario Outline:  Validar flujo de rescate exitoso
 *   CHROME@|LIQUIDEZ SOLES|vencido|PUSH
 *
 * - Una línea que empieza con el ID del escenario abre un nuevo escenario.
 * - Las líneas siguientes son filas de datos: la primera columna es la plataforma
 *   (se toma el texto sin "@") y el resto son los valores de la tabla de evidencia.
 * - No hay encabezados: las tablas de Regresión solo muestran los valores.
 */

const SCENARIO_RE = /^\s*([A-Za-z]+-\d+)[\s,;|]+@?\s*Scenario\s+Outline\s*:?[\s,;|]*(.*)$/i;

class RegressionCsvError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'RegressionCsvError';
    this.code = code;
  }
}

function splitRow(line) {
  const delimiter = line.includes('|') ? '|' : line.includes(';') ? ';' : ',';
  const cells = line.split(delimiter).map((c) => c.trim().replace(/^"(.*)"$/, '$1').trim());

  if (delimiter === '|') {
    // "|a|b|" genera celdas vacías en los extremos: se descartan.
    if (cells.length && cells[0] === '') cells.shift();
    if (cells.length && cells[cells.length - 1] === '') cells.pop();
  }
  return cells;
}

/**
 * @param {string} content  contenido del CSV (texto)
 * @param {string} fileName nombre original del archivo
 * @returns {{fileName: string, scenarios: Array, warnings: string[]}}
 */
function parseRegressionCsv(content, fileName) {
  const text = (content || '').replace(/^﻿/, '');
  const warnings = [];
  const scenarios = [];
  let current = null;

  text.split(/\r?\n/).forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return;

    const match = line.match(SCENARIO_RE);
    if (match) {
      current = {
        regressionId: match[1],
        name: match[2].replace(/[\s,;|]+$/, '').trim(),
        steps: [],
        examples: [],
      };
      scenarios.push(current);
      return;
    }

    if (!current) {
      warnings.push(`Línea ${idx + 1} ignorada: no pertenece a ningún escenario.`);
      return;
    }

    const [platformCell, ...values] = splitRow(line);
    const platformTag = (platformCell || '').replace(/@/g, '').trim().toUpperCase();

    if (!platformTag || values.length === 0) {
      warnings.push(`Línea ${idx + 1} de ${current.regressionId} ignorada: formato no válido.`);
      return;
    }

    // Cada fila es un caso: un bloque Example propio, sin encabezados.
    current.examples.push({ platformTag, headers: null, rows: [{ values }] });
  });

  const validScenarios = scenarios.filter((sc) => {
    if (sc.examples.length === 0) {
      warnings.push(`${sc.regressionId} no tiene filas de datos y se omite.`);
      return false;
    }
    return true;
  });

  if (validScenarios.length === 0) {
    throw new RegressionCsvError(
      `"${fileName}" no contiene escenarios válidos. Cada escenario debe empezar con una línea como "REGRE-0001  @Scenario Outline:  Nombre".`,
      'CSV_NO_SCENARIOS'
    );
  }

  return { fileName, scenarios: validScenarios, warnings };
}

module.exports = {
  parseRegressionCsv,
  RegressionCsvError,
};
