// Session cache owner: after login invalidate, after logout wipe — stale account data must never leak.
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "./api";
import { queryClient } from "./queryClient";
import type { OkResponse, UserProfile } from "@/types";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => apiGet<UserProfile>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
}

export async function beginSession() {
  await queryClient.invalidateQueries({ queryKey: ["session"] });
}

export async function endSession() {
  try {
    await apiPost<OkResponse>("/auth/logout");
  } finally {
    queryClient.clear();
  }
}

export async function markOnboarded() {
  const profile = await apiPatch<UserProfile>("/auth/me/onboarded");
  queryClient.setQueryData(["session"], profile);
  return profile;
}

export async function saveNickname(nickname: string) {
  const profile = await apiPatch<UserProfile>("/auth/me/nickname", { nickname });
  queryClient.setQueryData(["session"], profile);
  return profile;
}
