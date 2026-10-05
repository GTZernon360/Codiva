import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error ?? "Não foi possível concluir a solicitação.");
    error.status = response.status;
    error.details = payload.details;
    throw error;
  }
  return payload;
}

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => apiRequest("/api/me"),
    enabled,
  });
}

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiRequest("/api/dashboard"),
    enabled,
  });
}

export function useCurriculum(enabled = true) {
  return useQuery({
    queryKey: ["curriculum"],
    queryFn: () => apiRequest("/api/curriculum"),
    enabled,
  });
}

export function useLesson(lessonSlug, enabled = true) {
  return useQuery({
    queryKey: ["lesson", lessonSlug],
    queryFn: () => apiRequest(`/api/lessons/${encodeURIComponent(lessonSlug)}`),
    enabled: enabled && Boolean(lessonSlug),
  });
}

export function useReviewQueue(enabled = true) {
  return useQuery({
    queryKey: ["review-queue"],
    queryFn: () => apiRequest("/api/review"),
    enabled,
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values) => apiRequest("/api/profile", { method: "PATCH", body: values }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["current-user"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useSubmitExercise(lessonSlug) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ exerciseId, answer }) =>
      apiRequest(`/api/lessons/${encodeURIComponent(lessonSlug)}/attempt`, {
        method: "POST",
        body: { exerciseId, answer },
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["lesson", lessonSlug] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
        client.invalidateQueries({ queryKey: ["curriculum"] }),
        client.invalidateQueries({ queryKey: ["review-queue"] }),
      ]);
    },
  });
}

export function useCompleteReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (lessonSlug) =>
      apiRequest(`/api/review/${encodeURIComponent(lessonSlug)}/complete`, { method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["review-queue"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
