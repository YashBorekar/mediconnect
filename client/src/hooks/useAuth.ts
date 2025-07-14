import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) return null;

      try {
        const response = await apiRequest("/api/auth/user");
        return await response.json();
      } catch (error) {
        // If token is invalid, remove it
        localStorage.removeItem("token");
        return null;
      }
    },
    retry: false,
  });

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
