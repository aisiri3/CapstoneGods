const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 5001;

// Middleware for CORS and JSON parsing
app.use(cors());
app.use(bodyParser.json());  // Parse incoming JSON requests

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost', // Your MySQL server address
  user: 'root', // Your MySQL username
  password: 'cap123', // Your MySQL password
  database: 'chatbot_eval' // Your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the MySQL database');
});

// Define root route to handle requests to "/"
app.get("/", (req, res) => {
  res.send("Welcome to the Chatbot Evaluation API!");
});

// Route to fetch all evaluation entries
app.get('/api/entries', (req, res) => {
  const query = 'SELECT * FROM evaluation_entries';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Route to add a new evaluation entry
app.post('/api/entries', (req, res) => {
  const { prompt, sampleResponse, actualResponse, responseTime, similarityScore } = req.body;
  const query = `
    INSERT INTO evaluation_entries (prompt, sampleResponse, actualResponse, responseTime, similarityScore)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [prompt, sampleResponse, actualResponse, responseTime, similarityScore], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: results.insertId, prompt, sampleResponse, actualResponse, responseTime, similarityScore });
  });
});

// Route to start evaluation
app.post('/api/start-evaluation', (req, res) => {
  console.log('Starting Python script...');

  // Spawn the Python process to handle Llama evaluation
  const pythonProcess = spawn('python', ['llamaEvaluation.py']);  // Use 'python3' if necessary

  let dataToSend = '';

  // Handle data output from the Python script
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Received data: ${data.toString()}`);
    dataToSend += data.toString();
  });

  // Handle errors from the Python script
  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // Handle the process exit (success or failure)
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    if (code === 0) {
      res.json({ message: 'Evaluation completed successfully!', data: dataToSend });
    } else {
      res.status(500).json({ error: 'Evaluation failed' });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


