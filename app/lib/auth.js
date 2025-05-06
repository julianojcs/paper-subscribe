import { compare, hash } from 'bcryptjs';

/**
 * Verifica se uma senha fornecida corresponde à senha hash armazenada
 * @param {string} password - A senha em texto plano para verificar
 * @param {string} hashedPassword - A senha com hash armazenada no banco de dados
 * @returns {Promise<boolean>} - Retorna true se as senhas corresponderem, false caso contrário
 */
export async function verifyPassword(password, hashedPassword) {
  return await compare(password, hashedPassword);
}

/**
 * Gera um hash para uma senha em texto plano
 * @param {string} password - A senha em texto plano para ser transformada em hash
 * @returns {Promise<string>} - Retorna a senha com hash
 */
export async function hashPassword(password) {
  return await hash(password, 12);
}

/**
 * Verifica se a senha atende aos requisitos mínimos de segurança
 * @param {string} password - A senha a ser validada
 * @returns {Object} - Retorna um objeto com a validade e mensagem de erro, se houver
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'A senha deve ter pelo menos 8 caracteres'
    };
  }

  // Verifica se a senha contém pelo menos um número
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um número'
    };
  }

  // Verifica se a senha contém pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra maiúscula'
    };
  }

  // Verifica se a senha contém pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra minúscula'
    };
  }

  // Verifica se a senha contém pelo menos um caractere especial
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um caractere especial'
    };
  }

  return {
    isValid: true
  };
}