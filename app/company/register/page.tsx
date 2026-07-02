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
  const [loading, setLoading] = useState(false);
  const [cnpjData, setCnpjData] = useState<CnpjDataType | null>(null);
  const [cnpjValue, setCnpjValue] = useState('');
  const [cnpjValidado, setCnpjValidado] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [consultandoCNPJ, setConsultandoCNPJ] = useState(false);
  const [senhaPreenchida, setSenhaPreenchida] = useState(true); // Começa como true por padrão (sem campos de senha)
  
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
            // Preenche email e nome (razão social)
            setFormData(prev => ({
              ...prev,
              email: dados.email || prev.email,
              nome: dados.nome || prev.nome,
            }));
            
            // Preenche CNPJ se houver
            if (dados.cnpj) {
              const cnpjLimpo = dados.cnpj.replace(/\D/g, '');
              const cnpjFormatado = `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5, 8)}/${cnpjLimpo.slice(8, 12)}-${cnpjLimpo.slice(12)}`;
              setCnpjValue(cnpjFormatado);
              
              // Consulta o CNPJ após atualizar o state
              setTimeout(() => {
                const cnpjNovoLimpo = cnpjLimpo.replace(/\D/g, '');
                if (cnpjNovoLimpo.length === 14 && isValidCNPJ(cnpjNovoLimpo)) {
                  // Chama a consulta diretamente
                  fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNovoLimpo}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                  })
                    .then(response => {
                      if (response.ok) {
                        return response.json();
                      }
                      throw new Error('CNPJ não encontrado');
                    })
                    .then(data => {
                      const novosDados = {
                        nome: data.nome || data.nome_fantasia || data.razao_social || '',
                        endereco: data.logradouro ? `${data.logradouro}, ${data.numero || ''} - ${data.bairro}, ${data.municipio}` : '',
                        email: data.email || '',
                        telefone: data.telefone || ''
                      };
                      setCnpjData(novosDados);
                      setFormData(prev => ({
                        ...prev,
                        nome: novosDados.nome,
                        endereco: novosDados.endereco,
                        email: novosDados.email,
                        telefone: novosDados.telefone,
                      }));
                      setCnpjValidado(true);
                    })
                    .catch(error => {
                      console.error('Erro ao consultar CNPJ:', error);
                      setCnpjValidado(false);
                      setCnpjData(null);
                    })
                    .finally(() => {
                      setConsultandoCNPJ(false);
                    });
                }
              }, 100);
            }
            
            // Preenche a senha se houver
            if (dados.password) {
              setPassword(dados.password);
              setConfirmPassword(dados.password);
              // Senha foi carregada do localStorage, manter senhaPreenchida como true
            }
            
            console.log('Dados carregados do localStorage:', dados);
          }
        } catch (err) {
          console.error('Erro ao carregar dados:', err);
        }
      }
    }
  }, []);

  // Auto-consulta CNPJ quando atinge 14 dígitos
  useEffect(() => {
    if (cnpjValue.replace(/\D/g, '').length === 14 && !cnpjValidado) {
      consultarCNPJ(cnpjValue.replace(/\D/g, ''));
    }
  }, [cnpjValue, cnpjValidado]);

  const consultarCNPJ = async (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (!isValidCNPJ(cnpjLimpo)) {
      setCnpjValidado(false);
      setCnpjData(null);
      return;
    }
    
    if (cnpjLimpo.length !== 14) {
      return;
    }

    setConsultandoCNPJ(true);
    
    try {
      // Tenta BrasilAPI real
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const novosDados: CnpjDataType = {
          nome: data.nome || '',
          endereco: data.logradouro ? `${data.logradouro}, ${data.numero || ''} - ${data.bairro}, ${data.municipio}` : '',
          email: data.email || '',
          telefone: data.telefone || ''
        };
        
        setCnpjData(novosDados);
        setFormData(prev => ({
          ...prev,
          nome: novosDados.nome,
          endereco: novosDados.endereco,
          email: novosDados.email,
          telefone: novosDados.telefone,
        }));
        setCnpjValidado(true);
      } else {
        setCnpjValidado(false);
        setCnpjData(null);
      }
    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      setCnpjValidado(false);
      setCnpjData(null);
    } finally {
      setConsultandoCNPJ(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length > 14) {
      valor = valor.slice(0, 14);
    }
    
    // Formata: XX.XXX.XXX/XXXX-XX
    if (valor.length <= 2) {
      setCnpjValue(valor);
    } else if (valor.length <= 5) {
      setCnpjValue(`${valor.slice(0, 2)}.${valor.slice(2)}`);
    } else if (valor.length <= 8) {
      setCnpjValue(`${valor.slice(0, 2)}.${valor.slice(2, 5)}.${valor.slice(5)}`);
    } else if (valor.length <= 12) {
      setCnpjValue(`${valor.slice(0, 2)}.${valor.slice(2, 5)}.${valor.slice(5, 8)}/${valor.slice(8)}`);
    } else {
      setCnpjValue(`${valor.slice(0, 2)}.${valor.slice(2, 5)}.${valor.slice(5, 8)}/${valor.slice(8, 12)}-${valor.slice(12)}`);
    }
    
    if (valor.length < 14) {
      setCnpjValidado(false);
      setCnpjData(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('=== SUBMIT EMPRESA ===');
    console.log('senhaPreenchida:', senhaPreenchida);
    console.log('password length:', password.length);
    console.log('password value:', password);
    
    if (!cnpjValidado) {
      alert('CNPJ não validado');
      return;
    }

    if (!formData.email || !isValidEmail(formData.email)) {
      setEmailError('Email corporativo é obrigatório e deve ser válido');
      alert('Por favor, preencha um email corporativo válido');
      return;
    }
    
    if (!formData.telefone) {
      alert('Telefone é obrigatório');
      return;
    }
    
    // SE A SENHA FOI PREENCHIDA NO CADASTRO SIMPLES, PULAR TODA VALIDAÇÃO DE SENHA
    if (senhaPreenchida === true) {
      console.log('Senha foi preenchida no cadastro simples - pulando validação');
      setLoading(true);
      
      try {
        // Salva dados no localStorage
        const dadosCadastro = {
          ...formData,
          cnpj: cnpjValue.replace(/\D/g, ''),
          password,
          timestamp: new Date().toISOString()
        };
        
        console.log('📝 Salvando cadastro:', dadosCadastro);
        localStorage.setItem('dadosCadastroEmpresa', JSON.stringify(dadosCadastro));
        
        // Salva no banco de dados através da API
        console.log('🔄 Enviando para API /api/company/update-registration...');
        const response = await fetch('/api/company/update-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosCadastro)
        });

        console.log('📊 Resposta da API:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Erro na resposta:', errorData);
          throw new Error('Erro ao salvar cadastro');
        }

        const data = await response.json();
        console.log('✅ Cadastro salvo com sucesso:', data);

        // Simula delay de processamento
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Redireciona para sucesso
        console.log('🚀 Redirecionando para /company/success');
        router.push('/company/success');
      } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao salvar cadastro. Tente novamente.');
        setLoading(false);
      }
      return;
    }
    
    // APENAS SE senhaPreenchida FOR FALSE, validar a senha
    console.log('Validando senha (senhaPreenchida é false)');
    
    if (!password || password.length < 8) {
      alert('Senha deve ter mínimo 8 caracteres');
      return;
    }
    
    if (!confirmPassword) {
      alert('Confirmação de senha é obrigatória');
      return;
    }

    if (password !== confirmPassword) {
      alert('As senhas não conferem');
      return;
    }

    setLoading(true);
    
    try {
      // Salva dados no localStorage
      const dadosCadastro = {
        ...formData,
        cnpj: cnpjValue.replace(/\D/g, ''),
        password,
        timestamp: new Date().toISOString()
      };
      
      console.log('📝 Salvando cadastro (nova senha):', dadosCadastro);
      localStorage.setItem('dadosCadastroEmpresa', JSON.stringify(dadosCadastro));
      
      // Salva no banco de dados através da API
      console.log('🔄 Enviando para API /api/company/update-registration...');
      const response = await fetch('/api/company/update-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCadastro)
      });

      console.log('📊 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro na resposta:', errorData);
        throw new Error('Erro ao salvar cadastro');
      }

      const data = await response.json();
      console.log('✅ Cadastro salvo com sucesso:', data);
      
      // Simula delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redireciona para sucesso
      console.log('🚀 Redirecionando para /company/success');
      router.push('/company/success');
    } catch (error) {
      console.error('❌ Erro:', error);
      alert('Erro ao salvar cadastro. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#001f3f', textAlign: 'center', marginBottom: '30px' }}>CADASTRO COMPLETO - EMPRESA</h1>
        
        <form onSubmit={handleSubmit}>
          {/* CNPJ FIELD */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              CNPJ *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={cnpjValue}
                onChange={handleCnpjChange}
                placeholder="XX.XXX.XXX/XXXX-XX"
                style={{
                  width: '100%',
                  padding: '15px',
                  border: `3px solid ${cnpjValidado ? '#28a745' : '#001f3f'}`,
                  borderRadius: '10px',
                  fontSize: '16px',
                  backgroundColor: cnpjValidado ? '#e8f5e8' : '#fff',
                  color: '#001f3f',
                  boxSizing: 'border-box'
                }}
              />
              {consultandoCNPJ && (
                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#001f3f', fontSize: '16px' }}>
                  🔍 Consultando...
                </div>
              )}
              {!consultandoCNPJ && cnpjValue.length >= 18 && (
                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                  {cnpjValidado ? '✅ Válido' : '❌ Inválido'}
                </div>
              )}
            </div>
            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Digite apenas números - a formatação será aplicada automaticamente
            </small>
            {cnpjValue.length > 0 && !cnpjValidado && !consultandoCNPJ && (
              <div style={{ backgroundColor: '#f8d7da', border: '2px solid #dc3545', color: '#721c24', padding: '12px', borderRadius: '6px', marginTop: '10px', fontWeight: 'bold' }}>
                ❌ CNPJ incorreto ou não encontrado. Verifique e digite novamente.
              </div>
            )}
          </div>

          {/* COMPANY NAME - AUTO-FILLED */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              RAZÃO SOCIAL *
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              placeholder={cnpjValidado ? "Preenchido automaticamente" : "Será preenchido ao validar CNPJ"}
              style={{
                width: '100%',
                padding: '15px',
                border: '3px solid #001f3f',
                borderRadius: '10px',
                fontSize: '16px',
                backgroundColor: cnpjData?.nome ? '#e8f5e8' : '#fff',
                color: '#001f3f',
                boxSizing: 'border-box'
              }}
              disabled={!cnpjValidado}
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              {cnpjValidado ? '✅ Preenchido automaticamente a partir do CNPJ' : '⏳ Será preenchido automaticamente quando validar o CNPJ'}
            </small>
          </div>

          {/* SETOR INDUSTRIAL */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              SETOR INDUSTRIAL *
            </label>
            <select
              required
              value={formData.setor}
              onChange={(e) => setFormData({...formData, setor: e.target.value})}
              style={{
                width: '100%',
                padding: '15px',
                border: '3px solid #001f3f',
                borderRadius: '10px',
                fontSize: '16px',
                backgroundColor: '#fff',
                color: '#001f3f',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Selecione o setor</option>
              <option value="metalurgica">Metalúrgica</option>
              <option value="automotiva">Automotiva</option>
              <option value="quimica">Química</option>
              <option value="alimenticia">Alimentícia</option>
              <option value="textil">Têxtil</option>
              <option value="construcao">Construção</option>
              <option value="eletronica">Eletrônica</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* COMPANY SIZE */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              PORTE DA EMPRESA *
            </label>
            <select
              required
              value={formData.porte}
              onChange={(e) => setFormData({...formData, porte: e.target.value})}
              style={{
                width: '100%',
                padding: '15px',
                border: '3px solid #001f3f',
                borderRadius: '10px',
                fontSize: '16px',
                backgroundColor: '#fff',
                color: '#001f3f',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Selecione o porte</option>
              <option value="micro">Microempresa (até 19 funcionários)</option>
              <option value="pequena">Pequena (20-99 funcionários)</option>
              <option value="media">Média (100-499 funcionários)</option>
              <option value="grande">Grande (500+ funcionários)</option>
            </select>
          </div>

          {/* ADDRESS */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              ENDEREÇO COMPLETO *
            </label>
            <input
              type="text"
              required
              placeholder="Rua, número, bairro, cidade - UF"
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              style={{
                width: '100%',
                padding: '15px',
                border: '3px solid #001f3f',
                borderRadius: '10px',
                fontSize: '16px',
                backgroundColor: cnpjData?.endereco ? '#e8f5e8' : '#fff',
                color: '#001f3f',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* EMAIL */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              E-MAIL CORPORATIVO *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                const email = e.target.value;
                setFormData({...formData, email});
                if (email && !isValidEmail(email)) {
                  setEmailError('Email inválido');
                } else {
                  setEmailError('');
                }
              }}
              style={{
                width: '100%',
                padding: '15px',
                border: `3px solid ${emailError ? '#dc3545' : '#001f3f'}`,
                borderRadius: '10px',
                fontSize: '16px',
                backgroundColor: cnpjData?.email ? '#e8f5e8' : '#fff',
                color: '#001f3f',
                boxSizing: 'border-box'
              }}
            />
            {emailError && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>❌ {emailError}</span>}
          </div>



          {/* PHONE */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              TELEFONE PARA CONTATO *
            </label>
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => {
                const value = e.target.value;
                const telefoneLimpo = value.replace(/\D/g, '');
                
                // Formata: (XX) XXXXX-XXXX
                let telefoneFormatado = '';
                if (telefoneLimpo.length > 0) {
                  if (telefoneLimpo.length <= 2) {
                    telefoneFormatado = '(' + telefoneLimpo;
                  } else if (telefoneLimpo.length <= 7) {
                    telefoneFormatado = '(' + telefoneLimpo.slice(0, 2) + ') ' + telefoneLimpo.slice(2);
                  } else {
                    telefoneFormatado = '(' + telefoneLimpo.slice(0, 2) + ') ' + telefoneLimpo.slice(2, 7) + '-' + telefoneLimpo.slice(7, 11);
                  }
                }
                
                setFormData({...formData, telefone: telefoneFormatado});
              }}
              style={{
                width: '100%',
                padding: '15px',
                border: '3px solid #001f3f',
                borderRadius: '10px',
                fontSize: '16px',
                backgroundColor: cnpjData?.telefone ? '#e8f5e8' : '#fff',
                color: '#001f3f',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* RESPONSIBLE */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              NOME DO RESPONSÁVEL PELO RECRUTAMENTO *
            </label>
            <input
              type="text"
              required
              value={formData.responsavel}
              onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
              style={{
                width: '100%',
                padding: '15px',
                border: '3px solid #001f3f',
                borderRadius: '10px',
                fontSize: '16px',
                backgroundColor: '#fff',
                color: '#001f3f',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* DESCRIPTION */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>
              DESCRIÇÃO DA EMPRESA (OPCIONAL)
            </label>
            <textarea
              placeholder="Conte um pouco sobre sua empresa, cultura organizacional, benefícios oferecidos..."
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              style={{
                width: '100%',
                padding: '15px',
                border: '3px solid #001f3f',
                borderRadius: '10px',
                minHeight: '100px',
                resize: 'vertical',
                fontSize: '16px',
                backgroundColor: '#fff',
                color: '#001f3f',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* IMPORTANT NOTICE */}
          <div style={{ backgroundColor: '#fff3cd', border: '4px solid #856404', borderRadius: '20px', padding: '30px', marginTop: '30px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', position: 'relative', marginBottom: '25px' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '20px', backgroundColor: '#856404', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              ⚠️ AVISO IMPORTANTE
            </div>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0', color: '#856404', fontSize: '18px', lineHeight: '1.6', fontWeight: '600', textAlign: 'center' }}>
                <strong>Documentos comprobatórios podem ser solicitados</strong> para verificar a veracidade das informações fornecidas.
              </p>
            </div>
          </div>

          {/* PRIVACY NOTICE */}
          <div style={{ backgroundColor: '#e7f3ff', border: '4px solid #0066cc', borderRadius: '20px', padding: '30px', marginTop: '30px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', position: 'relative', marginBottom: '25px' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '20px', backgroundColor: '#0066cc', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              🔒 PRIVACIDADE E ANONIMATO
            </div>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0', color: '#0066cc', fontSize: '18px', lineHeight: '1.6', fontWeight: '600', textAlign: 'center' }}>
                <strong>Suas informações são protegidas.</strong> Os dados fornecidos serão utilizados exclusivamente para fins de recrutamento e seleção.
              </p>
            </div>
          </div>

          {/* TERMS DECLARATION */}
          <div style={{ marginTop: '35px', padding: '30px', border: '4px solid #dc3545', borderRadius: '20px', backgroundColor: '#f8d7da', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', position: 'relative', marginBottom: '25px' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '20px', backgroundColor: '#dc3545', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              📋 OBRIGATÓRIO
            </div>
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ color: '#721c24', margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>
                DECLARAÇÃO DE VERACIDADE
              </h4>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '18px', lineHeight: '1.6', backgroundColor: 'white', padding: '20px', borderRadius: '10px', border: '2px solid #721c24' }}>
                <input
                  type="checkbox"
                  required
                  style={{ marginRight: '20px', marginTop: '6px', transform: 'scale(2)', accentColor: '#dc3545' }}
                />
                <span style={{ color: '#721c24', fontWeight: '600' }}>
                  <strong>Declaro que todas as informações fornecidas são verdadeiras</strong> e estou ciente de que a prestação de informações falsas pode resultar na suspensão ou cancelamento da conta, além de eventuais medidas legais cabíveis.
                </span>
              </label>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ marginTop: '50px', textAlign: 'center' }}>
            <button
              type="submit"
              disabled={!cnpjValidado || loading}
              style={{
                backgroundColor: loading ? '#ffc107' : (cnpjValidado ? '#001f3f' : '#6c757d'),
                color: loading ? '#000' : 'white',
                padding: '25px 40px',
                border: 'none',
                borderRadius: '20px',
                fontWeight: '900',
                cursor: (cnpjValidado && !loading) ? 'pointer' : 'not-allowed',
                fontSize: '20px',
                width: '100%',
                maxWidth: '400px',
                transition: 'all 0.3s',
                boxShadow: cnpjValidado && !loading ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
                opacity: (cnpjValidado && !loading) ? 1 : 0.6
              }}
            >
              {loading ? '⏳ CRIANDO CONTA...' : (cnpjValidado ? '🚀 FINALIZAR CADASTRO' : '❌ CNPJ INVÁLIDO')}
            </button>
            <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>Ao clicar, você concorda com os termos acima</p>
          </div>
        </form>
      </div>
    </div>
  );
}
