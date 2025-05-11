import { exec } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório do projeto (o diretório atual)
const projectDir = process.cwd();

// Executa um comando como uma Promise
const execPromise = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr, stdout });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

// Função principal usando async/await
const updatePrismaClient = async () => {
  // Criar interface readline para prompts
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log(`Diretório do projeto: ${projectDir}`);

    // Verificar se o arquivo .env existe
    if (!existsSync(path.join(projectDir, '.env'))) {
      console.error(`Arquivo .env não encontrado em ${projectDir}`);
      process.exit(1);
    }

    // Perguntar ao usuário se deseja continuar
    const answer = await rl.question('Esta operação irá regenerar o Prisma Client. Continuar? (s/n): ');

    if (answer.toLowerCase() !== 's') {
      console.log('Operação cancelada pelo usuário.');
      rl.close();
      return;
    }

    console.log('Regenerando o cliente Prisma...');

    // Executar prisma generate
    const { stdout } = await execPromise('npx prisma generate', { cwd: projectDir });

    console.log(stdout);
    console.log('Cliente Prisma regenerado com sucesso.');

    // Perguntar sobre reinicialização da aplicação
    const restartAnswer = await rl.question('Deseja reiniciar a aplicação agora? (s/n): ');

    if (restartAnswer.toLowerCase() !== 's') {
      console.log('Lembre-se de reiniciar manualmente a aplicação para aplicar as alterações.');
      rl.close();
      return;
    }

    console.log('Verificando método de reinicialização disponível...');

    // Verificar se o PM2 está disponível
    try {
      await execPromise('which pm2');

      const appName = await rl.question('Digite o nome ou ID da aplicação no PM2 (ou "all" para todas): ');
      const pm2Command = `pm2 restart ${appName.trim() || 'all'}`;

      const { stdout: restartOutput } = await execPromise(pm2Command);
      console.log(restartOutput);
      console.log('Aplicação reiniciada com sucesso via PM2.');

    } catch (err) {
      // Se PM2 não estiver disponível, tentar systemctl
      try {
        await execPromise('which systemctl');

        const serviceName = await rl.question('Digite o nome do serviço systemd: ');

        if (!serviceName.trim()) {
          console.log('Nome do serviço não fornecido. Por favor, reinicie a aplicação manualmente.');
          rl.close();
          return;
        }

        console.log(`Reiniciando o serviço ${serviceName.trim()}...`);

        await execPromise(`sudo systemctl restart ${serviceName.trim()}`);
        console.log(`Serviço ${serviceName.trim()} reiniciado com sucesso.`);

      } catch (systemErr) {
        console.log('Não foi possível determinar como reiniciar a aplicação automaticamente.');
        console.log('Por favor, reinicie a aplicação manualmente.');
      }
    }

    rl.close();

  } catch (err) {
    console.error(`Erro ao atualizar o Prisma Client: ${err.error?.message || err.message}`);
    if (err.stderr) {
      console.error(`Detalhes do erro: ${err.stderr}`);
    }
    rl.close();
    process.exit(1);
  }
};

// Executar a função principal
updatePrismaClient();