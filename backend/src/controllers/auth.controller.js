const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');
const { sequelize } = require('../config/database');

const toPublico = (u) => ({ id: u.id, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol });

const registrar = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array() });
    }

    const { nombre, apellido, email, password, fecha_nacimiento, curp, tipo_sangre, telefono, direccion } = req.body;

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

    const { nuevoUsuario, nuevoPaciente } = await sequelize.transaction(async (t) => {
      const nuevoUsuario = await Usuario.create(
        { nombre, apellido, email, password, rol: 'paciente' },
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
        },
        { transaction: t }
      );
      return { nuevoUsuario, nuevoPaciente };
    });

    const token = generarToken(nuevoUsuario);

    return res.status(201).json({
      ok: true,
      mensaje: 'Paciente registrado exitosamente.',
      data: {
        usuario: toPublico(nuevoUsuario),
        paciente: { id: nuevoPaciente.id, numero_expediente: nuevoPaciente.numero_expediente },
        token,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

const login = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array() });
    }

    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas.' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ ok: false, mensaje: 'Tu cuenta está desactivada. Contacta al administrador.' });
    }

    if (usuario.estaBloqueado()) {
      const tiempoRestante = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
      return res.status(429).json({
        ok: false,
        mensaje: `Cuenta bloqueada por demasiados intentos fallidos. Intenta de nuevo en ${tiempoRestante} minuto(s).`,
        bloqueado_hasta: usuario.bloqueado_hasta,
      });
    }

    const passwordCorrecta = await usuario.verificarPassword(password);
    if (!passwordCorrecta) {
      const intentosRestantes = await usuario.registrarIntentoFallido();

      if (intentosRestantes <= 0) {
        return res.status(429).json({
          ok: false,
          mensaje: `Cuenta bloqueada por ${process.env.LOCK_TIME_MINUTES || 15} minutos por demasiados intentos fallidos.`,
        });
      }

      return res.status(401).json({
        ok: false,
        mensaje: `Credenciales incorrectas. Te quedan ${intentosRestantes} intento(s).`,
      });
    }

    await usuario.resetearIntentos();
    const token = generarToken(usuario);

    return res.status(200).json({
      ok: true,
      mensaje: 'Sesión iniciada correctamente.',
      data: {
        usuario: toPublico(usuario),
        token,
        expira_en: process.env.JWT_EXPIRES_IN || '8h',
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

const logout = (_req, res) => {
  return res.status(200).json({
    ok: true,
    mensaje: 'Sesión cerrada correctamente. Por favor elimina el token del almacenamiento local.',
  });
};

const perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: { exclude: ['password', 'intentos_fallidos', 'bloqueado_hasta'] },
      include: [{ model: Paciente, as: 'paciente', required: false }],
    });

    return res.status(200).json({ ok: true, data: usuario });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener perfil.' });
  }
};

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

module.exports = { registrar, login, logout, perfil };
