"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './papersList.module.css';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, PageBreak, Header, Footer, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';
import Multselector from '../../../components/ui/Multselector';
import { statuses } from '../../../utils/statuses';

const eventId = 'cac5c8cd5447baace99183d47';

// Placeholder para hooks reais de busca de dados
async function fetchAreas(eventId) {
  try {
    // Buscar áreas acadêmicas do evento
    const res = await fetch(`/api/organization/events/${eventId}/areas`);
    if (!res.ok) {
      console.error('Error fetching areas:', await res.text());
      return [];
    }
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching areas:', error);
    return [];
  }
}

async function fetchPaperTypes(eventId) {
  try {
    // Buscar tipos de trabalho do evento
    const res = await fetch(`/api/organization/events/${eventId}/paper-types`);
    if (!res.ok) {
      console.error('Error fetching paper types:', await res.text());
      return [];
    }
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching paper types:', error);
    return [];
  }
}

async function fetchPapers(eventId, selectedAreas, selectedTypes, selectedStatuses) {
  try {
    // Buscar papers com filtros
    const params = new URLSearchParams();

    // Sempre incluir o eventId se disponível
    if (eventId) {
      params.append('eventId', eventId);
    }

    // Adicionar áreas selecionadas
    if (selectedAreas && selectedAreas.length > 0) {
      selectedAreas.forEach(area => {
        params.append('areaId', area.value);
      });
    }

    // Adicionar tipos selecionados
    if (selectedTypes && selectedTypes.length > 0) {
      selectedTypes.forEach(type => {
        params.append('paperTypeId', type.value);
      });
    }

    // Adicionar status selecionados (sem padrão - todos os status se nada selecionado)
    if (selectedStatuses && selectedStatuses.length > 0) {
      selectedStatuses.forEach(status => {
        params.append('status', status.value);
      });
    }
    // Se nenhum status selecionado, não enviamos parâmetro para trazer todos

    const res = await fetch(`/api/admin/papers?${params.toString()}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error fetching papers:', errorText);
      return [];
    }
    const data = await res.json();
    return data.papers || [];
  } catch (error) {
    console.error('Error fetching papers:', error);
    return [];
  }
}

function getMainAuthor(authors) {
  // Retorna o autor principal (isMainAuthor ou primeiro authorOrder)
  if (!authors || !authors.length) return null;
  return (
    authors.find(a => a.isMainAuthor) ||
    authors.sort((a, b) => a.authorOrder - b.authorOrder)[0]
  );
}

export default function PapersListPage({ params }) {
  const router = useRouter();
  const [areas, setAreas] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [papers, setPapers] = useState([]);

  // Estados para os filtros usando Multselector
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]); // Iniciar sem filtro de status
  const [titleFilter, setTitleFilter] = useState(''); // Filtro por título

  // Estados para seleção e alteração de status
  const [selectedPapers, setSelectedPapers] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Estados para exportação
  const [exportAuthorsOnly, setExportAuthorsOnly] = useState(false);
  const [includePaperId, setIncludePaperId] = useState(false);

  // Estados para alteração de status em lote
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [statusDate, setStatusDate] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Estados para ordenação - ordenação padrão por autor principal
  const [sortConfig, setSortConfig] = useState({ key: 'mainAuthor', direction: 'asc' });

  // Função utilitária para determinar classe de opacidade das setas de ordenação
  const getSortArrowClass = (key, direction) => {
    return sortConfig.key === key && sortConfig.direction === direction
      ? styles.sortArrowActive
      : styles.sortArrowInactive;
  };

  // Função para gerar nome do arquivo baseado nos filtros
  const generateFileName = (extension) => {
    const parts = [];
    
    // Adicionar status selecionados
    if (selectedStatuses.length > 0) {
      const statusNames = selectedStatuses.map(status => 
        statuses.find(s => s.status === status.value)?.statusPtBR || status.value
      ).join('_');
      parts.push(`status_${statusNames.toLowerCase().replace(/\s+/g, '_')}`);
    }
    
    // Adicionar áreas selecionadas
    if (selectedAreas.length > 0) {
      const areaNames = selectedAreas.map(area => area.label).join('_');
      parts.push(`area_${areaNames.toLowerCase().replace(/\s+/g, '_')}`);
    }
    
    // Adicionar tipos selecionados
    if (selectedTypes.length > 0) {
      const typeNames = selectedTypes.map(type => type.label).join('_');
      parts.push(`tipo_${typeNames.toLowerCase().replace(/\s+/g, '_')}`);
    }
    
    // Adicionar filtro de título se existir
    if (titleFilter) {
      parts.push(`titulo_${titleFilter.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`);
    }
    
    // Nome base
    let baseName = 'trabalhos';
    if (parts.length > 0) {
      baseName += '_' + parts.join('_');
    } else {
      baseName += '_todos';
    }
    
    // Adicionar contagem se há seleção específica
    if (selectedPapers.size > 0) {
      baseName += `_selecionados_${selectedPapers.size}`;
    }
    
    return `${baseName}.${extension}`;
  };

  // Função para navegar para visualizar paper específico
  const handleViewPaper = (paperId) => {
    router.push(`/admin/papers/${paperId}`);
  };

  // Função para navegar para papers do autor principal
  const handleViewAuthorPapers = (authorId) => {
    router.push(`/admin/organization/users/${authorId}/papers`);
  };

  // Preparar opções para os seletores
  const areaOptions = areas.map(area => ({
    value: area.id,
    label: area.name,
    isFixed: false
  }));

  const typeOptions = paperTypes.map(type => ({
    value: type.id,
    label: type.name,
    isFixed: false
  }));

  const statusOptions = statuses.map(status => ({
    value: status.status,
    label: status.statusPtBR,
    isFixed: false
  }));

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSelectedAreas([]);
    setSelectedTypes([]);
    setSelectedStatuses([]); // Limpar também inicia sem status
    setTitleFilter(''); // Limpar filtro de título
  };

  // Função para ordenação da tabela
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedPapers = [...papers].sort((a, b) => {
      let aValue, bValue;

      switch (key) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'area':
          aValue = a.area?.name?.toLowerCase() || '';
          bValue = b.area?.name?.toLowerCase() || '';
          break;
        case 'type':
          aValue = a.paperType?.name?.toLowerCase() || '';
          bValue = b.paperType?.name?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        case 'mainAuthor':
          const mainAuthorA = getMainAuthor(a.authors);
          const mainAuthorB = getMainAuthor(b.authors);
          aValue = mainAuthorA?.name?.toLowerCase() || '';
          bValue = mainAuthorB?.name?.toLowerCase() || '';
          break;
        case 'authorCount':
          aValue = a.authors?.length || 0;
          bValue = b.authors?.length || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setPapers(sortedPapers);
  };

  // Função para selecionar/deselecionar todos os papers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPapers(new Set(papers.map(paper => paper.id)));
    } else {
      setSelectedPapers(new Set());
    }
  };

  // Função para selecionar/deselecionar um paper individual
  const handleSelectPaper = (paperId, checked) => {
    const newSelected = new Set(selectedPapers);
    if (checked) {
      newSelected.add(paperId);
    } else {
      newSelected.delete(paperId);
    }
    setSelectedPapers(newSelected);
  };

  // Função para abrir modal de alteração de status
  const handleOpenStatusModal = () => {
    if (selectedPapers.size === 0) {
      alert('Selecione pelo menos um trabalho para alterar o status.');
      return;
    }
    setSelectedStatus('');
    setStatusComment('');
    setStatusDate(new Date().toISOString().slice(0, 16)); // Data/hora atual
    setShowStatusModal(true);
  };

  // Função para alterar status em lote
  const handleBulkStatusChange = async () => {
    if (!selectedStatus) {
      alert('Selecione um status.');
      return;
    }

    if (!statusDate) {
      alert('Selecione uma data/hora.');
      return;
    }

    try {
      setUpdatingStatus(true);

      const response = await fetch('/api/admin/papers/bulk-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperIds: Array.from(selectedPapers),
          newStatus: selectedStatus,
          comment: statusComment,
          historyDate: statusDate
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar status');
      }

      const result = await response.json();

      // Atualizar a lista de papers local
      setPapers(prevPapers =>
        prevPapers.map(paper =>
          selectedPapers.has(paper.id)
            ? { ...paper, status: selectedStatus }
            : paper
        )
      );

      // Limpar seleção
      setSelectedPapers(new Set());
      setShowStatusModal(false);

      alert(`Status de ${result.updatedCount} trabalho(s) atualizado com sucesso!`);

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert(`Erro ao atualizar status: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    // Buscar áreas e tipos de papel com tratamento de erro individual
    fetchAreas(eventId)
      .then(setAreas)
      .catch(error => {
        console.error('Failed to fetch areas:', error);
        setAreas([]);
      });

    fetchPaperTypes(eventId)
      .then(setPaperTypes)
      .catch(error => {
        console.error('Failed to fetch paper types:', error);
        setPaperTypes([]);
      });
  }, []);  useEffect(() => {
    setLoading(true);

    fetchPapers(eventId, selectedAreas, selectedTypes, selectedStatuses)
      .then(papers => {
        // Ordena por autor principal (userId diferente de null)
        papers.sort((a, b) => {
          const maA = getMainAuthor(a.authors);
          const maB = getMainAuthor(b.authors);
          if (!maA && !maB) return 0;
          if (!maA) return 1;
          if (!maB) return -1;
          return maA.name.localeCompare(maB.name);
        });
        setPapers(papers);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch papers:', error);
        setPapers([]);
        setLoading(false);
      });
  }, [selectedAreas, selectedTypes, selectedStatuses]);

  const handleExport = async () => {
    // Determinar quais papers exportar
    const papersToExport = selectedPapers.size > 0
      ? papers.filter(paper => selectedPapers.has(paper.id))
      : papers;

    if (!papersToExport.length) return;

    // Gera um array de sessões do Word, um para cada trabalho
    const sections = papersToExport.map((paper, idx) => {
      const mainAuthor = getMainAuthor(paper.authors);
      const autores = paper.authors
        .sort((a, b) => a.authorOrder - b.authorOrder)
        .map((a, i) => `${i + 1}. ${a.name}${a.isMainAuthor ? ' (Autor Principal)' : ''}${a.isPresenter ? ' (Apresentador)' : ''}${a.institution ? ' - ' + a.institution : ''}`);
      const resumoField = paper.fieldValues?.find(f => f.field?.label?.toLowerCase().includes('resumo'));
      const resumo = resumoField ? resumoField.value : '';
      // Palavras-chave: agora usa keywordsList do backend
      const keywords = Array.isArray(paper.keywordsList) ? paper.keywordsList.filter(Boolean) : [];
      // Status do paper
      const statusInfo = statuses.find(s => s.status === paper.status);
      const statusText = statusInfo?.statusPtBR || paper.status;

      const children = [
        // Título do trabalho
        new Paragraph({
          text: paper.title.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }),

        // Status na mesma linha
        new Paragraph({
          children: [
            new TextRun({ text: 'Status: ', bold: true }),
            new TextRun({ text: statusText })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),

        // Área na mesma linha
        new Paragraph({
          children: [
            new TextRun({ text: 'Área: ', bold: true }),
            new TextRun({ text: paper.area?.name || '-' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),

        // Tipo na mesma linha
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo: ', bold: true }),
            new TextRun({ text: paper.paperType?.name || '-' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),

        // Autor Principal na mesma linha
        new Paragraph({
          children: [
            new TextRun({ text: 'Autor Principal: ', bold: true }),
            new TextRun({ text: mainAuthor ? mainAuthor.name : '-' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),

        new Paragraph({ text: '' })
      ];

      if (!exportAuthorsOnly) {
        children.push(
          new Paragraph({ text: 'Autores:', heading: HeadingLevel.HEADING_2 }),
          ...autores.map(a => new Paragraph({
            text: a,
            alignment: AlignmentType.JUSTIFIED
          })),
          new Paragraph({ text: '' })
        );
      }

      // Palavras-chave ANTES do resumo
      if (keywords.length > 0) {
        children.push(
          new Paragraph({ text: 'Palavras-chave:', heading: HeadingLevel.HEADING_2 }),
          ...keywords.map(k => new Paragraph({
            children: [new TextRun({ text: `• ${k}` })],
            alignment: AlignmentType.JUSTIFIED
          })),
          new Paragraph({ text: '' })
        );
      }

      children.push(
        new Paragraph({ text: 'Resumo:', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({
          text: resumo || '-',
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' })
      );

      // Adiciona campos dinâmicos extras
      paper.fieldValues?.forEach(fv => {
        if (fv.field?.label && !fv.field.label.toLowerCase().includes('resumo') && !fv.field.label.toLowerCase().includes('palavra') && !fv.field.label.toLowerCase().includes('keyword')) {
          children.push(new Paragraph({ text: `${fv.field.label}:`, heading: HeadingLevel.HEADING_2 }));
          children.push(new Paragraph({
            text: fv.value || '-',
            alignment: AlignmentType.JUSTIFIED
          }));
          children.push(new Paragraph({ text: '' }));
        }
      });

      // Data de submissão sempre ao final
      children.push(
        new Paragraph({
          text: `Data de Submissão: ${paper.history.createdAt ? new Date(paper.history.createdAt).toLocaleDateString() : ' Não Submetido'}`,
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' })
      );

      // Adiciona quebra de página exceto no último
      if (idx < papersToExport.length - 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }

      // Criar rodapé com ID (se incluído)
      const footers = includePaperId ? {
        default: new Footer({
          children: [
            new Paragraph({
              children: [new TextRun({ text: paper.id.toUpperCase() })],
              alignment: AlignmentType.RIGHT
            })
          ]
        })
      } : {};

      return { children, footers };
    });

    // Cria o documento Word
    const doc = new Document({
      sections: sections.map(({ children, footers }) => ({
        properties: {},
        children,
        footers: footers || {}
      })),
    });

    const blob = await Packer.toBlob(doc);
    const filename = generateFileName('docx');
    saveAs(blob, filename);
  };

  const handleExportExcel = () => {
    // Determinar quais papers exportar
    const papersToExport = selectedPapers.size > 0
      ? filteredPapers.filter(paper => selectedPapers.has(paper.id))
      : filteredPapers;

    if (!papersToExport.length) {
      alert('Nenhum trabalho disponível para exportação.');
      return;
    }

    // Preparar dados para planilha (incluindo ID do trabalho na primeira coluna)
    const excelData = papersToExport.map(paper => {
      const mainAuthor = getMainAuthor(paper.authors);
      const statusInfo = statuses.find(s => s.status === paper.status);

      return {
        'ID': paper.id || '',
        'Título': paper.title || '',
        'Área': paper.area?.name || '-',
        'Tipo': paper.paperType?.name || '-',
        'Status': statusInfo?.statusPtBR || paper.status || '',
        'Autor Principal': mainAuthor ? mainAuthor.name : '-',
        'Email do Autor Principal': mainAuthor ? mainAuthor.email : '-',
        'Qtd. Autores': paper.authors?.length || 0,
        'Data de Submissão': paper.createdAt ? new Date(paper.createdAt).toLocaleDateString('pt-BR') : '-'
      };
    });

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Configurar larguras das colunas
    const columnWidths = [
      { wch: 30 }, // ID
      { wch: 50 }, // Título
      { wch: 20 }, // Área
      { wch: 20 }, // Tipo
      { wch: 15 }, // Status
      { wch: 25 }, // Autor Principal
      { wch: 30 }, // Email do Autor Principal
      { wch: 12 }, // Qtd. Autores
      { wch: 18 }  // Data de Submissão
    ];
    worksheet['!cols'] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trabalhos');

    // Gerar nome do arquivo
    const filename = generateFileName('xlsx');

    // Exportar arquivo
    XLSX.writeFile(workbook, filename);
  };

  // Calcular papers filtrados por título
  const filteredPapers = papers.filter(paper =>
    !titleFilter ||
    paper.title.toLowerCase().includes(titleFilter.toLowerCase())
  );  return (
    <div className={styles.container}>
      <h1>Trabalhos Submetidos</h1>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Áreas:</label>
          <Multselector
            options={areaOptions}
            value={selectedAreas}
            onChange={setSelectedAreas}
            placeholder="Todas as áreas"
            instanceId="areas-filter"
            closeMenuOnSelect={true}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Tipos de Trabalho:</label>
          <Multselector
            options={typeOptions}
            value={selectedTypes}
            onChange={setSelectedTypes}
            placeholder="Todos os tipos"
            instanceId="types-filter"
            closeMenuOnSelect={true}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Status:</label>
          <Multselector
            options={statusOptions}
            value={selectedStatuses}
            onChange={setSelectedStatuses}
            placeholder="Todos os status"
            instanceId="status-filter"
            closeMenuOnSelect={true}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Título:</label>
          <input
            type="text"
            value={titleFilter}
            onChange={e => setTitleFilter(e.target.value)}
            placeholder="Filtrar por título"
            className={styles.titleFilterInput}
          />
        </div>

        <div className={styles.filterActions}>
          <button
            onClick={clearAllFilters}
            className={styles.clearButton}
            type="button"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className={styles.resultsInfo}>
        <p>
          {loading ? 'Carregando...' : `${filteredPapers.length} trabalho${filteredPapers.length === 1 ? '' : 's'} encontrado${filteredPapers.length === 1 ? '' : 's'}`}
        </p>
      </div>
      <div className={styles.exportSection}>
        <h3 className={styles.exportTitle}>Exportação</h3>
        <div className={styles.exportOptions}>
          <div className={styles.exportCheckboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={exportAuthorsOnly}
                onChange={e => setExportAuthorsOnly(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Exportar sem dados dos autores</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={includePaperId}
                onChange={e => setIncludePaperId(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Incluir ID do paper</span>
            </label>
          </div>

          <div className={styles.exportInfo}>
            {selectedPapers.size > 0 ? (
              <span className={styles.selectionInfo}>
                {selectedPapers.size} trabalho{selectedPapers.size === 1 ? '' : 's'} selecionado{selectedPapers.size === 1 ? '' : 's'}
              </span>
            ) : (
              <span className={styles.selectionInfo}>
                Todos os {papers.length} trabalho{papers.length === 1 ? '' : 's'} ser{papers.length === 1 ? 'á' : 'ão'} exportado{papers.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className={styles.exportButtons}>
            <button
              onClick={handleExport}
              disabled={papers.length === 0}
              className={styles.exportButtonWord}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                <path d="M18.536,2.323V4.868c3.4.019,7.12-.035,10.521.019a.783.783,0,0,1,.912.861c.054,6.266-.013,12.89.032,19.157-.02.4.009,1.118-.053,1.517-.079.509-.306.607-.817.676-.286.039-.764.034-1.045.047-2.792-.014-5.582-.011-8.374-.01l-1.175,0v2.547L2,27.133Q2,16,2,4.873L18.536,2.322" fill="#283c82"/>
                <path d="M18.536,5.822h10.5V26.18h-10.5V23.635h8.27V22.363h-8.27v-1.59h8.27V19.5h-8.27v-1.59h8.27V16.637h-8.27v-1.59h8.27V13.774h-8.27v-1.59h8.27V10.911h-8.27V9.321h8.27V8.048h-8.27V5.822" fill="#fff"/>
                <path d="M8.573,11.443c.6-.035,1.209-.06,1.813-.092.423,2.147.856,4.291,1.314,6.429.359-2.208.757-4.409,1.142-6.613.636-.022,1.272-.057,1.905-.1-.719,3.082-1.349,6.19-2.134,9.254-.531.277-1.326-.013-1.956.032-.423-2.106-.916-4.2-1.295-6.314C8.99,16.1,8.506,18.133,8.08,20.175q-.916-.048-1.839-.111c-.528-2.8-1.148-5.579-1.641-8.385.544-.025,1.091-.048,1.635-.067.328,2.026.7,4.043.986,6.072.448-2.08.907-4.161,1.352-6.241" fill="#fff"/>
              </svg>
              <span className={styles.exportButtonText}>Word</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={papers.length === 0}
              className={styles.exportButtonExcel}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="currentColor" d="M2.859 2.877l12.57-1.795a.5.5 0 0 1 .571.495v20.846a.5.5 0 0 1-.57.495L2.858 21.123a1 1 0 0 1-.859-.99V3.867a1 1 0 0 1 .859-.99zM17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4V3zm-6.8 9L13 8h-2.4L9 10.286 7.4 8H5l2.8 4L5 16h2.4L9 13.714 10.6 16H13l-2.8-4z"/>
              </svg>
              <span className={styles.exportButtonText}>Excel</span>
            </button>
          </div>

          {selectedPapers.size > 0 && (
            <button
              onClick={handleOpenStatusModal}
              className={styles.statusButton}
            >
              Alterar Status ({selectedPapers.size})
            </button>
          )}
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <th className={styles.th}>
                <input
                  type="checkbox"
                  checked={papers.length > 0 && selectedPapers.size === papers.length}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className={styles.selectAllCheckbox}
                />
              </th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort('title')}
                >
                  Título
                  <span className={`${styles.sortIcon} ${sortConfig.key === 'title' ? styles.sortIconActive : styles.sortIconInactive}`}>
                    <span className={getSortArrowClass('title', 'asc')}>▲</span>
                    <span className={getSortArrowClass('title', 'desc')}>▼</span>
                  </span>
                </button>
              </th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort('area')}
                >
                  Área
                  <span className={`${styles.sortIcon} ${sortConfig.key === 'area' ? styles.sortIconActive : styles.sortIconInactive}`}>
                    <span className={getSortArrowClass('area', 'asc')}>▲</span>
                    <span className={getSortArrowClass('area', 'desc')}>▼</span>
                  </span>
                </button>
              </th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort('type')}
                >
                  Tipo
                  <span className={`${styles.sortIcon} ${sortConfig.key === 'type' ? styles.sortIconActive : styles.sortIconInactive}`}>
                    <span className={getSortArrowClass('type', 'asc')}>▲</span>
                    <span className={getSortArrowClass('type', 'desc')}>▼</span>
                  </span>
                </button>
              </th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort('status')}
                >
                  Status
                  <span className={`${styles.sortIcon} ${sortConfig.key === 'status' ? styles.sortIconActive : styles.sortIconInactive}`}>
                    <span className={getSortArrowClass('status', 'asc')}>▲</span>
                    <span className={getSortArrowClass('status', 'desc')}>▼</span>
                  </span>
                </button>
              </th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort('mainAuthor')}
                >
                  Autor Principal
                  <span className={`${styles.sortIcon} ${sortConfig.key === 'mainAuthor' ? styles.sortIconActive : styles.sortIconInactive}`}>
                    <span className={getSortArrowClass('mainAuthor', 'asc')}>▲</span>
                    <span className={getSortArrowClass('mainAuthor', 'desc')}>▼</span>
                  </span>
                </button>
              </th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort('authorCount')}
                >
                  Autores
                  <span className={`${styles.sortIcon} ${sortConfig.key === 'authorCount' ? styles.sortIconActive : styles.sortIconInactive}`}>
                    <span className={getSortArrowClass('authorCount', 'asc')}>▲</span>
                    <span className={getSortArrowClass('authorCount', 'desc')}>▼</span>
                  </span>
                </button>
              </th>
              <th className={styles.th}>
                <button
                  className={styles.sortButton}
                  onClick={() => handleSort('createdAt')}
                >
                  Data de Submissão
                  <span className={`${styles.sortIcon} ${sortConfig.key === 'createdAt' ? styles.sortIconActive : styles.sortIconInactive}`}>
                    <span className={getSortArrowClass('createdAt', 'asc')}>▲</span>
                    <span className={getSortArrowClass('createdAt', 'desc')}>▼</span>
                  </span>
                </button>
              </th>
              <th className={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}>Carregando...</td></tr>
            ) : filteredPapers.length === 0 ? (
              <tr><td colSpan={9}>Nenhum trabalho encontrado.</td></tr>
            ) : (
              filteredPapers.map(paper => {
                const mainAuthor = getMainAuthor(paper.authors);
                const statusInfo = statuses.find(s => s.status === paper.status);
                return (
                  <tr className={styles.tr} key={paper.id}>
                    <td className={styles.td}>
                      <input
                        type="checkbox"
                        checked={selectedPapers.has(paper.id)}
                        onChange={e => handleSelectPaper(paper.id, e.target.checked)}
                        className={styles.rowCheckbox}
                      />
                    </td>
                    <td className={styles.td}>{paper.title}</td>
                    <td className={styles.td}>{paper.area?.name || '-'}</td>
                    <td className={styles.td}>{paper.paperType?.name || '-'}</td>
                    <td className={styles.td}>
                      <span className={`${styles.statusBadge} ${styles[`status${paper.status}`]}`}>
                        {statusInfo?.statusPtBR || paper.status}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {mainAuthor ? mainAuthor.name : '-'}
                    </td>
                    <td className={styles.td}>{paper.authors?.length || 0}</td>
                    <td className={styles.td}>{paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : '-'}</td>
                    <td className={styles.td}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleViewPaper(paper.id)}
                          className={styles.actionButton}
                          title="Ver detalhes do trabalho"
                        >
                          📄
                        </button>
                        {mainAuthor && mainAuthor.userId && (
                          <button
                            onClick={() => handleViewAuthorPapers(mainAuthor.userId)}
                            className={styles.actionButton}
                            title="Ver trabalhos do autor principal"
                          >
                            👤
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de alteração de status */}
      {showStatusModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Alterar Status dos Trabalhos</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p>
                Alterando status de <strong>{selectedPapers.size}</strong> trabalho{selectedPapers.size > 1 ? 's' : ''}:
              </p>

              <div className={styles.modalField}>
                <label htmlFor="newStatus">Novo Status:</label>
                <select
                  id="newStatus"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={styles.modalSelect}
                >
                  <option value="">Selecione um status</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalField}>
                <label htmlFor="statusDate">Data/Hora do Registro:</label>
                <input
                  type="datetime-local"
                  id="statusDate"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalField}>
                <label htmlFor="statusComment">Comentário (opcional):</label>
                <textarea
                  id="statusComment"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Comentário sobre a alteração de status..."
                  className={styles.modalTextarea}
                  rows="3"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowStatusModal(false)}
                className={styles.modalCancelButton}
                disabled={updatingStatus}
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkStatusChange}
                className={styles.modalConfirmButton}
                disabled={updatingStatus || !selectedStatus || !statusDate}
              >
                {updatingStatus ? 'Atualizando...' : 'Alterar Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
