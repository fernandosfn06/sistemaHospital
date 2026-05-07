const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const Usuario = require('../models/Usuario');
const Medico = require('../models/Medico');
const Especialidad = require('../models/Especialidad');
const HorarioMedico = require('../models/HorarioMedico');

const PRIVATE_ATTRS = ['password', 'intentos_fallidos', 'bloqueado_hasta'];

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const listarMedicos = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const { buscar, especialidad_id, activo } = req.query;
    const offset = (pagina - 1) * limite;

    const whereUsuario = { rol: 'medico' };
    if (buscar) {
      whereUsuario[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
      ];
    }

    const whereMedico = {};
    if (especialidad_id) whereMedico.especialidad_id = especialidad_id;
    if (activo === 'true' || activo === 'false') whereMedico.activo = activo === 'true';

    const { count, rows } = await Medico.findAndCountAll({
      where: whereMedico,
      include: [
        { model: Usuario, as: 'usuario', where: whereUsuario, attributes: { exclude: PRIVATE_ATTRS }, required: true },
        { model: Especialidad, as: 'especialidad', required: true },
        { model: HorarioMedico, as: 'horarios', required: false, where: { activo: true }, separate: true },
      ],
      limit: limite,
      offset,
      order: [['creado_en', 'DESC']],
    });

    return res.status(200).json({
      ok: true,
      data: { total: count, pagina, total_paginas: Math.ceil(count / limite), medicos: rows },
    });
  } catch (error) {
    console.error('Error al listar médicos:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener médicos.' });
  }
};

const obtenerMedico = async (req, res) => {
  try {
    const medico = await Medico.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: { exclude: PRIVATE_ATTRS } },
        { model: Especialidad, as: 'especialidad' },
        { model: HorarioMedico, as: 'horarios', required: false, order: [['dia_semana', 'ASC']] },
      ],
    });
    if (!medico) return res.status(404).json({ ok: false, mensaje: 'Médico no encontrado.' });
    return res.status(200).json({ ok: true, data: medico });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener médico.' });
  }
};

