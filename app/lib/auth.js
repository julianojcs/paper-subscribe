import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
// import LinkedInProvider from 'next-auth/providers/linkedin';
// import FacebookProvider from 'next-auth/providers/facebook';

import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcrypt";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
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

          // Se usuário existe mas não tem senha (apenas login social)
          if (!user.password) {
            console.log("Usuário sem senha (apenas login social)");
            
            // Registrar tentativa frustrada com usuário conhecido
            await prisma.loginLog.create({
              data: {
                userId: user.id,
                loginType: "credentials",
                success: false,
                ip: "",
                userAgent: "",
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
              ip: "",
              userAgent: "",
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

            // Registrar o login social e associar ao usuário existente
            await prisma.loginLog.create({
              data: {
                userId: existingUser.id,
                loginType: account.provider,
                success: true,
                ip: "",
                userAgent: "",
              }
            });
            
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
    
    async session({ session, token, user }) {
      if (session?.user) {
        session.user.id = token.uid;
        // Passar a flag de conta vinculada para a sessão
        if (token.accountLinked) {
          session.accountLinked = true;
        }
      }
      return session;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.uid = user.id;
        // Se a conta foi vinculada, adicionar flag ao token
        if (user.accountLinked) {
          token.accountLinked = true;
        }
      }
      
      // Se temos informações da conta e é um provedor social
      if (account && account.provider !== "credentials") {
        // Verificar se é uma nova vinculação
        // Esta verificação será usada na primeira carga após login
        token.newSocialLink = true;
        token.provider = account.provider;
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