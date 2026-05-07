const { Router } = require('express');
const { validarTexto } = require('../utils/validators');
const { listarEspecialidades, crearEspecialidad, actualizarEspecialidad } = require('../controllers/especialidades.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = Router();

const validarNombreEsp = [
  validarTexto('nombre', 'Nombre de especialidad', { maxLen: 100 }),
  validarTexto('descripcion', 'Descripción', { opcional: true, maxLen: 500 }),
];

router.get('/', verificarToken, listarEspecialidades);
router.post('/', verificarToken, verificarRol('admin'), validarNombreEsp, crearEspecialidad);
router.put('/:id', verificarToken, verificarRol('admin'), validarNombreEsp, actualizarEspecialidad);

module.exports = router;
