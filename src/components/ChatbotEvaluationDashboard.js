"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from "xlsx";
import { Scatter } from "react-chartjs-2";
import { Info } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import "@/styles/Eval.css";

// Register the required components
ChartJS.register(LinearScale, PointElement, LineElement, ChartTooltip, Legend);

export default function ChatbotEvaluationDashboard() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [newEntry, setNewEntry] = useState({
    prompt: "",
    sampleResponse: "",
    actualResponse: "",
    responseTime: 0,
    similarityScore: 0,
    personaId: "", // Store the selected persona ID
  });
  
  // Added state to show feedback for operations
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [selectedPersonaDescription, setSelectedPersonaDescription] = useState("");

  const [averageSimilarity, setAverageSimilarity] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);

  // Fetch entries and personas from the Next.js API route
  useEffect(() => {
    fetchPersonas();
    fetchEntries();
  }, []);

  // New function to fetch personas
  const fetchPersonas = async () => {
    try {
      const response = await fetch('/api/personas');
      
      // Check if the response is OK before trying to parse JSON
      if (!response.ok) {
        // Try to get error details if available
        let errorMessage = "Failed to fetch personas";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the status text
          errorMessage = `Failed to fetch personas: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Only parse JSON if response was successful
      const data = await response.json();
      
      // Map the data to ensure it has consistent field names
      const mappedPersonas = data.map(persona => ({
        // Ensure we have both id and persona_id for compatibility
        id: persona.persona_id || persona.id,
        persona_id: persona.persona_id || persona.id,
        name: persona.name,
        description: persona.persona_description || persona.description,
        persona_description: persona.persona_description || persona.description
      }));
      
      setPersonas(mappedPersonas);
    } catch (error) {
      console.error("Error fetching personas:", error);
      setFeedback({ 
        message: `Error fetching personas: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  // Function to fetch entries
  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/evaluation');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch entries");
      }

      setEntries(data);

      // Filter out invalid or missing data
      const validEntries = data.filter(
        (entry) =>
          !isNaN(entry.similarityScore) &&
          entry.similarityScore !== null &&
          entry.similarityScore !== undefined &&
          !isNaN(entry.responseTime) &&
          entry.responseTime !== null &&
          entry.responseTime !== undefined
      );

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

        setAverageSimilarity(avgSimilarity);
        setAverageResponseTime(avgResponseTime);
      } else {
        console.warn("No valid entries to calculate averages.");
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
      setFeedback({ 
        message: `Error fetching entries: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  const chartData = {
    datasets: [
      {
        label: "Similarity Score",
        data: entries.map((entry, index) => ({
          x: index,
          y: entry.similarityScore,
          key: `similarity-${index}`,
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
          key: `response-time-${index}`,
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
          text: "Prompt Index",
          color: "rgba(75, 192, 192, 1)",
        },
        ticks: {
          stepSize: 1,
          color: "white",
        },
        grid: {
          color: "rgba(85, 74, 74, 0.5)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Response Time (ms)",
          color: "rgba(255, 99, 132, 1)",
        },
        ticks: {
          stepSize: 10,
          color: "white",
        },
        grid: {
          color: "rgba(85, 74, 74, 0.5)",
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
      legend: {
        position: "right",
        labels: {
          color: "gray",
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
    
    // If the persona changed, update the selected persona description
    if (name === "personaId") {
      const selectedPersona = personas.find(p => p.persona_id.toString() === value);
      setSelectedPersonaDescription(
        selectedPersona ? selectedPersona.persona_description : ""
      );
    }
  };

  const handleAddEntry = async () => {
    try {
      // Validate entry has required fields
      if (!newEntry.prompt || !newEntry.sampleResponse) {
        setFeedback({
          message: "Prompt and Sample Response are required fields",
          type: "error"
        });
        return;
      }

      // Add new entry
      const response = await fetch('/api/evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });
  
      const newData = await response.json();
      if (!response.ok) {
        throw new Error(newData.message || "Failed to add entry");
      }
  
      // Update state with new entry
      setEntries(prev => [...prev, newData]);
      
      // Show success feedback
      setFeedback({
        message: "Entry added successfully",
        type: "success"
      });
      
      // Reset the form
      setNewEntry({
        prompt: "",
        sampleResponse: "",
        actualResponse: "",
        responseTime: 0,
        similarityScore: 0,
        personaId: ""
      });
      
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFeedback({ message: '', type: '' });
      }, 3000);
  
    } catch (error) {
      console.error("Error adding entry:", error);
      setFeedback({
        message: `Error adding entry: ${error.message}`,
        type: "error"
      });
    }
  };
  
  const handleNavigateToPersonaTools = () => {
    router.push('/persona-developer-tools');
  };

  const handleStartEvaluation = async () => {
    try {
      alert('Evaluation has started!');
    
      const response = await fetch('/api/start-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Simplified request body with just the persona ID
        body: JSON.stringify({ 
          personaId: newEntry.personaId || null  // Handle case when no persona is selected
        })
      });
    
      // First get the text response for debugging
      const responseText = await response.text();
      
      let data;
      try {
        // Try to parse as JSON if possible
        data = JSON.parse(responseText);
      } catch (err) {
        console.error("Failed to parse response as JSON:", responseText);
        alert('Error: Server returned invalid response. See console for details.');
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to start evaluation");
      }
    
      console.log("Evaluation completed:", data);
      alert('Evaluation complete!');
    
      // Re-fetch entries to update the UI
      const updatedResponse = await fetch('/api/evaluation');
      if (!updatedResponse.ok) {
        throw new Error("Failed to fetch updated entries");
      }
    
      const updatedData = await updatedResponse.json();
      setEntries(updatedData);
    } catch (error) {
      console.error("Error starting evaluation:", error);
      alert('There was an error starting the evaluation: ' + error.message);
    }
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
        prompt: row.prompt || "",
        sampleResponse: row.sample_answer || "",
        actualResponse: "",
        responseTime: 0,
        similarityScore: row.similarityScore || 0,
        personaId: newEntry.personaId // Use currently selected persona
      }));

      // Send the entries to the backend to be saved in the database
      let successCount = 0;
      let failureCount = 0;
      
      const uploadEntries = async () => {
        for (const entry of newEntries) {
          try {
            const response = await fetch('/api/evaluation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(entry),
            });

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || "Failed to add entry");
            }
            successCount++;
          } catch (error) {
            console.error("Error adding entry to database:", error);
            failureCount++;
          }
        }
        
        // Update feedback with results
        setFeedback({
          message: `File processed: ${successCount} entries added, ${failureCount} failed`,
          type: failureCount > 0 ? "warning" : "success"
        });
        
        // Refresh entries
        fetchEntries();
      };
      
      uploadEntries();
    };
    reader.readAsBinaryString(file);
  };

  // Function to display selected persona details
  const renderSelectedPersonaDetails = () => {
    if (!newEntry.personaId) return null;
    
    const selectedPersona = personas.find(p => p.persona_id.toString() === newEntry.personaId);
    if (!selectedPersona) return null;
    
    return (
      <div className="mt-2 p-2 bg-gray-800 rounded">
        <h3 className="text-sm font-bold text-cyan-400">Selected Persona:</h3>
        <p className="text-xs text-gray-300 mt-1">{selectedPersona.description}</p>
      </div>
    );
  };

  // Feedback message styling based on type
  const getFeedbackStyle = () => {
    switch (feedback.type) {
      case 'success': return 'bg-green-900 text-green-100';
      case 'error': return 'bg-red-900 text-red-100';
      case 'warning': return 'bg-yellow-900 text-yellow-100';
      case 'info': return 'bg-blue-900 text-blue-100';
      default: return 'bg-gray-900 text-gray-100';
    }
  };

  return (
    <div>
      <div className="main-form mx-auto p-4">
        {/* <h1 className="text-2xl text-center mb-4">Developer Tools</h1> */}

        {/* Container for Overview and Chart Sections */}
        <div className="flex flex-row space-x-4 mb-6">

          {/* Results Overview - with vertical centering */}
          <div className="w-1/2 p-4 overview-section flex flex-col justify-center">
            <h1 className="mb-2 sections-header">Results Overview</h1>

            {/* Results container with flex layout */}
            <div className="flex flex-col justify-center flex-grow">
              {/* Similarity Score */}
              <div className="mb-16 text-center">
                <div className="text-5xl font-bold text-cyan-400 large-value">{averageSimilarity.toFixed(2)}</div>
                <div className="text-sm text-cyan-400">Average Similarity Score</div>
              </div>

              {/* Response Time */}
              <div className="text-center">
                <div className="text-5xl font-bold text-rose-400">{averageResponseTime.toFixed(2)} ms</div>
                <div className="mt-3 text-sm text-rose-400">Average Response Time</div>
              </div>
            </div>
          </div>
            
          {/* Chart */}
          <div className="w-1/2 p-4 chart-section">
            <h1 className="mb-4 sections-header">Graph of Similarity Score and Response</h1>
            <Scatter data={chartData} options={chartOptions} />
          </div>
          
        </div>

        {/* Just a horizontal line */}
        <hr></hr>

        <h1 className="mt-4 text-xl font-bold mb-4 flex items-center">
        Model Evaluation

        <TooltipProvider delayDuration={70}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="ml-2 text-gray-300 cursor-pointer" size={18} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Evaluates the responses based on <br></br>
                similarity and response time.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

      </h1>
  
        {/* File Upload for Excel */}
        <div className="form-section mb-2">
          <label className="italic">Upload Dataset Excel File Here</label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="mt-2 input-field"
          />
        </div>

        {/* Dropdown to select persona */}
        <div className="form-section">
          <label className="mt-4 form-label">Select Persona</label>
          <select
            name="personaId"
            value={newEntry.personaId}
            onChange={handleInputChange}
            className="mt-2 input-field text-gray-900 persona-select"
            style={{ 
              width: "100%", 
              maxWidth: "100%",
              whiteSpace: "normal",
              textOverflow: "clip"
            }}
          >
            <option value="">Select a persona</option>
            {personas.map((persona) => (
              <option 
                key={persona.persona_id || persona.id} 
                value={persona.persona_id || persona.id}
                style={{ 
                  width: "100%",
                  whiteSpace: "normal",
                  overflow: "visible",
                  textOverflow: "clip"
                }}
              >
                {persona.name}
              </option>
            ))}
          </select>
          
          {/* Display selected persona description if any */}
          {newEntry.personaId && (
            <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
              <strong>Selected Persona:</strong> {personas.find(p => p.persona_id.toString() === newEntry.personaId.toString())?.name}
            </div>
          )}
        </div>
          
        {/* Form sections for input fields */}
        <div className="form-section">
          <label className="mt-4 form-label">Prompt</label>
          <input
            name="prompt"
            value={newEntry.prompt}
            onChange={handleInputChange}
            className="mt-2 input-field prompt-input text-gray-900"
            placeholder="Enter the prompt..."
          />
        </div>
  
        <div className="form-section">
          <label className="mt-4 form-label">Sample Response</label>
          <textarea
            name="sampleResponse"
            value={newEntry.sampleResponse}
            onChange={handleInputChange}
            className="mt-2 input-field sample-response-input text-gray-900"
            placeholder="Enter the sample response..."
          />
        </div>
  
        {/* Buttons */}
        <div className="flex flex-row space-x-4 mt-4 w-full">
          <button
            onClick={handleAddEntry}
            className="button bg-violet-900 hover:bg-violet-950 text-white px-4 py-2 rounded"
          >
            Add Entry
          </button>
  
          <button
            onClick={handleStartEvaluation}
            className="button bg-violet-900 hover:bg-violet-950 text-white px-4 py-2 rounded"
          >
            Start Evaluation
          </button>
        </div>

        <hr className='mt-10 mb-4'></hr>
        {/* Display Evaluation Entries with scrollable container */}
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-4 form-header">Evaluation Entries</h2>
          <div 
            className="overflow-auto border border-gray-700 rounded-md" 
            style={{ 
              maxHeight: "50vh",
              width: "100%",
              scrollbarWidth: "thin",
              scrollbarColor: "#4f4f4f #1f1f1f"
            }}>
            <table className="custom-table w-full">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: "#1e293b" }}>
                <tr>
                  <th>Prompt</th>
                  <th>Sample Response</th>
                  <th>Actual Response</th>
                  <th>Response Time (ms)</th>
                  <th>Similarity Score
                    <TooltipProvider delayDuration={70}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="ml-2 text-gray-300 cursor-pointer" size={18} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Similarity score refers to the<br/>bla bla bla bla bla...</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id || uuidv4()}>
                    <td>{entry.prompt}</td>
                    <td>{entry.sampleResponse}</td>
                    <td>{entry.actualResponse}</td>
                    <td className="font-bold">{entry.responseTime}</td>
                    <td className="font-bold">{entry.similarityScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New button to navigate to persona tools */}
        <div className="flex mt-8">
          <button
            onClick={handleNavigateToPersonaTools}
            className="button bg-violet-700 hover:bg-violet-950 text-white px-3 py-2 rounded"
            style={{ width: "200px" }}>
            Add a Persona
          </button>
        </div>
      </div>
    </div>
  );
}