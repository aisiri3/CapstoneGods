"use client";

/**
 * withAuth - Authentication Higher-Order Component
 *
 * This HOC (Higher-Order Component) provides authentication protection for pages.
 * It wraps page components and ensures users are authenticated before allowing access.
 * 
 * Features:
 * - Checks authentication status on component mount
 * - Redirects unauthenticated users to the sign-in page
 * - Displays a loading spinner during authentication check
 * - Only renders the protected component when the user is authenticated
 * 
 * Usage:
 *   import withAuth from '@/components/withAuth';
 *   
 *   function ProtectedPage() {
 *     return <div>Protected Content</div>;
 *   }
 *   
 *   export default withAuth(ProtectedPage);
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';

export default function withAuth(Component) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      // Check authentication status
      const checkAuth = () => {
        if (!isAuthenticated()) {
          // Not authenticated, redirect to login
          router.push('/auth/signin');
        } else {
          // Authenticated, allow access to the protected component
          setAuthorized(true);
        }
        setLoading(false);
      };

      checkAuth();
    }, [router]);

    // Show loading indicator while checking auth status
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-800"></div>
        </div>
      );
    }

    // Render the protected component if authorized
    return authorized ? <Component {...props} /> : null;
  };
}