const crearMedico = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ ok: false, errores: errores.array() });

    const { nombre, apellido, email, password, especialidad_id, cedula_profesional, telefono_consultorio, horarios } = req.body;

    const [emailExiste, cedulaExiste, especialidad] = await Promise.all([
      Usuario.findOne({ where: { email } }),
      Medico.findOne({ where: { cedula_profesional } }),
      Especialidad.findByPk(especialidad_id),
    ]);
    if (emailExiste) return res.status(400).json({ ok: false, mensaje: 'El correo electrónico ya está registrado.' });
    if (cedulaExiste) return res.status(400).json({ ok: false, mensaje: 'La cédula profesional ya está registrada.' });
    if (!especialidad) return res.status(400).json({ ok: false, mensaje: 'Especialidad no encontrada.' });

    const { nuevoMedico } = await sequelize.transaction(async (t) => {
      const nuevoUsuario = await Usuario.create(
        { nombre, apellido, email, password, rol: 'medico' },
        { transaction: t }
      );
      const nuevoMedico = await Medico.create(
        { usuario_id: nuevoUsuario.id, especialidad_id, cedula_profesional, telefono_consultorio: telefono_consultorio || null },
        { transaction: t }
      );
      if (Array.isArray(horarios) && horarios.length > 0) {
        const horariosData = horarios.map((h) => ({ medico_id: nuevoMedico.id, ...h }));
        await HorarioMedico.bulkCreate(horariosData, { transaction: t });
      }
      return { nuevoMedico };
    });

    const medico = await Medico.findByPk(nuevoMedico.id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: { exclude: PRIVATE_ATTRS } },
        { model: Especialidad, as: 'especialidad' },
        { model: HorarioMedico, as: 'horarios' },
      ],
    });
    return res.status(201).json({ ok: true, mensaje: 'Médico registrado exitosamente.', data: medico });
  } catch (error) {
    console.error('Error al crear médico:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

const actualizarMedico = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ ok: false, errores: errores.array() });

    const medico = await Medico.findByPk(req.params.id, {
      include: [{ model: Usuario, as: 'usuario' }],
    });
    if (!medico) return res.status(404).json({ ok: false, mensaje: 'Médico no encontrado.' });

    const { nombre, apellido, email, especialidad_id, cedula_profesional, telefono_consultorio, activo, horarios } = req.body;

    if (email && email !== medico.usuario.email) {
      const existe = await Usuario.findOne({ where: { email } });
      if (existe) return res.status(400).json({ ok: false, mensaje: 'El correo ya está en uso.' });
    }
    if (cedula_profesional && cedula_profesional !== medico.cedula_profesional) {
      const existe = await Medico.findOne({ where: { cedula_profesional } });
      if (existe) return res.status(400).json({ ok: false, mensaje: 'La cédula ya está registrada.' });
    }

    await sequelize.transaction(async (t) => {
      await medico.usuario.update(
        { nombre: nombre ?? medico.usuario.nombre, apellido: apellido ?? medico.usuario.apellido, email: email ?? medico.usuario.email },
        { transaction: t }
      );
      await medico.update(
        {
          especialidad_id: especialidad_id ?? medico.especialidad_id,
          cedula_profesional: cedula_profesional ?? medico.cedula_profesional,
          telefono_consultorio: telefono_consultorio !== undefined ? telefono_consultorio : medico.telefono_consultorio,
          activo: activo !== undefined ? activo : medico.activo,
        },
        { transaction: t }
      );
      if (Array.isArray(horarios)) {
        await HorarioMedico.destroy({ where: { medico_id: medico.id }, transaction: t });
        if (horarios.length > 0) {
          await HorarioMedico.bulkCreate(horarios.map((h) => ({ medico_id: medico.id, ...h })), { transaction: t });
        }
      }
    });

    const actualizado = await Medico.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: { exclude: PRIVATE_ATTRS } },
        { model: Especialidad, as: 'especialidad' },
        { model: HorarioMedico, as: 'horarios', order: [['dia_semana', 'ASC']] },
      ],
    });
    return res.status(200).json({ ok: true, mensaje: 'Médico actualizado correctamente.', data: actualizado });
  } catch (error) {
    console.error('Error al actualizar médico:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

// GET /api/medicos/:id/disponibilidad?fecha=YYYY-MM-DD
const obtenerDisponibilidad = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ ok: false, mensaje: 'Parámetro fecha es requerido (YYYY-MM-DD).' });

    const fechaDate = new Date(fecha + 'T00:00:00');
    if (isNaN(fechaDate)) return res.status(400).json({ ok: false, mensaje: 'Fecha inválida.' });

    const diaSemana = fechaDate.getDay();

    const medico = await Medico.findByPk(req.params.id);
    if (!medico || !medico.activo) return res.status(404).json({ ok: false, mensaje: 'Médico no encontrado o inactivo.' });

    const horario = await HorarioMedico.findOne({
      where: { medico_id: req.params.id, dia_semana: diaSemana, activo: true },
    });

    if (!horario) {
      return res.status(200).json({ ok: true, data: { disponible: false, slots: [], mensaje: 'El médico no atiende ese día.' } });
    }

    const { Op: O } = require('sequelize');
    const Cita = require('../models/Cita');
    const citasExistentes = await Cita.findAll({
      where: {
        medico_id: req.params.id,
        fecha,
        estado: { [O.in]: ['programada', 'confirmada'] },
      },
      attributes: ['hora_inicio'],
    });

    const ocupadas = new Set(citasExistentes.map((c) => c.hora_inicio.substring(0, 5)));

    const slots = [];
    const [hInicio, mInicio] = horario.hora_inicio.split(':').map(Number);
    const [hFin, mFin]       = horario.hora_fin.split(':').map(Number);
    let minutos = hInicio * 60 + mInicio;
    const finMin = hFin * 60 + mFin;

    while (minutos + 30 <= finMin) {
      const h = String(Math.floor(minutos / 60)).padStart(2, '0');
      const m = String(minutos % 60).padStart(2, '0');
      const label = `${h}:${m}`;
      slots.push({ hora: label, disponible: !ocupadas.has(label) });
      minutos += 30;
    }

    return res.status(200).json({ ok: true, data: { disponible: true, slots, horario: { hora_inicio: horario.hora_inicio, hora_fin: horario.hora_fin } } });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener disponibilidad.' });
  }
};

module.exports = { listarMedicos, obtenerMedico, crearMedico, actualizarMedico, obtenerDisponibilidad };
