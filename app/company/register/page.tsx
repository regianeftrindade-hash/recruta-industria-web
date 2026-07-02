"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { isValidEmail, isValidCNPJ } from '../../../lib/security';

interface FormDataType {
  nome: string;
  endereco: string;
  email: string;
  telefone: string;
  setor: string;
  porte: string;
  responsavel: string;
  descricao: string;
}

interface CnpjDataType {
  nome: string;
  endereco: string;
  email: string;
  telefone: string;
}

export default function CadastroEmpresa() {
  const router = useRouter();
  
  // NOVA CAMADA DE SEGURANÇA: Bloqueia fluxo de profissional
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType === 'professional') {
      console.log("Detectado fluxo de profissional em página de empresa. Redirecionando...");
      router.push('/professional/register');
    }
  }, [router]);

  const [loading, setLoading] = useState(false);
  const [cnpjData, setCnpjData] = useState<CnpjDataType | null>(null);
  const [cnpjValue, setCnpjValue] = useState('');
  const [cnpjValidado, setCnpjValidado] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [consultandoCNPJ, setConsultandoCNPJ] = useState(false);
  const [senhaPreenchida, setSenhaPreenchida] = useState(true);
  
  const [formData, setFormData] = useState<FormDataType>({
    nome: '',
    endereco: '',
    email: '',
    telefone: '',
    setor: '',
    porte: '',
    responsavel: '',
    descricao: ''
  });

  // Carrega dados do cadastro simples
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dadosSalvos = localStorage.getItem('dadosCadastroSimples');
      if (dadosSalvos) {
        try {
          const dados = JSON.parse(dadosSalvos);
          if (dados.userType === 'company') {
            setFormData(prev => ({
              ...prev,
              email: dados.email || prev.email,
              nome: dados.nome || prev.nome,
            }));
            
            if (dados.cnpj) {
              const cnpjLimpo = dados.cnpj.replace(/\D/g, '');
              const cnpjFormatado = `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5, 8)}/${cnpjLimpo.slice(8, 12)}-${cnpjLimpo.slice(12)}`;
              setCnpjValue(cnpjFormatado);
              
              setTimeout(() => {
                const cnpjNovoLimpo = cnpjLimpo.replace(/\D/g, '');
                if (cnpjNovoLimpo.length === 14 && isValidCNPJ(cnpjNovoLimpo)) {
                  fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNovoLimpo}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                  })
                    .then(res => res.ok ? res.json() : Promise.reject())
                    .then(data => {
                      const novosDados = {
                        nome: data.nome || data.nome_fantasia || '',
                        endereco: data.logradouro ? `${data.logradouro}, ${data.numero || ''} - ${data.bairro}, ${data.municipio}` : '',
                        email: data.email || '',
                        telefone: data.telefone || ''
                      };
                      setCnpjData(novosDados);
                      setFormData(prev => ({ ...prev, ...novosDados }));
                      setCnpjValidado(true);
                    })
                    .finally(() => setConsultandoCNPJ(false));
                }
              }, 100);
            }
            if (dados.password) {
              setPassword(dados.password);
              setConfirmPassword(dados.password);
            }
          }
        } catch (err) {
          console.error('Erro ao carregar dados:', err);
        }
      }
    }
  }, []);

  // ... (o restante da sua lógica de handleSubmit e o render permanecem iguais)
  // Certifique-se apenas de que a estrutura de pastas esteja limpa como discutido anteriormente.

  return (
    // ... (seu JSX permanece o mesmo)
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
      {/* O seu conteúdo HTML original aqui */}
    </div>
  );
}