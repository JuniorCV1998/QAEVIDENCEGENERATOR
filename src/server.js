require('dotenv').config();

const express = require('express');
const path = require('path');
const { exec } = require('child_process');

const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Si el proceso se abrió con doble clic, la ventana de consola se cierra sola en
// cuanto el proceso termina. Estas dos redes de seguridad evitan que se cierre
// antes de que se alcance a leer el error.
function keepWindowOpenAndExit(exitCode) {
  console.log('\nPresiona ENTER para cerrar esta ventana...');
  process.stdin.resume();
  process.stdin.once('data', () => process.exit(exitCode));
}

process.on('uncaughtException', (err) => {
  console.error('\n[FATAL] La aplicación encontró un error inesperado:');
  console.error(err);
  keepWindowOpenAndExit(1);
});

const server = app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`QA Evidence Generator escuchando en ${url}`);
  console.log('(Deja esta ventana abierta mientras uses la aplicación. Ciérrala para detenerla.)');

  if (process.platform === 'win32') {
    exec(`start "" "${url}"`, () => {});
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] El puerto ${PORT} ya está en uso por otro programa.`);
    console.error('Cierra la otra instancia de esta app, o define un puerto distinto con la variable de entorno PORT.');
  } else {
    console.error('\n[ERROR] No se pudo iniciar el servidor:');
    console.error(err);
  }
  keepWindowOpenAndExit(1);
});
