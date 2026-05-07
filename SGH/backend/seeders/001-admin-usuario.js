'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin123!', salt);

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Administrador',
        apellido: 'SGH',
        email: 'admin@hospital.com',
        password: passwordHash,
        rol: 'admin',
        activo: true,
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        creado_en: new Date(),
        actualizado_en: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', { email: 'admin@hospital.com' });
  },
};
