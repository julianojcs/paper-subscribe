# Implementando Upload no Firebase Storage para a API de Papers

## Principais Melhorias Implementadas:

1. **Importação das Bibliotecas do Firebase**:
   - Adicionei as importações necessárias para Firebase Storage
   - Incluí `uuid` para geração de nomes de arquivo únicos

2. **Verificação do Evento**:
   - Consulta o evento para determinar se o arquivo é necessário
   - Verifica configurações de tamanho máximo de arquivo

3. **Upload de Arquivo**:
   - Implementei o processo completo de upload para o Firebase Storage
   - Estrutura consistente de pastas (`JMR{ano}/Papers/`)
   - Adição de metadados como nome original e usuário que fez upload

4. **Validação**:
   - Verifica se o arquivo é necessário com base nas configurações do evento
   - Valida o tamanho do arquivo de acordo com o limite configurado

5. **Tratamento de Erros**:
   - Adicionei tratamento específico para erros de upload
   - Logs detalhados para facilitar o debugging

6. **Configuração para Arquivos Grandes**:
   - Adicionei configuração que desativa o parser de corpo padrão do Next.js para suportar arquivos grandes

Este código mantém todos os recursos da implementação original e adiciona o upload de arquivo seguindo o padrão do código legado, usando o Firebase Storage como backend de armazenamento.