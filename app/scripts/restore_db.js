import { exec } from 'child_process';
import path from 'path';
import { promises as fs, existsSync } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configurações do banco de dados
const dbConfig = {
  user: process.env.DB_USER || 'jornada',
  password: process.env.DB_PASSWORD || 'J0rn4d45rm6',
  host: process.env.DB_HOST || '195.200.4.220',
  port: process.env.DB_PORT || '5432',
  oldDatabase: process.env.DB_NAME || 'jornadav1',
  newDatabase: process.env.NEW_DB_NAME || 'jornadav2',
};

// Executa um comando como uma Promise
const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr, stdout });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

// Função principal usando async/await
const runRestore = async () => {
  // Criar interface readline para prompts
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Verificar argumentos da linha de comando
    if (process.argv.length < 3) {
      console.error('Uso: node restore-db.mjs <caminho_do_arquivo_backup>');
      process.exit(1);
    }

    const backupFile = process.argv[2];

    // Verificar se o arquivo existe
    if (!existsSync(backupFile)) {
      console.error(`Arquivo de backup não encontrado: ${backupFile}`);
      process.exit(1);
    }

    // Perguntar ao usuário se deseja continuar
    const answer = await rl.question(`Você está prestes a criar um novo banco de dados "${dbConfig.newDatabase}" e restaurar os dados do backup. Continuar? (s/n): `);

    if (answer.toLowerCase() !== 's') {
      console.log('Operação cancelada pelo usuário.');
      rl.close();
      return;
    }

    // Descomprimir se for um arquivo .gz
    let finalBackupFile = backupFile;

    if (backupFile.endsWith('.gz')) {
      console.log('Descomprimindo arquivo de backup...');

      // Nome do arquivo sem a extensão .gz
      finalBackupFile = backupFile.slice(0, -3);

      const gunzipCommand = `gunzip -c "${backupFile}" > "${finalBackupFile}"`;

      await execPromise(gunzipCommand);
      console.log(`Arquivo descomprimido: ${finalBackupFile}`);
    }

    // Criar o novo banco de dados
    await createNewDatabase(finalBackupFile, rl);

    rl.close();

  } catch (err) {
    console.error(`Erro durante o processo de restauração: ${err.error?.message || err.message}`);
    if (err.stderr) {
      console.error(`Detalhes do erro: ${err.stderr}`);
    }
    rl.close();
    process.exit(1);
  }
};

async function createNewDatabase(backupFile, rl) {
  console.log(`Criando novo banco de dados ${dbConfig.newDatabase}...`);

  try {
    // Comando para criar o novo banco de dados
    const createDbCommand = `PGPASSWORD=${dbConfig.password} psql \
      --host=${dbConfig.host} \
      --port=${dbConfig.port} \
      --username=${dbConfig.user} \
      --command="CREATE DATABASE ${dbConfig.newDatabase} WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';"`;

    await execPromise(createDbCommand);
    console.log(`Banco de dados ${dbConfig.newDatabase} criado com sucesso.`);
    await restoreBackup(backupFile, rl);

  } catch (err) {
    // Verificar se o erro é porque o banco já existe
    if (err.stderr && err.stderr.includes('already exists')) {
      console.log(`O banco de dados ${dbConfig.newDatabase} já existe.`);

      const answer = await rl.question(`Deseja excluir e recriar o banco de dados ${dbConfig.newDatabase}? (s/n): `);

      if (answer.toLowerCase() === 's') {
        await dropAndRecreateDatabase(backupFile, rl);
      } else {
        console.log(`Continuando com o banco existente ${dbConfig.newDatabase}...`);
        await restoreBackup(backupFile, rl);
      }
    } else {
      throw err;
    }
  }
}

async function dropAndRecreateDatabase(backupFile, rl) {
  console.log(`Removendo banco de dados ${dbConfig.newDatabase}...`);

  // Garantir que não haja conexões ativas
  const terminateCommand = `PGPASSWORD=${dbConfig.password} psql \
    --host=${dbConfig.host} \
    --port=${dbConfig.port} \
    --username=${dbConfig.user} \
    --command="SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbConfig.newDatabase}' AND pid <> pg_backend_pid();"`;

  await execPromise(terminateCommand);

  // Remover o banco de dados
  const dropDbCommand = `PGPASSWORD=${dbConfig.password} psql \
    --host=${dbConfig.host} \
    --port=${dbConfig.port} \
    --username=${dbConfig.user} \
    --command="DROP DATABASE ${dbConfig.newDatabase};"`;

  await execPromise(dropDbCommand);
  console.log(`Banco de dados ${dbConfig.newDatabase} removido com sucesso.`);

  // Recriar o banco de dados
  await createNewDatabase(backupFile, rl);
}

async function restoreBackup(backupFile, rl) {
  console.log(`Restaurando dados para ${dbConfig.newDatabase}...`);

  try {
    // Comando para restaurar o backup
    const pgRestoreCommand = `PGPASSWORD=${dbConfig.password} pg_restore \
      --host=${dbConfig.host} \
      --port=${dbConfig.port} \
      --username=${dbConfig.user} \
      --dbname=${dbConfig.newDatabase} \
      --verbose \
      --no-owner \
      --no-privileges \
      "${backupFile}"`;

    const { stderr } = await execPromise(pgRestoreCommand);

    if (stderr) {
      // pg_restore imprime detalhes no stderr mesmo em caso de sucesso
      console.log(`Notas da restauração: ${stderr}`);
    }

    console.log(`Restauração concluída com sucesso no banco ${dbConfig.newDatabase}.`);

    // Remover o arquivo temporário descomprimido se necessário
    if (backupFile !== process.argv[2]) {
      await fs.unlink(backupFile);
      console.log(`Arquivo temporário ${backupFile} removido.`);
    }

    console.log('\nPróximos passos:');
    console.log(`1. Atualize o .env com: DATABASE_URL="postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.newDatabase}"`);
    console.log('2. Execute: node update-prisma.mjs');

  } catch (err) {
    // O pg_restore pode retornar 1 para avisos não fatais
    if (err.error && err.error.code === 1) {
      console.log(`Restauração concluída com avisos não fatais no banco ${dbConfig.newDatabase}.`);

      if (backupFile !== process.argv[2]) {
        await fs.unlink(backupFile);
        console.log(`Arquivo temporário ${backupFile} removido.`);
      }

      console.log('\nPróximos passos:');
      console.log(`1. Atualize o .env com: DATABASE_URL="postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.newDatabase}"`);
      console.log('2. Execute: node update-prisma.mjs');
    } else {
      throw err;
    }
  }
}

// Executar a função principal
runRestore();