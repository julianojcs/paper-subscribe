import styles from './Tabs.module.css';

export default function TabsList({ children, className = '', ...props }) {
  return (
    <div 
      className={`${styles.tabsList} ${className}`} 
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}