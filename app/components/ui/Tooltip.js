'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  arrow = true,
  multLine = false,
  className = '',
  style = {}
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [tooltipElement, setTooltipElement] = useState(null);
  
  const targetRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Set up portal once the component mounts on client side
  useEffect(() => {
    setMounted(true);
    setTooltipElement(document.getElementById('tooltip-root') || createTooltipRoot());
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Create tooltip root if it doesn't exist
  const createTooltipRoot = () => {
    const tooltipRoot = document.createElement('div');
    tooltipRoot.id = 'tooltip-root';
    document.body.appendChild(tooltipRoot);
    return tooltipRoot;
  };

  // Calculate position whenever tooltip visibility changes
  useEffect(() => {
    if (isVisible && targetRef.current && tooltipRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Calculate tooltip position based on the 'position' prop
      const newPosition = calculatePosition(
        targetRect,
        tooltipRect,
        position,
      );
      
      setTooltipPosition(newPosition.tooltip);
      setArrowPosition(newPosition.arrow);
    }
  }, [isVisible, position]);

  // Calculate tooltip position
  const calculatePosition = (targetRect, tooltipRect, pos) => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    
    const spacing = 8; // Space between target and tooltip
    
    let tooltipPos = { top: 0, left: 0 };
    let arrowPos = { top: '100%', left: '50%' };
    
    // Initial position calculation based on desired position
    switch (pos) {
      case 'top':
        tooltipPos = {
          top: targetRect.top + scrollY - tooltipRect.height - spacing,
          left: targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2)
        };
        arrowPos = { top: '100%', left: '50%' };
        break;
      case 'bottom':
        tooltipPos = {
          top: targetRect.bottom + scrollY + spacing,
          left: targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2)
        };
        arrowPos = { top: '0%', left: '50%' };
        break;
      case 'left':
        tooltipPos = {
          top: targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2),
          left: targetRect.left + scrollX - tooltipRect.width - spacing
        };
        arrowPos = { top: '50%', left: '100%' };
        break;
      case 'right':
        tooltipPos = {
          top: targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2),
          left: targetRect.right + scrollX + spacing
        };
        arrowPos = { top: '50%', left: '0%' };
        break;
    }
    
    // Adjust if tooltip would go off screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check right edge
    if (tooltipPos.left + tooltipRect.width > viewportWidth) {
      tooltipPos.left = viewportWidth - tooltipRect.width - spacing;
      if (pos === 'top' || pos === 'bottom') {
        arrowPos.left = ((targetRect.left + targetRect.width / 2) - tooltipPos.left) / tooltipRect.width * 100 + '%';
      }
    }
    
    // Check left edge
    if (tooltipPos.left < 0) {
      tooltipPos.left = spacing;
      if (pos === 'top' || pos === 'bottom') {
        arrowPos.left = ((targetRect.left + targetRect.width / 2) - tooltipPos.left) / tooltipRect.width * 100 + '%';
      }
    }
    
    // Check bottom edge
    if (tooltipPos.top + tooltipRect.height > viewportHeight + scrollY) {
      tooltipPos.top = targetRect.top + scrollY - tooltipRect.height - spacing;
      if (pos === 'bottom') {
        pos = 'top';
        arrowPos = { top: '100%', left: '50%' };
      }
    }
    
    // Check top edge
    if (tooltipPos.top < scrollY) {
      tooltipPos.top = targetRect.bottom + scrollY + spacing;
      if (pos === 'top') {
        pos = 'bottom';
        arrowPos = { top: '0%', left: '50%' };
      }
    }
    
    return {
      tooltip: tooltipPos,
      arrow: arrowPos,
      position: pos
    };
  };

  // Event handlers
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(false), 100);
  };

  const handleFocus = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleBlur = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // SOLUÇÃO MAIS SEGURA: usar verificação baseada em tipo em vez de isValidElement
  const renderChildrenWithProps = () => {
    // Verificação segura para elementos React válidos sem usar isValidElement
    const isReactElement = children && typeof children === 'object' && 
                          'type' in children && 
                          'props' in children &&
                          children !== null;
    
    // Se não parece ser um elemento React válido, envolva em um span
    if (!isReactElement) {
      return (
        <span
          ref={targetRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {children}
        </span>
      );
    }
    
    // Usar cloneElement diretamente com o elemento React
    try {
      return React.cloneElement(children, {
        ref: targetRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
      });
    } catch (err) {
      // Fallback seguro se o cloneElement falhar
      console.warn('Tooltip: Failed to clone element', err);
      return (
        <span
          ref={targetRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {children}
        </span>
      );
    }
  };

  // Render tooltip using portal
  const renderTooltip = () => {
    if (!isVisible || !mounted || !tooltipElement) return null;

    return createPortal(
      <div 
        ref={tooltipRef}
        className={`${styles.tooltip} ${styles[position]} ${className}`}
        style={{
          ...style,
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`
        }}
        role="tooltip"
        aria-hidden="false"
      >
        {multLine && Array.isArray(content) ? (
          content.map((line, index) => <p key={index}>{line}</p>)
        ) : (
          content
        )}
        {arrow && (
          <span 
            className={styles.arrow} 
            style={{
              top: arrowPosition.top,
              left: arrowPosition.left
            }}
          />
        )}
      </div>,
      tooltipElement
    );
  };

  return (
    <>
      {renderChildrenWithProps()}
      {renderTooltip()}
    </>
  );
}