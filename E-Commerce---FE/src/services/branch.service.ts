import { env } from "../config/env";
import { parseRes } from "../utils/api";

export const BranchService = {
  fetchActiveBranches: async () => {
    const res = await fetch(`${env.API_URL}/branches/active`);
    if (!res.ok) throw new Error("Cannot load branches");
    return await parseRes(res);
  },
  fetchNearbyBranches: async (lat: number, lng: number) => {
    const res = await fetch(`${env.API_URL}/branches/nearby?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error("Cannot load nearby branches");
    return await parseRes(res);
  }
};
