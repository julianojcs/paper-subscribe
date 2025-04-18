import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Por segurança, este endpoint apenas indica se o fluxo precisa de token
    // e não revela diretamente se um email existe
    
    // Aqui você pode implementar uma verificação baseada no domínio do email
    // ou outros critérios conforme sua lógica de negócio
    
    // Esta é uma implementação simplificada que sempre diz que
    // necessita de token para registro, mas não para login
    
    // No caso real, você gostaria de verificar a sessão parcial que o OAuth cria
    // ou implementar uma forma de memória temporária para armazenar o fluxo
    
    return NextResponse.json({
      needsToken: true,
      message: 'É necessário fornecer um token para criar uma nova conta.'
    });
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar solicitação',
      needsToken: false 
    }, { status: 500 });
  }
}