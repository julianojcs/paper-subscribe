# Refatoração do LoginForm para Validação Imediata do Token

Vamos refatorar o componente LoginForm para validar o token imediatamente após recebê-lo e armazenar os dados do evento no contexto:

## Principais Mudanças e Melhorias

1. **Validação Imediata de Token**
   - Adicionada função `validateEventToken` para validar tokens via API imediatamente
   - O token é validado assim que recebido da URL ou do sessionStorage
   - Novo estado `tokenValidated` para rastrear a validação do token

2. **Armazenamento dos Dados do Evento**
   - Adicionado armazenamento dos dados do evento no contexto global via `setEventData`
   - A API retorna os dados do evento junto com a validação do token

3. **Feedback Visual de Validação**
   - Novo estado `tokenValidating` para indicar quando a validação está em andamento
   - Adicionado prop `isLoading` ao Input do token
   - Adicionado prop `isValid` para indicação visual de token válido

4. **Melhor Armazenamento de Token**
   - O token validado é armazenado com uma flag `validated: true`
   - Tokens já validados não precisam ser revalidados em novas visitas à página

5. **Compatibilidade com Formato Antigo**
   - Mantida a verificação para tokens em formato antigo
   - Conversão automática para novo formato com validação

6. **Validação Incremental para Input Manual**
   - Nova função `handleTokenInput` para validar tokens inseridos manualmente
   - Validação iniciada quando o token tem pelo menos 6 caracteres

7. **Prevenção de Registro com Token Inválido**
   - O botão de registro é desabilitado quando o token não está validado
   - Verificação adicional de token validado no `handleRegister`

## Como Isso Funciona

1. Quando o usuário chega à página com um token na URL (`?t=token`):
   - O token é extraído e validado imediatamente via API
   - O usuário é direcionado para a aba de registro
   - Os dados do evento são salvos no contexto global

2. Para tokens armazenados em sessionStorage:
   - Se já foi validado anteriormente, é usado sem nova validação
   - Caso contrário, é validado novamente

3. Para entrada manual de token:
   - À medida que o usuário digita, o token é validado automaticamente após atingir 6 caracteres
   - Feedback visual indica se o token é válido ou não

4. No registro:
   - O botão só está habilitado se o token estiver validado
   - Dupla verificação de token válido antes do envio do registro

Esta refatoração melhora significativamente a experiência do usuário, fornecendo feedback imediato sobre a validade do token e reduzindo o tempo necessário para completar o registro.

Similar code found with 1 license type