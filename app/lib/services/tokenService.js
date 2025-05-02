// /app/lib/services/tokenService.js

import * as localStorageService from './localStorage';

// Constantes
const EVENT_TOKEN_KEY = 'event_registration_token';

/**
 * Salva o token de registro no localStorage
 * @param {string} token - O token a ser salvo
 */
export const saveToken = (token) => {
  if (!token) return;

  // Usar a constante EVENT_TOKEN_KEY
  localStorageService.setItem(EVENT_TOKEN_KEY, token);
};

/**
 * Recupera dados do token do localStorage
 * @returns {object|null} Objeto com o token e data de expiração ou null
 */
export const getStoredTokenData = () => {
  return localStorageService.getItem(EVENT_TOKEN_KEY);
};

/**
 * Verifica se o token armazenado é válido e não expirou
 * @returns {boolean} true se o token existir e não tiver expirado
 */
export const isStoredTokenValid = () => {
  const tokenData = getStoredTokenData();
  if (!tokenData || !tokenData.token || !tokenData.expires) return false;
  return tokenData.expires > Date.now();
};

/**
 * Limpa o token de registro do localStorage
 */
export const clearToken = () => {
  // Usar a constante EVENT_TOKEN_KEY
  localStorageService.removeItem(EVENT_TOKEN_KEY);
};

/**
 * Valida um token com a API
 * @param {string} token - O token a ser validado
 * @returns {Promise<{valid: boolean, event: object|null, message: string|null}>} Resultado da validação
 */
export const validateToken = async (token) => {
  if (!token) {
    return {
      valid: false,
      event: null,
      message: "Token não fornecido"
    };
  }

  try {
    const response = await fetch('/api/token/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    // Retornar a estrutura completa, incluindo a mensagem de erro da API
    return {
      valid: data.valid === true,
      event: data.event || null,
      message: data.message || null,
      isActive: data.isActive,
      logoUrl: data.event?.logoUrl || null,
      eventName: data.event?.name || null,
      expiresAt: data.expiresAt || null
    };
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return {
      valid: false,
      event: null,
      message: "Erro de comunicação com o servidor"
    };
  }
};

/**
 * Obtém e valida o token armazenado no localStorage
 * @returns {Promise<{valid: boolean, event: object|null, message: string|null}>}
 */
export const getAndValidateStoredToken = async () => {
  try {
    // Usar a constante EVENT_TOKEN_KEY
    const storedToken = localStorageService.getItem(EVENT_TOKEN_KEY);

    if (!storedToken) {
      return { valid: false, event: null, message: null };
    }

    // Validar o token armazenado
    const result = await validateToken(storedToken);
    return result;
  } catch (error) {
    console.error('Erro ao validar token armazenado:', error);
    return { valid: false, event: null, message: 'Erro ao processar token' };
  }
};