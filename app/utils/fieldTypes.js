/**
 * Enum para tipos de campos de formulário compatíveis com o schema Prisma FieldType
 * Usado em EventField e outros componentes que trabalham com campos de formulário dinâmicos
 */
export const FieldType = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  SELECT: 'SELECT',
  MULTISELECT: 'MULTISELECT',
  CHECKBOX: 'CHECKBOX',
  RADIO: 'RADIO',
  DATE: 'DATE',
  NUMBER: 'NUMBER',
  EMAIL: 'EMAIL',
  FILE: 'FILE'
};

/**
 * Retorna o tipo de input HTML correspondente ao FieldType
 * @param {string} fieldType - O tipo de campo do enum FieldType
 * @returns {string} - O tipo de input HTML adequado
 */
export const getInputTypeFromFieldType = (fieldType) => {
  switch (fieldType) {
    case FieldType.EMAIL:
      return 'email';
    case FieldType.NUMBER:
      return 'number';
    case FieldType.DATE:
      return 'date';
    case FieldType.FILE:
      return 'file';
    default:
      return 'text';
  }
};

/**
 * Verifica se um fieldType suporta validação de comprimento
 * @param {string} fieldType - O tipo de campo do enum FieldType
 * @returns {boolean} - Se o tipo suporta validação de comprimento
 */
export const supportsLengthValidation = (fieldType) => {
  return fieldType === FieldType.TEXT || fieldType === FieldType.TEXTAREA || fieldType === FieldType.EMAIL;
};

export default FieldType;