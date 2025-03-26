export default async function handler(req, res) {
    try {
        if (!req.body || !req.body.text) {
            return res.status(400).json({ error: "Missing 'text' field in request body" });
        }

        console.log("Sending request to Flask backend:", req.body);

        const response = await fetch('http://localhost:8888/api/speak', {  // Updated URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Flask error:", errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error("Unexpected error in API route:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
