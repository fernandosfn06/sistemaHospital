const { validationResult } = require('express-validator');
const Especialidad = require('../models/Especialidad');

const listarEspecialidades = async (req, res) => {
  try {
    const soloActivas = req.query.activo === 'true' || req.query.activo === undefined;
    const where = soloActivas ? { activo: true } : {};
    const especialidades = await Especialidad.findAll({ where, order: [['nombre', 'ASC']] });
    return res.status(200).json({ ok: true, data: especialidades });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener especialidades.' });
  }
};

const crearEspecialidad = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ ok: false, errores: errores.array() });

    const { nombre, descripcion } = req.body;
    const existe = await Especialidad.findOne({ where: { nombre } });
    if (existe) return res.status(400).json({ ok: false, mensaje: 'Esta especialidad ya existe.' });

    const especialidad = await Especialidad.create({ nombre, descripcion });
    return res.status(201).json({ ok: true, mensaje: 'Especialidad creada.', data: especialidad });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al crear especialidad.' });
  }
};

const actualizarEspecialidad = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ ok: false, errores: errores.array() });

    const especialidad = await Especialidad.findByPk(req.params.id);
    if (!especialidad) return res.status(404).json({ ok: false, mensaje: 'Especialidad no encontrada.' });

    const { nombre, descripcion, activo } = req.body;
    if (nombre && nombre !== especialidad.nombre) {
      const existe = await Especialidad.findOne({ where: { nombre } });
      if (existe) return res.status(400).json({ ok: false, mensaje: 'Ya existe una especialidad con ese nombre.' });
    }

    await especialidad.update({ nombre: nombre ?? especialidad.nombre, descripcion: descripcion ?? especialidad.descripcion, activo: activo ?? especialidad.activo });
    return res.status(200).json({ ok: true, mensaje: 'Especialidad actualizada.', data: especialidad });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar especialidad.' });
  }
};

module.exports = { listarEspecialidades, crearEspecialidad, actualizarEspecialidad };
