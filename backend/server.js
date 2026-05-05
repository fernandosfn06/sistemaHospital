require('dotenv').config();
const app = require('./src/app');
const { conectarDB } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
  await conectarDB();

  app.listen(PORT, () => {
    console.log(` SGH Backend corriendo en http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
};

iniciarServidor();
