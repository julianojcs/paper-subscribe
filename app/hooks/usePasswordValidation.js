'use client';

import { useState, useEffect } from 'react';

export default function usePasswordValidation({
  password = '',
  confirmPassword = '',
  requiredLength = 8,
  requiresLowercase = true,
  requiresUppercase = true,
  requiresNumber = true,
  requiresSpecial = true
}) {
  const [validationState, setValidationState] = useState({
    isValid: false,
    hasLength: false,
    hasLowerCase: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false,
    strength: 0, // 0-100
    strengthText: '',
    textColor: '',
    gradient: ''
  });

  // Atualiza o estado de validação sempre que a senha mudar
  useEffect(() => {
    const newState = {
      hasLength: password.length >= requiredLength,
      hasLowerCase: requiresLowercase ? /[a-z]/.test(password) : true,
      hasUpperCase: requiresUppercase ? /[A-Z]/.test(password) : true,
      hasNumber: requiresNumber ? /[0-9]/.test(password) : true,
      hasSpecial: requiresSpecial ? /[^A-Za-z0-9]/.test(password) : true,
      passwordsMatch: confirmPassword ? password === confirmPassword : true
    };

    // Calcular a força da senha com lógica avançada
    const strength = calculatePasswordStrength(password, newState);
    
    // Gerar descrição textual da força
    const strengthText = getStrengthText(strength);
    
    // Gerar cor para o texto
    const textColor = getTextColor(strength);
    
    // Gerar gradiente para a barra de progresso
    const gradient = getGradient(strength);

    // Validação geral
    const isValid =
      newState.hasLength &&
      newState.hasLowerCase &&
      newState.hasUpperCase &&
      newState.hasNumber &&
      newState.hasSpecial &&
      newState.passwordsMatch;

    setValidationState({
      ...newState,
      isValid,
      strength,
      strengthText,
      textColor,
      gradient
    });
  }, [password, confirmPassword, requiredLength, requiresLowercase, requiresUppercase, requiresNumber, requiresSpecial]);

  /**
   * Calcula a força da senha com algoritmo avançado
   */
  function calculatePasswordStrength(value, validationState) {
    if (!value) return 0;
    
    let strength = 0;
    const length = value.length;
    
    // 1. Pontuação base pelo comprimento (máx. 40 pontos)
    if (length <= 10) {
      // 0-10 caracteres: até 20 pontos (2 pontos por caractere)
      strength += length * 2;
    } else if (length <= 20) {
      // 11-20 caracteres: 20 pontos base + até 10 pontos adicionais
      strength += 20 + (length - 10);
    } else if (length <= 40) {
      // 21-40 caracteres: 30 pontos base + até 10 pontos adicionais
      strength += 30 + ((length - 20) * 0.5);
    } else {
      // Mais de 40 caracteres: pontuação máxima por comprimento
      strength += 40;
    }
    
    // 2. Presença de diferentes tipos de caracteres (até 24 pontos)
    const hasLowercase = /[a-z]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    
    if (hasLowercase) strength += 6;
    if (hasUppercase) strength += 6;
    if (hasNumber) strength += 6;
    if (hasSpecial) strength += 6;
    
    // 3. Distribuição de caracteres (até 16 pontos)
    const lowercaseCount = (value.match(/[a-z]/g) || []).length;
    const uppercaseCount = (value.match(/[A-Z]/g) || []).length;
    const numberCount = (value.match(/[0-9]/g) || []).length;
    const specialCount = (value.match(/[^A-Za-z0-9]/g) || []).length;
    
    const lowercasePct = lowercaseCount / length || 0;
    const uppercasePct = uppercaseCount / length || 0;
    const numberPct = numberCount / length || 0;
    const specialPct = specialCount / length || 0;
    
    const idealPct = 0.25;
    const distributionPenalty = Math.abs(lowercasePct - idealPct) + 
                                Math.abs(uppercasePct - idealPct) + 
                                Math.abs(numberPct - idealPct) + 
                                Math.abs(specialPct - idealPct);
    
    const distributionScore = Math.max(0, 16 - (distributionPenalty * 8));
    strength += distributionScore;
    
    // 4. Complexidade de padrões (até 10 pontos)
    let patternPenalty = 0;
    
    // Penalizar sequências
    const sequenceRegexes = [
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i,
      /012|123|234|345|456|567|678|789/,
      /987|876|765|654|543|432|321|210/,
      /qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm/i
    ];
    
    for (const regex of sequenceRegexes) {
      if (regex.test(value)) patternPenalty += 1;
    }
    
    // Penalizar repetições
    if (/(.)\1{2,}/.test(value)) patternPenalty += 2;
    
    // Penalizar palavras comuns
    const commonPatterns = ['password', 'qwerty', '123456', 'admin', 'welcome', 'letmein'];
    if (commonPatterns.some(pattern => value.toLowerCase().includes(pattern))) {
      patternPenalty += 3;
    }
    
    // Adicionar pontos de complexidade (máximo 10)
    strength += Math.max(0, 10 - patternPenalty * 2);
    
    // 5. Bônus para cumprimento dos requisitos (até 10 pontos)
    if (validationState.isValid) {
      strength += 10;
    }
    
    // Normalizar para 0-100
    return Math.min(100, Math.round(strength));
  }

  /**
   * Retorna o texto descritivo da força da senha
   */
  function getStrengthText(strength) {
    if (strength < 40) return 'Fraca';
    if (strength < 70) return 'Média';
    if (strength < 90) return 'Boa';
    return 'Forte';
  }

  /**
   * Retorna a cor do texto baseada na força
   */
  function getTextColor(strength) {
    let hue;
    
    if (strength < 40) {
      hue = (strength / 40) * 30; // 0-30 (vermelho a laranja)
    } else if (strength < 70) {
      hue = 30 + ((strength - 40) / 30) * 30; // 30-60 (laranja a amarelo)
    } else {
      hue = 60 + ((strength - 70) / 30) * 60; // 60-120 (amarelo a verde)
    }
    
    return `hsl(${hue}, 85%, 45%)`;
  }

  /**
   * Retorna um gradiente CSS baseado na força da senha
   */
  function getGradient(strength) {
    let primaryHue;
    
    if (strength < 40) {
      primaryHue = (strength / 40) * 30; // 0-30 (vermelho a laranja)
    } else if (strength < 70) {
      primaryHue = 30 + ((strength - 40) / 30) * 30; // 30-60 (laranja a amarelo)
    } else {
      primaryHue = 60 + ((strength - 70) / 30) * 60; // 60-120 (amarelo a verde)
    }
    
    let startHue, endHue;
    
    if (strength < 40) {
      startHue = 0;
      endHue = primaryHue;
    } else if (strength < 70) {
      startHue = 30;
      endHue = primaryHue;
    } else if (strength < 90) {
      startHue = 60;
      endHue = primaryHue;
    } else {
      startHue = 90;
      endHue = 120;
    }
    
    return `linear-gradient(90deg, 
      hsl(${startHue}, 85%, 45%) 0%,
      hsl(${endHue}, 85%, 45%) 100%)`;
  }

  /**
   * Verifica quais requisitos não foram atendidos
   */
  function getFailedRequirements() {
    const failed = [];
    
    if (!validationState.hasLength) {
      failed.push(`Mínimo ${requiredLength} caracteres`);
    }
    
    if (requiresLowercase && !validationState.hasLowerCase) {
      failed.push('Uma letra minúscula');
    }
    
    if (requiresUppercase && !validationState.hasUpperCase) {
      failed.push('Uma letra maiúscula');
    }
    
    if (requiresNumber && !validationState.hasNumber) {
      failed.push('Um número');
    }
    
    if (requiresSpecial && !validationState.hasSpecial) {
      failed.push('Um caractere especial');
    }
    
    if (confirmPassword && !validationState.passwordsMatch) {
      failed.push('Senhas devem ser iguais');
    }
    
    return failed;
  }

  return {
    ...validationState,
    failedRequirements: getFailedRequirements()
  };
}