const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  type: String,
  title: String,
  date: Date,
  hours: Number,
  description: String,
  evidence_url: String,
  status: { type: String, default: 'pending' } // pending | approved | rejected
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
