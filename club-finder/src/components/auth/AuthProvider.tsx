import React, { createContext, useContext, useState, useEffect } from 'react';

interface ClientUser {
    id: number;
    username: string;
    email: string;
    role: string;
    avatar_url?: string;
    faceit_id?: string | null;
    faceit_elo?: number | null;
    faceit_level?: number | null;
}

interface AuthContextType {
    user: ClientUser | null;
    token: string | null;
    login: (token: string, user: ClientUser) => void;
    updateUser: (patch: Partial<ClientUser>) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<ClientUser | null>(() => {
        const savedUser = localStorage.getItem('icafe_client_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('icafe_client_token');
    });

    const login = (newToken: string, newUser: ClientUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('icafe_client_token', newToken);
        localStorage.setItem('icafe_client_user', JSON.stringify(newUser));
    };

    const updateUser = (patch: Partial<ClientUser>) => {
        setUser(prev => {
            if (!prev) return prev;
            const next = { ...prev, ...patch };
            localStorage.setItem('icafe_client_user', JSON.stringify(next));
            return next;
        });
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('icafe_client_token');
        localStorage.removeItem('icafe_client_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, updateUser, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
