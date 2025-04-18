'use client';

import { useTabs } from './Tabs';
import styles from './Tabs.module.css';

export default function TabsTrigger({ 
  children, 
  value, 
  disabled = false,
  className = '', 
  ...props 
}) {
  const { value: selectedValue, setValue } = useTabs();
  const isSelected = selectedValue === value;
  
  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      disabled={disabled}
      data-state={isSelected ? 'active' : 'inactive'}
      onClick={() => setValue(value)}
      className={`${styles.tabsTrigger} ${className}`}
      tabIndex={isSelected ? 0 : -1}
      {...props}
    >
      {children}
    </button>
  );
}