import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || res.statusText);
    } catch (parseError) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  urlOrOptions: string | { url: string; method?: string; body?: unknown },
  methodOrOptions?: string | { method?: string; body?: unknown },
  bodyData?: unknown
): Promise<any> {
  let url: string;
  let method: string;
  let data: unknown;

  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    
    if (typeof methodOrOptions === 'string') {
      // Виклик з 3 параметрами: apiRequest("/api/endpoint", "POST", data)
      method = methodOrOptions;
      data = bodyData;
    } else {
      // Виклик з об'єктом: apiRequest("/api/endpoint", {method: "POST", body: data})
      method = methodOrOptions?.method || 'GET';
      data = methodOrOptions?.body;
    }
  } else {
    // Об'єктний виклик: apiRequest({ url: "/api/endpoint", method: "POST", body: data })
    url = urlOrOptions.url;
    method = urlOrOptions.method || 'GET';
    data = urlOrOptions.body;
  }

  // Логування всіх POST запитів для виробничих завдань
  if (url.includes('/manufacturing-orders') && method === 'POST') {
    console.log("🟡 apiRequest - Manufacturing POST:", { url, method, data });
  }
  
  // Логування запитів на оновлення статусу
  if (url.includes('/status') && method === 'PUT') {
    console.log("apiRequest - Status update:", { url, method, data });
  }

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: "no-cache", // Примусово відключаємо кеш браузера для всіх запитів
  });

  await throwIfResNotOk(res);
  
  // Завжди повертаємо JSON, якщо є контент
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  
  // Якщо немає JSON контенту, повертаємо пустий об'єкт для успішних відповідей
  return {};
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // Додаємо cache busting параметр для позицій та виробничих завдань, щоб обійти кеш браузера
    if (url.includes('/api/positions') || url.includes('/api/manufacturing-orders')) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}_t=${Date.now()}`;
    }
    
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-cache", // Примусово відключаємо кеш браузера
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
