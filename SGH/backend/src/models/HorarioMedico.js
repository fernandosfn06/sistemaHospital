const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Medico = require('./Medico');

// dia_semana: 0=domingo, 1=lunes, ..., 6=sábado (coincide con Date.getDay())
const HorarioMedico = sequelize.define('HorarioMedico', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  medico_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'medicos', key: 'id' },
  },
  dia_semana: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: { min: 0, max: 6 },
  },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin:    { type: DataTypes.TIME, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'horarios_medico',
  timestamps: false,
});

HorarioMedico.belongsTo(Medico, { foreignKey: 'medico_id', as: 'medico' });
Medico.hasMany(HorarioMedico,   { foreignKey: 'medico_id', as: 'horarios' });

module.exports = HorarioMedico;
