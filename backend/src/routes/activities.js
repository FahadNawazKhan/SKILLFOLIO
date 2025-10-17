const express = require('express');
const router = express.Router();
const {
  createActivity,
  getPendingActivities
} = require('../controllers/activitiesController');

router.post('/', createActivity);
router.get('/', getPendingActivities); // optional query params ?status=pending

module.exports = router;
