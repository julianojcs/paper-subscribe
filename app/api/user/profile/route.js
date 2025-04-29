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
      where: { id: session.user.id },
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
                      logoUrl: true,
                      startDate: true,
                      endDate: true,
                      submissionStart: true,
                      submissionEnd: true,
                      reviewStart: true,
                      reviewEnd: true,
                      maxAuthors: true,
                      maxKeywords: true,
                      minKeywords: true,
                      maxFiles: true,
                      maxFileSize: true,
                      isActive: true,
                      areas: {
                        select: {
                          id: true,
                          name: true,
                          description: true,
                          sortOrder: true,
                        }
                      },
                      paperTypes: {
                        select: {
                          id: true,
                          name: true,
                          description: true,
                          sortOrder: true,
                        }
                      },
                      eventFields: {
                        select: {
                          id: true,
                          label: true,
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
              logoUrl: event.logoUrl,
              startDate: event.startDate,
              endDate: event.endDate,
              submissionStart: event.submissionStart,
              submissionEnd: event.submissionEnd,
              reviewStart: event.reviewStart,
              reviewEnd: event.reviewEnd,
              maxAuthors: event.maxAuthors,
              maxKeywords: event.maxKeywords,
              minKeywords: event.minKeywords,
              maxFiles: event.maxFiles,
              maxFileSize: event.maxFileSize,
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

    // if (!session?.user?.email) {
    //   return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    // }

    const data = await request.json();
    const { userId, name, email, cpf, phone, institution, city, stateId } = data;

    // Validações básicas dos dados
    if (name && name.trim().length < 3) {
      return NextResponse.json({
        message: "O nome deve ter pelo menos 3 caracteres",
        field: "name"
      }, { status: 400 });
    }

    // Validação de CPF (se fornecido)
    if (cpf) {
      // Se quiser adicionar validação de formato de CPF
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(cpf)) {
        return NextResponse.json({
          message: "Formato de CPF inválido. Use 000.000.000-00",
          field: "cpf"
        }, { status: 400 });
      }

    if (email) {
      // Verificar se email já existe (se foi alterado)
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email,
          id: { not: session.user.id || userId }
        }
      });

      if (existingUserWithEmail) {
        return NextResponse.json({
          message: "Este e-mail já está em uso por outro usuário",
          field: "email"
        }, { status: 409 });
      }
    }

      // Verificar se CPF já existe (se foi alterado)
      const existingUserWithCpf = await prisma.user.findFirst({
        where: {
          cpf,
          id: { not: session.user.id || userId }
        }
      });

      if (existingUserWithCpf) {
        return NextResponse.json({
          message: "Este CPF já está em uso por outro usuário",
          field: "cpf"
        }, { status: 409 });
      }
    }

    // Validação de telefone (se fornecido)
    if (phone) {
      const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json({
          message: "Formato de telefone inválido. Use (00) 00000-0000",
          field: "phone"
        }, { status: 400 });
      }
    }

    // Validação de estado (se fornecido)
    if (stateId) {
      // Verificar se o estado existe
      const stateIdToUse = stateId?.value || stateId;
      const stateExists = await prisma.state.findUnique({
        where: { id: stateIdToUse }
      });

      if (!stateExists) {
        return NextResponse.json({
          message: "Estado inválido",
          field: "stateId"
        }, { status: 400 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id || userId }
    });

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id || userId },
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

    } catch (dbError) {
      // Tratamento específico para erros de Prisma
      if (dbError.code === 'P2002') { // Código do Prisma para unique constraint violation
        const field = dbError.meta?.target[0]; // Obter o campo que causou o erro

        // Mensagens específicas para cada campo com restrição única
        switch(field) {
          case 'cpf':
            return NextResponse.json({
              message: "Este CPF já está em uso por outro usuário",
              field: "cpf",
            }, { status: 409 }); // 409 Conflict

          case 'phone':
            return NextResponse.json({
              message: "Este número de telefone já está em uso",
              field: "phone",
            }, { status: 409 });

          default:
            return NextResponse.json({
              message: `O valor informado para ${field} já está em uso`,
              field,
            }, { status: 409 });
        }
      }

      if (dbError.code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({
          message: "Referência inválida. Verifique os dados informados.",
          field: dbError.meta?.field_name?.split('_').pop() || null,
        }, { status: 400 });
      }

      if (dbError.code === 'P2025') { // Record not found
        return NextResponse.json({
          message: "Registro não encontrado para atualização",
        }, { status: 404 });
      }

      // Log do erro completo para debugging
      console.error("Erro de banco de dados:", dbError.code, dbError.message, dbError.meta);

      // Erro genérico de banco de dados
      return NextResponse.json({
        message: "Erro ao processar sua solicitação no banco de dados",
        error: dbError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);

    // Determinar o tipo de erro e fornecer respostas apropriadas
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({
        message: "Formato de dados inválido",
      }, { status: 400 });
    }

    // Erros gerais do sistema
    return NextResponse.json({
      message: "Erro ao atualizar perfil. Por favor, tente novamente mais tarde.",
      errorType: error.name,
      // Em ambiente de desenvolvimento, retorne mais detalhes
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack?.split('\n')
      })
    }, { status: 500 });
  }
}