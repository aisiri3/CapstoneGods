// pages/api/login.js - simplified version
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { email, password } = req.body;

            console.log('Login API: Sending request to backend...');
            const response = await fetch('http://localhost:8888/api/login', {  
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('Login API: Login failed:', data.error);
                return res.status(response.status).json({ error: data.error || 'Login failed' });
            }

            console.log('Login API: Login successful');
            
            // Set a more compatible cookie
            res.setHeader(
                'Set-Cookie',
                `authToken=${data.token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
            );
            
            // Return success with token for client-side storage too
            return res.status(200).json({
                message: 'Login successful',
                user: data.user,
                token: data.token
            });
            
        } catch (error) {
            console.error('Login API: Error:', error);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}