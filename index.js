const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors({ 
  origin: 'https://password-reset-61.netlify.app',
  credentials: true 
}));

app.use(bodyParser.json());

// Routes
app.use('/auth', apiRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.log("Error connecting to MongoDB", error);
  });
