import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { prisma } from "../../../lib/db";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Obter dados do corpo
  const body = await request.json();
  const { provider, ip, userAgent } = body;

  // Obter o usuário
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  // Registrar o login
  await prisma.loginLog.create({
    data: {
      userId: user.id,
      loginType: provider || 'oauth',
      success: true,
      ip,
      userAgent
    }
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}