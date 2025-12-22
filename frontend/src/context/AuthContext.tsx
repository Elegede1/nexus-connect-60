
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    role: 'LANDLORD' | 'TENANT'; // Adjust based on your model
    avatar?: string;
    // Add other fields as needed
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User, refreshToken?: string) => void;
    logout: () => void;
    refreshAccessToken: () => Promise<string | null>;
    updateUser: (updatedUser: User) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        // Check localStorage on mount
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user', e);
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User, refreshToken?: string) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('access_token', newToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    };

    const refreshAccessToken = async (): Promise<string | null> => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            logout();
            return null;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                const newToken = data.access;
                setToken(newToken);
                localStorage.setItem('access_token', newToken);
                return newToken;
            } else {
                logout();
                return null;
            }
        } catch (error) {
            console.error('Failed to refresh token', error);
            logout();
            return null;
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshAccessToken, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
