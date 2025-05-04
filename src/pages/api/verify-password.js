export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { user_id, password } = req.body;
    
    if (!user_id || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the auth token from cookies
    const authToken = req.cookies.authToken;
    
    if (!authToken) {
        return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
        // Forward the request to the backend
        const response = await fetch("http://localhost:8888/api/verify-password", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ user_id, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        
        return res.status(200).json(data);
    } catch (error) {
        console.error("API error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}