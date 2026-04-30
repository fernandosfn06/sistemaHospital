const { Router } = require('express');
const { body } = require('express-validator');
const { registrar, login, logout, perfil } = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = Router();

const validarRegistro = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres.'),
  body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio.'),
  body('email').isEmail().withMessage('El correo electrónico no es válido.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula.')
    .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número.'),
  body('fecha_nacimiento').isDate().withMessage('La fecha de nacimiento no es válida.'),
  body('curp').optional()
    .isLength({ min: 18, max: 18 }).withMessage('La CURP debe tener 18 caracteres.')
    .toUpperCase(),
  body('tipo_sangre').optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Tipo de sangre no válido.'),
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
