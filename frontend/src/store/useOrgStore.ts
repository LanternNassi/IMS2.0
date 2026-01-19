import { create } from 'zustand'
import OrgAPI from '@/Utils/OrgRequest';


interface client {
    ClientID: string;
    FirstName?: string;
    LastName?: string;
    Email?: string;
    Phone?: string;
    Address?: string;
    BusinessName?: string;
    Status?: string;
    ValidTill?: Date;
}


interface backUp {
    ClientID: string;
    Name: string;
    BackUp: string;
    Size: string;
    BillID: string;
}

interface OrgState {
    clientInformation: client | null,
    fetchClientInformation: (imsKey: string) => Promise<client | null>
    fetchClientBackUps: (imsKey: string) => Promise<backUp[]>
    // UploadClientBackUp: (backUp: Partial<backUp>) => Promise<backUp>
}


export const useOrgStore = create<OrgState>((set, get) => ({
    clientInformation: null,
    fetchClientInformation: async (imsKey) => {
        try {
            const res = await OrgAPI.get(`/clients/${imsKey}`)
            set({clientInformation: res.data})
            return res.data
        } catch (error: any) {
            return null
        }
    },
    fetchClientBackUps: async (imsKey) => {
        try {
            const res = await OrgAPI.get(`backups/client/${imsKey}`)
            return res.data
        } catch (error: any) {
            return null
        }
    },
}))