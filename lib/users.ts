import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

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

// Garantir diretório de dados
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
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
  const salt = process.env.PASSWORD_SALT || 'recruta-industria-salt-super-secreto-2025-mudeme'
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

// Comparar senha
function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Buscar usuário por email
export function findUserByEmail(email: string): User | null {
  const users = readUsers()
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Buscar usuário por Google ID
export function findUserByGoogleId(googleId: string): User | null {
  const users = readUsers()
  return users.find(u => u.googleId === googleId) || null
}

// Buscar usuário por ID
export function findUserById(id: string): User | null {
  const users = readUsers()
  return users.find(u => u.id === id) || null
}

// Criar novo usuário
export function createUser(
  email: string,
  password: string | null,
  userType: UserType,
  googleId?: string,
  googleEmail?: string
): User {
  const users = readUsers()
  
  // Verificar se email já existe
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email já cadastrado')
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: password ? hashPassword(password) : '',
    userType,
    googleId,
    googleEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  users.push(user)
  writeUsers(users)

  return user
}

// Validar credenciais
export function validateCredentials(email: string, password: string): User | null {
  const user = findUserByEmail(email)
  
  if (!user || !user.passwordHash) {
    return null
  }

  if (!comparePassword(password, user.passwordHash)) {
    return null
  }

  return user
}

// Atualizar último login
export function updateLastLogin(userId: string): void {
  const users = readUsers()
  const user = users.find(u => u.id === userId)
  
  if (user) {
    user.lastLogin = new Date().toISOString()
    user.updatedAt = new Date().toISOString()
    writeUsers(users)
  }
}

// Atualizar dados do usuário
export function updateUser(userId: string, data: Partial<User>): User | null {
  const users = readUsers()
  const index = users.findIndex(u => u.id === userId)
  
  if (index === -1) return null

  const user = users[index]
  Object.assign(user, { ...data, updatedAt: new Date().toISOString() })
  writeUsers(users)

  return user
}

// Deletar usuário (apenas para testes)
export function deleteUser(userId: string): boolean {
  const users = readUsers()
  const filtered = users.filter(u => u.id !== userId)
  
  if (filtered.length === users.length) return false
  
  writeUsers(filtered)
  return true
}

// Atualizar senha do usuário
export function updateUserPassword(userId: string, newPasswordHash: string): User | null {
  const users = readUsers()
  const index = users.findIndex(u => u.id === userId)
  
  if (index === -1) return null
  
  const user = users[index]
  user.passwordHash = newPasswordHash
  user.updatedAt = new Date().toISOString()
  writeUsers(users)
  
  return user
}

// Exportar dados para backup
export function exportAllUsers(): User[] {
  return readUsers()
}
