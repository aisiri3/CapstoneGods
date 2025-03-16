// API handler for sending avatar selections to the backend
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const selections = req.body;
      
      // Validate the request body
      if (!selections || !selections.gender || !selections.persona || !selections.language) {
        return res.status(400).json({ error: 'Missing required selection fields' });
      }
  
      // Send the selections to your Flask backend
      const response = await fetch("http://localhost:8888/api/selections", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selections),
      });
  
      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
  
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error sending selections to backend:', error);
      return res.status(500).json({ error: 'Failed to send selections to backend' });
    }
  }