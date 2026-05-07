const { Router } = require('express');
const { body } = require('express-validator');
const {
  listarPacientes, obtenerPaciente, crearPaciente,
  actualizarPaciente, toggleActivoPaciente,
} = require('../controllers/pacientes.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { validarNombre, validarTexto } = require('../utils/validators');

const router = Router();

const ROLES_CONSULTA = ['admin', 'medico', 'enfermera', 'recepcionista'];
const ROLES_GESTION  = ['admin', 'recepcionista'];
const ROLES_EDICION  = ['admin', 'recepcionista', 'medico'];

const camposComunes = (opcional = false) => [
  body('email').optional(opcional ? { checkFalsy: true } : false)
    .isEmail().withMessage('Correo electrónico inválido.').normalizeEmail(),
  body('fecha_nacimiento')
    .optional(opcional ? { checkFalsy: true } : false)
    .isDate().withMessage('La fecha de nacimiento no es válida.'),
  body('curp')
    .optional({ checkFalsy: true })
    .trim().toUpperCase()
    .isLength({ min: 18, max: 18 }).withMessage('La CURP debe tener exactamente 18 caracteres.')
    .matches(/^[A-Z0-9]+$/).withMessage('La CURP solo puede contener letras y números.'),
  body('tipo_sangre')
    .optional({ checkFalsy: true })
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Tipo de sangre inválido.'),
  body('telefono')
    .optional({ checkFalsy: true }).trim()
    .matches(/^\d[\d\s\-\+\(\)]{6,14}$/).withMessage('Teléfono inválido.'),
  body('contacto_emergencia_telefono')
    .optional({ checkFalsy: true }).trim()
    .matches(/^\d[\d\s\-\+\(\)]{6,14}$/).withMessage('Teléfono de contacto inválido.'),
  validarNombre('contacto_emergencia_nombre', 'Nombre del contacto', { opcional: true }),
  validarTexto('direccion', 'Dirección', { opcional: true, maxLen: 300 }),
  validarTexto('alergias', 'Alergias', { opcional: true, maxLen: 1000 }),
];

const validarCrear = [
  validarNombre('nombre', 'Nombre'),
  validarNombre('apellido', 'Apellido'),
  ...camposComunes(false),
  body('fecha_nacimiento').isDate().withMessage('La fecha de nacimiento es obligatoria.'),
];

const validarActualizar = [
  validarNombre('nombre', 'Nombre', { opcional: true }),
  validarNombre('apellido', 'Apellido', { opcional: true }),
  ...camposComunes(true),
];

router.get('/',    verificarToken, verificarRol(...ROLES_CONSULTA), listarPacientes);
router.get('/:id', verificarToken, verificarRol(...ROLES_CONSULTA), obtenerPaciente);
router.post('/',   verificarToken, verificarRol(...ROLES_GESTION),  validarCrear, crearPaciente);
router.put('/:id', verificarToken, verificarRol(...ROLES_EDICION),  validarActualizar, actualizarPaciente);
router.patch('/:id/toggle', verificarToken, verificarRol(...ROLES_GESTION), toggleActivoPaciente);

module.exports = router;
