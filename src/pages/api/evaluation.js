export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const response = await fetch('http://localhost:8888/api/entries');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch evaluation data");
            }

            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const entryData = req.body;  // Get the entry data sent from frontend

            const response = await fetch('http://localhost:8888/api/entries', {  // FIXED ENDPOINT
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entryData),  // Send data to backend
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to add entry");
            }

            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}