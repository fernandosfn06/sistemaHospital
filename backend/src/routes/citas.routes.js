const { Router } = require('express');
const { body } = require('express-validator');
const { listarCitas, obtenerCita, crearCita, cancelarCita, reprogramarCita, confirmarCita, completarCita, eliminarCita } = require('../controllers/citas.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { validarTexto } = require('../utils/validators');

const router = Router();

const ROLES_CITAS = ['admin', 'medico', 'enfermera', 'recepcionista', 'paciente'];

const validarCrear = [
  body('paciente_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Paciente inválido.'),
  body('medico_id').isInt({ min: 1 }).withMessage('Médico inválido.'),
  body('fecha').isDate().withMessage('Fecha inválida.'),
  body('hora_inicio').matches(/^\d{2}:\d{2}$/).withMessage('Hora de inicio inválida (HH:MM).'),
  validarTexto('motivo', 'Motivo', { maxLen: 500 }),
];

const validarReprogramar = [
  body('fecha').isDate().withMessage('Fecha inválida.'),
  body('hora_inicio').matches(/^\d{2}:\d{2}$/).withMessage('Hora de inicio inválida (HH:MM).'),
  validarTexto('motivo_reprogramacion', 'Motivo de reprogramación', { opcional: true, maxLen: 500 }),
];

router.get('/', verificarToken, verificarRol(...ROLES_CITAS), listarCitas);
router.get('/:id', verificarToken, verificarRol(...ROLES_CITAS), obtenerCita);
router.post('/', verificarToken, verificarRol('admin', 'recepcionista', 'medico', 'paciente'), validarCrear, crearCita);
router.patch('/:id/confirmar', verificarToken, verificarRol('admin', 'recepcionista', 'medico'), confirmarCita);
router.patch('/:id/completar', verificarToken, verificarRol('admin', 'medico', 'enfermera'), completarCita);
router.patch('/:id/cancelar', verificarToken, verificarRol(...ROLES_CITAS), cancelarCita);
router.post('/:id/reprogramar', verificarToken, verificarRol('admin', 'recepcionista', 'medico'), validarReprogramar, reprogramarCita);
router.delete('/:id', verificarToken, verificarRol('admin', 'recepcionista', 'medico'), eliminarCita);

module.exports = router;
