import { useMemo } from "react";

// Replace this with your actual user fetching logic
export function useUser() {
  // Example: hardcoded user for testing
  const user = useMemo(() => ({
    id: "demo-user-id",
    name: "Demo User",
    email: "demo@example.com",
  }), []);

  return { user };
}