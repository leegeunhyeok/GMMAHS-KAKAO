const config = require('config')
const School = require('node-school-kr')
const school = new School()

school.init(school.eduType.high,
            school.region.gyeonggi,
            config.get('schoolCode'))

exports.school = school
