import { z } from 'zod';

// Solo letras (español incluido), espacios, guiones, apóstrofes y puntos
export const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙ\s\-'\.]+$/;

// Patrones de inyección SQL / código
export const INJECTION_REGEX = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|TRUNCATE|GRANT|REVOKE|REPLACE|MERGE)\b|--|\/\*|\*\/|<script[\s>]|javascript:|vbscript:|0x[0-9a-fA-F]{4,})/i;

export const zNombre = (etiqueta, min = 2, max = 100) =>
  z.string()
    .min(min, `${etiqueta} debe tener al menos ${min} caracteres.`)
    .max(max, `${etiqueta} no puede exceder ${max} caracteres.`)
    .regex(NOMBRE_REGEX, `${etiqueta} solo puede contener letras, espacios, guiones y apóstrofes.`);

export const zNombreOpcional = (etiqueta, max = 100) =>
  z.string()
    .max(max, `${etiqueta} no puede exceder ${max} caracteres.`)
    .regex(NOMBRE_REGEX, `${etiqueta} solo puede contener letras, espacios, guiones y apóstrofes.`)
    .optional()
    .or(z.literal(''));

export const zTexto = (etiqueta, max = 1000) =>
  z.string()
    .max(max, `${etiqueta} no puede exceder ${max} caracteres.`)
    .refine((v) => !INJECTION_REGEX.test(v), `${etiqueta} contiene caracteres o patrones no permitidos.`);

export const zTextoOpcional = (etiqueta, max = 1000) =>
  z.string()
    .max(max, `${etiqueta} no puede exceder ${max} caracteres.`)
    .refine((v) => !INJECTION_REGEX.test(v), `${etiqueta} contiene caracteres o patrones no permitidos.`)
    .optional()
    .or(z.literal(''));

export const zTelefono = z
  .string()
  .regex(/^\d[\d\s\-\+\(\)]{6,14}$/, 'Teléfono inválido.')
  .optional()
  .or(z.literal(''));
