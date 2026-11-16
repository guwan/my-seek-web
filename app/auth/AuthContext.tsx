// src/auth/AuthContext.tsx
import { createContext, useState, useContext, type ReactNode } from 'react';
import {deleteUserToken, getUserToken, saveUserToken} from "~/lib/AuthUtils";

interface AuthContextType {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!getUserToken();
    });

    const login = (token: string) => {
        saveUserToken(token)
        //localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        //localStorage.removeItem('token');
        deleteUserToken()
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};