import { NextRequest, NextResponse } from 'next/server'
import { isValidCPF } from '@/lib/security'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf } = body

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    const cpfLimpo = cpf.replace(/\D/g, '')

    // Validar formato do CPF
    if (!isValidCPF(cpfLimpo)) {
      return NextResponse.json(
        { 
          valid: false,
          message: 'CPF inválido - formato incorreto',
          exists: false
        },
        { status: 200 }
      )
    }

    // Verificar se CPF já existe no banco de dados
    try {
      const dataPath = path.join(process.cwd(), 'data', 'users.json')
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8')
        const users = JSON.parse(data)
        
        const cpfExists = users.some((user: any) => {
          const userCpf = user.cpf ? user.cpf.replace(/\D/g, '') : ''
          return userCpf === cpfLimpo
        })

        if (cpfExists) {
          return NextResponse.json(
            { 
              valid: false,
              message: 'Este CPF já está cadastrado',
              exists: true
            },
            { status: 200 }
          )
        }
      }
    } catch (err) {
      // Se houver erro ao ler arquivo, continua com validação simples
      console.error('Erro ao validar CPF:', err)
    }

    // CPF é válido e não existe
    return NextResponse.json(
      { 
        valid: true,
        message: 'CPF válido e disponível',
        exists: false
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erro ao validar CPF:', err)
    return NextResponse.json(
      { error: 'Erro ao validar CPF' },
      { status: 500 }
    )
  }
}
