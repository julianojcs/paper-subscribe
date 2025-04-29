'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaPlus, FaTimes, FaSave, FaArrowUp, FaArrowDown, FaSync } from 'react-icons/fa';
import { useDataContext } from '/context/DataContext';
import LoadingSpinner from '/app/components/ui/LoadingSpinner';
import PageContainer from '/app/components/layout/PageContainer';
import HeaderContentTitle from '/app/components/layout/HeaderContentTitle';
import styles from './timeline.module.css';

// Componente interno que usa os parâmetros e contexto
function TimelineContent({ eventId }) {
  const router = useRouter();

  // Usar o contexto compartilhado
  const {
    loading: contextLoading,
    setLoading: setContextLoading,
    eventData
  } = useDataContext();

  // Estado local
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movingItemId, setMovingItemId] = useState(null);
  const [localItems, setLocalItems] = useState([]);
  const [dataReady, setDataReady] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    date: '',
    description: '',
    type: 'CUSTOM',
    isPublic: true
  });

  // Controle para evitar loops de atualização
  const isUpdatingRef = useRef(false);

  // Helper para gerenciar o estado de loading
  const startLoading = useCallback(() => {
    setLoading(true);
    setContextLoading(true);
  }, [setContextLoading]);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setContextLoading(false);
  }, [setContextLoading]);

  // Função para buscar a timeline com controle local de erros
  const fetchTimeline = useCallback(async () => {
    if (isUpdatingRef.current) return;

    try {
      isUpdatingRef.current = true;
      startLoading();
      setDataReady(false);

      const res = await fetch(`/api/organization/events/${eventId}/timeline/admin`);
      const data = await res.json();

      if (res.ok) {
        const itemsWithOrder = data.timeline.map((item, index) => ({
          ...item,
          order: item.sortOrder || index,
          sortOrder: item.sortOrder || index
        }));

        setLocalItems(itemsWithOrder);

        // Pequeno timeout para garantir uma transição suave
        setTimeout(() => {
          setDataReady(true);
        }, 300);
      } else {
        setError(data.error || 'Erro ao carregar cronograma');
        setDataReady(true);
      }
    } catch (err) {
      console.error('Erro ao carregar timeline:', err);
      setError('Falha na comunicação com o servidor');
      setDataReady(true);
    } finally {
      stopLoading();
      isUpdatingRef.current = false;
    }
  }, [eventId, startLoading, stopLoading]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchTimeline();

    // Limpar os timeouts quando o componente for desmontado
    return () => {
      const allTimeouts = setTimeout(() => {}, 0);
      for (let i = 0; i < allTimeouts; i++) {
        clearTimeout(i);
      }
    };
  }, [fetchTimeline]);

  const handleAddItem = async () => {
    // Validação básica
    if (!newItem.name || !newItem.date) {
      setError('Nome e data são obrigatórios');
      return;
    }

    try {
      startLoading();
      const res = await fetch(`/api/organization/events/${eventId}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newItem,
          eventId,
          sortOrder: localItems.length + 1
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Adicionar a nova timeline com order
        const newTimelineItem = {
          ...data.timeline,
          order: data.timeline.sortOrder || localItems.length
        };

        // Atualizar apenas estado local
        setLocalItems(prev => [...prev, newTimelineItem]);

        // Limpar formulário
        setNewItem({
          name: '',
          date: '',
          description: '',
          type: 'CUSTOM',
          isPublic: true
        });

        setError(null); // Limpar erros se houver
      } else {
        setError(data.error || 'Erro ao adicionar item');
      }
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      setError('Falha na comunicação com o servidor');
    } finally {
      stopLoading();
    }
  };

  const handleUpdateItem = async (id, updates) => {
    try {
      startLoading();
      const res = await fetch(`/api/organization/events/${eventId}/timeline/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();

      if (res.ok) {
        // Atualizar apenas estado local
        setLocalItems(prev =>
          prev.map(item => item.id === id ? { ...item, ...updates } : item)
        );
        setError(null);
      } else {
        setError(data.error || 'Erro ao atualizar item');
      }
    } catch (err) {
      console.error('Erro ao atualizar item:', err);
      setError('Falha na comunicação com o servidor');
    } finally {
      stopLoading();
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este item do cronograma?')) {
      return;
    }

    try {
      startLoading();
      const res = await fetch(`/api/organization/events/${eventId}/timeline/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remover o item e reordenar os demais
        const filteredItems = localItems.filter(item => item.id !== id);
        const reorderedItems = filteredItems.map((item, index) => ({
          ...item,
          order: index
        }));

        setLocalItems(reorderedItems);
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao excluir item');
      }
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      setError('Falha na comunicação com o servidor');
    } finally {
      stopLoading();
    }
  };

  const handleMoveItem = async (id, direction) => {
    // Ordenar os itens primeiro para garantir que estamos trabalhando com a ordem visual correta
    const orderedItems = [...localItems].sort((a, b) =>
      (a.order || a.sortOrder || 0) - (b.order || b.sortOrder || 0)
    );

    // Encontrar o item atual na lista ordenada
    const currentItemIndex = orderedItems.findIndex(item => item.id === id);
    if (currentItemIndex === -1) return;

    // Verificar limites
    if (
      (direction === 'up' && currentItemIndex === 0) ||
      (direction === 'down' && currentItemIndex === orderedItems.length - 1)
    ) {
      return;
    }

    // Identificar o item com o qual trocar (baseado na ordem visual, não no array original)
    const currentItem = orderedItems[currentItemIndex];
    const swapIndex = direction === 'up' ? currentItemIndex - 1 : currentItemIndex + 1;
    const swapItem = orderedItems[swapIndex];

    // Definir o item em movimento para estilização
    setMovingItemId(id);

    try {
      startLoading();

      // Trocar os valores order/sortOrder entre os dois itens
      const tempOrder = currentItem.order || currentItem.sortOrder;
      const tempSortOrder = currentItem.sortOrder;

      // Criar um novo array atualizado com as trocas de ordem
      const updatedItems = localItems.map(item => {
        if (item.id === currentItem.id) {
          return {
            ...item,
            order: swapItem.order || swapItem.sortOrder,
            sortOrder: swapItem.sortOrder
          };
        } else if (item.id === swapItem.id) {
          return {
            ...item,
            order: tempOrder,
            sortOrder: tempSortOrder
          };
        }
        return item;
      });

      // Atualizar o estado local
      setLocalItems(updatedItems);

      // Chamar a API para atualizar o banco de dados
      const responses = await Promise.all([
        fetch(`/api/organization/events/${eventId}/timeline/${currentItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sortOrder: swapItem.sortOrder
          })
        }),
        fetch(`/api/organization/events/${eventId}/timeline/${swapItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sortOrder: tempSortOrder
          })
        })
      ]);

      // Verificar se as respostas da API foram bem-sucedidas
      const allResponsesOk = responses.every(res => res.ok);
      if (!allResponsesOk) {
        setError('Erro ao reordenar itens. As mudanças foram revertidas.');
        fetchTimeline(); // Recarregar do servidor para garantir consistência
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Erro ao reordenar:', err);
      setError('Falha ao reordenar itens');
      fetchTimeline(); // Recarregar em caso de erro
    } finally {
      stopLoading();

      // Remover o efeito de movimento após a conclusão
      setTimeout(() => setMovingItemId(null), 300);
    }
  };

  // Ordenar os itens consistentemente usando o mesmo campo usado na propriedade CSS order
  const sortedItems = [...localItems].sort((a, b) =>
    (a.order || a.sortOrder || 0) - (b.order || b.sortOrder || 0)
  );

  // Componente para o conteúdo principal quando estiver carregado
  const TimelineManager = () => (
    <>
      <HeaderContentTitle
        eventData={{logoUrl: eventLogoUrl.logoUrl, eventName: eventData.name}}
        subtitle="Gerenciar Cronograma do Evento"
        fallbackTitle="Gerenciar Cronograma do Evento"
      />

      <div className={styles.timelineAdminContainer}>
        <div className={styles.eventHeaderRow}>
          {eventData && (
            <h2 className={styles.eventName}>{eventData.name || eventData.shortName}</h2>
          )}
          <button
            className={styles.refreshButton}
            onClick={fetchTimeline}
            disabled={loading}
            title="Atualizar cronograma"
          >
            <FaSync className={loading ? styles.spinning : ''} />
            <span>Atualizar</span>
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => setError(null)} className={styles.dismissButton}>
              <FaTimes />
            </button>
          </div>
        )}

        <div className={styles.timelineList}>
          {sortedItems.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum item no cronograma ainda. Adicione o primeiro item abaixo.</p>
            </div>
          ) : (
            sortedItems.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.timelineItem} ${movingItemId === item.id ? styles.moving : ''}`}
                style={{ order: item.order }}
              >
                <div className={styles.itemHeader}>
                  <h3>{item.name}</h3>
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleMoveItem(item.id, 'up')}
                      disabled={index === 0 || loading}
                      className={styles.moveButton}
                      title="Mover para cima"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      onClick={() => handleMoveItem(item.id, 'down')}
                      disabled={index === sortedItems.length - 1 || loading}
                      className={styles.moveButton}
                      title="Mover para baixo"
                    >
                      <FaArrowDown />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={loading}
                      className={styles.deleteButton}
                      title="Excluir item"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <div className={styles.itemDetails}>
                  <div className={styles.itemDate}>
                    <strong>Data:</strong> {new Date(item.date).toLocaleDateString('pt-BR')}
                  </div>
                  {item.description && (
                    <div className={styles.itemDescription}>
                      <span>
                        <strong>Descrição:</strong>
                        <span>{item.description}</span>
                      </span>
                    </div>
                  )}
                  <div className={styles.itemType}>
                    <strong>Tipo:</strong> {item.type}
                  </div>
                  <div className={styles.itemStatus}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.isPublic}
                        onChange={(e) => handleUpdateItem(item.id, { isPublic: e.target.checked })}
                        disabled={loading}
                      />
                      Público
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={(e) => handleUpdateItem(item.id, { isCompleted: e.target.checked })}
                        disabled={loading}
                      />
                      Concluído
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.addNewItem}>
          <h2>Adicionar Novo Item</h2>
          <div className={styles.formGroup}>
            <label htmlFor="itemName">Nome</label>
            <input
              id="itemName"
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              placeholder="Ex: Prazo para Inscrição"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="itemDate">Data</label>
            <input
              id="itemDate"
              type="date"
              value={newItem.date}
              onChange={(e) => setNewItem({...newItem, date: e.target.value})}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="itemDescription">Descrição (opcional)</label>
            <textarea
              id="itemDescription"
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              placeholder="Uma descrição breve sobre este marco"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="itemType">Tipo</label>
            <select
              id="itemType"
              value={newItem.type}
              onChange={(e) => setNewItem({...newItem, type: e.target.value})}
              disabled={loading}
            >
              <option value="SUBMISSION_START">Início de Submissão</option>
              <option value="SUBMISSION_END">Fim de Submissão</option>
              <option value="REVIEW_START">Início de Revisão</option>
              <option value="REVIEW_END">Fim de Revisão</option>
              <option value="EVENT_START">Início do Evento</option>
              <option value="EVENT_END">Fim do Evento</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={newItem.isPublic}
                onChange={(e) => setNewItem({...newItem, isPublic: e.target.checked})}
                disabled={loading}
                id="itemPublic"
              />
              Público
            </label>
          </div>

          <button
            onClick={handleAddItem}
            className={styles.addButton}
            disabled={loading || !newItem.name || !newItem.date}
          >
            <FaPlus /> Adicionar Item
          </button>
        </div>
      </div>
    </>
  );

  // Estado de carregamento durante operações
  if (loading && localItems.length > 0) {
    return (
      <div className={styles.overlayLoading}>
        <LoadingSpinner message="Atualizando cronograma..." />
      </div>
    );
  }

  return (
    <>
      {(loading || !dataReady)
        ? <LoadingSpinner message="Carregando cronograma..." />
        : <PageContainer>
            <TimelineManager />
          </PageContainer>
      }
    </>
  );
}

// Componente principal que resolve os parâmetros
const TimelineAdmin = () => {
  const params = useParams();

  return (
    <Suspense fallback={<LoadingSpinner message="Carregando o Gerenciador de Cronograma..." />}>
      <TimelineContent eventId={params.id} />
    </Suspense>
  );
};

export default TimelineAdmin;