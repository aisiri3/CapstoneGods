// pages/api/start-evaluation.js
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            console.log('Starting evaluation process...');
            
            // Forward the request to the Flask backend
            const response = await fetch('http://localhost:8888/api/start-evaluation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body || {})
            });

            // Get the raw response text first
            const responseText = await response.text();
            console.log('Response from Flask:', responseText);
            
            // Try to parse the response as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                console.error('Error parsing response as JSON:', error);
                return res.status(500).json({ 
                    message: 'Failed to parse response from evaluation server',
                    rawResponse: responseText.substring(0, 200) // Include part of the raw response for debugging
                });
            }

            // Return the data to the client
            return res.status(response.ok ? 200 : response.status).json(data);
        } catch (error) {
            console.error('Error in start-evaluation:', error);
            return res.status(500).json({ message: error.message });
        }
    } else {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
}