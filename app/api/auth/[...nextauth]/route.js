import NextAuth from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
// import LinkedInProvider from 'next-auth/providers/linkedin';
// import FacebookProvider from 'next-auth/providers/facebook';
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/db";
import { extractIPv4 } from '../../../utils';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        clientIp: { type: "text", label: "" }, // Campo oculto
        clientUserAgent: { type: "text", label: "" } // Campo oculto
      },
      async authorize(credentials, request) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Credenciais ausentes");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          // Se usuário não existe, registrar tentativa frustrada sem vincular a um usuário
          if (!user) {
            console.log("Usuário não encontrado");
            return null;
          }

          // Obter IP e User Agent das credenciais (que vieram do contexto)
          const ip = credentials.clientIp || extractIPv4(request.headers['x-forwarded-for']?.split(',')[0] || request.headers['x-real-ip'] || 'unknown');
          const userAgent = credentials.clientUserAgent || request.headers['user-agent'] || 'unknown';

          // Se usuário existe mas não tem senha (apenas login social)
          if (!user.password) {
            console.log("Usuário sem senha (apenas login social)");

            // Registrar tentativa frustrada com usuário conhecido
            await prisma.loginLog.create({
              data: {
                userId: user.id,
                loginType: "credentials",
                success: false,
                ip,
                userAgent
              }
            });

            return null;
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          // Registrar o login, bem-sucedido ou não
          await prisma.loginLog.create({
            data: {
              userId: user.id,
              loginType: "credentials",
              success: passwordMatch,
              ip,
              userAgent
            }
          });

          if (!passwordMatch) {
            console.log("Senha incorreta");
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Erro na função authorize:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // LinkedInProvider({
    //   clientId: process.env.LINKEDIN_CLIENT_ID,
    //   clientSecret: process.env.LINKEDIN_CLIENT_SECRET
    // }),
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_CLIENT_ID,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET
    // }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Se for um login via OAuth
      if (account && account.provider === 'google') {
        try {
          // Verificar se o usuário já existe
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Se não existir, verificar se há um token de registro válido
          if (!existingUser) {
            // Obter o token do cookie
            const cookieHeader = cookies().get('social_registration_token')?.value;

            if (!cookieHeader) {
              // Se não tiver token, não permitir o login/registro
              return false;
            }

            // Verificar se o token é válido
            const isValid = await validateEventToken(cookieHeader);
            if (!isValid) {
              return false;
            }

            // Token válido, pode continuar com o registro
          }

          // Se o usuário já existe ou o token é válido, permitir login
          return true;
        } catch (error) {
          console.error('Erro durante autenticação social:', error);
          return false;
        }
      }

      // Caso 1: Login com provedor social (não credenciais)
      if (account?.provider !== "credentials") {
        try {
          // Verificar se existe um usuário com este email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Se encontrou usuário existente com mesmo email
          if (existingUser) {
            // Verificar se a conta já está vinculada
            const existingAccount = await prisma.account.findFirst({
              where: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }
            });

            // Se a conta não estiver vinculada, vincular automaticamente
            if (!existingAccount) {
              // Criar nova vinculação
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  token_type: account.token_type,
                  id_token: account.id_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at ? Math.floor(account.expires_at) : null,
                  scope: account.scope,
                  session_state: account.session_state,
                }
              });
              console.log(`Conta ${account.provider} vinculada automaticamente ao usuário ${existingUser.id}`);

              // Adicionar uma flag à sessão para mostrar mensagem na página de perfil
              // (será usado mais tarde para notificar o usuário)
              user.accountLinked = true;
            }

            // Importante: substituir o ID do usuário para usar o existente
            // em vez de criar um novo no banco
            user.id = existingUser.id;
          }
        } catch (error) {
          console.error("Erro ao processar login social:", error);
        }
      }

      return true; // Permitir login
    },

    async session({ session, token }) {
      if (session?.user) {
        // Usar os dados do token JWT para enriquecer a sessão
        session.user.id = token.sub;
        session.user.cpf = token.cpf;
        session.user.phone = token.phone;
        session.user.institution = token.institution;
        session.user.city = token.city;
        session.user.stateId = token.stateId;
        session.user.organizationMemberships = token.organizationMemberships;

        // A verificação de admin agora pode ser feita facilmente no Header.js
      }
      return session;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.eventTokenVerified = false;

        try {
          const userDetails = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
              id: true,
              name: true,
              cpf: true,
              phone: true,
              institution: true,
              city: true,
              stateId: true,
              organizationMemberships: {
                select: {
                  organizationId: true,
                  role: true
                }
              }
            }
          });

          if (userDetails) {
            token = {
              ...token,
              ...userDetails,
              sub: token.sub || user.id
            };
          }
        } catch (error) {
          console.error("Erro ao verificar token do usuário:", error);
        }
      }
      return token;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
