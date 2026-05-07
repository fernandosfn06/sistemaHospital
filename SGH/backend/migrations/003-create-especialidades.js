'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('especialidades', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      activo: { type: Sequelize.BOOLEAN, defaultValue: true },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('especialidades');
  },
};
