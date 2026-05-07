const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es obligatorio.' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres.' },
    },
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El apellido es obligatorio.' },
    },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: { msg: 'Este correo ya está registrado.' },
    validate: {
      isEmail: { msg: 'El correo electrónico no es válido.' },
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('admin', 'medico', 'enfermera', 'recepcionista', 'farmaceutico', 'paciente'),
    defaultValue: 'paciente',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  intentos_fallidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  bloqueado_hasta: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: 'actualizado_en',
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    },
  },
});

Usuario.prototype.verificarPassword = async function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

Usuario.prototype.estaBloqueado = function () {
  return !!(this.bloqueado_hasta && new Date() < new Date(this.bloqueado_hasta));
};

Usuario.prototype.registrarIntentoFallido = async function () {
  const MAX_INTENTOS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const LOCK_MINUTES = parseInt(process.env.LOCK_TIME_MINUTES) || 15;

  this.intentos_fallidos += 1;

  if (this.intentos_fallidos >= MAX_INTENTOS) {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + LOCK_MINUTES);
    this.bloqueado_hasta = ahora;
  }

  await this.save();
  return MAX_INTENTOS - this.intentos_fallidos;
};

Usuario.prototype.resetearIntentos = async function () {
  this.intentos_fallidos = 0;
  this.bloqueado_hasta = null;
  await this.save();
};

module.exports = Usuario;
