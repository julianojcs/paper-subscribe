import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

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

    // Verificar conexão com banco de dados antes da consulta principal
    try {
      // Consulta simples para verificar a conexão
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbConnectionError) {
      console.error('Erro de conexão com o banco de dados:', dbConnectionError);
      return NextResponse.json(
        {
          error: 'Erro de conexão com o banco de dados',
          details: dbConnectionError.message,
          code: dbConnectionError.code || 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }

    // Buscar o evento com todos os dados relacionados necessários
    let event;
    try {
      event = await prisma.event.findUnique({
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
          // statusConfigs: {
          //   select: {
          //     id: true,
          //     status: true,
          //     label: true,
          //     description: true,
          //     sortOrder: true,
          //     isActive: true
          //   },
          //   orderBy: { sortOrder: 'asc' }
          // },
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
    } catch (queryError) {
      console.error('Erro na consulta do evento:', queryError);

      // Tratamento específico para erros do Prisma
      if (queryError instanceof PrismaClientKnownRequestError) {
        return NextResponse.json(
          {
            error: 'Erro na consulta do banco de dados',
            details: queryError.message,
            code: queryError.code,
            meta: queryError.meta
          },
          { status: 422 }
        );
      } else if (queryError instanceof PrismaClientValidationError) {
        return NextResponse.json(
          {
            error: 'Erro de validação na consulta',
            details: queryError.message
          },
          { status: 400 }
        );
      }

      throw queryError; // Repassar outros erros para o catch global
    }

    if (!event) {
      return NextResponse.json(
        {
          error: 'Evento não encontrado',
          eventId: id
        },
        { status: 404 }
      );
    }

    // Filtrar statusConfigs para incluir apenas os ativos
    if (event.statusConfigs) {
      event.statusConfigs = event.statusConfigs.filter(config =>
        config.isActive === undefined || config.isActive === true
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

    // Extrair informações detalhadas do erro
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error.code,
      clientVersion: error.clientVersion,
      timestamp: new Date().toISOString()
    };

    // Em ambiente de desenvolvimento, retornar detalhes completos
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          error: 'Erro interno ao buscar evento',
          details: errorDetails
        },
        { status: 500 }
      );
    }

    // Em produção, retornar mensagem genérica com identificador de erro
    // mas sem expor detalhes sensíveis como stack trace
    const errorId = `err_${Date.now().toString(36)}`;
    console.error(`[${errorId}] Erro interno:`, errorDetails);

    return NextResponse.json(
      {
        error: 'Erro interno ao buscar evento',
        errorId: errorId,
        message: error.message
      },
      { status: 500 }
    );
  }
}