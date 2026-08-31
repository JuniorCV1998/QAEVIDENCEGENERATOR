const form = document.getElementById('evidence-form');
const fileInput = document.getElementById('features');
const fileList = document.getElementById('file-list');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submit-btn');

fileInput.addEventListener('change', () => {
  fileList.innerHTML = '';
  Array.from(fileInput.files).forEach((file) => {
    const li = document.createElement('li');
    li.textContent = file.name;
    fileList.appendChild(li);
  });
});

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type || ''}`.trim();
}

function extractFileName(contentDisposition, fallback) {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallback;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (fileInput.files.length === 0) {
    setStatus('Selecciona al menos un archivo .feature.', 'error');
    return;
  }

  const formData = new FormData(form);

  submitBtn.disabled = true;
  setStatus('Generando documento...', 'loading');

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let message = 'Ocurrió un error generando el documento.';
      try {
        const data = await response.json();
        if (data.error) message = data.error;
      } catch (_) {
        // La respuesta no era JSON: típico de un timeout del servidor (ej. el
        // plan gratis de Render "despertando" tras estar inactivo).
        if (response.status >= 502 && response.status <= 504) {
          message =
            'El servidor estaba iniciando (puede pasar en el plan gratis tras un rato sin uso). Espera unos segundos e intenta de nuevo.';
        }
      }
      setStatus(message, 'error');
      return;
    }

    const warningsHeader = response.headers.get('X-Generator-Warnings');
    const blob = await response.blob();
    const fileName = extractFileName(
      response.headers.get('Content-Disposition'),
      'evidencia_qa.docx'
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    let successMsg = `Documento generado: ${fileName}`;
    if (warningsHeader) {
      try {
        const warnings = JSON.parse(decodeURIComponent(warningsHeader));
        if (warnings.length > 0) {
          successMsg += `\nAvisos:\n- ${warnings.join('\n- ')}`;
        }
      } catch (_) {
        // ignorar si el header no se puede parsear
      }
    }
    setStatus(successMsg, 'success');
  } catch (err) {
    console.error(err);
    setStatus('No se pudo conectar con el servidor.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});
