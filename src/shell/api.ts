// Appels à l'API du serveur MAINTeX.

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const MESSAGES: Record<string, string> = {
  IDENTITY_NOT_ALLOWED: 'Ce compte Google n’est pas autorisé sur MAINTeX.',
  USER_NOT_AUTHORIZED: 'Votre compte n’est pas encore enregistré dans MAINTeX. Contactez l’administrateur.',
  INVALID_GOOGLE_TOKEN: 'La connexion Google a échoué. Réessayez.',
  AUTH_NOT_CONFIGURED: 'La connexion n’est pas encore configurée sur ce serveur.',
  ADMIN_REQUIRED: 'Accès réservé aux administrateurs MAINTeX.',
  UNAUTHORIZED: 'Votre session a expiré. Reconnectez-vous.',
};

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'maintex' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Serveur MAINTeX injoignable. Vérifiez votre connexion.');
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const code = String(data?.error || `HTTP_${response.status}`);
    throw new ApiError(response.status, code, data?.message || MESSAGES[code] || `Erreur ${response.status}`);
  }
  return data as T;
}

export const encodeId = (value: string) => encodeURIComponent(value);
