import { prisma } from '../lib/db';

/**
 * Busca todos os estados do Brasil no banco de dados
 * @returns {Promise<Array>} Lista formatada de estados
 */
export async function getAllStates() {
  try {
    const states = await prisma.state.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      },
    });

    return states.map(state => ({
      value: state.id,
      label: state.name,
      flag: `/flags/${state.id}.svg`,
    }));
  } catch (error) {
    console.error('Erro ao buscar estados:', error);
    return [];
  }
}

/**
 * Busca um estado específico pelo ID
 * @param {string} id - ID/UF do estado
 * @returns {Promise<Object|null>} Estado encontrado ou null
 */
export async function getStateById(id) {
  try {
    const state = await prisma.state.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!state) return null;

    return {
      value: state.id,
      label: state.name,
      flag: `/flags/${state.id}.svg`,
    };
  } catch (error) {
    console.error(`Erro ao buscar estado com ID ${id}:`, error);
    return null;
  }
}