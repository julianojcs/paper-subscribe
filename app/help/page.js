'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { FaSitemap, FaAngleDown, FaAngleUp, FaFileAlt, FaCloudUploadAlt, FaSearch, FaExclamationCircle, FaInfoCircle, FaUser, FaEdit, FaCheckCircle, FaBan, FaFileUpload, FaTrashAlt,
  FaCodeBranch } from 'react-icons/fa';
import PageContainer from '/app/components/layout/PageContainer';
import HeaderContentTitle from '/app/components/layout/HeaderContentTitle';
import LoadingSpinner from '/app/components/ui/LoadingSpinner';
import styles from './help.module.css';
import { useDataContext } from '../../context/DataContext';
import * as localStorageService from '/app/lib/services/localStorage';
import { useEventDataService } from '/app/lib/services/eventDataService';

const EVENT_DATA_KEY = 'event_data';

export default function HelpPage() {
  const { data: session, status: authStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeStatus, setActiveStatus] = useState(null);
  const statusCardRefs = useRef({});

  const { eventData: contextEventData, setEventData } = useDataContext();
  const [eventData, setLocalEventData] = useState(null);
  const [sourceData, setSourceData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [paperStatuses, setPaperStatuses] = useState(false);

  const { getEventData, saveEventDataToLocalStorage } = useEventDataService();

  const steps = [ {
    title: "Crie sua conta",
    description: 'Acesse a página de registro para criar sua conta. Você precisará fornecer informações básicas como nome, email, cidade, estado e instituição.'
  }, {
    title: 'Explore os eventos disponíveis',
    description: 'Na página inicial, você encontrará os eventos atualmente abertos para submissão. Verifique os requisitos e o organograma dos prazos de cada evento antes de submeter seu trabalho.'
  }, {
    title: 'Prepare seu trabalho',
    description: 'Crie um novo trabalho usando o botão "Enviar Trabalho" e salve-o como rascunho enquanto desenvolve seu conteúdo. Certifique-se de seguir os modelos e diretrizes do evento.'
  }, {
    title: 'Submeta seu trabalho',
    description: 'Quando seu trabalho estiver pronto, preencha todos os campos obrigatórios. Revise todas as informações antes de confirmar a submissão.'
  }, {
    title: 'Acompanhe o processo',
    description: 'Use a seção "Meus Trabalhos" para monitorar o status das suas submissões. Você será notificado por email quando houver atualizações importantes no processo de revisão.'
  }, {
    title: 'Responda às revisões (opcional)',
    description: 'Se seu trabalho necessitar de revisões, você receberá feedback detalhado dos revisores. Faça as correções solicitadas e reenvie seu trabalho dentro do prazo estabelecido.'
  }];

  const userTips = [
    "Mantenha seus dados de contato atualizados para receber todas as notificações.",
    "Fique atento aos prazos de submissão e revisão.",
    "Salve seu trabalho regularmente enquanto o edita.",
    "Verifique cuidadosamente os requisitos de formatação antes de submeter.",
    "Acompanhe regularmente o status de suas submissões."
  ];

  const faqs = [
    {
      question: "Como faço para submeter um trabalho?",
      answer: "Para submeter um trabalho, faça login na plataforma e clique no botão 'Enviar Trabalho' no menu superior. Preencha o formulário com os dados solicitados, faça upload do arquivo em formato PDF e confirme a submissão. Você receberá um email confirmando que sua submissão foi recebida com sucesso."
    },
    {
      question: "Posso editar meu trabalho depois de submetido?",
      answer: "Sim, você pode editar seu trabalho enquanto ele estiver nos status RASCUNHO ou PENDENTE. Uma vez que o trabalho entre em avaliação (EM REVISÃO), não será mais possível realizar alterações, a menos que os revisores solicitem revisões (REVISÃO necessária)."
    },
    {
      question: "Como acompanho o status da minha submissão?",
      answer: "Acesse a seção 'Meus Trabalhos' no menu principal. Lá você encontrará a lista de todos os seus trabalhos submetidos, com informações detalhadas sobre o status atual de cada um. Você também receberá notificações por email quando houver atualizações importantes."
    },
    {
      question: "Como funciona o processo de revisão?",
      answer: "Após a submissão, seu trabalho passa por uma triagem inicial e então é encaminhado para revisores especialistas no tema. Os revisores avaliam seu trabalho e podem recomendar aceitação, rejeição ou solicitar revisões. A decisão final é tomada pelos organizadores do evento com base nas recomendações dos revisores."
    },
    {
      question: "Posso retirar meu trabalho depois de submetido?",
      answer: "Sim, você pode retirar (withdraw) seu trabalho a qualquer momento antes da publicação final. Para isso, acesse a página do seu trabalho através da seção 'Meus Trabalhos' e clique no botão 'Retirar Trabalho'. Note que isso é irreversível e seu trabalho não será mais considerado para o evento."
    },
    {
      question: "O que acontece quando meu trabalho é aceito?",
      answer: "Quando seu trabalho é aceito, você recebe uma notificação por email. Dependendo do evento, pode ser necessário realizar ajustes finais, confirmar presença ou preparar uma apresentação. Os organizadores fornecerão instruções específicas sobre os próximos passos para a apresentação e publicação do seu trabalho."
    }
  ];

  // Use useMemo to prevent the defaultPaperStatuses from being recreated on every render
  const defaultPaperStatuses = useMemo(() => [
    {
      status: "DRAFT",
      icon: <FaEdit />,
      title: "Rascunho",
      description: "Versão inicial e não finalizada do trabalho",
      details: [
        "Visível apenas para o autor e colaboradores diretos",
        "Completamente editável pelo autor",
        "Não entrou oficialmente no processo de avaliação",
        "Não aparece para revisores ou organizadores do evento",
        "Permite ao autor trabalhar em seu documento sem comprometimento oficial"
      ],
      nextStatus: "PENDENTE (quando submetido)"
    },
    {
      status: "PENDING",
      icon: <FaCloudUploadAlt />,
      title: "Pendente",
      description: "Trabalho oficialmente submetido aguardando triagem",
      details: [
        "Visível para autores e organizadores do evento",
        "Editável com limitações; edições permitidas até designação de revisores",
        "Entrou no pipeline de avaliação, mas ainda não foi distribuído aos revisores",
        "Aparece nas filas de trabalho pendentes para os organizadores",
        "Marca que o paper está completo e pronto para revisão na perspectiva do autor"
      ],
      nextStatus: "EM REVISÃO (quando atribuído a revisores)"
    },
    {
      status: "UNDER_REVIEW",
      icon: <FaSearch />,
      title: "Em Revisão",
      description: "Trabalho em processo ativo de avaliação por revisores designados",
      details: [
        "Visível para autores (somente leitura), organizadores e revisores designados",
        "Bloqueado para edição pelo autor durante o período de revisão",
        "Está sendo ativamente avaliado pelos revisores",
        "Aparece nas filas de trabalho dos revisores designados",
        "Garante a integridade do processo de revisão ao evitar alterações durante a avaliação"
      ],
      nextStatus: "ACEITO, REJEITADO ou REVISÃO necessária (após conclusão das avaliações)"
    },
    {
      status: "REVISION_REQUIRED",
      icon: <FaExclamationCircle />,
      title: "Revisão Necessária (opcional)",
      description: "Trabalho que precisa de modificações após a primeira rodada de revisão",
      details: [
        <span key="optional-state">
          Estado opcional [<span style={{ color: "red", fontWeight: 600 }}>?</span>], podendo ser aplicado ou não, dependendo do evento
        </span>,
        "Visível para autores (com acesso aos comentários dos revisores), organizadores e revisores",
        "Autor pode editar para atender às solicitações de revisão",
        "Entre ciclos de revisão, após feedback inicial",
        "Aparece para o autor com feedback específico dos revisores",
        "Permite que o autor melhore o trabalho com base nas avaliações recebidas"
      ],
      nextStatus: "EM REVISÃO (quando reenviado para nova avaliação)"
    },
    {
      status: "ACCEPTED",
      icon: <FaCheckCircle />,
      title: "Aceito",
      description: "Trabalho aprovado pelos revisores/comitê após processo de avaliação",
      details: [
        "Visível para autores, organizadores e revisores designados",
        "Geralmente não editável, exceto para pequenas correções finais autorizadas",
        "Fim do processo de revisão, aguardando publicação",
        "Preparado para inclusão nos anais ou publicações do evento",
        "Indica que o trabalho atende aos padrões acadêmicos/científicos exigidos"
      ],
      nextStatus: "REJEITADO (quando incluído nos anais ou publicações)"
    },
    {
      status: "REJECTED",
      icon: <FaBan />,
      title: "Rejeitado",
      description: "Trabalho que não atendeu aos critérios mínimos de aceitação",
      details: [
        "Visível para autores (com justificativas), organizadores e revisores",
        "Não editável, processo encerrado para esta submissão",
        "Fim do processo de avaliação, sem continuidade",
        "Arquivado com feedback para o autor",
        "Filtra trabalhos que não atendem aos requisitos de qualidade ou escopo"
      ],
      nextStatus: "Nenhum (processo finalizado para esta submissão)"
    },
    {
      status: "PUBLISHED",
      icon: <FaFileUpload />,
      title: "Publicado",
      description: "Trabalho aceito que foi oficialmente publicado nos anais ou em periódico",
      details: [
        "Públicamente disponível (conforme políticas do evento)",
        "Não editável, versão final publicada",
        "Etapa final do processo, paper concluído e publicado",
        "Disponível para citação, com DOI ou referência formal",
        "Dissemina oficialmente o conhecimento científico após validação"
      ],
      nextStatus: "Nenhum (representa o estado final do trabalho)"
    },
    {
      status: "WITHDRAWN",
      icon: <FaTrashAlt />,
      title: "Retirado",
      description: "Trabalho retirado do processo pelo próprio autor ou por solicitação institucional",
      details: [
        "Visível para autores e organizadores, com notificação para revisores se já designados",
        "Não editável, processo interrompido",
        "Interrupção do processo em qualquer ponto antes da publicação",
        "Arquivado com registro de retirada",
        "Permite aos autores removerem trabalhos do processo por motivos pessoais, éticos ou estratégicos"
      ],
      nextStatus: "Nenhum (processo encerrado a pedido do autor)"
    }
  ], []); // Empty dependency array ensures this is only created once

  // Adicionando esta função para mapear statusConfigs para o formato de paperStatuses
  // Adicionando esta função para mapear statusConfigs para o formato de paperStatuses
  const mapStatusConfigsToPaperStatuses = useCallback((eventData) => {
    // Verificar se temos configurações de status do evento
    const statusConfigs = eventData?.event?.statusConfigs || eventData?.statusConfigs;

    if (!statusConfigs || !Array.isArray(statusConfigs) || statusConfigs.length === 0) {
      console.log('Nenhuma configuração de status encontrada, usando valores padrão');
      return defaultPaperStatuses;
    }

    console.log('Mapeando configurações de status do evento:', statusConfigs);

    // Criar um mapa dos status padrão para poder combinar os dados
    const defaultStatusMap = defaultPaperStatuses.reduce((map, status) => {
      map[status.status] = status;
      return map;
    }, {});

    // Mapear as configurações para o formato esperado
    const mappedStatuses = statusConfigs.map(config => {
      const defaultStatus = defaultStatusMap[config.status] || {};

      return {
        status: config.status,
        icon: defaultStatus.icon || getDefaultIconForStatus(config.status),
        title: config.label || defaultStatus.title || config.status,
        description: config.description || defaultStatus.description || '',
        details: defaultStatus.details || [
          "Informações detalhadas não disponíveis para este status."
        ],
        nextStatus: defaultStatus.nextStatus || "Próximo estado não especificado"
      };
    });

    // Ordenar por sortOrder se disponível
    mappedStatuses.sort((a, b) => {
      const configA = statusConfigs.find(c => c.status === a.status);
      const configB = statusConfigs.find(c => c.status === b.status);

      // Se o sortOrder for null ou undefined, considerar como valor alto
      const orderA = configA?.sortOrder ?? 999;
      const orderB = configB?.sortOrder ?? 999;

      return orderA - orderB;
    });

    return mappedStatuses;
  }, [defaultPaperStatuses]);

  // Função auxiliar para obter ícones baseados no status
  const getDefaultIconForStatus = (status) => {
    switch (status) {
      case 'DRAFT': return <FaEdit />;
      case 'PENDING': return <FaCloudUploadAlt />;
      case 'UNDER_REVIEW': return <FaSearch />;
      case 'REVISION_REQUIRED': return <FaExclamationCircle />;
      case 'ACCEPTED': return <FaCheckCircle />;
      case 'REJECTED': return <FaBan />;
      case 'PUBLISHED': return <FaFileUpload />;
      case 'WITHDRAWN': return <FaTrashAlt />;
      default: return <FaFileAlt />;
    }
  };

  // No loadEventData, modifique para incluir o mapeamento e atualização dos paperStatuses
  const loadEventData = useCallback(async (force = false) => {
    if (!force && eventData && !loading) return;

    try {
      setLoading(true);
      console.log("Carregando dados do evento para página de ajuda...", { authStatus, hasSession: !!session });

      const storedData = localStorageService.getItem(EVENT_DATA_KEY);
      if (storedData && !force) {
        console.log('Dados encontrados no localStorage:', storedData);

        let normalizedData = storedData;

        if (!storedData.expires && storedData.event) {
          console.log('Detectada estrutura de dados antiga, normalizando...');
          normalizedData = saveEventDataToLocalStorage(storedData);
        }

        // Extrair e definir os status dos papers baseados nos dados do evento
        const mappedStatuses = mapStatusConfigsToPaperStatuses(normalizedData);
        setPaperStatuses(mappedStatuses);

        setLocalEventData(normalizedData);
        setEventData(normalizedData);
        setSourceData('localStorage');
        setLoading(false);
        setImageReady(true);
        return;
      }

      const result = await getEventData();
      console.log("Dados obtidos da API para página de ajuda:", result);

      if (result?.dataEvent) {
        const savedData = saveEventDataToLocalStorage(result.dataEvent);

        // Extrair e definir os status dos papers baseados nos dados do evento
        const mappedStatuses = mapStatusConfigsToPaperStatuses(savedData);
        setPaperStatuses(mappedStatuses);

        setLocalEventData(savedData);
        setEventData(savedData);
        setSourceData(result.sourceDataEvent);
      } else {
        console.log('Nenhum dado de evento disponível para página de ajuda');
        // Usar valores padrão quando não há dados do evento
        setPaperStatuses(defaultPaperStatuses);
      }
    } catch (error) {
      console.error('Erro ao inicializar dados na página de ajuda:', error);
      // Em caso de erro, use os valores padrão
      setPaperStatuses(defaultPaperStatuses);
    } finally {
      setLoading(false);
      setImageReady(true);
      setIsInitialized(true);
    }
  }, [authStatus,
      session,
      loading,
      getEventData,
      eventData,
      setEventData,
      saveEventDataToLocalStorage,
      mapStatusConfigsToPaperStatuses,
      defaultPaperStatuses
    ]
  );

  // Também é necessário atualizar este useEffect para garantir que os paperStatuses sejam definidos
  useEffect(() => {
    if (contextEventData && !eventData) {
      setLocalEventData(contextEventData);

      // Mapeie os status quando os dados vierem do contexto
      const mappedStatuses = mapStatusConfigsToPaperStatuses(contextEventData);
      setPaperStatuses(mappedStatuses);

      setLoading(false);
      setImageReady(true);
    }
  }, [contextEventData, eventData, mapStatusConfigsToPaperStatuses]);

  // Adicione um useEffect inicial para garantir que paperStatuses nunca seja falso/undefined
  useEffect(() => {
    if (!paperStatuses) {
      setPaperStatuses(defaultPaperStatuses);
    }
  }, [paperStatuses, defaultPaperStatuses]);

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (isInitialized) return;
    loadEventData();
  }, [authStatus, loadEventData, isInitialized]);

  useEffect(() => {
    if (authStatus === 'authenticated' && isInitialized && !eventData) {
      console.log('Usuário autenticado e sem dados do evento na página de ajuda. Recarregando...');
      loadEventData(true);
    }
  }, [authStatus, loadEventData, isInitialized, eventData]);

  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => {
      if (!eventData && !contextEventData) {
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [loading, eventData, contextEventData]);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const toggleStatus = (status) => {
    setActiveStatus(activeStatus === status ? null : status);
  };

  const handleStatusDotClick = (status) => {
    setActiveStatus(status);
    setTimeout(() => {
      if (statusCardRefs.current[status]) {
        statusCardRefs.current[status].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 50);
  };

  const currentEventData = eventData || contextEventData;

  let headerData = {
    eventName: "Central de Ajuda",
    eventLogoUrl: null,
    contactEmail: currentEventData?.event?.organization?.email || "apfjuliano@gmail.com",
    website: currentEventData?.event?.organization?.website
  };

  if (currentEventData) {
    if (currentEventData.event) {
      headerData.eventLogoUrl = currentEventData.event.logoUrl;
      headerData.eventName = `${currentEventData.event.name} - Central de Ajuda`;
      headerData.contactEmail = currentEventData.event.organization.email || headerData.contactEmail;
      headerData.website = currentEventData.event.organization.website || headerData.website;
    } else {
      headerData.eventLogoUrl = currentEventData.logoUrl;
      headerData.eventName = `${currentEventData.name} - Central de Ajuda`;
      headerData.contactEmail = currentEventData.organization.email || headerData.contactEmail;
      headerData.website = currentEventData.organization.website || headerData.website;
    }
  }

  return (
    <>
      {loading ? (
        <LoadingSpinner message={"Carregando a Central de Ajuda"} />
      ) : (
        <PageContainer>
          <HeaderContentTitle
            eventData={{
              eventLogoUrl: headerData.eventLogoUrl,
              eventName: headerData.eventName
            }}
            onImageLoad={() => setImageReady(true)}
            subtitle="Orientações e Perguntas Frequentes"
            fallbackTitle="Central de Ajuda"
            background="linear-gradient(135deg, #3b82f6, #1e40af)"
          />

          <div className={styles.helpContainer}>
            <nav className={styles.helpNav}>
              <button
                className={`${styles.navButton} ${activeSection === 'getting-started' ? styles.activeNavButton : ''}`}
                onClick={() => setActiveSection('getting-started')}
              >
                <FaInfoCircle className={styles.navIcon} />
                <span>Primeiros Passos</span>
              </button>
              <button
                className={`${styles.navButton} ${activeSection === 'paper-status' ? styles.activeNavButton : ''}`}
                onClick={() => setActiveSection('paper-status')}
              >
                <FaSitemap className={styles.navIcon} />
                <span>Status dos Trabalhos</span>
              </button>
              <button
                className={`${styles.navButton} ${activeSection === 'faq' ? styles.activeNavButton : ''}`}
                onClick={() => setActiveSection('faq')}
              >
                <FaUser className={styles.navIcon} />
                <span>Perguntas Frequentes</span>
              </button>
            </nav>

            <div className={styles.helpContent}>
              {activeSection === 'getting-started' && (
                <section className={styles.gettingStarted}>
                  <h2>Primeiros Passos</h2>

                  <div className={styles.card}>
                    <h3>Bem-vindo ao Sistema de Submissão de Trabalhos Científicos</h3>
                    <p>
                      Essa plataforma foi desenvolvida para facilitar o processo de submissão, revisão e publicação de
                      trabalhos científicos para eventos acadêmicos. Aqui você encontrará todas as ferramentas
                      necessárias para submeter seus trabalhos, acompanhar o processo de revisão e manter-se informado
                      sobre os prazos importantes.
                    </p>
                  </div>

                  <div className={styles.stepGrid}>
                    {steps.map((step, index) => {
                      if (index !== 5 || (index === 5 && paperStatuses.some(status => status.status === 'REVISION_REQUIRED'))) {
                        return (
                          <div key={index} className={styles.step}>
                            <div className={styles.stepNumber}>{index + 1}</div>
                            <h4>{step.title}</h4>
                            <p>{step.description}</p>
                          </div>
                        );
                      }
                    })}
                  </div>

                  <div className={styles.userTips}>
                    <h3>Dicas Importantes</h3>
                    <ul>
                      {userTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {activeSection === 'paper-status' && (
                <section className={styles.paperStatus}>
                  <h2>Status dos Trabalhos</h2>

                  <div className={styles.card}>
                    <p>
                      Seu trabalho passa por diferentes estados durante o processo de submissão e avaliação.
                      Entender o significado de cada status ajudará você a acompanhar o progresso do seu trabalho
                      e saber o que esperar em cada etapa. Dependendo do evento, o estado do trabalho pode ser
                      opcional, podendo ou nao ser aplicado.
                    </p>
                  </div>
                  <div className={styles.flowContainer}>
                    <div className={styles.statusFlow}>
                      <div className={styles.flowArrow}></div>
                      <div
                        className={styles.statusDot}
                        data-status="DRAFT"
                        data-label="Rascunho"
                        onClick={() => handleStatusDotClick("DRAFT")}
                      >
                        <FaEdit className={styles.dotIcon} />
                      </div>
                      <div
                        className={styles.statusDot}
                        data-status="PENDING"
                        data-label="Pendente"
                        onClick={() => handleStatusDotClick("PENDING")}
                      >
                        <FaCloudUploadAlt className={styles.dotIcon} />
                      </div>
                      <div
                        className={styles.statusDot}
                        data-status="UNDER_REVIEW"
                        data-label="Em Revisão"
                        onClick={() => handleStatusDotClick("UNDER_REVIEW")}
                      >
                        <FaSearch className={styles.dotIcon} />
                      </div>
                      { paperStatuses.some(status => status.status === 'REVISION_REQUIRED') ? (
                        <div className={styles.statusBranch}>
                          <div className={styles.branchItem}>
                            <div
                              className={styles.statusDot}
                              data-status="REVISION_REQUIRED"
                              data-label="Revisão Necessária"
                              onClick={() => handleStatusDotClick("REVISION_REQUIRED")}
                            >
                              <FaExclamationCircle className={styles.dotIcon} />
                            </div>
                          </div>
                          <div className={styles.branchItem}>
                            <div
                              className={styles.statusDot}
                              data-status="ACCEPTED"
                              data-label="Aceito"
                              onClick={() => handleStatusDotClick("ACCEPTED")}
                            >
                              <FaCheckCircle className={styles.dotIcon} />
                            </div>
                          </div>
                          <div className={styles.branchItem}>
                            <div
                              className={styles.statusDot}
                              data-status="REJECTED"
                              data-label="Rejeitado"
                              onClick={() => handleStatusDotClick("REJECTED")}
                            >
                              <FaBan className={styles.dotIcon} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.statusBranch2}>
                          <div className={styles.statusDot}
                            data-status="ACCEPTED"
                            data-label="Aceito"
                            onClick={() => handleStatusDotClick("ACCEPTED")}
                          >
                            <FaCheckCircle className={styles.dotIcon} />
                          </div>
                          <div className={styles.statusDot}
                            data-status="REJECTED"
                            data-label="Rejeitado"
                            onClick={() => handleStatusDotClick("REJECTED")}
                          >
                            <FaBan className={styles.dotIcon} />
                          </div>
                        </div>
                      )}
                      <div
                        className={styles.statusDot}
                        data-status="PUBLISHED"
                        data-label="Publicado"
                        onClick={() => handleStatusDotClick("PUBLISHED")}
                      >
                        <FaFileUpload className={styles.dotIcon} />
                      </div>
                    </div>
                    <div className={styles.statusWithdraw}>
                      <div className={styles.withdrawArrow}></div>
                      <div
                        className={styles.statusDot}
                        data-status="WITHDRAWN"
                        data-label="Retirado"
                        onClick={() => handleStatusDotClick("WITHDRAWN")}
                      >
                        <FaTrashAlt className={styles.dotIcon} />
                      </div>
                    </div>
                  </div>

                  <div className={styles.statusList}>
                    {paperStatuses.map((item) => (
                      <div
                        key={item.status}
                        className={`${styles.statusCard} ${activeStatus === item.status ? styles.expandedStatus : ''}`}
                        ref={el => statusCardRefs.current[item.status] = el}
                      >
                        <div
                          className={styles.statusHeader}
                          onClick={() => toggleStatus(item.status)}
                        >
                          <div className={styles.statusIconWrapper}>
                            <div className={styles.statusIcon} data-status={item.status}>
                              {item.icon}
                            </div>
                          </div>
                          <div className={styles.statusTitleWrapper}>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                          </div>
                          <div className={styles.statusToggle}>
                            {activeStatus === item.status ? <FaAngleUp /> : <FaAngleDown />}
                          </div>
                        </div>

                        <div className={styles.statusDetails}>
                          <ul>
                            {item.details.map((detail, index) => (
                              <li key={index}>{detail}</li>
                            ))}
                          </ul>
                          <div className={styles.nextStatus}>
                            <strong>Próximo estado típico:</strong> {item.nextStatus}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeSection === 'faq' && (
                <section className={styles.faqSection}>
                  <h2>Perguntas Frequentes</h2>

                  <div className={styles.faqList}>
                    {faqs.map((faq, index) => (
                      <div
                        key={index}
                        className={`${styles.faqItem} ${activeFaq === index ? styles.activeFaq : ''}`}
                      >
                        <div
                          className={styles.faqQuestion}
                          onClick={() => toggleFaq(index)}
                        >
                          <h3>{faq.question}</h3>
                          {activeFaq === index ? <FaAngleUp /> : <FaAngleDown />}
                        </div>
                        <div className={styles.faqAnswer}>
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.helpContact}>
                    <h3>Não encontrou o que procurava?</h3>
                    <p>
                      Entre em contato com nossa equipe de suporte através do email{' '}
                      <a href={`mailto:${headerData.contactEmail}`}>{headerData.contactEmail}</a>.
                      {headerData.website && (
                        <>
                          <br />
                          <br />
                          Ou visite o <a href={headerData.website} target="_blank" rel="noopener noreferrer">site oficial do evento</a>.
                        </>
                      )}
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>

          {headerData.website && (
            <footer className={styles.footer}>
              <a href={headerData.website} target="_blank" rel="noopener noreferrer">
                Visite o site oficial do evento
              </a>
              <span className={styles.versionTag}>versão: {process.env.NEXT_PUBLIC_VNAME}</span>
            </footer>
          )}
        </PageContainer>
      )}
    </>
  );
}