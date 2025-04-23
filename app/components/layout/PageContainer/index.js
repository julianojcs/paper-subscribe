import styles from './PageContainer.module.css';

export default function PageContainer({ children, className = '', dataReady = true }) {
  return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.container} ${className} ${dataReady ? styles.fadeIn : styles.hidden}`}>
        {children}
      </div>
    </div>
  );
}