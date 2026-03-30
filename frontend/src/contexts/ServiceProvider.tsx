'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import * as apiClient from '@/lib/apiClient';

// Define the shape of our service abstraction
type ApiService = typeof apiClient;

const ServiceContext = createContext<ApiService | null>(null);

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <ServiceContext.Provider value={apiClient}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useService = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error('useService must be used within a ServiceProvider');
    }
    return context;
};
