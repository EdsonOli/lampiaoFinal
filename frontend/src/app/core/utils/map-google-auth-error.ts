import { HttpErrorResponse } from '@angular/common/http';
import { normalizeApiErrorPayload } from './api-error';
import { FRONTEND_ERROR_CATALOG } from './error-catalog';

/**
 * Mapeia erros de Google auth para mensagens mais legíveis e acionáveis para UX.
 * Usa o código semântico como chave, não texto de mensagem.
 */
export function mapGoogleAuthError(error: unknown): string {
  const apiError = error as HttpErrorResponse;
  const payload = normalizeApiErrorPayload(error);
  const code = payload.code;

  // Mensagens contextualizadas para Google auth flow
  if (code === FRONTEND_ERROR_CATALOG.GOOGLE_LINK_CONFLICT) {
    return 'Esta conta Google não corresponde ao vínculo existente. Entre com e-mail e senha para revisar o vínculo da conta.';
  }

  if (code === FRONTEND_ERROR_CATALOG.GOOGLE_EMAIL_NOT_VERIFIED) {
    return 'Seu e-mail do Google ainda não está verificado. Verifique no Google e tente novamente.';
  }

  if (code === FRONTEND_ERROR_CATALOG.GOOGLE_LINK_EMAIL_MISMATCH) {
    return 'O e-mail da conta Google deve ser igual ao e-mail da sua conta Lampião para concluir o vínculo.';
  }

  if (code === FRONTEND_ERROR_CATALOG.GOOGLE_PROVIDER_ALREADY_LINKED) {
    return 'Esta conta Google já está vinculada a outro perfil Lampião.';
  }

  // Fallback: retorna a mensagem do servidor se disponível
  return payload.message ?? 'Erro ao autenticar com Google.';
}
