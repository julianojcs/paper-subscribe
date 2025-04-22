import styles from './PageHeader.module.css';

const PageHeader = ({ title, description, icon }) => {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.titleRow}>
        {icon && <div className={styles.iconContainer}>{icon}</div>}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
};

export default PageHeader;