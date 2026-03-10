import { Environment } from '@abp/ng.core';

const baseUrl = 'http://localhost:4200';

export const environment = {
  production: false,
  application: {
    baseUrl,
    name: 'Lampiao',
    logoUrl: '',
  },
  oAuthConfig: {
    issuer: 'https://localhost:44316/',
    redirectUri: baseUrl,
    clientId: 'Lampiao_App',
    responseType: 'code',
    scope: 'offline_access Lampiao',
    requireHttps: true,
  },
  apis: {
    default: {
      url: 'https://localhost:44316',
      rootNamespace: 'Lampiao',
    },
  },
} as Environment;
