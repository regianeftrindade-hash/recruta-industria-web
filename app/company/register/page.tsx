"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CadastroEmpresa() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nome: '', endereco: '', email: '', telefone: '', setor: '', porte: '', responsavel: '', descricao: ''
  });
  
  const [cnpjValue, setCnpjValue] = useState('');

  // 1. MÁSCARA DO CNPJ (Coloca pontos e traço automaticamente)
  const formatarCNPJ = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarCNPJ(e.target.value);
    setCnpjValue(valorFormatado);
    
    // Se o CNPJ tiver 18 caracteres (tamanho total com pontuação), dispara a busca
    if (valorFormatado.length === 18) {
      consultarReceita(valorFormatado.replace(/\D/g, ''));
    }
  };

  // 2. CONSULTA RECEITA (API)
  const consultarReceita = async (cnpjLimpo: string) => {
    console.log("Consultando Receita para:", cnpjLimpo);
    // Aqui você vai inserir o fetch para a API de sua escolha
    // Exemplo: await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Dados do formulário:", { ...formData, cnpj: cnpjValue });
    alert("Cadastro finalizado com sucesso!");
    // router.push('/company/dashboard-empresa');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px', fontFamily: 'Arial' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#001f3f', textAlign: 'center', marginBottom: '30px' }}>CADASTRO EMPRESA</h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ fontWeight: 'bold' }}>CNPJ *</label>
            <input 
              type="text" 
              placeholder="00.000.000/0000-00"
              value={cnpjValue} 
              onChange={handleCnpjChange}
              style={{ width: '100%', padding: '12px', border: '2px solid #001f3f', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold' }}>RAZÃO SOCIAL *</label>
            <input 
              type="text" 
              value={formData.nome} 
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '2px solid #001f3f', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '16px', backgroundColor: '#001f3f', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}
          >
            FINALIZAR CADASTRO
          </button>
        </form>
      </div>
    </div>
  );
}