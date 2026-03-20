export function mapGoogleAuthError(error: unknown): string {
  const apiError = error as {
    status?: number;
    error?: {
      code?: string;
      error?: string;
      message?: string;
    };
  };

  const status = apiError?.status;
  const code = apiError?.error?.code;
  const backendMessage = apiError?.error?.error || apiError?.error?.message;

  if (code === 'GOOGLE_LINK_CONFLICT') {
    return 'Esta conta Google nao corresponde ao vinculo existente. Entre com e-mail e senha para revisar o vinculo da conta.';
  }

  if (code === 'GOOGLE_EMAIL_NOT_VERIFIED') {
    return 'Seu e-mail do Google ainda nao esta verificado. Verifique no Google e tente novamente.';
  }

  if (code === 'GOOGLE_LINK_EMAIL_MISMATCH') {
    return 'O e-mail da conta Google deve ser igual ao e-mail da sua conta Lampiao para concluir o vinculo.';
  }

  if (code === 'GOOGLE_PROVIDER_ALREADY_LINKED') {
    return 'Esta conta Google ja esta vinculada a outro perfil Lampiao.';
  }

  if (status === 403) {
    return 'Esta conta Google nao corresponde ao vinculo existente. Entre com e-mail e senha para revisar o vinculo da conta.';
  }

  if (status === 400 && typeof backendMessage === 'string' && backendMessage.toLowerCase().includes('not verified')) {
    return 'Seu e-mail do Google ainda nao esta verificado. Verifique no Google e tente novamente.';
  }

  return backendMessage ?? 'Erro ao autenticar com Google.';
}
