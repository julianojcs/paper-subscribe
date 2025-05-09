'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './HeaderContentTitle.module.css';

/**
 * Componente de cabeçalho reutilizável para exibir logo e título do evento
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.eventData - Dados do evento (nome, logoUrl)
 * @param {Function} props.onImageLoad - Callback opcional quando a imagem é carregada
 * @param {String} props.subtitle - Texto do subtítulo (opcional)
 * @param {String} props.fallbackTitle - Título alternativo quando não há logo
 * @param {String} props.className - Classe CSS adicional para o header (opcional)
 */
const HeaderContentTitle = ({
  eventData,
  onImageLoad,
  subtitle = "Sistema de Submissão de Trabalhos",
  fallbackTitle = "Sistema de Submissão de Trabalhos Científicos",
  className = "",
  background = "linear-gradient(135deg,#3b82f6,rgb(17,76,204))",
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { eventName, eventLogoUrl } = eventData || {};
  const handleImageLoad = () => {
    setImageLoaded(true);
    if (onImageLoad) onImageLoad();
  };
  return (
    <header className={`${styles.header} ${className}`} style={{ background }}>
      <div className={styles.headerContent}>
        {(eventLogoUrl && eventName) ? (
          <div className={styles.logoWrapper}>
            <Image
              src={eventLogoUrl}
              alt={eventName || "Logo do evento"}
              className={styles.eventLogo}
              width={300}
              height={92}
              priority
              quality={90}
              onLoad={handleImageLoad}
            />
            <div className={styles.subtitle}>
              {subtitle}
            </div>
          </div>
        ) : (
          <h1 className={styles.titleFallback}>
            {fallbackTitle}
          </h1>
        )}
      </div>
    </header>
  );
};

export default HeaderContentTitle;