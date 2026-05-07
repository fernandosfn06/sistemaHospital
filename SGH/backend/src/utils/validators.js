const { body } = require('express-validator');

// Solo letras (incluyendo español), espacios, guiones y apóstrofes — para nombres propios
const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙ\s\-'\.]+$/;

// Patrones de inyección SQL / código que deben rechazarse en cualquier campo de texto
const INJECTION_REGEX = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|TRUNCATE|GRANT|REVOKE|REPLACE|MERGE)\b|--|\/\*|\*\/|<script[\s>]|javascript:|vbscript:|0x[0-9a-fA-F]{4,})/i;

/**
 * Validator para campos de nombre propio (nombre, apellido, etc.)
 * Solo acepta letras, espacios, guiones y apóstrofes.
 */
const validarNombre = (campo, etiqueta, opciones = {}) => {
  const v = body(campo).trim();
  if (opciones.opcional) {
    return v
      .optional({ checkFalsy: true })
      .isLength({ min: 2, max: 100 }).withMessage(`${etiqueta} debe tener entre 2 y 100 caracteres.`)
      .matches(NOMBRE_REGEX).withMessage(`${etiqueta} solo puede contener letras, espacios, guiones y apóstrofes.`);
  }
  return v
    .notEmpty().withMessage(`${etiqueta} es obligatorio.`)
    .isLength({ min: 2, max: 100 }).withMessage(`${etiqueta} debe tener entre 2 y 100 caracteres.`)
    .matches(NOMBRE_REGEX).withMessage(`${etiqueta} solo puede contener letras, espacios, guiones y apóstrofes.`);
};

/**
 * Validator para campos de texto libre (motivo, descripcion, alergias, direccion, etc.)
 * Permite texto general pero rechaza patrones de inyección.
 */
const validarTexto = (campo, etiqueta, opciones = {}) => {
  const maxLen = opciones.maxLen || 1000;
  let v = body(campo).trim();
  if (opciones.opcional) {
    v = v.optional({ checkFalsy: true });
  } else {
    v = v.notEmpty().withMessage(`${etiqueta} es obligatorio.`);
  }
  return v
    .isLength({ max: maxLen }).withMessage(`${etiqueta} no puede exceder ${maxLen} caracteres.`)
    .not().matches(INJECTION_REGEX).withMessage(`${etiqueta} contiene caracteres o patrones no permitidos.`);
};

module.exports = { validarNombre, validarTexto, NOMBRE_REGEX, INJECTION_REGEX };
