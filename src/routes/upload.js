const express = require('express');
const multer = require('multer');
const path = require('path');
const JSZip = require('jszip');

const { parseFeatureContent, GherkinParseError } = require('../parser/gherkinParser');
const { parseRegressionCsv, RegressionCsvError } = require('../parser/regressionCsvParser');
const { generateEvidenceDocuments } = require('../generator/wordGenerator');

const router = express.Router();

const TIPOS_REPORTE = ['certificacion', 'regresion'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const esperado = file.fieldname === 'csv' ? '.csv' : '.feature';
    if (ext !== esperado) {
      return cb(new Error(`"${file.originalname}" no es un archivo ${esperado}`));
    }
    cb(null, true);
  },
});

const uploadFields = upload.fields([
  { name: 'features', maxCount: 20 },
  { name: 'csv', maxCount: 1 },
]);

function normalizeMulti(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return (value || '').trim();
}

function sanitizeFileNamePart(text) {
  return (text || 'QA').replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 40);
}

router.post('/generate', (req, res) => {
  uploadFields(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      const tipoReporte = (req.body.tipoReporte || 'certificacion').trim();
      if (!TIPOS_REPORTE.includes(tipoReporte)) {
        return res.status(400).json({ error: 'Tipo de reporte no válido.' });
      }

      const featureFiles = (req.files && req.files.features) || [];
      const csvFiles = (req.files && req.files.csv) || [];

      const formData = {
        jiraId: (req.body.jiraId || '').trim(),
        jiraDescription: (req.body.jiraDescription || '').trim(),
        entidad: (req.body.entidad || '').trim(),
        fecha: (req.body.fecha || '').trim(),
        analistasQA: normalizeMulti(req.body.analistasQA),
        analistasDev: normalizeMulti(req.body.analistasDev),
        usuario: (req.body.usuario || '').trim(),
        ambiente: (req.body.ambiente || '').trim(),
        tipo: (req.body.tipo || '').trim(),
      };

      let features;
      const extraWarnings = [];

      if (tipoReporte === 'regresion') {
        if (csvFiles.length === 0) {
          return res.status(400).json({ error: 'Debes subir el archivo .csv de Regresión.' });
        }
        const csv = parseRegressionCsv(csvFiles[0].buffer.toString('utf8'), csvFiles[0].originalname);
        extraWarnings.push(...csv.warnings);
        features = [csv];
      } else {
        if (featureFiles.length === 0) {
          return res.status(400).json({ error: 'Debes subir al menos un archivo .feature.' });
        }
        features = await Promise.all(
          featureFiles.map((file) => parseFeatureContent(file.buffer.toString('utf8'), file.originalname))
        );
      }

      const { documents, warnings } = await generateEvidenceDocuments({
        features,
        formData,
        modo: tipoReporte,
      });
      const allWarnings = [...extraWarnings, ...warnings];

      if (allWarnings.length > 0) {
        res.setHeader('X-Generator-Warnings', encodeURIComponent(JSON.stringify(allWarnings)));
      }

      if (documents.length === 1) {
        const { fileName, buffer } = documents[0];
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(buffer);
      }

      // Varios documentos (varios features, o varios escenarios de Regresión) -> .zip
      const zip = new JSZip();
      documents.forEach(({ fileName, buffer }) => {
        zip.file(fileName, buffer);
      });
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      const zipName = `Evidencias_${sanitizeFileNamePart(formData.jiraId)}_${Date.now()}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
      res.send(zipBuffer);
    } catch (err) {
      if (err instanceof GherkinParseError || err instanceof RegressionCsvError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      console.error('[upload] Error generando el documento:', err);
      res.status(500).json({ error: 'Error interno generando el documento.' });
    }
  });
});

module.exports = router;
