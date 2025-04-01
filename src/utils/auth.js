// src/utils/auth.js - simplified version
import Cookies from 'js-cookie';

// Simplified setAuth function - focus on localStorage for client-side
export const setAuth = (token, user) => {
  try {
    // Store token in client-side cookie
    if (token) {
      Cookies.set('authToken', token, { expires: 7, path: '/' });
    }
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('Auth data stored successfully');
    return true;
  } catch (error) {
    console.error('Error storing auth data:', error);
    return false;
  }
};

// Simplified removeAuth
export const removeAuth = () => {
  try {
    // Remove client-side cookie
    Cookies.remove('authToken', { path: '/' });
    
    // Remove localStorage data
    localStorage.removeItem('user');
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

// Check if authenticated (client-side only)
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const token = Cookies.get('authToken');
  const user = localStorage.getItem('user');
  
  console.log('Auth check - token exists:', !!token, 'user exists:', !!user);
  return !!(token && user);
};

// Get user data
export const getUser = () => {
  if (typeof window === 'undefined') return null;
  
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get token
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  
  return Cookies.get('authToken');
};

// Auth header helper
export const authHeader = () => {
  const token = getToken();
  
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  
  return {};
};