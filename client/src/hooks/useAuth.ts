import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImageUrl: string | null;
}

export function useAuth() {
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ["/api/auth/status"],
    retry: false,
  });

  return {
    user: authStatus?.user,
    isLoading,
    isAuthenticated: authStatus?.authenticated || false,
  };
}