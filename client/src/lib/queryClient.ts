import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  // Add staff ID to headers if available
  const headers: Record<string, string> = {};
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  const staffUser = localStorage.getItem('staffUser');
  if (staffUser) {
    try {
      const parsed = JSON.parse(staffUser);
      headers["X-Staff-Id"] = parsed.id.toString();
      console.log("Adding staff ID to headers:", parsed.id);
    } catch (e) {
      console.error("Error parsing staff user:", e);
    }
  } else {
    console.log("No staff user found in localStorage");
  }

  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add staff ID to headers for queries too
    const headers: Record<string, string> = {};
    const staffUser = localStorage.getItem('staffUser');
    if (staffUser) {
      try {
        const parsed = JSON.parse(staffUser);
        headers["X-Staff-Id"] = parsed.id.toString();
      } catch (e) {
        // Ignore parsing errors
      }
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
