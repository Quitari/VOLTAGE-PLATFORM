export interface User {
  id: string;
  username: string;
  email: string | null;
  status: "active" | "inactive" | "banned" | "pending";
  telegram_id: number | null;
  telegram_username: string | null;
  twitch_id: string | null;
  twitch_username: string | null;
  steam_id: string | null;
  steam_trade_url: string | null;
  has_telegram: boolean;
  has_twitch: boolean;
  has_steam: boolean;
  created_at: string;
  roles: UserRole[];
  permissions: string[];
}

export interface Role {
  id: number;
  name: string;
  codename: string;
  level: number;
  color: string;
  permissions: Permission[];
}

export interface Permission {
  codename: string;
  name: string;
}

export interface UserRole {
  role: Role;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
  message: string;
}

export interface Giveaway {
  id: string;
  title: string;
  prize_type: "skin" | "other";
  skin_name: string;
  skin_image_url: string;
  platform: "telegram" | "twitch" | "both";
  status: "draft" | "active" | "drawing" | "finished" | "cancelled";
  participants_count: number;
  starts_at: string | null;
  ends_at: string | null;
  created_by: { id: string; username: string };
  created_at: string;
}

export interface Prize {
  id: string;
  name: string;
  status:
    | "pending"
    | "processing"
    | "sent"
    | "delivered"
    | "failed"
    | "cancelled";
  delivery_method: "lisskins" | "inventory" | "manual";
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
}
