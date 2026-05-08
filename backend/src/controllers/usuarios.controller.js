const { Op } = require('sequelize');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');

const PRIVATE_ATTRS = ['password', 'intentos_fallidos', 'bloqueado_hasta'];

const listarUsuarios = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const { rol, activo, buscar } = req.query;
    const offset = (pagina - 1) * limite;

    const where = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === 'true';
    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } },
      ];
    }

    const { count, rows } = await Usuario.findAndCountAll({
      where,
      distinct: true,
      attributes: { exclude: PRIVATE_ATTRS },
      include: [{ model: Paciente, as: 'paciente', required: false,
        attributes: ['numero_expediente', 'tipo_sangre', 'creado_en'] }],
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
        usuarios: rows,
      },
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios.' });
  }
};

const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: PRIVATE_ATTRS },
      include: [{ model: Paciente, as: 'paciente', required: false }],
    });

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ ok: true, data: usuario });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener usuario.' });
  }
};

const toggleActivo = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    if (usuario.id === req.usuario.id) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes desactivar tu propia cuenta.' });
    }

    const nuevoActivo = !usuario.activo;
    await usuario.update({ activo: nuevoActivo });

    return res.status(200).json({
      ok: true,
      mensaje: `Usuario ${nuevoActivo ? 'activado' : 'desactivado'} correctamente.`,
      data: { id: usuario.id, activo: nuevoActivo },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar usuario.' });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    if (usuario.id === req.usuario.id) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes eliminar tu propia cuenta.' });
    }

    if (usuario.rol === 'admin') {
      return res.status(400).json({ ok: false, mensaje: 'No se puede eliminar una cuenta de administrador.' });
    }

    await usuario.destroy();

    return res.status(200).json({ ok: true, mensaje: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar usuario.' });
  }
};

const desbloquearCuenta = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    await usuario.resetearIntentos();

    return res.status(200).json({ ok: true, mensaje: 'Cuenta desbloqueada correctamente.' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al desbloquear cuenta.' });
  }
};

module.exports = { listarUsuarios, obtenerUsuario, toggleActivo, desbloquearCuenta, eliminarUsuario };
