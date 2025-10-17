const express = require('express');
const router = express.Router();
const { getAllStudents } = require('../controllers/studentsController');

router.get('/', getAllStudents);

module.exports = router;
