import { PrismaClient } from '@prisma/client';
import { brazilianStates as states } from '../app/utils/brazilianStates.js';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando a importação dos dados...');

    // Importar estados
    console.log('Importando estados...');
    for (const state of states) {
      await prisma.state.upsert({
        where: { id: state.value },
        update: {
          name: state.label,
          flag: state.flag
        },
        create: {
          id: state.value,
          name: state.label,
          flag: state.flag
        }
      });
    }
    console.log('Estados importados com sucesso!');

    // Importar organização
    console.log('Importando organização...');
    await prisma.organization.upsert({
      where: { id: 'c4b47eeb63945d0da252915ce' },
      update: {
        name: 'Sociedade Mineira de Radiologia',
        shortName: 'SRMG',
        description: 'A Sociedade de Radiologia e Diagnóstico por Imagem de MG é o representante dos interesses do Radiologista mineiro para fortalecimento da especialidade.',
        email: 'srmg@srmg.org.br',
        isActive: true,
        isPremium: true,
        subscriptionEnds: new Date('2026-04-16T18:57:40.075Z')
      },
      create: {
        id: 'c4b47eeb63945d0da252915ce',
        name: 'Sociedade Mineira de Radiologia',
        shortName: 'SRMG',
        description: 'A Sociedade de Radiologia e Diagnóstico por Imagem de MG é o representante dos interesses do Radiologista mineiro para fortalecimento da especialidade.',
        email: 'srmg@srmg.org.br',
        isActive: true,
        isPremium: true,
        createdAt: new Date('2025-04-16T18:57:40.075Z'),
        updatedAt: new Date('2025-04-16T18:57:40.075Z'),
        subscriptionEnds: new Date('2026-04-16T18:57:40.075Z')
      }
    });
    console.log('Organização importada com sucesso!');

    // Importar evento
    console.log('Importando evento...');
    await prisma.event.upsert({
      where: { id: 'cac5c8cd5447baace99183d47' },
      update: {
        name: 'JMR & CIM 2025',
        shortName: 'JMR/CIM2025',
        description: 'Jornada Mineira de Radiologia 2025 (JMR), organizada pela SRMG, e o Congresso de Imaginologia da Mulher 2025 (CIM).',
        startDate: new Date('2025-07-27T00:00:00.000Z'),
        endDate: new Date('2025-07-28T00:00:00.000Z'),
        submissionStart: new Date('2025-05-20T00:00:00.000Z'),
        submissionEnd: new Date('2025-06-30T00:00:00.000Z'),
        reviewStart: new Date('2025-07-01T00:00:00.000Z'),
        reviewEnd: new Date('2025-07-20T00:00:00.000Z'),
        organizationId: 'c4b47eeb63945d0da252915ce',
        isActive: true
      },
      create: {
        id: 'cac5c8cd5447baace99183d47',
        name: 'JMR & CIM 2025',
        shortName: 'JMR/CIM2025',
        description: 'Jornada Mineira de Radiologia 2025 (JMR), organizada pela SRMG, e o Congresso de Imaginologia da Mulher 2025 (CIM).',
        startDate: new Date('2025-07-27T00:00:00.000Z'),
        endDate: new Date('2025-07-28T00:00:00.000Z'),
        submissionStart: new Date('2025-05-20T00:00:00.000Z'),
        submissionEnd: new Date('2025-06-30T00:00:00.000Z'),
        reviewStart: new Date('2025-07-01T00:00:00.000Z'),
        reviewEnd: new Date('2025-07-20T00:00:00.000Z'),
        organizationId: 'c4b47eeb63945d0da252915ce',
        isActive: true,
        createdAt: new Date('2025-04-16T18:57:40.075Z'),
        updatedAt: new Date('2025-04-16T18:57:40.075Z')
      }
    });
    console.log('Evento importado com sucesso!');

    // Importar áreas do evento
    console.log('Importando áreas do evento...');
    const eventAreas = [
      {
        id: 'c1f6212472b25ea3bfb6bd2af',
        name: 'Medicina',
        description: 'Área de Medicina',
        eventId: 'cac5c8cd5447baace99183d47'
      },
      {
        id: 'cafa75f1a2644ce9d1d686c68',
        name: 'Enfermagem',
        description: 'Área de Enfermagem',
        eventId: 'cac5c8cd5447baace99183d47'
      },
      {
        id: 'c9417dc0092a6af2e56dc4606',
        name: 'Fisioterapia',
        description: 'Área de Fisioterapia',
        eventId: 'cac5c8cd5447baace99183d47'
      },
      {
        id: 'c076845d7fb07d1cf8221efa5',
        name: 'Nutrição',
        description: 'Área de Nutrição',
        eventId: 'cac5c8cd5447baace99183d47'
      },
      {
        id: 'c24b7b1f9e91c9c6e2b3f0fbc',
        name: 'Psicologia',
        description: 'Área de Psicologia',
        eventId: 'cac5c8cd5447baace99183d47'
      }
    ];

    for (const area of eventAreas) {
      await prisma.eventArea.upsert({
        where: { id: area.id },
        update: {
          name: area.name,
          description: area.description,
          eventId: area.eventId
        },
        create: {
          id: area.id,
          name: area.name,
          description: area.description,
          eventId: area.eventId,
          createdAt: new Date('2025-04-16T18:57:40.075Z'),
          updatedAt: new Date('2025-04-16T18:57:40.075Z')
        }
      });
    }
    console.log('Áreas do evento importadas com sucesso!');

    // Importar campos do evento
    console.log('Importando campos do evento...');
    const eventFields = [
      {
        id: 'c409d07361e2bfed3ca51706f',
        eventId: 'cac5c8cd5447baace99183d47',
        label: 'Metodologia',
        description: 'Descreva a metodologia utilizada no trabalho',
        isRequired: true,
        fieldType: 'TEXTAREA',
        sortOrder: 1
      },
      {
        id: 'c5cac852dd39373b41e92e5d0',
        eventId: 'cac5c8cd5447baace99183d47',
        label: 'Resultados',
        description: 'Apresente os resultados obtidos',
        isRequired: true,
        fieldType: 'TEXTAREA',
        sortOrder: 2
      },
      {
        id: 'cde33ec60ed82d9107f54fe03',
        eventId: 'cac5c8cd5447baace99183d47',
        label: 'Financiamento',
        description: 'Indique se o trabalho recebeu financiamento e de qual fonte',
        isRequired: false,
        fieldType: 'TEXT',
        sortOrder: 3
      }
    ];

    for (const field of eventFields) {
      await prisma.eventField.upsert({
        where: { id: field.id },
        update: {
          eventId: field.eventId,
          label: field.label,
          description: field.description,
          isRequired: field.isRequired,
          fieldType: field.fieldType,
          sortOrder: field.sortOrder
        },
        create: {
          id: field.id,
          eventId: field.eventId,
          label: field.label,
          description: field.description,
          isRequired: field.isRequired,
          fieldType: field.fieldType,
          sortOrder: field.sortOrder,
          createdAt: new Date('2025-04-16T18:57:40.075Z'),
          updatedAt: new Date('2025-04-16T18:57:40.075Z')
        }
      });
    }
    console.log('Campos do evento importados com sucesso!');

    // Importar tipos de paper do evento
    console.log('Importando tipos de paper do evento...');
    const eventPaperTypes = [
      {
        id: 'c9fee4de630d05a05344a82da',
        name: 'Trabalho Original',
        description: 'Submissão de Trabalho Original',
        eventId: 'cac5c8cd5447baace99183d47'
      },
      {
        id: 'cbddef477d846e2a2d3d0f279',
        name: 'Ensaio Iconográfico ou Pictórico',
        description: 'Submissão de Ensaio Iconográfico ou Pictórico',
        eventId: 'cac5c8cd5447baace99183d47'
      },
      {
        id: 'c867250bdd67c4d7cb1eefd6e',
        name: 'Relato de Casou ou Série de Casos',
        description: 'Submissão de Relato de Casou ou Série de Casos',
        eventId: 'cac5c8cd5447baace99183d47'
      }
    ];

    for (const paperType of eventPaperTypes) {
      await prisma.eventPaperType.upsert({
        where: { id: paperType.id },
        update: {
          name: paperType.name,
          description: paperType.description,
          eventId: paperType.eventId
        },
        create: {
          id: paperType.id,
          name: paperType.name,
          description: paperType.description,
          eventId: paperType.eventId,
          createdAt: new Date('2025-04-16T18:57:40.075Z'),
          updatedAt: new Date('2025-04-16T18:57:40.075Z')
        }
      });
    }
    console.log('Tipos de paper do evento importados com sucesso!');

    // Importar tokens da organização
    console.log('Importando tokens da organização...');
    await prisma.organizationToken.upsert({
      where: { id: 'cf7a51c434147665809473e6f' },
      update: {
        token: 'BDBBBKDcxh3rlAa0',
        description: 'Token da JMR2025',
        organizationId: 'c4b47eeb63945d0da252915ce',
        eventId: 'cac5c8cd5447baace99183d47',
        expiresAt: new Date('2025-06-30T00:00:00.000Z'),
        isActive: true
      },
      create: {
        id: 'cf7a51c434147665809473e6f',
        token: 'BDBBBKDcxh3rlAa0',
        description: 'Token da JMR2025',
        organizationId: 'c4b47eeb63945d0da252915ce',
        eventId: 'cac5c8cd5447baace99183d47',
        expiresAt: new Date('2025-06-30T00:00:00.000Z'),
        isActive: true,
        createdAt: new Date('2025-04-16T18:57:40.075Z')
      }
    });
    console.log('Tokens da organização importados com sucesso!');

    console.log('Importação de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a importação de dados:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Seed completo!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Erro no script de seed:', e);
    process.exit(1);
  });