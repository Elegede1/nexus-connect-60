import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRole: 'LANDLORD' | 'TENANT';
}

export const RoleGuard = ({ children, allowedRole }: RoleGuardProps) => {
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (user && user.role !== allowedRole) {
            toast({
                title: "Access Denied",
                description: `This area is restricted to ${allowedRole.toLowerCase()}s only.`,
                variant: "destructive",
            });
        }
    }, [user, allowedRole, toast]);

    if (!user) return null; // ProtectedRoute will handle this

    if (user.role !== allowedRole) {
        // Redirect to the appropriate dashboard
        const redirectPath = user.role === 'LANDLORD' ? '/landlord' : '/tenant';
        return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
};
