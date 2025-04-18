import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "/app/api/auth/[...nextauth]/route";
import { prisma } from "/app/lib/db"; // Ajuste para o caminho correto

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // Buscar parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const includeEvents = searchParams.get('includeEvents') !== 'false'; // Padrão: true
    const activeEventsOnly = searchParams.get('activeEventsOnly') !== 'false'; // Padrão: true

    // Buscar usuário completo do banco de dados
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        institution: true,
        city: true,
        stateId: true,
        image: true,
        state: {
          select: {
            id: true,
            name: true,
            flag: true
          }
        },
        ...(includeEvents ? {
          organizationMemberships: {
            select: {
              id: true,
              role: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  description: true,
                  logoUrl: true,
                  website: true,
                  email: true,
                  phone: true,
                  address: true,
                  events: {
                    where: activeEventsOnly ? { isActive: true } : {},
                    select: {
                      id: true,
                      name: true,
                      shortName: true,
                      description: true,
                      startDate: true,
                      endDate: true,
                      submissionStart: true,
                      submissionEnd: true,
                      reviewStart: true,
                      reviewEnd: true,
                      maxAuthors: true,
                      isActive: true,
                      areas: {
                        select: {
                          id: true,
                          name: true,
                          description: true,
                        }
                      },
                      paperTypes: {
                        select: {
                          id: true,
                          name: true,
                          description: true
                        }
                      },
                      eventFields: {
                        select: {
                          id: true,
                          label: true,
                          description: true,
                          isRequired: true,
                          fieldType: true,
                          fieldOptions: true,
                          maxLength: true,
                          minLength: true,
                          sortOrder: true,
                        },
                        orderBy: {
                          sortOrder: 'asc'
                        }
                      },
                      _count: {
                        select: {
                          areas: true,
                          paperTypes: true,
                          papers: true,
                          eventFields: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } : {})
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    // Construir objeto de resposta com estrutura simplificada
    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      institution: user.institution,
      city: user.city,
      stateId: user.stateId,
      state: user.state ? {
        id: user.state.id,
        name: user.state.name,
        flag: user.state.flag
      } : null,
      image: user.image,
      stateName: user.state?.name || null,
    };

    // Processar organizações e eventos se incluídos
    if (includeEvents && user.organizationMemberships) {
      const now = new Date();
      const organizations = [];
      const events = [];

      user.organizationMemberships.forEach(membership => {
        const org = membership.organization;
        
        organizations.push({
          id: org.id,
          name: org.name,
          shortName: org.shortName,
          description: org.description,
          logoUrl: org.logoUrl,
          website: org.website,
          email: org.email,
          phone: org.phone,
          address: org.address,
          role: membership.role
        });
        
        if (org.events && org.events.length > 0) {
          org.events.forEach(event => {
            let submissionStatus;
            if (!event.submissionStart || !event.submissionEnd) {
              submissionStatus = 'unknown';
            } else if (now < new Date(event.submissionStart)) {
              submissionStatus = 'upcoming';
            } else if (now <= new Date(event.submissionEnd)) {
              submissionStatus = 'open';
            } else {
              submissionStatus = 'closed';
            }
            
            let daysRemaining = null;
            if (submissionStatus === 'open' && event.submissionEnd) {
              const endDate = new Date(event.submissionEnd);
              const timeDiff = endDate.getTime() - now.getTime();
              daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
            } else if (submissionStatus === 'upcoming' && event.submissionStart) {
              const startDate = new Date(event.submissionStart);
              const timeDiff = startDate.getTime() - now.getTime();
              daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
            }

            events.push({
              id: event.id,
              name: event.name,
              shortName: event.shortName,
              description: event.description,
              startDate: event.startDate,
              endDate: event.endDate,
              submissionStart: event.submissionStart,
              submissionEnd: event.submissionEnd,
              reviewStart: event.reviewStart,
              reviewEnd: event.reviewEnd,
              maxAuthors: event.maxAuthors,
              isActive: event.isActive,
              areas: event.areas,
              paperTypes: event.paperTypes,
              eventFields: event.eventFields,
              submissionStatus,
              daysRemaining,
              organization: {
                id: org.id,
                name: org.name,
                shortName: org.shortName,
                logoUrl: org.logoUrl,
                role: membership.role
              },
              stats: {
                areas: event._count?.areas || 0,
                paperTypes: event._count?.paperTypes || 0,
                papers: event._count?.papers || 0,
                fields: event._count?.eventFields || 0
              }
            });
          });
        }
      });

      const sortedEvents = events.sort((a, b) => {
        const statusOrder = { open: 0, upcoming: 1, closed: 2, unknown: 3 };
        
        if (statusOrder[a.submissionStatus] !== statusOrder[b.submissionStatus]) {
          return statusOrder[a.submissionStatus] - statusOrder[b.submissionStatus];
        }
        
        const dateA = a.submissionStart ? new Date(a.submissionStart) : new Date(0);
        const dateB = b.submissionStart ? new Date(b.submissionStart) : new Date(0);
        return dateB - dateA;
      });

      response.organizations = organizations;
      response.events = sortedEvents;
      response.eventsSummary = {
        total: events.length,
        open: events.filter(e => e.submissionStatus === 'open').length,
        upcoming: events.filter(e => e.submissionStatus === 'upcoming').length,
        closed: events.filter(e => e.submissionStatus === 'closed').length
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    return NextResponse.json(
      { message: "Erro ao buscar perfil", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();
    const { name, email, cpf, phone, institution, city, stateId } = data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        cpf,
        phone,
        institution,
        city,
        stateId: stateId?.value || stateId
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        institution: true,
        city: true,
        stateId: true,
        state: {
          select: {
            id: true,
            name: true,
            flag: true
          }
        }
      }
    });

    const response = {
      ...updatedUser,
      state: updatedUser.state ? {
        id: updatedUser.state.id,
        name: updatedUser.state.name,
        flag: updatedUser.state.flag
      } : null,
      stateName: updatedUser.state?.name || null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar perfil", error: error.message },
      { status: 500 }
    );
  }
}