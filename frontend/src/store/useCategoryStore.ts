import {create} from 'zustand';
import api from '@/Utils/Request';
import {AxiosResponse} from 'axios';
import {defaultProperties} from '@/Utils/DefaultProperties';

export interface category extends defaultProperties {
    id: string;
    name: string;
    description: string;
}

export type categoryDto = {
    name: string;
    description: string;
};

interface IcategoryStore {
    categories: category[] | null;
    isLoading: boolean;
    fetchCategories: (keywords: string | null) => Promise<void>;
    getCategoryById: (id: string) => Promise<category>;
    createCategory: (category: categoryDto, onsuccess: () => void, onFailure: () => void) => Promise<void>;
    updateCategory: (category: category, onsuccess: () => void, onFailure: () => void) => Promise<void>;
    deleteCategory: (id: string, onsuccess: () => void, onFailure: () => void) => Promise<void>;
}

export const useCategoriesStore = create<IcategoryStore>((set) => ({
    categories: null,
    isLoading: false,
    fetchCategories: async (keywords: string | null) => {
        set({isLoading: true});
        api.get('/Categories', {params: {keywords}}).then((response: AxiosResponse) => {
            if (response.status == 200) {
                set({categories: response.data, isLoading: false});
            }
        });
    },
    getCategoryById: async (id: string) => {
        const response: AxiosResponse = await api.get(`/Categories/${id}`);
        return response.data;
    },
    createCategory: async (category: categoryDto, onsuccess: () => void, onFailure: () => void) => {
        api.post('/Categories', category).then((response: AxiosResponse) => {
            if (response.status == 201) {
                onsuccess();
            } else {
                onFailure();
            }
        });
    },
    updateCategory: async (category: category, onsuccess: () => void, onFailure: () => void) => {
        api.put(`/Stores/${category.id}`, category).then((response: AxiosResponse) => {
            if (response.status == 204) {
                onsuccess();
            } else {
                onFailure();
            }
        });
    },
    deleteCategory: async (id: string, onsuccess: () => void, onFailure: () => void) => {
        api.delete(`/Categories/${id}`).then((response: AxiosResponse) => {
            if (response.status == 204) {
                onsuccess();
            } else {
                onFailure();
            }
        });
    },
}));