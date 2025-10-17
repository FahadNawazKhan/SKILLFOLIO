require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => res.send('Skillfolio Backend Running'));

// mount routes
const studentsRouter = require('./routes/students');
const activitiesRouter = require('./routes/activities');
app.use('/api/students', studentsRouter);
app.use('/api/activities', activitiesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
