"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function PersonaEvaluationDashboard() {
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPersona, setNewPersona] = useState({
    name: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: ''
  });

  // Fetch personas from the API
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/personas');
        
        if (!response.ok) {
          let errorMessage = "Failed to fetch personas";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Failed to fetch personas: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log("Fetched personas:", data);
        
        // Map the data to ensure it has consistent field names
        const mappedPersonas = data.map(persona => ({
          id: persona.persona_id || persona.id,
          persona_id: persona.persona_id || persona.id,
          name: persona.name,
          description: persona.persona_description || persona.description,
          persona_description: persona.persona_description || persona.description
        }));
        
        setPersonas(mappedPersonas);
      } catch (error) {
        console.error("Error fetching personas:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonas();
  }, []);

  // Validate the form inputs
  const validateForm = () => {
    let valid = true;
    const errors = {
      name: '',
      description: ''
    };

    // Check if name is empty
    if (!newPersona.name.trim()) {
      errors.name = 'Persona name is required';
      valid = false;
    }

    // Check if description is empty
    if (!newPersona.description.trim()) {
      errors.description = 'Persona description is required';
      valid = false;
    }

    // Check if persona with same name already exists
    const personaExists = personas.some(
      persona => persona.name.toLowerCase() === newPersona.name.toLowerCase()
    );
    
    if (personaExists) {
      errors.name = 'Persona with this name already exists';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPersona(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear the error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle adding a new persona
  const handleAddPersona = async () => {
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
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
      
      // Parse the response first to get detailed error messages
      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = data.error || "Failed to add persona";
        
        // Handle specific errors
        if (response.status === 409) {
          setFormErrors(prev => ({
            ...prev,
            name: 'Persona with this name already exists'
          }));
          throw new Error("Persona with this name already exists");
        }
        
        throw new Error(errorMessage);
      }
      
      console.log("Persona added successfully:", data);
      
      // Add the new persona to the list
      setPersonas(prevPersonas => [...prevPersonas, {
        id: data.persona_id || data.id,
        persona_id: data.persona_id || data.id,
        name: data.name,
        description: data.persona_description || data.description,
        persona_description: data.persona_description || data.description
      }]);
      
      // Reset the form
      setNewPersona({
        name: '',
        description: '',
      });
      
      // Show success message
      alert('Persona added successfully!');
      
    } catch (error) {
      console.error("Error adding persona:", error);
      
      // Don't show error alert if it's a validation error (already shown in the form)
      if (!error.message.includes("already exists")) {
        setError(error.message);
        alert(`Error adding persona: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="main-form mx-auto p-4">
        {/* Add Persona Section */}
        <div className="form-section mt-6">
          <h1 className="mt-0 text-xl font-bold mb-6">Add Persona</h1>
          
          {/* Show any general error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}
          
          {/* input fields with full width */}
          <div className="mb-4 w-full">
            <label className="form-label block mb-1">Persona Name</label>
            <input
              name="name"
              value={newPersona.name}
              onChange={handleInputChange}
              className={`mt-2 input-field text-gray-900 w-full block ${
                formErrors.name ? 'border-red-500' : ''
              }`}
              style={{ width: '100%', maxWidth: '100%' }}
              placeholder="Enter persona name"
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          <div className="mb-4 w-full">
            <label className="mt-5 form-label block mb-1">Persona Description</label>
            <textarea
              name="description"
              value={newPersona.description}
              onChange={handleInputChange}
              className={`mt-2 input-field text-gray-900 w-full block ${
                formErrors.description ? 'border-red-500' : ''
              }`}
              style={{ width: '100%', maxWidth: '100%' }}
              placeholder="Enter persona description"
              rows={6}
            />
            {formErrors.description && (
              <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
            )}
          </div>
          
          <button
            onClick={handleAddPersona}
            disabled={isLoading}
            className={`mt-4 mb-8 py-2 px-6 bg-violet-800 text-white rounded-lg ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-violet-900'
            }`}
          >
            {isLoading ? 'Adding...' : 'Add Persona'}
          </button>
        </div>

        {/* Horizontal line */}
        <hr></hr>
        
        {/* Display existing personas */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-6">Existing Personas</h2>
          
          {isLoading && <p>Loading personas...</p>}
          
          {!isLoading && personas.length === 0 && (
            <p className="text-gray-400">No personas found. Add one above!</p>
          )}
          
          {personas.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personas.map(persona => (
                <div 
                  key={persona.id || persona.persona_id || uuidv4()} 
                  className="p-4 border border-gray-700 rounded-md bg-gray-800"
                >
                  <h3 className="text-md font-semibold mb-2">{persona.name}</h3>
                  <p className="text-gray-300 text-sm">
                    {(persona.description || persona.persona_description || '').substring(0, 120)}
                    {(persona.description || persona.persona_description || '').length > 120 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}