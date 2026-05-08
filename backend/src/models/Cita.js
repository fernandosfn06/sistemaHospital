const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Paciente = require('./Paciente');
const Medico = require('./Medico');
const Usuario = require('./Usuario');

const Cita = sequelize.define('Cita', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'pacientes', key: 'id' },
  },
  medico_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'medicos', key: 'id' },
  },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin:    { type: DataTypes.TIME, allowNull: false },
  motivo: { type: DataTypes.TEXT, allowNull: false },
  estado: {
    type: DataTypes.ENUM('programada', 'confirmada', 'cancelada', 'reprogramada', 'completada'),
    defaultValue: 'programada',
  },
  motivo_cancelacion: { type: DataTypes.TEXT, allowNull: true },
  motivo_reprogramacion: { type: DataTypes.TEXT, allowNull: true },
  fecha_anterior: { type: DataTypes.DATEONLY, allowNull: true },
  hora_inicio_anterior: { type: DataTypes.TIME, allowNull: true },
  cita_original_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'citas', key: 'id' },
  },
  creado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
  },
}, {
  tableName: 'citas',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: 'actualizado_en',
});

Cita.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Cita.belongsTo(Medico,   { foreignKey: 'medico_id',   as: 'medico'   });
Cita.belongsTo(Usuario,  { foreignKey: 'creado_por_id', as: 'creadoPor' });
Cita.belongsTo(Cita,     { foreignKey: 'cita_original_id', as: 'citaOriginal' });

Paciente.hasMany(Cita, { foreignKey: 'paciente_id', as: 'citas' });
Medico.hasMany(Cita,   { foreignKey: 'medico_id',   as: 'citas' });

module.exports = Cita;
