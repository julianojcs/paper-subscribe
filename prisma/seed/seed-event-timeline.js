import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Obter todos os eventos existentes
  const events = await prisma.event.findMany();

  console.log(`Migrando dados de timeline para ${events.length} eventos...`);

  for (const event of events) {
    const timelines = [];

    // Submission Start
    if (event.submissionStart) {
      timelines.push({
        eventId: event.id,
        name: 'Abertura de inscrições',
        description: 'Início do período para envio de trabalhos',
        date: event.submissionStart,
        type: 'SUBMISSION_START',
        sortOrder: 1
      });
    }

    // Submission End
    if (event.submissionEnd) {
      timelines.push({
        eventId: event.id,
        name: 'Data-limite para envio dos trabalhos',
        description: 'Encerramento do período de submissão',
        date: event.submissionEnd,
        type: 'SUBMISSION_END',
        sortOrder: 2
      });
    }

    // Review Start
    if (event.reviewStart) {
      timelines.push({
        eventId: event.id,
        name: 'Divulgação dos trabalhos selecionados',
        description: 'Início do período de revisão',
        date: event.reviewStart,
        type: 'REVIEW_START',
        sortOrder: 3
      });
    }

    // Review End
    if (event.reviewEnd) {
      timelines.push({
        eventId: event.id,
        name: 'Divulgação dos melhores trabalhos',
        description: 'Fim do período de revisão',
        date: event.reviewEnd,
        type: 'REVIEW_END',
        sortOrder: 4
      });
    }

    // Event Start
    if (event.startDate) {
      timelines.push({
        eventId: event.id,
        name: `Início do ${event.name || event.shortName}`,
        description: 'Data de início do evento',
        date: event.startDate,
        type: 'EVENT_START',
        sortOrder: 5
      });
    }

    // Event End
    if (event.endDate) {
      timelines.push({
        eventId: event.id,
        name: `Encerramento do ${event.name || event.shortName}`,
        description: 'Data de encerramento do evento',
        date: event.endDate,
        type: 'EVENT_END',
        sortOrder: 6
      });
    }

    // Criar registros de timeline
    if (timelines.length > 0) {
      console.log(`Criando ${timelines.length} registros de timeline para o evento: ${event.name}`);

      await prisma.eventTimeline.createMany({
        data: timelines,
        skipDuplicates: true,
      });
    }
  }

  console.log('Migração de dados de timeline concluída!');
}

main()
  .catch((e) => {
    console.error('Erro durante a migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });