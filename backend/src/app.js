const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes          = require('./routes/auth.routes');
const usuariosRoutes      = require('./routes/usuarios.routes');
const pacientesRoutes     = require('./routes/pacientes.routes');
const especialidadesRoutes = require('./routes/especialidades.routes');
const medicosRoutes       = require('./routes/medicos.routes');
const citasRoutes         = require('./routes/citas.routes');

const app = express();

// ── Middlewares globales ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas de la API ─────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/usuarios',       usuariosRoutes);
app.use('/api/pacientes',      pacientesRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/medicos',        medicosRoutes);
app.use('/api/citas',          citasRoutes);

// ── Ruta de health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mensaje: 'SGH API corriendo correctamente.', version: '1.0.0' });
});

// ── Manejo de rutas no encontradas ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta ${req.method} ${req.path} no encontrada.` });
});

// ── Manejo de errores globales ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
});

module.exports = app;
