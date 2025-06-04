"use client"

import React, { useEffect, useState } from 'react';
import styles from './papersList.module.css';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, PageBreak } from 'docx';

// Placeholder para hooks reais de busca de dados
async function fetchAreas(eventId) {
  // Buscar áreas acadêmicas do evento
  const res = await fetch(`/api/organization/events/${eventId}`);
  const data = await res.json();
  return data.areas || [];
}

async function fetchPaperTypes(eventId) {
  // Buscar tipos de trabalho do evento
  const res = await fetch(`/api/organization/papers/${eventId}`);
  const data = await res.json();
  return data.paperTypes || [];
}

async function fetchPapers(eventId, areaId, paperTypeId) {
  // Buscar papers com status 'Pending' e filtros
  const params = new URLSearchParams({
    status: 'Pending',
    ...(areaId && { areaId }),
    ...(paperTypeId && { paperTypeId })
  });
  const res = await fetch(`/api/admin/papers`);
  const data = await res.json();
  return data.papers || [];
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
  const eventId = params?.eventId || '';
  const [areas, setAreas] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [papers, setPapers] = useState([]);
  const [areaId, setAreaId] = useState('');
  const [paperTypeId, setPaperTypeId] = useState('');
  const [exportAuthorsOnly, setExportAuthorsOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAreas(eventId).then(setAreas);
    fetchPaperTypes(eventId).then(setPaperTypes);
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    fetchPapers(eventId, areaId, paperTypeId).then(papers => {
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
    });
  }, [eventId, areaId, paperTypeId]);

  const handleExport = async () => {
    if (!papers.length) return;

    // Gera um array de sessões do Word, um para cada trabalho
    const sections = papers.map((paper, idx) => {
      const mainAuthor = getMainAuthor(paper.authors);
      const autores = paper.authors
        .sort((a, b) => a.authorOrder - b.authorOrder)
        .map((a, i) => `${i + 1}. ${a.name}${a.isMainAuthor ? ' (Autor Principal)' : ''}${a.isPresenter ? ' (Apresentador)' : ''}${a.institution ? ' - ' + a.institution : ''}`);
      const resumoField = paper.fieldValues?.find(f => f.field?.label?.toLowerCase().includes('resumo'));
      const resumo = resumoField ? resumoField.value : '';
      // Palavras-chave: agora usa keywordsList do backend
      const keywords = Array.isArray(paper.keywordsList) ? paper.keywordsList.filter(Boolean) : [];

      const children = [
        new Paragraph({ text: paper.title, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Área:', heading: HeadingLevel.HEADING_2 }),
        new Paragraph(paper.area?.name || '-'),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Tipo:', heading: HeadingLevel.HEADING_2 }),
        new Paragraph(paper.paperType?.name || '-'),
        new Paragraph({ text: '' }),
      ];

      if (!exportAuthorsOnly) {
        children.push(
          new Paragraph({ text: 'Autor Principal:', heading: HeadingLevel.HEADING_2 }),
          new Paragraph(mainAuthor ? mainAuthor.name : '-'),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Autores:', heading: HeadingLevel.HEADING_2 }),
          ...autores.map(a => new Paragraph(a)),
          new Paragraph({ text: '' })
        );
      }

      // Palavras-chave ANTES do resumo
      if (keywords.length > 0) {
        children.push(
          new Paragraph({ text: 'Palavras-chave:', heading: HeadingLevel.HEADING_2 }),
          ...keywords.map(k => new Paragraph({ children: [new TextRun({ text: `• ${k}` })] })),
          new Paragraph({ text: '' })
        );
      }

      children.push(
        new Paragraph({ text: 'Resumo:', heading: HeadingLevel.HEADING_2 }),
        new Paragraph(resumo || '-'),
        new Paragraph({ text: '' })
      );

      // Adiciona campos dinâmicos extras
      paper.fieldValues?.forEach(fv => {
        if (fv.field?.label && !fv.field.label.toLowerCase().includes('resumo') && !fv.field.label.toLowerCase().includes('palavra') && !fv.field.label.toLowerCase().includes('keyword')) {
          children.push(new Paragraph({ text: `${fv.field.label}:`, heading: HeadingLevel.HEADING_2 }));
          children.push(new Paragraph(fv.value || '-'));
          children.push(new Paragraph({ text: '' }));
        }
      });

      // Data de submissão sempre ao final
      children.push(
        new Paragraph({ text: `Data de Submissão: ${paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : '-'}` }),
        new Paragraph({ text: '' })
      );

      // Adiciona quebra de página exceto no último
      if (idx < papers.length - 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      return children;
    });

    // Cria o documento Word
    const doc = new Document({
      sections: sections.map(children => ({ properties: {}, children })),
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'trabalhos_submetidos.docx');
  };

  return (
    <div className={styles.container}>
      <h1>Trabalhos Submetidos</h1>
      <div className={styles.filters}>
        <select value={areaId} onChange={e => setAreaId(e.target.value)}>
          <option value="">Todas as Áreas</option>
          {areas.map(area => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </select>
        <select value={paperTypeId} onChange={e => setPaperTypeId(e.target.value)}>
          <option value="">Todos os Tipos</option>
          {paperTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>
      <div className={styles.actions}>
        <label htmlFor="check">
          <input
            id="check"
            type="checkbox"
            checked={exportAuthorsOnly}
            onChange={e => setExportAuthorsOnly(e.target.checked)}
          />
          Exportar sem os dados dos autores
        </label>
        <button onClick={handleExport} disabled={papers.length === 0}>
          Exportar para Word
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <th className={styles.th}>Área</th>
              <th className={styles.th}>Título</th>
              <th className={styles.th}>Tipo</th>
              <th className={styles.th}>Autor Principal</th>
              <th className={styles.th}>Autores</th>
              <th className={styles.th}>Data de Submissão</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Carregando...</td></tr>
            ) : papers.length === 0 ? (
              <tr><td colSpan={6}>Nenhum trabalho encontrado.</td></tr>
            ) : (
              papers.map(paper => {
                const mainAuthor = getMainAuthor(paper.authors);
                return (
                  <tr className={styles.tr} key={paper.id}>
                    <td className={styles.td}>{paper.title}</td>
                    <td className={styles.td}>{paper.area?.name || '-'}</td>
                    <td className={styles.td}>{paper.paperType?.name || '-'}</td>
                    <td className={styles.td}>{mainAuthor ? mainAuthor.name : '-'}</td>
                    <td className={styles.td}>{paper.authors?.length || 0}</td>
                    <td className={styles.td}>{paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
