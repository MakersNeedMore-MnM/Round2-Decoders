import { apiFetch, setToken, clearToken } from "./api-client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
    setToken(result.access_token);
    return result;
  },

  async register(payload: RegisterPayload) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
  },

  async me(): Promise<CurrentUser> {
    return apiFetch<CurrentUser>("/auth/me");
  },

  logout() {
    clearToken();
  },

  async googleLogin(token: string) {
    const result = await apiFetch<AuthResponse>("/auth/google-auth", {
      method: "POST",
      body: JSON.stringify({
        token,
      }),
      auth: false,
    });

    setToken(result.access_token);

    return result;
  },
};
