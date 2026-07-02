"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidEmail, isValidCNPJ } from '../../../lib/security';

export default function CadastroEmpresa() {
  const router = useRouter();

  // 1. SEGURANÇA: Garante que apenas empresas fiquem aqui
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType === 'professional') {
      router.push('/professional/register');
    }
  }, [router]);

  // 2. ESTADOS
  const [formData, setFormData] = useState({
    nome: '', endereco: '', email: '', telefone: '', setor: '', porte: '', responsavel: '', descricao: ''
  });
  const [cnpjValue, setCnpjValue] = useState('');
  const [cnpjValidado, setCnpjValidado] = useState(false);

  // 3. HANDLERS
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 14) valor = valor.slice(0, 14);
    setCnpjValue(valor);
    if (valor.length === 14) setCnpjValidado(true); // Simplificado para teste
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enviando dados da empresa...");
    // A sua lógica de envio aqui
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '15px' }}>
        <h1 style={{ color: '#001f3f', textAlign: 'center' }}>CADASTRO EMPRESA</h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label>CNPJ *</label>
            <input 
              type="text" 
              value={cnpjValue} 
              onChange={handleCnpjChange}
              style={{ width: '100%', padding: '10px', border: '2px solid #001f3f' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>RAZÃO SOCIAL *</label>
            <input 
              type="text" 
              value={formData.nome} 
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              style={{ width: '100%', padding: '10px', border: '2px solid #001f3f' }}
            />
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '15px', backgroundColor: '#001f3f', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
          >
            FINALIZAR CADASTRO
          </button>
        </form>
      </div>
    </div>
  );
}