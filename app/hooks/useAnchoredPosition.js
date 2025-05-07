'use client';

import { useEffect, useRef, useState } from 'react';

export default function useAnchoredPosition(
  menuRef,
  anchorRef,
  isOpen,
  options = {}
) {
  const {
    position = 'bottom-start',
    offset = 8,
    flip = true,
    shift = true,
    fallbackPlacements = ['top-start', 'bottom-end', 'top-end']
  } = options;

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [supportsAnchor, setSupportsAnchor] = useState(false);

  // Verificar se o navegador suporta posicionamento de âncora
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (CSS && CSS.supports) {
        setSupportsAnchor(CSS.supports('anchor-name: --anchor'));
      } else {
        setSupportsAnchor(false);
      }
    }
  }, []);

  // Posicionar o menu quando aberto
  useEffect(() => {
    if (!isOpen || !menuRef.current || !anchorRef.current || supportsAnchor) return;

    const calculatePosition = () => {
      const menuElement = menuRef.current;
      const anchorElement = anchorRef.current;

      const anchorRect = anchorElement.getBoundingClientRect();
      const menuRect = menuElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Valores iniciais para diferentes posições
      let top, left;

      // Determine posição base
      const [side, align] = position.split('-');

      if (side === 'bottom') {
        top = anchorRect.bottom + offset + window.scrollY;
      } else if (side === 'top') {
        top = anchorRect.top - menuRect.height - offset + window.scrollY;
      } else if (side === 'left') {
        left = anchorRect.left - menuRect.width - offset + window.scrollX;
      } else if (side === 'right') {
        left = anchorRect.right + offset + window.scrollX;
      }

      // Determine alinhamento
      if (side === 'bottom' || side === 'top') {
        if (align === 'start') {
          left = anchorRect.left + window.scrollX;
        } else if (align === 'end') {
          left = anchorRect.right - menuRect.width + window.scrollX;
        } else {
          // Centralizado
          left = anchorRect.left + (anchorRect.width / 2) - (menuRect.width / 2) + window.scrollX;
        }
      } else if (side === 'left' || side === 'right') {
        if (align === 'start') {
          top = anchorRect.top + window.scrollY;
        } else if (align === 'end') {
          top = anchorRect.bottom - menuRect.height + window.scrollY;
        } else {
          // Centralizado
          top = anchorRect.top + (anchorRect.height / 2) - (menuRect.height / 2) + window.scrollY;
        }
      }

      // Flip se necessário
      if (flip) {
        // Se estiver fora da viewport no eixo Y
        if (side === 'bottom' && top + menuRect.height > viewportHeight + window.scrollY) {
          // Flip para top
          top = anchorRect.top - menuRect.height - offset + window.scrollY;
        } else if (side === 'top' && top < window.scrollY) {
          // Flip para bottom
          top = anchorRect.bottom + offset + window.scrollY;
        }

        // Se estiver fora da viewport no eixo X
        if (side === 'right' && left + menuRect.width > viewportWidth + window.scrollX) {
          // Flip para left
          left = anchorRect.left - menuRect.width - offset + window.scrollX;
        } else if (side === 'left' && left < window.scrollX) {
          // Flip para right
          left = anchorRect.right + offset + window.scrollX;
        }
      }

      // Shift se necessário
      if (shift) {
        // Evitar que o menu ultrapasse os limites horizontais da viewport
        if (left < window.scrollX) {
          left = window.scrollX + 8; // 8px de margem de segurança
        } else if (left + menuRect.width > viewportWidth + window.scrollX) {
          left = viewportWidth - menuRect.width + window.scrollX - 8;
        }

        // Evitar que o menu ultrapasse os limites verticais da viewport
        if (top < window.scrollY) {
          top = window.scrollY + 8;
        } else if (top + menuRect.height > viewportHeight + window.scrollY) {
          top = viewportHeight - menuRect.height + window.scrollY - 8;
        }
      }

      setMenuPosition({ top, left });
    };

    // Calcular a posição inicial
    calculatePosition();

    // Recalcular em caso de redimensionamento ou rolagem
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [isOpen, offset, position, flip, shift, supportsAnchor, anchorRef, menuRef]);

  return { menuPosition, supportsAnchor };
}