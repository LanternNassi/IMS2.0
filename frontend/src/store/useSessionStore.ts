import {create} from 'zustand';


interface ISessionStore {
    currentPage : number;
    setCurrentPage: (currentPage: number) => void;
}

export const useSessionStore = create<ISessionStore>((set) => ({
    currentPage: 0,
    setCurrentPage: (currentPage: number) => set({currentPage}),
}));