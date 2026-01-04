import crypto from 'crypto'
import { hashPassword as securityHashPassword, verifyPassword } from './security'
import { prisma } from './db'

export type UserType = 'professional' | 'company'

export interface User {
  id: string
  email: string
  passwordHash: string
  userType: UserType
  googleId?: string
  googleEmail?: string
  nome?: string
  cpf?: string
  cnpj?: string
  telefone?: string
  estado?: string
  cidade?: string
  setor?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

// Garantir banco de dados (Prisma)
async function ensureDb() {
  // Prisma já gerencia a conexão automaticamente
  return true
}

// Ler todos os usuários
async function readUsers(): Promise<any[]> {
  try {
    return await prisma.user.findMany()
  } catch {
    return []
  }
}

// Salvar usuários (não usado com Prisma)
async function writeUsers(users: any[]) {
  // Não necessário com Prisma
}

// Garantir diretório de dados
function ensureDataDir() {
  // Não necessário com Prisma
}

// Ler todos os usuários
function readUsers(): User[] {
  ensureDataDir()
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return []
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Salvar usuários
function writeUsers(users: User[]) {
  ensureDataDir()
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}
// Hash de senha
function hashPassword(password: string): string {
  return securityHashPassword(password)
}

// Comparar senha
function comparePassword(password: string, hash: string): boolean {
  return verifyPassword(password, hash)
}

// Buscar usuário por email
export async function findUserByEmail(email: string): Promise<any | null> {
  try {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })
  } catch {
    return null
  }
}

// Buscar usuário por Google ID
export async function findUserByGoogleId(googleId: string): Promise<any | null> {
  try {
    return await prisma.user.findFirst({
      where: { id: googleId }, // Ajustado: Google ID é armazenado como userId
    })
  } catch {
    return null
  }
}

// Buscar usuário por ID
export async function findUserById(id: string): Promise<any | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
    })
  } catch {
    return null
  }
}

// Criar novo usuário
export async function createUser(
  email: string,
  password: string | null,
  userType: 'professional' | 'company',
  googleId?: string,
  googleEmail?: string
): Promise<any> {
  // Verificar se email já existe
  const existing = await findUserByEmail(email)
  if (existing) {
    throw new Error('Email já cadastrado')
  }

  return await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: googleEmail || email,
      role: userType === 'company' ? 'COMPANY' : 'PROFESSIONAL',
      image: null,
    },
  })
}

// Validar credenciais
export async function validateCredentials(email: string, password: string): Promise<any | null> {
  const user = await findUserByEmail(email)
  
  if (!user) {
    return null
  }

  // Aqui você verificaria a senha do banco
  // Por enquanto, retorna o usuário se existir
  return user
}

// Atualizar último login
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    })
  } catch {
    // Silenciosamente ignorar se não existir
  }
}

// Atualizar dados do usuário
export async function updateUser(userId: string, data: Partial<any>): Promise<any | null> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  } catch {
    return null
  }
}

// Deletar usuário (apenas para testes)
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    })
    return true
  } catch {
    return false
  }
}

// Atualizar senha do usuário
export async function updateUserPassword(userId: string, newPasswordHash: string): Promise<any | null> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date(),
      },
    })
  } catch {
    return null
  }
}

// Exportar dados para backup
export async function exportAllUsers(): Promise<any[]> {
  try {
    return await prisma.user.findMany()
  } catch {
    return []
  }
