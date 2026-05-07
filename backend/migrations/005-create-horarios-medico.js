'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('horarios_medico', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      medico_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'medicos', key: 'id' }, onDelete: 'CASCADE',
      },
      dia_semana: { type: Sequelize.TINYINT, allowNull: false },
      hora_inicio: { type: Sequelize.TIME, allowNull: false },
      hora_fin:    { type: Sequelize.TIME, allowNull: false },
      activo: { type: Sequelize.BOOLEAN, defaultValue: true },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('horarios_medico');
  },
};
