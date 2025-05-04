export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // Clear the auth token cookie
    res.setHeader(
        'Set-Cookie',
        'authToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
    );
    
    return res.status(200).json({ message: 'Logged out successfully' });
}