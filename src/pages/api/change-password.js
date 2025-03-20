// pages/api/change-password.js

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { user_id, new_password } = req.body;
    
    if (!user_id || !new_password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    try {
        const response = await fetch("http://localhost:8888/api/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id, new_password }),
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