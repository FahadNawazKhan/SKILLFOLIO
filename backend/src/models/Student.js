const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true },
  name: String,
  email: String,
  program: String,
  year: Number
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
