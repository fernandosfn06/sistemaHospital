const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const Cita = require('../models/Cita');
const Paciente = require('../models/Paciente');
const Medico = require('../models/Medico');
const Usuario = require('../models/Usuario');
const Especialidad = require('../models/Especialidad');

const PRIVATE_ATTRS = ['password', 'intentos_fallidos', 'bloqueado_hasta'];

const includeCompleto = [
  {
    model: Paciente, as: 'paciente',
    include: [{ model: Usuario, as: 'usuario', attributes: { exclude: PRIVATE_ATTRS } }],
  },
  {
    model: Medico, as: 'medico',
    include: [
      { model: Usuario, as: 'usuario', attributes: { exclude: PRIVATE_ATTRS } },
      { model: Especialidad, as: 'especialidad' },
    ],
  },
  { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre', 'apellido', 'rol'] },
];

const listarCitas = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const { medico_id, paciente_id, estado, fecha_desde, fecha_hasta } = req.query;
    const offset = (pagina - 1) * limite;

    const where = {};
    if (medico_id)  where.medico_id   = medico_id;
    if (paciente_id) where.paciente_id = paciente_id;
    if (estado)     where.estado      = estado;
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    // Si el usuario es médico, solo ve sus propias citas
    if (req.usuario.rol === 'medico') {
      const medico = await Medico.findOne({ where: { usuario_id: req.usuario.id } });
      if (medico) where.medico_id = medico.id;
    }

    const { count, rows } = await Cita.findAndCountAll({
      where,
      include: includeCompleto,
      limit: limite,
      offset,
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
    });

    return res.status(200).json({
      ok: true,
      data: { total: count, pagina, total_paginas: Math.ceil(count / limite), citas: rows },
    });
  } catch (error) {
    console.error('Error al listar citas:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener citas.' });
  }
};

const obtenerCita = async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id, { include: includeCompleto });
    if (!cita) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    return res.status(200).json({ ok: true, data: cita });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener cita.' });
  }
};

const crearCita = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ ok: false, errores: errores.array() });

    const { paciente_id, medico_id, fecha, hora_inicio, motivo } = req.body;

    const [paciente, medico] = await Promise.all([
      Paciente.findByPk(paciente_id),
      Medico.findByPk(medico_id),
    ]);
    if (!paciente) return res.status(400).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    if (!medico || !medico.activo) return res.status(400).json({ ok: false, mensaje: 'Médico no encontrado o inactivo.' });

    // Verificar que no exista conflicto
    const conflicto = await Cita.findOne({
      where: { medico_id, fecha, hora_inicio, estado: { [Op.in]: ['programada', 'confirmada'] } },
    });
    if (conflicto) return res.status(409).json({ ok: false, mensaje: 'Ese horario ya está ocupado.' });

    // Calcular hora_fin (+30 min)
    const [h, m] = hora_inicio.split(':').map(Number);
    const finMin = h * 60 + m + 30;
    const hora_fin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}:00`;

    const cita = await Cita.create({
      paciente_id, medico_id, fecha,
      hora_inicio: hora_inicio + ':00',
      hora_fin,
      motivo,
      estado: 'programada',
      creado_por_id: req.usuario.id,
    });

    const citaCompleta = await Cita.findByPk(cita.id, { include: includeCompleto });
    return res.status(201).json({ ok: true, mensaje: 'Cita programada exitosamente.', data: citaCompleta });
  } catch (error) {
    console.error('Error al crear cita:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

const cancelarCita = async (req, res) => {
  try {
    const { motivo_cancelacion } = req.body;
    if (!motivo_cancelacion?.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'El motivo de cancelación es obligatorio.' });
    }

    const cita = await Cita.findByPk(req.params.id);
    if (!cita) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    if (['cancelada', 'completada'].includes(cita.estado)) {
      return res.status(400).json({ ok: false, mensaje: `No se puede cancelar una cita en estado "${cita.estado}".` });
    }

    await cita.update({ estado: 'cancelada', motivo_cancelacion });
    const actualizada = await Cita.findByPk(cita.id, { include: includeCompleto });
    return res.status(200).json({ ok: true, mensaje: 'Cita cancelada.', data: actualizada });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al cancelar cita.' });
  }
};

const reprogramarCita = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ ok: false, errores: errores.array() });

    const citaOriginal = await Cita.findByPk(req.params.id);
    if (!citaOriginal) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    if (['cancelada', 'completada', 'reprogramada'].includes(citaOriginal.estado)) {
      return res.status(400).json({ ok: false, mensaje: `No se puede reprogramar una cita en estado "${citaOriginal.estado}".` });
    }

    const { fecha, hora_inicio, motivo } = req.body;

    const conflicto = await Cita.findOne({
      where: {
        medico_id: citaOriginal.medico_id,
        fecha,
        hora_inicio: hora_inicio + ':00',
        estado: { [Op.in]: ['programada', 'confirmada'] },
        id: { [Op.ne]: citaOriginal.id },
      },
    });
    if (conflicto) return res.status(409).json({ ok: false, mensaje: 'Ese horario ya está ocupado.' });

    const [h, m] = hora_inicio.split(':').map(Number);
    const finMin = h * 60 + m + 30;
    const hora_fin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}:00`;

    await citaOriginal.update({ estado: 'reprogramada' });

    const nuevaCita = await Cita.create({
      paciente_id: citaOriginal.paciente_id,
      medico_id: citaOriginal.medico_id,
      fecha,
      hora_inicio: hora_inicio + ':00',
      hora_fin,
      motivo: motivo || citaOriginal.motivo,
      estado: 'programada',
      cita_original_id: citaOriginal.id,
      creado_por_id: req.usuario.id,
    });

    const citaCompleta = await Cita.findByPk(nuevaCita.id, { include: includeCompleto });
    return res.status(201).json({ ok: true, mensaje: 'Cita reprogramada exitosamente.', data: citaCompleta });
  } catch (error) {
    console.error('Error al reprogramar cita:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

const confirmarCita = async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id);
    if (!cita) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    if (cita.estado !== 'programada') {
      return res.status(400).json({ ok: false, mensaje: `Solo se pueden confirmar citas en estado "programada".` });
    }
    await cita.update({ estado: 'confirmada' });
    return res.status(200).json({ ok: true, mensaje: 'Cita confirmada.', data: { id: cita.id, estado: 'confirmada' } });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al confirmar cita.' });
  }
};

module.exports = { listarCitas, obtenerCita, crearCita, cancelarCita, reprogramarCita, confirmarCita };
