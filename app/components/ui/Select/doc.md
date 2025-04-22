# Refatoração do Componente Select com CreatePortal

Usarremos CreatePortal sem alterar suas funcionalidades existentes, incluindo a descrição e o estilo. Aplicaremos apenas os conceitos para resolver o problema de sobreposição:

## Mudanças Implementadas

Implementei apenas as mudanças necessárias para resolver o problema de sobreposição, preservando todas as funcionalidades existentes:

1. **CreatePortal**
   - Adicionei um portal container para renderizar o dropdown fora da hierarquia do DOM
   - O dropdown agora é renderizado diretamente no body, evitando problemas de contexto de empilhamento

2. **Posicionamento dinâmico**
   - Adicionei a função `updateDropdownPosition` que calcula a posição exata do dropdown
   - O dropdown é posicionado baseado nas coordenadas do botão trigger

3. **Gerenciamento de posição ao rolar/redimensionar**
   - Adicionei event listeners para scroll e resize
   - A posição do dropdown é atualizada sempre que a página é rolada ou redimensionada

4. **Container dedicado**
   - Criei um container dedicado com z-index alto (9999) para todos os dropdowns
   - Este container é criado somente uma vez e compartilhado por todas as instâncias do componente

5. **Renderização condicional com fallback**
   - Adicionei lógica para renderizar o dropdown através do portal quando disponível
   - Se por algum motivo o portal não estiver disponível, o dropdown é renderizado localmente

Esta implementação mantém todas as funcionalidades existentes incluindo a descrição das opções, acessibilidade, navegação pelo teclado e todos os estilos originais, resolvendo o problema de sobreposição com a tabela/cards.