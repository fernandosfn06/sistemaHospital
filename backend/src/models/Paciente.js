const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
  },
  numero_expediente: {
    type: DataTypes.STRING(20),
    unique: true,
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: { msg: 'La fecha de nacimiento no es válida.' },
    },
  },
  curp: {
    type: DataTypes.STRING(18),
    allowNull: true,
    unique: true,
    validate: {
      len: { args: [18, 18], msg: 'La CURP debe tener exactamente 18 caracteres.' },
    },
  },
  tipo_sangre: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contacto_emergencia_nombre: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  contacto_emergencia_telefono: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  alergias: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Ninguna',
  },
}, {
  tableName: 'pacientes',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: 'actualizado_en',
  hooks: {
    beforeCreate: async (paciente) => {
      const count = await Paciente.count();
      const numero = String(count + 1).padStart(6, '0');
      paciente.numero_expediente = `EXP-${numero}`;
    },
  },
});

Paciente.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasOne(Paciente, { foreignKey: 'usuario_id', as: 'paciente' });

module.exports = Paciente;
