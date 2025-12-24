// store/authStore.ts or store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    email?: string;
    role?: string;
    [key: string]: any;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setAuth: (token: string, user: User) => void;
    clearAuth: () => void;
    logout: () => Promise<void>;
    updateToken: (newToken: string) => void;
    initializeAuth: () => Promise<void>;
}

// Check if we're in Electron
const isElectron = typeof window !== 'undefined' && window.electron;

// Create a silent no-op storage that doesn't throw errors
const createNoopStorage = () => ({
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
});

// Use different store configurations based on environment
const createAuthStore = () => {
    if (isElectron) {
        // In Electron: NO persistence middleware, pure Zustand store
        return create<AuthState>((set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: true,

            setAuth: (token: string, user: User) => {
                console.log('Setting auth in store:', { token: token.substring(0, 20) + '...', user });
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false
                });
            },

            clearAuth: () => {
                console.log('Clearing auth in store');
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            },

            logout: async () => {
                console.log('Logging out...');
                // Clear local state
                get().clearAuth();

                // Trigger Electron logout
                await window.electron.logout();
            },

            updateToken: (newToken: string) => {
                console.log('Updating token');
                set({ token: newToken });

                // Update in Electron store
                const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
                window.electron.updateToken(newToken, expiresAt);
            },

            initializeAuth: async () => {
                console.log('Initializing auth from Electron...');
                set({ isLoading: true });

                try {
                    // Get auth data from electron-store
                    const authData = await window.electron.getAuthData();
                    console.log('Auth data from electron-store:', authData);

                    if (authData && authData.token) {
                        // Get server config to determine backend URL
                        const serverConfig = await window.electron.getServerConfig();
                        const backendUrl = serverConfig 
                          ? `http://${serverConfig.serverIP}:${serverConfig.backendPort}`
                          : 'http://localhost:5184';
                        
                        // Verify token is still valid
                        const response = await fetch(`${backendUrl}/api/Auth/verify`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${authData.token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.ok) {
                            set({
                                token: authData.token,
                                user: authData.user,
                                isAuthenticated: true,
                                isLoading: false
                            });
                            console.log('Auth initialized successfully');
                        } else {
                            console.log('Token invalid, clearing auth');
                            get().clearAuth();
                        }
                    } else {
                        console.log('No auth data found');
                        set({ isLoading: false });
                    }
                } catch (error) {
                    console.error('Auth initialization failed:', error);
                    set({ isLoading: false });
                }
            }
        }));
    } else {
        // In Web: Use persist middleware with localStorage
        return create<AuthState>()(
            persist(
                (set, get) => ({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    isLoading: true,

                    setAuth: (token: string, user: User) => {
                        set({
                            token,
                            user,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    },

                    clearAuth: () => {
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                            isLoading: false
                        });
                    },

                    logout: async () => {
                        get().clearAuth();
                    },

                    updateToken: (newToken: string) => {
                        set({ token: newToken });
                    },

                    initializeAuth: async () => {
                        // In web mode, persist middleware handles this
                        set({ isLoading: false });
                    }
                }),
                {
                    name: 'auth-storage',
                    storage: createJSONStorage(() => localStorage),
                }
            )
        );
    }
};

export const useAuthStore = createAuthStore();

// Initialize auth when app starts
if (typeof window !== 'undefined') {
    // Small delay to ensure Electron is ready
    setTimeout(() => {
        useAuthStore.getState().initializeAuth();
    }, 100);

    // Listen for auth data from Electron main process
    if (isElectron) {
        console.log('Setting up auth data listener in Electron');
        window.electron.onAuthData((authData) => {
            console.log('Received auth data from Electron:', authData);
            if (authData && authData.token) {
                useAuthStore.getState().setAuth(authData.token, authData.user);
                console.log('Auth state updated in store');
            }
        });
    }
}