require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// health
app.get('/', (req, res) => res.send('Skillfolio Backend Running'));

// mount API routes (make sure these files exist)
const studentsRouter = require('./routes/students');
const activitiesRouter = require('./routes/activities');
app.use('/api/students', studentsRouter);
app.use('/api/activities', activitiesRouter);

// public PDFs (static serving) - optional but handy for demo
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Public verification endpoint (single import, single route)
const verifyController = require('./controllers/verifyController');
if (!verifyController || typeof verifyController.verifyToken !== 'function') {
  console.error('verifyController.verifyToken is missing or not a function');
} else {
  app.get('/verify', verifyController.verifyToken);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
