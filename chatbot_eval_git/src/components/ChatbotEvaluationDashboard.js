import React from 'react';

import '../styles/styles.css';

import * as XLSX from "xlsx";  // Import the xlsx library

import { useState, useEffect } from "react";

import axios from "axios"; // Import axios for HTTP requests

import { Scatter } from "react-chartjs-2";  // Use the Scatter component from react-chartjs-2

export default function ChatbotEvaluationDashboard() {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    prompt: "",
    sampleResponse: "",
    actualResponse: "",
    responseTime: 0,
    similarityScore: 0
  });

  const [averageSimilarity, setAverageSimilarity] = useState(0);

  const [averageResponseTime, setAverageResponseTime] = useState(0);



  // // Fetch entries from the backend
  // useEffect(() => {
  //   axios.get("http://localhost:5001/api/entries")
  //     .then((response) => {
  //       setEntries(response.data); // Populate the entries state with the fetched data
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching entries:", error);
  //     });
  // }, []); // Empty dependency array to run only once when the component mounts



  useEffect(() => {

    axios

      .get("http://localhost:5001/api/entries")

      .then((response) => {

        const fetchedEntries = response.data;

        console.log("Fetched Entries: ", fetchedEntries); // Log the raw data



        setEntries(fetchedEntries); // Populate the entries state with the fetched data



        // Filter out invalid or missing data

        const validEntries = fetchedEntries.filter(

          (entry) =>

            !isNaN(entry.similarityScore) &&

            entry.similarityScore !== null &&

            entry.similarityScore !== undefined &&

            !isNaN(entry.responseTime) &&

            entry.responseTime !== null &&

            entry.responseTime !== undefined

        );



        console.log("Valid Entries: ", validEntries); // Log filtered valid entries



        if (validEntries.length > 0) {

          // Calculate averages

          const totalSimilarity = validEntries.reduce(

            (sum, entry) => sum + Number(entry.similarityScore),

            0

          );

          const totalResponseTime = validEntries.reduce(

            (sum, entry) => sum + Number(entry.responseTime),

            0

          );



          const avgSimilarity = totalSimilarity / validEntries.length;

          const avgResponseTime = totalResponseTime / validEntries.length;



          console.log("Total Similarity: ", totalSimilarity); // Check total similarity

          console.log("Average Similarity: ", avgSimilarity); // Check calculated average



          setAverageSimilarity(avgSimilarity);

          setAverageResponseTime(avgResponseTime);

        } else {

          console.warn("No valid entries to calculate averages.");

        }

      })

      .catch((error) => {

        console.error("Error fetching entries:", error);

      });

  }, []);


  const chartData = {

    datasets: [

      {

        label: "Similarity Score",

        data: entries.map((entry, index) => ({

          x: index,

          y: entry.similarityScore,

        })),

        backgroundColor: "rgba(75, 192, 192, 1)",

        borderColor: "rgba(75, 192, 192, 0.2)",

        borderWidth: 1,

        pointRadius: 5,

        pointHoverRadius: 7,

      },

      {

        label: "Response Time",

        data: entries.map((entry, index) => ({

          x: index,

          y: entry.responseTime,

        })),

        backgroundColor: "rgba(255, 99, 132, 1)",

        borderColor: "rgba(255, 99, 132, 0.2)",

        borderWidth: 1,

        pointRadius: 5,

        pointHoverRadius: 7,

      },

    ],

  };



  const chartOptions = {

    responsive: true,

    scales: {

      x: {

        title: {

          display: true,

          text: "Index",

        },

        ticks: {

          stepSize: 1, // Set the interval to 1

        },

      },

      y: {

        title: {

          display: true,

          text: "Value",

        },

        ticks: {

          stepSize: 10, // Set the interval to 10 for the y-axis

        },

      },

    },

    plugins: {

      tooltip: {

        callbacks: {

          label: function (context) {

            let data = context.raw;

            if (context.dataset.label === "Similarity Score") {

              return `Similarity: ${data.y}`;

            } else if (context.dataset.label === "Response Time") {

              return `Time: ${data.y}ms`;

            }

          },

        },

      },

    },

  };





  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({
      ...prev,
      [name]: name === "responseTime" || name === "similarityScore" ? Number(value) : value
    }));
  };

  // const handleAddEntry = () => {
  //   setEntries((prev) => [...prev, { id: Date.now(), ...newEntry }]);
  //   setNewEntry({
  //     prompt: "",
  //     sampleResponse: "",
  //     actualResponse: "",
  //     responseTime: 0,
  //     similarityScore: 0
  //   });
  // };


  // Handle the submission of new entry
  const handleAddEntry = () => {
    axios.post("http://localhost:5001/api/entries", newEntry)
      .then((response) => {
        setEntries((prev) => [...prev, response.data]); // Add the newly added entry to the state
        setNewEntry({
          prompt: "",
          sampleResponse: "",
          actualResponse: "",
          responseTime: 0,
          similarityScore: 0
        });
      })
      .catch((error) => {
        console.error("Error adding entry:", error);
      });
  };

  const handleStartEvaluation = () => {
    alert('Evaluation has started!');
    axios.post("http://localhost:5001/api/start-evaluation")
      .then((response) => {
        console.log("Evaluation Started:", response.data);
        alert('Evaluation complete!');
        
        // Trigger a re-fetch of the entries to update the UI
        axios.get("http://localhost:5001/api/entries")
          .then((response) => {
            setEntries(response.data); // Update the entries state with the latest data
          })
          .catch((error) => {
            console.error("Error fetching updated entries:", error);
          });
      })
      .catch((error) => {
        console.error("Error starting evaluation:", error);
        alert('There was an error starting the evaluation.');
      });
  };
  

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
  
      // Assuming the data is in the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      // Extract prompts and sample responses
      const newEntries = jsonData.map((row) => ({
        prompt: row.prompt || "", // Assuming column name is "prompt"
        sampleResponse: row.sample_answer || "", // Assuming column name is "sampleResponse"
        actualResponse: "",
        responseTime: 0,
        similarityScore: row.similarityScore || 0 
      }));
  
      setEntries(newEntries); // Populate the entries with data from the file
  
      // Send the entries to the backend to be saved in the database
      newEntries.forEach(entry => {
        axios.post("http://localhost:5001/api/entries", entry)
          .then((response) => {
            console.log("Entry added to database:", response.data);
          })
          .catch((error) => {
            console.error("Error adding entry to database:", error);
          });
      });
      alert('File uploaded sucessfully!');
    };
    reader.readAsBinaryString(file);
  };
  

  return (
<div className="container mx-auto p-4">
  <h1 className="text-2xl font-bold mb-4">Chatbot Evaluation Dashboard</h1>

  <div className="avg-stats mb-6">
        <div>
          <strong>Average Similarity Score:</strong> {averageSimilarity.toFixed(2)}
        </div>
        <div>
          <strong>Average Response Time:</strong> {averageResponseTime.toFixed(2)} ms
        </div>
      </div>

      <div className="chart-section">
        <Scatter data={chartData} options={chartOptions} />
      </div>



  {/* File Upload for Excel */}
  <div className="form-section mb-4">
    <label className="form-label">Upload Excel File:</label>
    <input
      type="file"
      accept=".xlsx, .xls"
      onChange={handleFileUpload}
      className="input-field"
    />
  </div>

  {/* Form sections for input fields */}
  <div className="form-section">
    <label className="form-label">Prompt:</label>
    <input
      name="prompt"
      value={newEntry.prompt}
      onChange={handleInputChange}
      className="input-field prompt-input"
      placeholder="Enter the prompt"
    />
  </div>

  <div className="form-section">
    <label className="form-label">Sample Response:</label>
    <textarea
      name="sampleResponse"
      value={newEntry.sampleResponse}
      onChange={handleInputChange}
      className="input-field sample-response-input"
      placeholder="Enter the sample response"
    />
  </div>

  {/* Buttons */}
  <div className="flex flex-row space-x-4 mt-4 w-full">
    <button
      onClick={handleAddEntry}
      className="button bg-blue-500 text-white px-4 py-2 rounded"
    >
      Add Entry
    </button>

    <button
      onClick={handleStartEvaluation}
      className="button bg-green-500 text-white px-4 py-2 rounded"
    >
      Start Evaluation
    </button>
  </div>

  {/* Display Evaluation Entries */}
  <h2 className="text-xl font-bold mt-6">Evaluation Entries</h2>
  <table className="w-full mt-4">
    <thead>
      <tr>
        <th>Prompt</th>
        <th>Sample Response</th>
        <th>Actual Response</th>
        <th>Response Time (ms)</th>
        <th>Similarity Score</th>
      </tr>
    </thead>
    <tbody>
      {entries.map((entry) => (
        <tr key={entry.id}>
          <td>{entry.prompt}</td>
          <td>{entry.sampleResponse}</td>
          <td>{entry.actualResponse}</td>
          <td>{entry.responseTime}</td>
          <td>{entry.similarityScore}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

  );
}









