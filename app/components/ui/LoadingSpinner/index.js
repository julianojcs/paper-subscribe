import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ message = "Carregando..." }) => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingSpinner}></div>
    <p>{message}</p>
  </div>
);

export default LoadingSpinner;