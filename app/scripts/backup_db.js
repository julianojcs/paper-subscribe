import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configurações do banco de dados
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
};

// Diretório de backup
const backupDir = path.resolve(process.env.BACKUP_DIR || './backups');
if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true });
  console.log(`Diretório de backup criado: ${backupDir}`);
}

// Nome do arquivo de backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `${dbConfig.database}_${timestamp}.dump`);

console.log(`Iniciando backup do banco de dados ${dbConfig.database}...`);

// Executa um comando como uma Promise
const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

// Função principal usando async/await
const runBackup = async () => {
  try {
    // Comando pg_dump
    const pgDumpCommand = `PGPASSWORD=${dbConfig.password} pg_dump \
      --host=${dbConfig.host} \
      --port=${dbConfig.port} \
      --username=${dbConfig.user} \
      --format=custom \
      --verbose \
      --file=${backupFile} \
      --clean \
      --if-exists \
      ${dbConfig.database}`;

    // Executar o comando de backup
    const { stderr } = await execPromise(pgDumpCommand);

    if (stderr) {
      console.log(`Informações do pg_dump: ${stderr}`);
    }

    console.log(`Backup concluído com sucesso: ${backupFile}`);

    // Comprimir o arquivo de backup
    console.log('Comprimindo o arquivo de backup...');

    await execPromise(`gzip ${backupFile}`);
    console.log(`Arquivo comprimido: ${backupFile}.gz`);

    // Limpar backups antigos (manter apenas os últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const files = await fs.readdir(backupDir);
    let deletedCount = 0;

    for (const file of files) {
      if (file.startsWith(`${dbConfig.database}_`) && file.endsWith('.dump.gz')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < sevenDaysAgo) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`${deletedCount} backups antigos foram removidos.`);
    }

    console.log('Processo de backup concluído com sucesso!');

  } catch (err) {
    console.error(`Erro durante o processo de backup: ${err.error?.message || err.message}`);
    if (err.stderr) {
      console.error(`Detalhes do erro: ${err.stderr}`);
    }
    process.exit(1);
  }
};

// Executar a função principal
runBackup();
