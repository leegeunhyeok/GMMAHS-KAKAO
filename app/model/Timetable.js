const { Sequelize, sequelize } = require('../bootstrap/database')

// Timetable 모델 정의
const Timetable = sequelize.define('Timetable', {
  grade: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  class: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  weekday: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  period: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  code: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  teacher: {
    type: Sequelize.toString(12),
    allowNull: false
  },
  subject: {
    type: Sequelize.toString(36),
    allowNull: false
  }
}, {
  freezeTableName: true
})


exports.init = () => {
  return Timetable.sync({ force: true })
}
