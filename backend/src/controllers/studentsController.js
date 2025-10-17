const Student = require('../models/Student');

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().limit(500);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
