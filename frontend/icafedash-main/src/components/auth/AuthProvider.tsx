import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    username: string;
    role: string;
    club_name: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('icafe_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState<string | null>(() => {
        const savedToken = localStorage.getItem('icafe_token');
        return savedToken;
    });

    useEffect(() => {
        // Activity tracking for 2 hours timeout
        let timeoutId: number;

        const resetTimer = () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            // 2 hours in milliseconds
            timeoutId = window.setTimeout(() => {
                logout();
            }, 2 * 60 * 60 * 1000);
        };

        if (token) {
            resetTimer();
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
            events.forEach(event => document.addEventListener(event, resetTimer));

            return () => {
                window.clearTimeout(timeoutId);
                events.forEach(event => document.removeEventListener(event, resetTimer));
            };
        }
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('icafe_token', newToken);
        localStorage.setItem('icafe_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('icafe_token');
        localStorage.removeItem('icafe_user');
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
