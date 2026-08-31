const fs = require('fs');
const path = require('path');
const { Parser, AstBuilder, GherkinClassicTokenMatcher } = require('@cucumber/gherkin');
const { IdGenerator } = require('@cucumber/messages');

// @DFPEWEMA-2017-001 -> DFPEWEMA-2017-001
const JIRA_ID_TAG_RE = /^@([A-Za-z]+-\d+-\d+)$/;
// @josue.lazo -> josue.lazo (letras/numeros, sin guiones, con un punto)
const QA_ANALYST_TAG_RE = /^@([a-z0-9]+\.[a-z0-9]+)$/i;
// @manual / @automated
const TYPE_TAG_RE = /^@(manual|automated)$/i;

class GherkinParseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GherkinParseError';
    this.code = code;
  }
}

function createParser() {
  return new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());
}

/**
 * Parsea el contenido de un archivo .feature y devuelve una estructura
 * lista para alimentar el generador de Word.
 */
function parseFeatureContent(content, fileName) {
  let gherkinDocument;
  try {
    gherkinDocument = createParser().parse(content);
  } catch (err) {
    throw new GherkinParseError(
      `"${fileName}" tiene errores de sintaxis Gherkin:\n${err.message}`,
      'GHERKIN_SYNTAX_ERROR'
    );
  }

  const feature = gherkinDocument.feature;
  if (!feature) {
    throw new GherkinParseError(
      `"${fileName}" no contiene una declaración "Feature:".`,
      'NO_FEATURE'
    );
  }

  const scenarioChildren = (feature.children || []).filter((c) => c.scenario);
  if (scenarioChildren.length === 0) {
    throw new GherkinParseError(
      `"${fileName}" (Feature: ${feature.name || 'sin nombre'}) no contiene ningún Scenario.`,
      'NO_SCENARIOS'
    );
  }

  const warnings = [];
  const scenarios = scenarioChildren.map(({ scenario }) =>
    parseScenario(scenario, fileName, warnings)
  );

  return {
    fileName,
    featureName: feature.name || '(sin nombre)',
    featureDescription: (feature.description || '').trim(),
    scenarios,
    warnings,
  };
}

function parseScenario(scenario, fileName, warnings) {
  const tagNames = (scenario.tags || []).map((t) => t.name);

  let jiraId = null;
  const qaAnalysts = [];
  let tipo = null;
  const otherTags = [];

  for (const tag of tagNames) {
    const jiraMatch = tag.match(JIRA_ID_TAG_RE);
    const typeMatch = tag.match(TYPE_TAG_RE);
    const analystMatch = !jiraMatch && !typeMatch && tag.match(QA_ANALYST_TAG_RE);

    if (jiraMatch) {
      jiraId = jiraMatch[1];
    } else if (typeMatch) {
      tipo = typeMatch[1].toLowerCase() === 'manual' ? 'Manual' : 'Automatizado';
    } else if (analystMatch) {
      qaAnalysts.push(analystMatch[1]);
    } else {
      otherTags.push(tag);
    }
  }

  if (!jiraId) {
    warnings.push(
      `Escenario "${scenario.name}" (${fileName}) no tiene tag de JIRA ID (formato @LETRAS-000-000); se usará "SIN-ID".`
    );
  }

  const steps = (scenario.steps || []).map((step) => ({
    keyword: step.keyword.trim(),
    text: step.text,
  }));

  const isOutline = scenario.keyword === 'Scenario Outline' || scenario.keyword === 'Scenario Template';
  const examplesBlocks = scenario.examples || [];

  let examples;
  if (examplesBlocks.length > 0) {
    examples = examplesBlocks.map((ex) => parseExamplesBlock(ex));
  } else {
    if (isOutline) {
      warnings.push(
        `Scenario Outline "${scenario.name}" (${fileName}) no tiene bloques Examples.`
      );
    }
    // Scenario simple (no outline): se representa como un único caso sin tabla de datos.
    examples = [{ platformTag: null, headers: [], rows: [{ values: [], rowObject: {} }] }];
  }

  return {
    jiraId: jiraId || 'SIN-ID',
    name: scenario.name,
    isOutline,
    qaAnalysts,
    tipo,
    otherTags,
    steps,
    examples,
  };
}

function parseExamplesBlock(examplesNode) {
  const platformTags = (examplesNode.tags || []).map((t) => t.name.replace(/^@/, ''));
  const platformTag = platformTags.length > 0 ? platformTags.join(', ') : null;
  const headers = (examplesNode.tableHeader?.cells || []).map((c) => c.value);
  const rows = (examplesNode.tableBody || []).map((row) => {
    const values = row.cells.map((c) => c.value);
    const rowObject = {};
    headers.forEach((h, i) => {
      rowObject[h] = values[i];
    });
    return { values, rowObject };
  });
  return { platformTag, headers, rows };
}

/**
 * Lee y parsea un archivo .feature desde disco.
 */
function parseFeatureFile(filePath) {
  const fileName = path.basename(filePath);
  if (path.extname(fileName).toLowerCase() !== '.feature') {
    throw new GherkinParseError(`"${fileName}" no es un archivo .feature válido.`, 'INVALID_EXTENSION');
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parseFeatureContent(content, fileName);
}

module.exports = {
  parseFeatureContent,
  parseFeatureFile,
  GherkinParseError,
};
