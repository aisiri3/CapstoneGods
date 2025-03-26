// src/pages/api/personas.js
export default async function handler(req, res) {
    // Set CORS headers if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    try {
      // Route based on HTTP method
      if (req.method === 'GET') {
        // Fetch all personas from the backend
        console.log('Fetching personas from backend...');
        
        try {
          const response = await fetch('http://localhost:8888/api/personas', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          // Log the response status to help with debugging
          console.log('Backend response status:', response.status);
          
          // Handle non-OK responses
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            
            return res.status(response.status).json({ 
              error: `Backend error: ${response.status} ${response.statusText}`,
              details: errorText
            });
          }
          
          const data = await response.json();
          console.log('Personas fetched successfully!');
          return res.status(200).json(data);
        } 
        catch (fetchError) {
          console.error('Error connecting to backend:', fetchError);
          return res.status(500).json({ 
            error: 'Failed to connect to backend service',
            details: fetchError.message
          });
        }
      } 
      else if (req.method === 'POST') {
        // Extract data from request body
        const personaData = req.body;
        console.log('Creating new persona:', personaData);
  
        // Validate required fields
        if (!personaData.name || !personaData.persona_description) {
          return res.status(400).json({ 
            error: 'Missing required fields',
            requiredFields: ['name', 'persona_description']
          });
        }
  
        // Forward the request to create a new persona
        try {
          const response = await fetch('http://localhost:8888/api/personas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(personaData),
          });
          
          // Log the response status
          console.log('Backend response status:', response.status);
          
          // Handle non-OK responses
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            
            return res.status(response.status).json({ 
              error: `Backend error: ${response.status} ${response.statusText}`,
              details: errorText
            });
          }
          
          const data = await response.json();
          console.log('Persona created successfully:', data);
          return res.status(201).json(data);
        }
        catch (fetchError) {
          console.error('Error connecting to backend:', fetchError);
          return res.status(500).json({ 
            error: 'Failed to connect to backend service',
            details: fetchError.message
          });
        }
      } 
      else {
        // Handle unsupported methods
        res.status(405).json({ error: 'Method Not Allowed' });
      }
    } 
    catch (error) {
      console.error('Error in personas API handler:', error);
      res.status(500).json({ error: error.message });
    }
  }