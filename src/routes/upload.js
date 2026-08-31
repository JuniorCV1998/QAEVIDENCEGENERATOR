const express = require('express');
const multer = require('multer');
const path = require('path');
const JSZip = require('jszip');

const { parseFeatureContent, GherkinParseError } = require('../parser/gherkinParser');
const { generateEvidenceDocuments } = require('../generator/wordGenerator');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.feature') {
      return cb(new Error(`"${file.originalname}" no es un archivo .feature`));
    }
    cb(null, true);
  },
});

function normalizeMulti(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return (value || '').trim();
}

function sanitizeFileNamePart(text) {
  return (text || 'QA').replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 40);
}

router.post('/generate', (req, res) => {
  upload.array('features')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Debes subir al menos un archivo .feature.' });
      }

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

      const features = await Promise.all(
        req.files.map((file) => parseFeatureContent(file.buffer.toString('utf8'), file.originalname))
      );

      const { documents, warnings } = await generateEvidenceDocuments({ features, formData });

      if (warnings.length > 0) {
        res.setHeader('X-Generator-Warnings', encodeURIComponent(JSON.stringify(warnings)));
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

      // Varios features -> un .docx por archivo, comprimidos en un .zip
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
      if (err instanceof GherkinParseError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      console.error('[upload] Error generando el documento:', err);
      res.status(500).json({ error: 'Error interno generando el documento.' });
    }
  });
});

module.exports = router;
