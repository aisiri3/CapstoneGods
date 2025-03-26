// forward login request to backend
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { email, password } = req.body;  // Extract from request body

            const response = await fetch('http://localhost:8888/api/login', {  
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }) // Send login data
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Login failed'); // Show API error messages
            }

            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
