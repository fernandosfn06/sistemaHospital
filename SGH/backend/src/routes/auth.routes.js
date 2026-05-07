const { Router } = require('express');
const { body } = require('express-validator');
const { registrar, login, logout, perfil } = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarNombre } = require('../utils/validators');

const router = Router();

const validarRegistro = [
  validarNombre('nombre', 'Nombre'),
  validarNombre('apellido', 'Apellido'),
  body('email').isEmail().withMessage('El correo electrónico no es válido.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula.')
    .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número.'),
  body('fecha_nacimiento').isDate().withMessage('La fecha de nacimiento no es válida.'),
  body('curp').optional({ checkFalsy: true }).trim().toUpperCase()
    .isLength({ min: 18, max: 18 }).withMessage('La CURP debe tener 18 caracteres.')
    .matches(/^[A-Z0-9]+$/).withMessage('La CURP solo puede contener letras y números.'),
  body('tipo_sangre').optional({ checkFalsy: true })
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Tipo de sangre no válido.'),
  body('telefono').optional({ checkFalsy: true }).trim()
    .matches(/^\d[\d\s\-\+\(\)]{6,14}$/).withMessage('Teléfono inválido.'),
];

const validarLogin = [
  body('email').isEmail().withMessage('El correo no es válido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
];

router.post('/registrar', validarRegistro, registrar);
router.post('/login', validarLogin, login);
router.post('/logout', verificarToken, logout);
router.get('/perfil', verificarToken, perfil);

module.exports = router;
