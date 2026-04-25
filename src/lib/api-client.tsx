import Axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { enqueueSnackbar } from 'notistack';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { ErrorResponse } from '@/types/api';

const resolveBaseUrl = (proxyPath: string, configuredBaseUrl: string): string =>
  import.meta.env.DEV ? proxyPath : configuredBaseUrl;

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }

  config.withCredentials = true;
  return config;
}

function handleApiResponse(response: AxiosResponse) {
  return response.data;
}

function handleApiError(error: AxiosError<ErrorResponse>) {
  const message = error.response?.data?.message ?? error.message;

  enqueueSnackbar(message, {
    variant: 'error',
    preventDuplicate: true,
  });

  if (error.response?.status === 401 && window.location.pathname !== paths.auth.login.path) {
    const searchParams = new URLSearchParams();
    const redirectTo = searchParams.get('redirectTo') ?? window.location.pathname;
    window.location.href = paths.auth.login.getHref(redirectTo);
  }

  return Promise.reject(error);
}

export const loginApi = Axios.create({
  baseURL: resolveBaseUrl('/proxy/user', env.USER_API_URL),
});

export const userApi = Axios.create({
  baseURL: resolveBaseUrl('/proxy/user', env.USER_API_URL),
});

userApi.interceptors.request.use(authRequestInterceptor);
userApi.interceptors.response.use(handleApiResponse, handleApiError);

export const threatApi = Axios.create({
  baseURL: resolveBaseUrl('/proxy/threat', env.THREAT_API_URL),
});

threatApi.interceptors.request.use(authRequestInterceptor);
threatApi.interceptors.response.use(handleApiResponse, handleApiError);

export const logApi = Axios.create({
  baseURL: resolveBaseUrl('/proxy/log', env.LOG_API_URL),
});

logApi.interceptors.request.use(authRequestInterceptor);
logApi.interceptors.response.use(handleApiResponse, handleApiError);

export const bulkProcessorApi = Axios.create({
  baseURL: resolveBaseUrl('/proxy/bulk', env.BULK_PROCESSOR_URL),
});

bulkProcessorApi.interceptors.request.use(authRequestInterceptor);
bulkProcessorApi.interceptors.response.use(handleApiResponse, handleApiError);

export const attachToken = (headers?: Record<string, string>) => {
  const accessToken = localStorage.getItem('accessToken');

  return {
    headers: {
      ...headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  };
};
