const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');
const Especialidad = require('./Especialidad');

const Medico = sequelize.define('Medico', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'usuarios', key: 'id' },
  },
  especialidad_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'especialidades', key: 'id' },
  },
  cedula_profesional: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: { msg: 'Esta cédula profesional ya está registrada.' },
  },
  telefono_consultorio: { type: DataTypes.STRING(15), allowNull: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'medicos',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: 'actualizado_en',
});

Medico.belongsTo(Usuario,      { foreignKey: 'usuario_id',    as: 'usuario'      });
Medico.belongsTo(Especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' });
Usuario.hasOne(Medico,         { foreignKey: 'usuario_id',    as: 'medico'       });
Especialidad.hasMany(Medico,   { foreignKey: 'especialidad_id', as: 'medicos'    });

module.exports = Medico;
