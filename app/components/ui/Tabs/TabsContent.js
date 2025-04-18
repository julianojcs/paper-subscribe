'use client';

import { useTabs } from './Tabs';
import styles from './Tabs.module.css';

export default function TabsContent({ 
  children, 
  value, 
  className = '', 
  forceMount = false,
  ...props 
}) {
  const { value: selectedValue } = useTabs();
  const isSelected = selectedValue === value;
  
  // Se não estiver selecionado e não tiver forceMount, não renderiza
  if (!isSelected && !forceMount) {
    return null;
  }
  
  return (
    <div
      role="tabpanel"
      hidden={!isSelected}
      aria-hidden={!isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      tabIndex={0}
      className={`${styles.tabsContent} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}