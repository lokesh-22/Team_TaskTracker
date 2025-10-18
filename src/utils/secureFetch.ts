// Secure fetch with auto token refresh for client-side usage
export async function refreshAccessToken(): Promise<string | null> {
  const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh') : null;
  if (!refresh) return null;
  try {
    const res = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access) {
      localStorage.setItem('access', data.access);
      return data.access as string;
    }
    return null;
  } catch {
    return null;
  }
}

export async function secureFetch(url: string, options: RequestInit = {}, retry = true): Promise<Response> {
  const access = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
  // Normalize headers to a mutable object
  let headers: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (typeof options.headers === 'object') {
      headers = { ...(options.headers as Record<string, string>) };
    }
  }
  if (access && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${access}`;
  }
  options.headers = headers;

  let res = await fetch(url, options);
  let shouldRefresh = false;
  if (!res.ok) {
    try {
      const errorData = await res.clone().json();
      if (
        res.status === 401 ||
        errorData?.code === 'token_not_valid' ||
        (Array.isArray(errorData?.messages) && errorData.messages.some((m: any) => m?.message?.includes('Token is expired')))
      ) {
        shouldRefresh = true;
      }
    } catch {
      // ignore parse failures
    }
  }
  if (shouldRefresh && retry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`;
      options.headers = headers;
      res = await fetch(url, options);
    }
  }
  return res;
}
