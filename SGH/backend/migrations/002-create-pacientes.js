'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pacientes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      numero_expediente: {
        type: Sequelize.STRING(20),
        unique: true,
      },
      fecha_nacimiento: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      curp: {
        type: Sequelize.STRING(18),
        allowNull: true,
        unique: true,
      },
      tipo_sangre: {
        type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: true,
      },
      telefono: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      direccion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contacto_emergencia_nombre: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      contacto_emergencia_telefono: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      alergias: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: 'Ninguna',
      },
      creado_en: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      actualizado_en: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pacientes');
  },
};
