const Activity = require('../models/Activity');

exports.createActivity = async (req, res) => {
  try {
    const data = req.body;
    const activity = new Activity(data);
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPendingActivities = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const activities = await Activity.find({ status }).sort({ createdAt: -1 }).limit(200);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
