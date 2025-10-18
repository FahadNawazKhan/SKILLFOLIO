const express = require('express');
const router = express.Router();

const {
  createActivity,
  getPendingActivities,
  verifyActivity
} = require('../controllers/activitiesController');

router.post('/', createActivity);
router.get('/', getPendingActivities);

// IMPORTANT: approve/reject route used by frontend ModeratorDashboard
router.post('/:id/verify', verifyActivity);

module.exports = router;
