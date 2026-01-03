const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Hash de senha
function hashPassword(password) {
  const salt = process.env.PASSWORD_SALT || 'recruta-industria-salt-super-secreto-2025-mudeme';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Ler usuários
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Salvar usuários
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

const users = readUsers();

// Criar usuário de teste profissional
const testUserProf = {
  id: crypto.randomUUID(),
  email: "profissional@teste.com",
  passwordHash: hashPassword("Teste123!"),
  userType: "professional",
  nome: "João Silva",
  cpf: "12345678900",
  telefone: "(11) 98765-4321",
  estado: "SP",
  cidade: "São Paulo",
  setor: "Produção / Operacional",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Criar usuário de teste empresa
const testUserCompany = {
  id: crypto.randomUUID(),
  email: "empresa@teste.com",
  passwordHash: hashPassword("Teste123!"),
  userType: "company",
  nome: "Indústria Test LTDA",
  cnpj: "12.345.678/0001-90",
  telefone: "(11) 3456-7890",
  setor: "Metalmecânica",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Remover usuários antigos se existirem
let newUsers = users.filter(u => u.email !== "profissional@teste.com" && u.email !== "empresa@teste.com");

// Adicionar novos
newUsers.push(testUserProf);
newUsers.push(testUserCompany);

writeUsers(newUsers);

console.log("\n✅ Usuários de teste criados com sucesso!");
console.log("\n📝 PROFISSIONAL:");
console.log("  Email: profissional@teste.com");
console.log("  Senha: Teste123!");
console.log("\n🏢 EMPRESA:");
console.log("  Email: empresa@teste.com");
console.log("  Senha: Teste123!");
console.log("\nAcesse http://localhost:3000/login para fazer login\n");
