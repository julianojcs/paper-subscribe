import { NextResponse } from 'next/server';

export async function GET() {
  // Somente forneça variáveis seguras para exibição
  const dbName = process.env.DATABASE_URL.split("/")[3];

  return NextResponse.json({
    dbName: dbName
  });
}