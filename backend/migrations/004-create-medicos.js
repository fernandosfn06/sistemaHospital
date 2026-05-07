'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medicos', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'usuarios', key: 'id' }, onDelete: 'CASCADE',
      },
      especialidad_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'especialidades', key: 'id' }, onDelete: 'RESTRICT',
      },
      cedula_profesional: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      telefono_consultorio: { type: Sequelize.STRING(15), allowNull: true },
      activo: { type: Sequelize.BOOLEAN, defaultValue: true },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('medicos');
  },
};
