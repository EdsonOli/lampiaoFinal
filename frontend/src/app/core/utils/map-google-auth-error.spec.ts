import { describe, expect, it } from 'vitest';
import { mapGoogleAuthError } from './map-google-auth-error';

describe('mapGoogleAuthError', () => {
  it('returns conflict-link message when backend provides GOOGLE_LINK_CONFLICT code', () => {
    const message = mapGoogleAuthError({
      status: 403,
      error: {
        code: 'GOOGLE_LINK_CONFLICT',
        error: 'Google account does not match existing linked account',
      },
    });

    expect(message).toBe('Esta conta Google nao corresponde ao vinculo existente. Entre com e-mail e senha para revisar o vinculo da conta.');
  });

  it('returns unverified-email message when backend provides GOOGLE_EMAIL_NOT_VERIFIED code', () => {
    const message = mapGoogleAuthError({
      status: 400,
      error: {
        code: 'GOOGLE_EMAIL_NOT_VERIFIED',
        error: 'Google account email is not verified',
      },
    });

    expect(message).toBe('Seu e-mail do Google ainda nao esta verificado. Verifique no Google e tente novamente.');
  });

  it('returns email mismatch message when backend provides GOOGLE_LINK_EMAIL_MISMATCH code', () => {
    const message = mapGoogleAuthError({
      status: 403,
      error: {
        code: 'GOOGLE_LINK_EMAIL_MISMATCH',
        error: 'Google account email must match your current account email',
      },
    });

    expect(message).toBe('O e-mail da conta Google deve ser igual ao e-mail da sua conta Lampiao para concluir o vinculo.');
  });

  it('returns already linked message when backend provides GOOGLE_PROVIDER_ALREADY_LINKED code', () => {
    const message = mapGoogleAuthError({
      status: 409,
      error: {
        code: 'GOOGLE_PROVIDER_ALREADY_LINKED',
        error: 'This Google account is already linked to another Lampiao account',
      },
    });

    expect(message).toBe('Esta conta Google ja esta vinculada a outro perfil Lampiao.');
  });

  it('returns conflict-link message for status 403', () => {
    const message = mapGoogleAuthError({
      status: 403,
      error: {
        error: 'Google account does not match existing linked account',
      },
    });

    expect(message).toBe('Esta conta Google nao corresponde ao vinculo existente. Entre com e-mail e senha para revisar o vinculo da conta.');
  });

  it('returns unverified-email message for status 400 with not verified text', () => {
    const message = mapGoogleAuthError({
      status: 400,
      error: {
        error: 'Google account email is not verified',
      },
    });

    expect(message).toBe('Seu e-mail do Google ainda nao esta verificado. Verifique no Google e tente novamente.');
  });

  it('returns backend message when available and no special mapping applies', () => {
    const message = mapGoogleAuthError({
      status: 400,
      error: {
        message: 'Invalid Google token payload',
      },
    });

    expect(message).toBe('Invalid Google token payload');
  });

  it('returns default message when payload is empty', () => {
    const message = mapGoogleAuthError(undefined);

    expect(message).toBe('Erro ao autenticar com Google.');
  });
});
