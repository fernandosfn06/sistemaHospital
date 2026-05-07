const { Router } = require('express');
const { listarUsuarios, obtenerUsuario, toggleActivo, desbloquearCuenta } = require('../controllers/usuarios.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas requieren autenticación y rol admin
// GET /api/usuarios → HU31: Listar todos los usuarios con filtros
router.get('/', verificarToken, verificarRol('admin'), listarUsuarios);

// GET /api/usuarios/:id → Ver detalle de un usuario
router.get('/:id', verificarToken, verificarRol('admin'), obtenerUsuario);

// PATCH /api/usuarios/:id/toggle → Activar o desactivar cuenta
router.patch('/:id/toggle', verificarToken, verificarRol('admin'), toggleActivo);

// PATCH /api/usuarios/:id/desbloquear → Desbloquear cuenta bloqueada (HU30)
router.patch('/:id/desbloquear', verificarToken, verificarRol('admin'), desbloquearCuenta);

module.exports = router;
