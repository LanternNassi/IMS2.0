import {create} from 'zustand';
import api from '@/Utils/Request';
import {AxiosResponse} from 'axios';
import {defaultProperties} from '@/Utils/DefaultProperties';

export interface store extends defaultProperties {
    id: string;
    name: string;
    address: string;
    description: string;
}

export type storeDto = {
    name: string;
    address: string;
    description: string;
};

interface IStoreStore {
    stores: store[] | null;
    isLoading: boolean;
    fetchStores: (keywords: string | null) => Promise<void>;
    getStoreById: (id: string) => Promise<store>;
    createStore: (store: storeDto, onsuccess: () => void, onFailure: () => void) => Promise<void>;
    updateStore: (store: store, onsuccess: () => void, onFailure: () => void) => Promise<void>;
    deleteStore: (id: string, onsuccess: () => void, onFailure: () => void) => Promise<void>;
}

export const useStoresStore = create<IStoreStore>((set) => ({
    stores: null,
    isLoading: false,
    fetchStores: async (keywords: string | null) => {
        set({isLoading: true});
        api.get('/Stores', {params: {keywords}}).then((response: AxiosResponse) => {
            if (response.status == 200) {
                set({stores: response.data, isLoading: false});
            }
        });
    },
    getStoreById: async (id: string) => {
        const response: AxiosResponse = await api.get(`/Stores/${id}`);
        return response.data;
    },
    createStore: async (store: storeDto, onsuccess: () => void, onFailure: () => void) => {
        api.post('/Stores', store).then((response: AxiosResponse) => {
            if (response.status == 201) {
                onsuccess();
            } else {
                onFailure();
            }
        });
    },
    updateStore: async (store: store, onsuccess: () => void, onFailure: () => void) => {
        api.put(`/Stores/${store.id}`, store).then((response: AxiosResponse) => {
            if (response.status == 204) {
                onsuccess();
            } else {
                onFailure();
            }
        });
    },
    deleteStore: async (id: string, onsuccess: () => void, onFailure: () => void) => {
        api.delete(`/Stores/${id}`).then((response: AxiosResponse) => {
            if (response.status == 204) {
                onsuccess();
            } else {
                onFailure();
            }
        });
    },
}));