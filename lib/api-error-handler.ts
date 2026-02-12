import { toast } from 'sonner';

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export function handleApiError(error: unknown, customMessage?: string): ApiError {
  console.error('API Error:', error);

  // Axios error
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    const statusCode = axiosError.response?.status;
    const message = axiosError.response?.data?.message || axiosError.message;
    const errorType = axiosError.response?.data?.error;

    // Mesaje specifice pentru coduri de eroare comune
    let userMessage = customMessage || message;

    switch (statusCode) {
      case 400:
        userMessage = 'Datele trimise sunt invalide';
        break;
      case 401:
        userMessage = 'Nu ești autentificat. Te rugăm să te autentifici.';
        break;
      case 403:
        userMessage = 'Nu ai permisiunea să accesezi această resursă';
        break;
      case 404:
        userMessage = 'Resursa solicitată nu a fost găsită';
        break;
      case 429:
        userMessage = 'Prea multe cereri. Te rugăm să aștepți.';
        break;
      case 500:
        userMessage = 'Eroare de server. Te rugăm să încerci mai târziu.';
        break;
      case 503:
        userMessage = 'Serviciul este temporar indisponibil';
        break;
    }

    toast.error(userMessage);

    return {
      message: userMessage,
      statusCode,
      error: errorType,
    };
  }

  // Network error
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as Error).message;
    
    if (message.includes('Network Error') || message.includes('ERR_NETWORK')) {
      const networkMessage = 'Nu se poate conecta la server. Verifică conexiunea la internet.';
      toast.error(networkMessage);
      return { message: networkMessage };
    }

    if (message.includes('timeout')) {
      const timeoutMessage = 'Cererea a expirat. Te rugăm să încerci din nou.';
      toast.error(timeoutMessage);
      return { message: timeoutMessage };
    }
  }

  // Generic error
  const genericMessage = customMessage || 'A apărut o eroare. Te rugăm să încerci din nou.';
  toast.error(genericMessage);
  
  return {
    message: genericMessage,
  };
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    return axiosError.response?.status === 401;
  }
  return false;
}

export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as Error).message;
    return message.includes('Network Error') || message.includes('ERR_NETWORK');
  }
  return false;
}
