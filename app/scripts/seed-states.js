import { PrismaClient } from '@prisma/client';
import { states } from '/app/utils/brazilianStates.js';

const prisma = new PrismaClient();

async function seedStates() {
  try {
    console.log('Iniciando a importação dos estados...');

    // Verifica se já existem estados no banco
    const existingCount = await prisma.state.count();

    if (existingCount > 0) {
      console.log(`Já existem ${existingCount} estados no banco. Deseja limpar e recriar? (Responda 'sim' para confirmar)`);
      // Em um script real você adicionaria interação com o usuário aqui
      // Para este exemplo, vamos assumir que queremos continuar
    }

    // Opção alternativa: criar um por um para melhor tratamento de erros
    for (const state of states) {
      await prisma.state.upsert({
        where: { id: state.id },
        update: { name: state.name, flag: state.flag },
        create: state,
      });
      console.log(`Estado ${state.id} - ${state.name} importado com sucesso.`);
    }

    console.log('Importação de estados concluída!');
  } catch (error) {
    console.error('Erro ao importar estados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedStates();