// /app/lib/services/localStorage.js
/**
 * Serviço para gerenciar operações de armazenamento local
 * Abstrai o acesso ao localStorage com verificação de disponibilidade no ambiente
 */

/**
 * Verifica se o localStorage está disponível no ambiente atual
 * @returns {boolean} true se localStorage estiver disponível
 */
const isLocalStorageAvailable = () => {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Salva um item no localStorage com uma chave específica
 * @param {string} key - A chave para o item
 * @param {any} value - O valor a ser armazenado (será convertido para JSON)
 * @returns {boolean} true se a operação foi bem-sucedida
 */
export const setItem = (key, value) => {
  if (!isLocalStorageAvailable()) return false;

  try {
    const serializedValue = JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Erro ao salvar item '${key}' no localStorage:`, error);
    return false;
  }
};

/**
 * Recupera um item do localStorage pela chave
 * @param {string} key - A chave do item a ser recuperado
 * @param {any} defaultValue - Valor padrão caso o item não exista
 * @returns {any} O valor armazenado ou defaultValue
 */
export const getItem = (key, defaultValue = null) => {
  if (!isLocalStorageAvailable()) return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Erro ao recuperar item '${key}' do localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Remove um item do localStorage pela chave
 * @param {string} key - A chave do item a ser removido
 * @returns {boolean} true se a operação foi bem-sucedida
 */
export const removeItem = (key) => {
  if (!isLocalStorageAvailable()) return false;

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erro ao remover item '${key}' do localStorage:`, error);
    return false;
  }
};

/**
 * Verifica se um item existe no localStorage
 * @param {string} key - A chave a ser verificada
 * @returns {boolean} true se o item existir
 */
export const hasItem = (key) => {
  if (!isLocalStorageAvailable()) return false;
  return window.localStorage.getItem(key) !== null;
};