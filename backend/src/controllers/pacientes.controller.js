const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');

const PRIVATE_ATTRS = ['password', 'intentos_fallidos', 'bloqueado_hasta'];

const listarPacientes = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const { buscar, activo } = req.query;
    const offset = (pagina - 1) * limite;

    const whereUsuario = { rol: 'paciente' };
    if (activo === 'true' || activo === 'false') whereUsuario.activo = activo === 'true';
    if (buscar) {
      whereUsuario[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } },
      ];
    }

    const { count, rows } = await Paciente.findAndCountAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        where: whereUsuario,
        attributes: { exclude: PRIVATE_ATTRS },
        required: true,
      }],
      limit: limite,
      offset,
      order: [['creado_en', 'DESC']],
    });

    return res.status(200).json({
      ok: true,
      data: {
        total: count,
        pagina,
        total_paginas: Math.ceil(count / limite),
        pacientes: rows,
      },
    });
  } catch (error) {
    console.error('Error al listar pacientes:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener pacientes.' });
  }
};

const obtenerPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: { exclude: PRIVATE_ATTRS },
      }],
    });

    if (!paciente) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }

    return res.status(200).json({ ok: true, data: paciente });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener paciente.' });
  }
};

const crearPaciente = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array() });
    }

    const {
      nombre, apellido, email, password,
      fecha_nacimiento, curp, tipo_sangre, telefono, direccion,
      contacto_emergencia_nombre, contacto_emergencia_telefono, alergias,
    } = req.body;

    const [emailExiste, curpExiste] = await Promise.all([
      Usuario.findOne({ where: { email } }),
      curp ? Paciente.findOne({ where: { curp } }) : null,
    ]);

    if (emailExiste) {
      return res.status(400).json({ ok: false, mensaje: 'El correo electrónico ya está registrado.' });
    }
    if (curpExiste) {
      return res.status(400).json({ ok: false, mensaje: 'La CURP ya está registrada en el sistema.' });
    }

    const passwordFinal = password || generarPasswordTemporal();

    const { nuevoUsuario, nuevoPaciente } = await sequelize.transaction(async (t) => {
      const nuevoUsuario = await Usuario.create(
        { nombre, apellido, email, password: passwordFinal, rol: 'paciente' },
        { transaction: t }
      );
      const nuevoPaciente = await Paciente.create(
        {
          usuario_id: nuevoUsuario.id,
          fecha_nacimiento,
          curp: curp || null,
          tipo_sangre: tipo_sangre || null,
          telefono: telefono || null,
          direccion: direccion || null,
          contacto_emergencia_nombre: contacto_emergencia_nombre || null,
          contacto_emergencia_telefono: contacto_emergencia_telefono || null,
          alergias: alergias || 'Ninguna',
        },
        { transaction: t }
      );
      return { nuevoUsuario, nuevoPaciente };
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Paciente registrado exitosamente.',
      data: {
        paciente: nuevoPaciente,
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          email: nuevoUsuario.email,
        },
      },
    });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

const actualizarPaciente = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array() });
    }

    const paciente = await Paciente.findByPk(req.params.id, {
      include: [{ model: Usuario, as: 'usuario' }],
    });

    if (!paciente) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }

    const {
      nombre, apellido, email,
      fecha_nacimiento, curp, tipo_sangre, telefono, direccion,
      contacto_emergencia_nombre, contacto_emergencia_telefono, alergias,
    } = req.body;

    if (email && email !== paciente.usuario.email) {
      const emailExiste = await Usuario.findOne({ where: { email } });
      if (emailExiste) {
        return res.status(400).json({ ok: false, mensaje: 'El correo electrónico ya está en uso.' });
      }
    }

    if (curp && curp !== paciente.curp) {
      const curpExiste = await Paciente.findOne({ where: { curp } });
      if (curpExiste) {
        return res.status(400).json({ ok: false, mensaje: 'La CURP ya está registrada en el sistema.' });
      }
    }

    await sequelize.transaction(async (t) => {
      await paciente.usuario.update(
        {
          nombre: nombre ?? paciente.usuario.nombre,
          apellido: apellido ?? paciente.usuario.apellido,
          email: email ?? paciente.usuario.email,
        },
        { transaction: t }
      );
      await paciente.update(
        {
          fecha_nacimiento: fecha_nacimiento ?? paciente.fecha_nacimiento,
          curp: curp !== undefined ? (curp || null) : paciente.curp,
          tipo_sangre: tipo_sangre !== undefined ? (tipo_sangre || null) : paciente.tipo_sangre,
          telefono: telefono !== undefined ? (telefono || null) : paciente.telefono,
          direccion: direccion !== undefined ? (direccion || null) : paciente.direccion,
          contacto_emergencia_nombre: contacto_emergencia_nombre !== undefined ? (contacto_emergencia_nombre || null) : paciente.contacto_emergencia_nombre,
          contacto_emergencia_telefono: contacto_emergencia_telefono !== undefined ? (contacto_emergencia_telefono || null) : paciente.contacto_emergencia_telefono,
          alergias: alergias !== undefined ? alergias : paciente.alergias,
        },
        { transaction: t }
      );
    });

    const actualizado = await Paciente.findByPk(req.params.id, {
      include: [{ model: Usuario, as: 'usuario', attributes: { exclude: PRIVATE_ATTRS } }],
    });

    return res.status(200).json({ ok: true, mensaje: 'Paciente actualizado correctamente.', data: actualizado });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

const toggleActivoPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id, {
      include: [{ model: Usuario, as: 'usuario' }],
    });

    if (!paciente) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }

    paciente.usuario.activo = !paciente.usuario.activo;
    await paciente.usuario.save();

    return res.status(200).json({
      ok: true,
      mensaje: `Paciente ${paciente.usuario.activo ? 'activado' : 'desactivado'} correctamente.`,
      data: { id: paciente.id, activo: paciente.usuario.activo },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar paciente.' });
  }
};

const generarPasswordTemporal = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const nums = '0123456789';
  const all = upper + lower + nums;
  let pass = upper[Math.floor(Math.random() * upper.length)]
    + nums[Math.floor(Math.random() * nums.length)];
  for (let i = 2; i < 12; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass.split('').sort(() => Math.random() - 0.5).join('');
};

module.exports = { listarPacientes, obtenerPaciente, crearPaciente, actualizarPaciente, toggleActivoPaciente };
