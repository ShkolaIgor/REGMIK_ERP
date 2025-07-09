import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || res.statusText);
      } catch (parseError) {
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
    } catch (error) {
      throw new Error(`${res.status}: ${res.statusText}`);
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

  // Логування запитів на оновлення статусу та інтеграцій
  if (url.includes('/status') && method === 'PUT') {
    console.log("apiRequest - Status update:", { url, method, data });
  }
  if (url.includes('/integrations') && method === 'PUT') {
    console.log("apiRequest - Integration update:", { url, method, data });
  }

  // Визначаємо чи це FormData для файлових завантажень
  const isFormData = data instanceof FormData;
  
  let requestBody: BodyInit | undefined;
  if (isFormData) {
    requestBody = data as FormData;
  } else if (data) {
    requestBody = JSON.stringify(data);
  }

  console.log(`Frontend: Making ${method} request to: ${url}`);
  console.log("Frontend: Request headers:", !isFormData && data ? { "Content-Type": "application/json" } : {});
  console.log("Frontend: Request body:", requestBody);
  console.log("Frontend: Document cookies:", document.cookie);

  const res = await fetch(url, {
    method,
    headers: !isFormData && data ? { "Content-Type": "application/json" } : {},
    body: requestBody,
    credentials: "include",
    cache: "no-cache", // Примусово відключаємо кеш браузера для всіх запитів
  });

  console.log(`Frontend: Response status: ${res.status} for ${method} ${url}`);
  console.log("Frontend: Response headers:", Object.fromEntries(res.headers.entries()));
  
  if (res.status === 404) {
    console.error(`Frontend: 404 ERROR - URL not found: ${url}`);
    console.error("Frontend: Full URL being requested:", res.url);
  }

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

const defaultQueryFn = getQueryFn({ on401: "throw" });

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
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
