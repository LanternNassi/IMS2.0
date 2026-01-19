// types/global.d.ts or types/electron.d.ts
export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthData {
  token: string;
  user: User;
  expiresAt?: number;
  rememberMe?: boolean;
}

export interface ElectronAPI {
  // Auth methods
  login: (credentials: { 
    username: string; 
    password: string; 
    rememberMe?: boolean 
  }) => Promise<{ 
    success: boolean; 
    data?: AuthData; 
    message?: string 
  }>;
  getAuthData: () => Promise<AuthData | null>;
  saveAuthData: (authData: AuthData) => Promise<{ success: boolean }>;
  logout: () => Promise<{ success: boolean }>;
  updateToken: (newToken: string, expiresAt: number) => Promise<{ success: boolean }>;
  
  // Auth data listener
  onAuthData: (callback: (data: AuthData) => void) => void;
  removeAuthDataListener: () => void;
  
  // Excel export
  exportExcel: (jsonData: any[], fileName: string) => void;
  onExportDone: (callback: (message: string) => void) => void;
  onExportError: (callback: (error: string) => void) => void;
  
  // Auto-update methods
  checkForUpdates: () => Promise<{ 
    success: boolean; 
    message?: string; 
    currentVersion?: string 
  }>;
  downloadUpdate: () => Promise<{ success: boolean; message?: string }>;
  installUpdate: () => Promise<{ success: boolean; message?: string }>;
  getAppVersion: () => Promise<{ version: string; name: string }>;
  onUpdateStatus: (callback: (status: {
    status: string;
    message: string;
    version?: string;
    percent?: number;
    bytesPerSecond?: number;
    transferred?: number;
    total?: number;
  }) => void) => void;
  removeUpdateStatusListener: () => void;
  
  // Server configuration (for client mode)
  getServerConfig: () => Promise<{
    serverIP: string;
    frontendPort: number;
    backendPort: number;
    mode: 'server' | 'client';
  } | null>;
  
  // Folder picker
  showFolderPicker: () => Promise<string | null>;
}

export interface API {
  send: (channel: string, data: any) => void;
}

// Extend the Window interface globally
declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
  }
}

// This export is necessary to make this file a module
export {};