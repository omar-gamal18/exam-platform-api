const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Base Route / Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Exam Platform API',
    timestamp: new Date()
  });
});

// Handling 404
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

module.exports = app;
