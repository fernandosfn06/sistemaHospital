const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Especialidad = sequelize.define('Especialidad', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: { msg: 'Esta especialidad ya existe.' },
    validate: { notEmpty: { msg: 'El nombre de la especialidad es obligatorio.' } },
  },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'especialidades',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: 'actualizado_en',
});

module.exports = Especialidad;
