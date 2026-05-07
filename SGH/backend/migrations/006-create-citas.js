'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('citas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      paciente_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'pacientes', key: 'id' }, onDelete: 'RESTRICT',
      },
      medico_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'medicos', key: 'id' }, onDelete: 'RESTRICT',
      },
      fecha:       { type: Sequelize.DATEONLY, allowNull: false },
      hora_inicio: { type: Sequelize.TIME, allowNull: false },
      hora_fin:    { type: Sequelize.TIME, allowNull: false },
      motivo:      { type: Sequelize.TEXT, allowNull: false },
      estado: {
        type: Sequelize.ENUM('programada', 'confirmada', 'cancelada', 'reprogramada', 'completada'),
        defaultValue: 'programada',
      },
      motivo_cancelacion: { type: Sequelize.TEXT, allowNull: true },
      cita_original_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'citas', key: 'id' }, onDelete: 'SET NULL',
      },
      creado_por_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'usuarios', key: 'id' }, onDelete: 'RESTRICT',
      },
      creado_en:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      actualizado_en:{ type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('citas');
  },
};
