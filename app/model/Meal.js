const { Sequelize, sequelize } = require('../bootstrap/database')
const { timeStamp } = require('../common/util')

// Meal 모델 정의
const Meal = sequelize.define('Meal', {
  date: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  info: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  freezeTableName: true
})


exports.init = () => {
  return Meal.sync({ force: true })
}


exports.get = () => {
  return Meal.findOne()
}


exports.update = async (dateString, mealInfo) => {
  await Meal.destroy({
    where: {},
    truncate: true
  })
  await Meal.create({
    date: dateString,
    info: mealInfo
  })
}
