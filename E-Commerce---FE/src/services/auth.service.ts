import { env } from "../config/env";
import { parseRes } from "../utils/api";

export const AuthService = {
  verifyEmail: async (token: string) => {
    const res = await fetch(`${env.API_URL}/auth/verify-email?token=${token}`);
    const data = await parseRes(res);
    if (!res.ok) throw new Error(data.message || "Xác thực email thất bại");
    return data;
  },
  getCurrentUser: async (token: string) => {
    const res = await fetch(`${env.API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Unauthorized");
    return await parseRes(res);
  }
};
