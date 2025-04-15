A aplicação será utilizada por 'varios parceiros (Organizations), que farão uso do sistema para criar eventos de submissao de trabalhos científicos. Sendo assim, os trabalhos científicos deverão ser associados a uma organização e também a um evento específico dessa organização.
Por exemplo, a organização "Sociedade Mineira de Radiologia", sigla "SRMG", realizará o evento "Jornada Mineira de Radiologia", sigla "JMR2025" e usará o sistema para cadastro e análise de Trabalhos Científicos. Seus associados/usuários acessarão o sistema por um link que conterá um token para que será associado ao evento da organização. Sendo assim, os trabalhos cadastrados pelo associado/usuário dessa organização terá que estar associado a organização e ao evento da organização. O usuário poderá também acessar o sistema diretamente pela tela de regisro de usuário, informando o token da organização. Nao será mais permitido a criação de usuários sem o token do evento.
A organização terá Avaliadores dos trabalhos científicos cadastrados no sistema. Esses avaliadores, para serem cadastrados no sistema como avaliadores da organização, já terão que ter um cadastro prévio, ou a própria organização poderá cadastrar o email do avaliador previamente e este poderá então realizar o seu cadastro com a criação de uma senha ou, se o email for de uma dos provedores de Login Social, ele poderá criar seu usuário através dessa funcionalidade, sem ter que informar o token do evento.
O administrador da organização terá que associar esses usuários como Avaliadores da organização para o evento específico.
Esses avaliadores terão acesso aos Trabalhos Científicos cadastrados pelos associados/usuários que submeteram seus trabalhos para o evento ao qual o Avaliador foi cadastrado.
A organização terá um ou vários usuários Admins, que poderão cadastrar (CRUD total) avaliadores e também ter acesso aos trabalhos científicos, assim como criar eventos no sistema.
O sistema deverá oferecer meio para que os Admins da Organização criem Eventos, caso a Organização tenha uma conta Premium (conta com assinatura semestral). Caso contrário, este poderá ter apenas 1 evento ativo por vez no sistema.
O cadastro de todos os usuários do sistema deverá ter Nome, CPF, email e celular (campos obrigatórios).



Principais Mudanças e Funcionalidades
1. Sistema Multi-Organizacional
Nova tabela Organization para armazenar dados de cada parceiro
Diferenciação entre organizações premium e gratuitas
Controle de período de assinatura
2. Eventos
Cada organização pode ter múltiplos eventos
Controle de datas importantes (submissão, avaliação)
Restrição para contas não-premium (1 evento ativo)
3. Autenticação por Token
Sistema de tokens para acesso (OrganizationToken)
Tokens podem ser associados a organizações ou eventos específicos
Controle de expiração de tokens
4. Papéis de Usuário
Sistema de permissões baseado em papéis
Administradores de organização
Avaliadores por evento
Super administradores do sistema
5. Perfil de Usuário Estendido
Adicionados campos obrigatórios: CPF e telefone
Todos os usuários agora são vinculados a pelo menos uma organização
6. Sistema de Avaliação
Avaliadores são associados a eventos específicos
Revisões detalhadas com notas e recomendações
Comentários públicos e privados nas avaliações
7. Trabalhos Científicos
Papers agora vinculados a organizações e eventos
Status mais detalhado com enumeração
Sistema de histórico melhorado
Próximos Passos
Após essa atualização do schema, será necessário:

Executar migrações cuidadosas para preservar dados existentes
Atualizar a camada de API para trabalhar com a nova estrutura
Modificar a interface para refletir as novas relações e fluxos de trabalho
Implementar os novos fluxos de registro baseados em token
Esta nova estrutura permite escalabilidade para múltiplas organizações e eventos, mantendo um controle claro sobre permissões e associações entre as entidades do sistema.