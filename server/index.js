const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Schema } = mongoose;
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Problem Schema
const holdSchema = new Schema({
  id: Number,
  x: Number,
  y: Number,
  type: String
});

const problemSchema = new Schema({
  id: Number,
  name: String,
  creator: String,
  grade: String,
  holds: [holdSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Create Model
const Problem = mongoose.model('Problem', problemSchema);

// API Routes
// Get all problems
app.get('/api/problems', async (req, res) => {
  try {
    const problems = await Problem.find().sort({ createdAt: -1 });
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single problem
app.get('/api/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findOne({ id: req.params.id });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new problem
app.post('/api/problems', async (req, res) => {
  try {
    const problem = new Problem(req.body);
    const savedProblem = await problem.save();
    res.status(201).json(savedProblem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a problem
app.put('/api/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    res.json(problem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a problem
app.delete('/api/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({ id: req.params.id });
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    res.json({ message: 'Problem deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get the next available ID
app.get('/api/next-id', async (req, res) => {
  try {
    const lastProblem = await Problem.findOne().sort({ id: -1 });
    const nextId = lastProblem ? lastProblem.id + 1 : 1;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 