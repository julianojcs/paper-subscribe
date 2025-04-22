# API para Consulta de Usuários por Administrador de Organização

API completa que verifica as permissões do usuário logado e retorna os dados dos usuários vinculados à mesma organização.

## Pontos Importantes da Implementação:

1. **Verificação de Permissões**:
   - Confirma se o usuário está logado através da sessão
   - Verifica se o usuário possui vínculo como ADMIN em alguma organização

2. **Busca do Evento Ativo**:
   - Encontra o evento ativo da organização para mostrar dados contextuais
   - Utiliza este evento para filtrar os papers associados a cada usuário

3. **Dados Retornados**:
   - Informações pessoais: nome, email, CPF, telefone
   - Data de criação da conta (createdAt)
   - Quantidade de papers submetidos ao evento ativo
   - Papel/função do usuário na organização (ADMIN, MEMBER, etc.)
   - Data em que o usuário se juntou à organização

4. **Recursos Avançados**:
   - Paginação para lidar com grandes volumes de dados
   - Filtros por texto (busca em nome, email, CPF, telefone)
   - Ordenação por diferentes campos
   - Filtro específico por papel/função

5. **Segurança**:
   - Não permite acesso a usuários não autenticados
   - Restringe acesso apenas a administradores
   - Limita a visualização apenas aos usuários da mesma organização

Esta API fornece todas as informações necessárias para que um administrador possa gerenciar e monitorar os usuários de sua organização, com dados relevantes sobre sua participação nos eventos.