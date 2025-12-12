import {create} from 'zustand'
import api from '@/Utils/Request';
import {AxiosResponse} from 'axios';
import {defaultProperties , pagination} from '@/Utils/DefaultProperties';


interface customerTag {
    name : string;
    description? : string;
}

export interface customer extends defaultProperties {
    id: string;
    name : string;
    customerType : string;
    address : string;
    phone : string;
    email : string;
    accountNumber : string;
    moreInfo : string;
    customerTags : customerTag[];
}

export type customerDto = {
    name : string;
    customerType : string;
    address : string;
    phone : string;
    email : string;
    accountNumber : string;
    moreInfo : string;
    customerTags : customerTag[];
}


interface ICustomerStore {
    customers : customer[] | null;
    isLoading : boolean;
    pagination : pagination | null;
    customerTags : customerTag[] | null;
    fetchCustomers : (keywords: string|null , page: number) => Promise<void>;
    fetchCustomerTags : (keywords : string|null , customer : string|null) => Promise<void>;
    addCustomerToTags : (customer: string, tags : customerTag[] , onsuccess : ()=> void , onFailure : () => void) => Promise<void>;
    searchCustomerTags : (keywords: string) => Promise<customerTag[]>
    getCustomerById : (id : string) => Promise<customer>;
    createCustomer : (customer : customerDto, onsuccess: ()=> void, onFailure: ()=> void) => Promise<void>;
    updateCustomer : (customer: customer, onsuccess: ()=>void, onFailure: ()=>void) => Promise<void>;
    deleteCustomer : (id: string, onsuccess: ()=>void, onFailure: ()=>void) => Promise<void>;
}

export const useCustomerStore = create<ICustomerStore>((set) => ({
    isLoading : false,
    customers : null,
    customerTags : null,
    pagination : null,
    fetchCustomers : async (keywords: string | null , page: number) => {
        set({isLoading: true});
        api.get('/Customers' , {params: {keywords , page}}).then((response : AxiosResponse) => {  
            if (response.status == 200){
                set({
                    customers: response.data.customers,
                    isLoading: false,
                    pagination : response.data.pagination,
                })
            } 
        })
    },
    fetchCustomerTags : async (keywords: string | null , customer: string|null) => {
        api.get('/Customers/Tags' , {params: {keywords,customer}}).then((response : AxiosResponse) => {
            if (response.status == 200){
                set({customerTags : response.data})
            }
        })
    },
    searchCustomerTags : async (keywords: string | null) => {
        const response:AxiosResponse = await api.get(`/Customers/Tags` , {params:{keywords}});
        return response.data
    },
    addCustomerToTags : async (customer: string , tags , onsuccess, onFailure) => {
        api.post(`/Customers/${customer}/tags`, tags).then((response : AxiosResponse) => {
            if (response.status == 200){
                onsuccess()
            }else {
                onFailure()
            }
        }).catch(() => {
            onFailure()
        })

    },
    getCustomerById : async (id : string) => {
        const response:AxiosResponse = await api.get(`/Customers/${id}`);
        return response.data;
    },
    createCustomer : async (customer : customerDto , onsuccess , onFailure) => {
        api.post('/Customers' , customer).then((response:AxiosResponse) => {
            if (response.status == 201){
                onsuccess();
            }else{
                onFailure();
            }
        });
    },
    updateCustomer : async (customer: customer , onsuccess , onFailure) => {
        api.put(`/Customers/${customer.id}`, customer).then((response : AxiosResponse) => {
            if (response.status == 200){
                onsuccess();
            }else {
                onFailure();
            }
        });
    },
    deleteCustomer : async (id : string, onsuccess , onFailure) => {
        api.delete(`Customers/${id}`).then((response:AxiosResponse) => {
            if (response.status == 204){
                onsuccess();
            }else{
                onFailure();
            }
        });
    },

}))