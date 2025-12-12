import {create} from 'zustand'
import api from '@/Utils/Request';
import {AxiosResponse} from 'axios';
import {defaultProperties , pagination} from '@/Utils/DefaultProperties';


interface supplierTag {
    name : string;
    description? : string;
}

export interface supplier extends defaultProperties {
    id: string;
    companyName: string;
    contactPerson: string;
    emailAddress: string;
    phoneNumber: string;
    address: string;
    tin: string;
    status: string;
    moreInfo: string;
    supplierTags : supplierTag[];
}

export type supplierDto = {
    companyName: string;
    contactPerson: string;
    emailAddress: string;
    phoneNumber: string;
    address: string;
    tin: string;
    status: string;
    moreInfo: string;
    supplierTags : supplierTag[];
}


interface ISupplierStore {
    suppliers : supplier[] | null;
    isLoading : boolean;
    pagination : pagination | null;
    supplierTags : supplierTag[] | null;
    fetchSuppliers : (keywords: string|null , page: number) => Promise<supplier[]>;
    setSuppliers : (suppliers : supplier[] | null) => void;
    fetchSupplierTags : (keywords : string|null , supplier : string|null) => Promise<supplierTag[]>;
    addSupplierToTags : (supplier: string, tags : supplierTag[] , onsuccess : ()=> void , onFailure : () => void) => Promise<void>;
    searchSupplierTags : (keywords: string) => Promise<supplierTag[]>
    getSupplierById : (id : string) => Promise<supplier>;
    createSupplier : (supplier : supplierDto, onsuccess: ()=> void, onFailure: ()=> void) => Promise<void>;
    updateSupplier : (supplier: supplier, onsuccess: ()=>void, onFailure: ()=>void) => Promise<void>;
    deleteSupplier : (id: string, onsuccess: ()=>void, onFailure: ()=>void) => Promise<void>;
}

export const useSupplierStore = create<ISupplierStore>((set) => ({
    isLoading : false,
    suppliers : null,
    supplierTags : null,
    pagination : null,
    fetchSuppliers : async (keywords: string | null , page: number) => {
        set({isLoading: true});
        const response: AxiosResponse = await api.get('/Suppliers' , {params: {keywords , page}});
        set({isLoading: false});
        return response.data.suppliers;
    },
    setSuppliers: (suppliers: supplier[] | null) => set({suppliers}),

    fetchSupplierTags : async (keywords: string | null , supplier: string|null) => {
        const response: AxiosResponse = await api.get('/Suppliers/Tags' , {params: {keywords,supplier}});
        if (response.status == 200){
            return response.data;
        }
    },
    searchSupplierTags : async (keywords: string | null) => {
        const response:AxiosResponse = await api.get(`/Suppliers/Tags` , {params:{keywords}});
        return response.data
    },
    addSupplierToTags : async (supplier: string , tags , onsuccess, onFailure) => {
        api.post(`/Suppliers/${supplier}/tags`, tags).then((response : AxiosResponse) => {
            if (response.status == 200){
                onsuccess()
            }else {
                onFailure()
            }
        }).catch(() => {
            onFailure()
        })

    },
    getSupplierById : async (id : string) => {
        const response:AxiosResponse = await api.get(`/Suppliers/${id}`);
        return response.data;
    },
    createSupplier : async (supplier : supplierDto , onsuccess , onFailure) => {
        api.post('/Suppliers' , supplier).then((response:AxiosResponse) => {
            if (response.status == 201){
                onsuccess();
            }else{
                onFailure();
            }
        });
    },
    updateSupplier : async (supplier: supplier , onsuccess , onFailure) => {
        api.put(`/Suppliers/${supplier.id}`, supplier).then((response : AxiosResponse) => {
            if (response.status == 200){
                onsuccess();
            }else {
                onFailure();
            }
        });
    },
    deleteSupplier : async (id : string, onsuccess , onFailure) => {
        api.delete(`Suppliers/${id}`).then((response:AxiosResponse) => {
            if (response.status == 204){
                onsuccess();
            }else{
                onFailure();
            }
        });
    },

}))