'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SubmissionForm.module.css';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function SubmissionForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    authors: '',
    keywords: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'O título é obrigatório';
    if (!formData.abstract) newErrors.abstract = 'O resumo é obrigatório';
    if (!formData.authors) newErrors.authors = 'Os autores são obrigatórios';
    if (!formData.keywords) newErrors.keywords = 'As palavras-chave são obrigatórias';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao enviar trabalho');
      }

      // Sucesso - redireciona para página de confirmação ou exibe mensagem de sucesso
      router.push('/paper?success=true');
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      {submitError && (
        <div className={styles.error}>
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Título"
          id="title"
          name="title"
          type="text"
          placeholder="Digite o título do seu trabalho"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
        />

        <div className={styles.textareaGroup}>
          <label htmlFor="abstract">Resumo</label>
          <textarea
            id="abstract"
            name="abstract"
            className={errors.abstract ? styles.errorTextarea : ''}
            placeholder="Digite o resumo do seu trabalho"
            value={formData.abstract}
            onChange={handleChange}
            rows={6}
            required
          />
          {errors.abstract && <p className={styles.errorText}>{errors.abstract}</p>}
        </div>

        <Input
          label="Autores"
          id="authors"
          name="authors"
          type="text"
          placeholder="Digite os autores (separados por vírgula)"
          value={formData.authors}
          onChange={handleChange}
          error={errors.authors}
          required
        />

        <Input
          label="Palavras-chave"
          id="keywords"
          name="keywords"
          type="text"
          placeholder="Digite as palavras-chave (separadas por vírgula)"
          value={formData.keywords}
          onChange={handleChange}
          error={errors.keywords}
          required
        />

        <div className={styles.buttons}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/paper')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}