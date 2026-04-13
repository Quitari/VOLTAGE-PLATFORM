import client from "./client";

export const moderationApi = {
  // Наказания
  punishments: (params?: { status?: string; type?: string; user?: string }) =>
    client.get("/moderation/punishments/", { params }),

  punish: (
    userId: string,
    data: {
      punishment_type: string;
      platform: string;
      reason: string;
      expires_at?: string;
    },
  ) => client.post(`/moderation/users/${userId}/punish/`, data),

  revoke: (punishmentId: string) =>
    client.post(`/moderation/punishments/${punishmentId}/revoke/`),

  // Апелляции
  appeals: (params?: { status?: string }) =>
    client.get("/moderation/appeals/", { params }),

  resolveAppeal: (
    appealId: string,
    data: {
      decision: string;
      response: string;
    },
  ) => client.post(`/moderation/appeals/${appealId}/resolve/`, data),

  // Тикеты
  tickets: (params?: { status?: string }) =>
    client.get("/moderation/tickets/", { params }),

  ticketDetail: (id: string) => client.get(`/moderation/tickets/${id}/`),

  ticketReply: (id: string, text: string) =>
    client.post(`/moderation/tickets/${id}/reply/`, { text }),

  ticketClose: (id: string) => client.post(`/moderation/tickets/${id}/close/`),

  // Журнал
  audit: (params?: { action?: string; user?: string }) =>
    client.get("/moderation/audit/", { params }),
};
