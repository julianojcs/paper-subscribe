import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

/**
 * Manipulador da rota GET para buscar um evento específico pelo ID
 * @param {Request} request - O objeto de requisição
 * @param {Object} params - Parâmetros da rota, incluindo o ID do evento
 * @returns {NextResponse} Resposta com os dados do evento ou erro
 */
export async function GET(request, context) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do evento não fornecido' },
        { status: 400 }
      );
    }

    // Buscar o evento com todos os dados relacionados necessários
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        // Incluir os itens de timeline para calcular os status
        timelines: {
          where: { isPublic: true },
          orderBy: [
            { sortOrder: 'asc' },
            { date: 'asc' }
          ]
        },
        // Incluir outros relacionamentos que possam ser úteis
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            website: true,
            email: true,
            phone: true,
            address: true
          }
        },
        statusConfigs: {
          select: {
            id: true,
            status: true,
            label: true,
            description: true,
            sortOrder: true
          },
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        areas: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        paperTypes: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true
          }
        },
        timelines: {
          select: {
            id: true,
            name: true,
            description: true,
            date: true,
            type: true,
            isPublic: true
          }
        },
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Calcular estados do evento (isSubmissionOpen, isEventActive, etc)
    // com base nos itens da timeline
    const now = new Date();
    let isSubmissionOpen = false;
    let isSubmissionClosed = false;
    let isReviewPhase = false;
    let isEventActive = false;
    let isEventFinished = false;

    // Encontrar datas relevantes na timeline
    const submissionStartItem = event.timelines.find(item => item.type === 'SUBMISSION_START');
    const submissionEndItem = event.timelines.find(item => item.type === 'SUBMISSION_END');
    const reviewStartItem = event.timelines.find(item => item.type === 'REVIEW_START');
    const reviewEndItem = event.timelines.find(item => item.type === 'REVIEW_END');
    const eventStartItem = event.timelines.find(item => item.type === 'EVENT_START');
    const eventEndItem = event.timelines.find(item => item.type === 'EVENT_END');

    const submissionStart = submissionStartItem?.date;
    const submissionEnd = submissionEndItem?.date;
    const reviewStart = reviewStartItem?.date;
    const reviewEnd = reviewEndItem?.date;
    const eventStart = eventStartItem?.date;
    const eventEnd = eventEndItem?.date;

    // Verificar status do evento
    if (submissionStart && submissionEnd) {
      isSubmissionOpen = now >= new Date(submissionStart) && now <= new Date(submissionEnd);
      isSubmissionClosed = now > new Date(submissionEnd);
    }

    if (reviewStart && reviewEnd) {
      isReviewPhase = now >= new Date(reviewStart) && now <= new Date(reviewEnd);
    }

    if (eventStart && eventEnd) {
      isEventActive = now >= new Date(eventStart) && now <= new Date(eventEnd);
      isEventFinished = now > new Date(eventEnd);
    }

    // Adicionar os status calculados ao objeto do evento
    const eventWithStatus = {
      ...event,
      isSubmissionOpen,
      isSubmissionClosed,
      isReviewPhase,
      isEventActive,
      isEventFinished
    };

    return NextResponse.json({ event: eventWithStatus });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar evento' },
      { status: 500 }
    );
  }
}