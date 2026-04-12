import client from "./client";
import type { Giveaway } from "../types";

export const giveawaysApi = {
  list: (params?: { status?: string; platform?: string }) =>
    client.get<Giveaway[]>("/giveaways/", { params }),

  detail: (id: string) => client.get<Giveaway>(`/giveaways/${id}/`),

  create: (data: Partial<Giveaway>) =>
    client.post<Giveaway>("/giveaways/create/", data),

  activate: (id: string) => client.post(`/giveaways/${id}/activate/`),

  join: (id: string) => client.post(`/giveaways/${id}/join/`),

  draw: (id: string) => client.post(`/giveaways/${id}/draw/`),

  confirmWinner: (id: string) =>
    client.post(`/giveaways/${id}/confirm-winner/`),

  reroll: (id: string, reason?: string) =>
    client.post(`/giveaways/${id}/reroll/`, { reason }),

  participants: (id: string) => client.get(`/giveaways/${id}/participants/`),
};
