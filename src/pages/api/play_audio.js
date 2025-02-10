export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const response = await fetch('http://localhost:8888/api/play_audio', {  // Updated URL
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to play audio');
            }

            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
