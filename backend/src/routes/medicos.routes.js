const { Router } = require('express');
const { body } = require('express-validator');
const { listarMedicos, obtenerMedico, crearMedico, actualizarMedico, obtenerDisponibilidad } = require('../controllers/medicos.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { validarNombre } = require('../utils/validators');

const router = Router();

const ROLES_CONSULTA = ['admin', 'medico', 'enfermera', 'recepcionista'];

const validarCrear = [
  validarNombre('nombre', 'Nombre'),
  validarNombre('apellido', 'Apellido'),
  body('email').isEmail().withMessage('Correo inválido.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
  body('especialidad_id').isInt({ min: 1 }).withMessage('Especialidad inválida.'),
  body('cedula_profesional').trim().notEmpty().withMessage('La cédula profesional es obligatoria.')
    .isLength({ max: 20 }).withMessage('La cédula no puede exceder 20 caracteres.')
    .matches(/^[a-zA-Z0-9\-]+$/).withMessage('La cédula solo puede contener letras, números y guiones.'),
  body('telefono_consultorio').optional({ checkFalsy: true }).trim()
    .matches(/^\d[\d\s\-\+\(\)]{6,14}$/).withMessage('Teléfono de consultorio inválido.'),
];

const validarActualizar = [
  validarNombre('nombre', 'Nombre', { opcional: true }),
  validarNombre('apellido', 'Apellido', { opcional: true }),
  body('email').optional().isEmail().withMessage('Correo inválido.').normalizeEmail(),
  body('especialidad_id').optional().isInt({ min: 1 }).withMessage('Especialidad inválida.'),
  body('cedula_profesional').optional().trim()
    .matches(/^[a-zA-Z0-9\-]+$/).withMessage('La cédula solo puede contener letras, números y guiones.'),
];

router.get('/', verificarToken, verificarRol(...ROLES_CONSULTA), listarMedicos);
router.get('/:id/disponibilidad', verificarToken, verificarRol(...ROLES_CONSULTA), obtenerDisponibilidad);
router.get('/:id', verificarToken, verificarRol(...ROLES_CONSULTA), obtenerMedico);
router.post('/', verificarToken, verificarRol('admin'), validarCrear, crearMedico);
router.put('/:id', verificarToken, verificarRol('admin'), validarActualizar, actualizarMedico);

module.exports = router;
