import client from "./client";
import type { AuthResponse, User } from "../types";

export const authApi = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => client.post<AuthResponse>("/auth/register/", data),

  login: (data: { login: string; password: string }) =>
    client.post<AuthResponse>("/auth/login/", data),

  logout: (refresh: string) => client.post("/auth/logout/", { refresh }),

  me: () => client.get<User>("/auth/me/"),

  updateProfile: (data: Partial<User>) =>
    client.patch<{ user: User; message: string }>("/auth/profile/", data),
};
