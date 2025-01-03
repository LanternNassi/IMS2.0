import { create } from "zustand";
import api from "@/Utils/Request";
import { AxiosResponse } from "axios";
import { defaultProperties } from "@/Utils/defaultProperties";

export interface User extends defaultProperties {
  id: string;
  username: string;
  email: string;
  telephone: string;
  gender: "Male" | "Female";
  role: "admin" | "normal";
};

export type UserDto = {
  username: string;
  passwordHash: string;
  email: string;
  gender: "Male" | "Female";
  telephone: string;
  role: "admin" | "normal";
};

interface IUserStore {
  users: User[] | null;
  isLoading: boolean;
  fetchUsers: (keywords: string | null) => Promise<void>;
  getUserById: (id: string) => Promise<User>;
  createUser: (
    user: UserDto,
    onsuccess: () => void,
    onFailure: () => void
  ) => Promise<void>;
  updateUser: (
    user: User,
    onsuccess: () => void,
    onFailure: () => void,
  ) => Promise<void>;
  deleteUser: (
    id: string,
    onsuccess: () => void,
    onFailure: () => void
  ) => Promise<void>;
}

export const useUserStore = create<IUserStore>((set) => ({
  users: null,
  isLoading: false,
  fetchUsers: async (keywords: string | null) => {
    set({ isLoading: true });
    api
      .get("/Users", { params: { keywords } })
      .then((response: AxiosResponse) => {
        if (response.status == 200) {
          set({ users: response.data, isLoading: false });
        }
      });
  },
  getUserById: async (id: string) => {
    const response: AxiosResponse = await api.get(`/Users/${id}`);
    return response.data;
  },
  createUser: async (user, onsuccess, onFailure) => {
    api
      .post("/Users", user)
      .then((response: AxiosResponse) => {
        if (response.status == 200) {
          onsuccess();
        }
      })
      .catch(() => {
        onFailure();
      });
  },
  updateUser: async (user, onsuccess, onFailure) => {
    api
      .put(`/Users/${user.id}`, user)
      .then((response: AxiosResponse) => {
        if (response.status == 204) {
          onsuccess();
        }
      })
      .catch(() => {
        onFailure();
      });
  },
  deleteUser: async (id, onsuccess, onFailure) => {
    api
      .delete(`/Users/${id}`)
      .then((response: AxiosResponse) => {
        if (response.status == 204) {
          onsuccess();
        }
      })
      .catch(() => {
        onFailure();
      });
  },
}));
