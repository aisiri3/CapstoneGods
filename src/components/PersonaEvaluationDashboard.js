"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from "xlsx";
import { Scatter } from "react-chartjs-2";
import { Info } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import { v4 as uuidv4 } from 'uuid';

import {
  Chart as ChartJS,
  LinearScale, // Import LinearScale
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import "@/styles/Eval.css";

// Register the required components
ChartJS.register(LinearScale, PointElement, LineElement, ChartTooltip, Legend);

export default function PersonaEvaluationDashboard() {
  const [entries, setEntries] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [newEntry, setNewEntry] = useState({
    prompt: "",
    sampleResponse: "",
    actualResponse: "",
    responseTime: 0,
    similarityScore: 0,
    personaId: "", 
  });
  const [newPersona, setNewPersona] = useState({
    name: "",
    description: "",
  });

  const [averageSimilarity, setAverageSimilarity] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);

  // Fetch entries and personas from the Next.js API route
  useEffect(() => {

// Fix for the useEffect to correctly map persona data from backend
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
      
      // Log the data structure to debug
      console.log("Fetched personas data:", data);
      
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
      // Handle the error appropriately (maybe set an error state)
    }
  };

    const fetchEntriesAndPersonas = async () => {
      try {
        const entriesResponse = await fetch('/api/evaluation');
        const entriesData = await entriesResponse.json();
        if (!entriesResponse.ok) {
          throw new Error(entriesData.message || "Failed to fetch entries");
        }

        setEntries(entriesData);

        // Fetch personas
        fetchPersonas();

        // Calculate averages
        const validEntries = entriesData.filter(
          (entry) =>
            !isNaN(entry.similarityScore) &&
            entry.similarityScore !== null &&
            entry.similarityScore !== undefined &&
            !isNaN(entry.responseTime) &&
            entry.responseTime !== null &&
            entry.responseTime !== undefined
        );

        if (validEntries.length > 0) {
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
        }
      } catch (error) {
        console.error("Error fetching entries and personas:", error);
      }
    };

    fetchEntriesAndPersonas();
  }, []);


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
  };

  const handleAddPersona = async () => {
    if (!newPersona.name || !newPersona.description) {
      alert("Name and description are required!");
      return;
    }
  
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPersona.name,
          persona_description: newPersona.description,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add persona");
      }
  
      const data = await response.json();
      console.log("Received persona data:", data); // Debugging log
  
      // Update the personas list with the new persona
      // Use the correct field names from your backend response
      setPersonas((prevPersonas) => [...prevPersonas, {
        persona_id: data.persona_id, // Use the actual field name from your backend
        id: data.persona_id, // Add this for compatibility with existing code
        name: data.name,
        persona_description: data.persona_description
      }]);
      
      // Reset the form
      setNewPersona({
        name: '',
        description: '',
      });
      
      alert('Persona added successfully!');
    } catch (error) {
      console.error("Error adding persona:", error);
      alert(`Failed to add persona: ${error.message}`);
    }
  };
  
  

  return (
    <div>
      <div className="main-form mx-auto p-4">

        {/* Add Persona Section */}
        <div className="form-section mt-6">
        <h1 className="mt-0 text-2xl font-bold mt-12">Add Persona</h1>
          <label className="mt-8 form-label">Persona Name</label>
          <input
            name="name"
            value={newPersona.name}
            onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
            className="mt-2 input-field text-gray-900"
            placeholder="Enter persona name"
          />
          <label className="mt-8 form-label">Persona Description</label>
          <textarea
            name="description"
            value={newPersona.description}
            onChange={(e) => setNewPersona({ ...newPersona, description: e.target.value })}
            className="mt-2 input-field text-gray-900"
            placeholder="Enter persona description"
          />
          <button
            onClick={handleAddPersona}
            className="mt-4 py-2 px-6 bg-violet-800 text-white rounded-lg"
          >
            Add Persona
          </button>
        </div>
      </div>
    </div>
  );
}