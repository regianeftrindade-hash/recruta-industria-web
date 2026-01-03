"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { isValidEmail, isValidCNPJ, sanitizeInput } from '../../../lib/security';

export default function CadastroEmpresa() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cnpjData, setCnpjData] = useState<{ nome: string; endereco: string; email: string; telefone: string } | null>(null);
  const [cnpjValue, setCnpjValue] = useState('');
  const [cnpjValidado, setCnpjValidado] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    email: '',
    telefone: '',
    setor: '',
    porte: '',
    responsavel: '',
    descricao: ''
  });

  // Simulação de dados de CNPJ (em produção, isso viria de uma API)
  const mockCnpjData: { [key: string]: { nome: string; endereco: string; email: string; telefone: string } } = {
    "12345678000123": {
      nome: "Empresa ABC Ltda",
      endereco: "Rua das Flores, 123 - Centro",
      email: "contato@empresaabc.com.br",
      telefone: "(11) 99999-8888"
    },
    "98765432000145": {
      nome: "Indústria XYZ S.A.",
      endereco: "Av. Industrial, 456 - Distrito Industrial",
      email: "rh@industriaxyz.com.br",
      telefone: "(11) 88888-7777"
    },
    "11122233000167": {
      nome: "Metalúrgica Silva & Cia",
      endereco: "Rua dos Metais, 789 - Zona Industrial",
      email: "recrutamento@metalurgicasilva.com.br",
      telefone: "(11) 77777-6666"
    }
  };

  const consultarCNPJ = async (cnpj: string) => {
    // Remove caracteres não numéricos
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    // Valida o CNPJ usando a função de segurança
    if (!isValidCNPJ(cnpjLimpo)) {
      alert('❌ CNPJ inválido! Verifique o número digitado.');
      setCnpjValidado(false);
      return;
    }
    
    // Verifica se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      setCnpjData(null);
      return;
    }

    setLoading(true);
    
    // Simula delay de API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Busca dados mockados
    const dados = mockCnpjData[cnpjLimpo];
    
    if (dados) {
      setCnpjData(dados);
      setFormData(prev => ({ ...prev, ...dados }));
      setCnpjValidado(true);
      alert('✅ Dados da empresa carregados automaticamente! Verifique e ajuste se necessário.');
    } else {
      setCnpjData(null);
      setCnpjValidado(false);
      alert('❌ CNPJ não encontrado na base de dados. O cadastro só pode ser realizado com CNPJ válido.');
    }
    
    setLoading(false);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Formatar CNPJ enquanto digita
    const formatted = value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
    
    setCnpjValue(formatted);
    
    // Consultar CNPJ quando completar
    if (formatted.replace(/\D/g, '').length === 14) {
      consultarCNPJ(formatted);
    } else {
      setCnpjData(null);
      setCnpjValidado(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const checkbox = form.querySelector('input[type="checkbox"]') as HTMLInputElement;
    
    // Verificar se CNPJ foi validado
    if (!cnpjValidado) {
      alert('❌ CNPJ não validado. Você deve informar um CNPJ válido existente na base de dados para realizar o cadastro.');
      const cnpjInput = form.querySelector('input[placeholder="00.000.000/0000-00"]') as HTMLInputElement;
      if (cnpjInput) {
        cnpjInput.style.borderColor = '#dc3545';
        cnpjInput.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.25)';
        setTimeout(() => {
          cnpjInput.style.borderColor = '#001f3f';
          cnpjInput.style.boxShadow = '';
        }, 3000);
      }
      return;
    }
    
    // Validar email
    if (!isValidEmail(formData.email)) {
      alert('❌ Email inválido! Verifique o endereço digitado.');
      return;
    }
    
    // Validar senhas
    if (!password || password.length < 8) {
      alert('❌ A senha deve ter no mínimo 8 caracteres!');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('❌ As senhas não conferem!');
      return;
    }
    
    if (!checkbox.checked) {
      alert('❌ Você deve aceitar a declaração de veracidade das informações para continuar com o cadastro.');
      const declaracaoDiv = form.querySelector('div[style*="f8d7da"]') as HTMLElement;
      if (declaracaoDiv) {
        declaracaoDiv.style.animation = 'shake 0.5s';
        setTimeout(() => {
          declaracaoDiv.style.animation = '';
        }, 500);
      }
      return;
    }
    
    // Sanitizar dados antes de enviar
    const sanitizedData = {
      ...formData,
      nome: sanitizeInput(formData.nome),
      endereco: sanitizeInput(formData.endereco),
      email: sanitizeInput(formData.email),
      responsavel: sanitizeInput(formData.responsavel),
      descricao: sanitizeInput(formData.descricao)
    };
    
    console.log('Dados sanitizados:', sanitizedData);
    router.push('/company/success');
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '50px 20px', fontFamily: 'Arial, sans-serif' }}>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}
      </style>
      <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: '#fff', padding: '50px', borderRadius: '20px', border: '4px solid #001f3f', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#001f3f', fontWeight: '900', textAlign: 'center', fontSize: '28px', marginBottom: '10px' }}>CADASTRO INDUSTRIAL (EMPRESA)</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '16px' }}>
          Preencha todos os campos obrigatórios (*) abaixo para cadastrar sua empresa.<br/>
          <small style={{ color: '#001f3f', fontWeight: 'bold' }}>💡 Digite o CNPJ completo para preenchimento automático dos dados</small>
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>NOME DA EMPRESA / INDÚSTRIA *</label>
            <input 
              type="text" 
              required 
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              style={{ width: '100%', padding: '15px', border: '3px solid #001f3f', borderRadius: '10px', fontSize: '16px', backgroundColor: cnpjData?.nome ? '#e8f5e8' : '#fff', color: '#001f3f' }} 
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>CNPJ *</label>
            <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              required 
              placeholder="00.000.000/0000-00" 
              value={cnpjValue}
              onChange={handleCnpjChange}
              style={{ 
                width: '100%', 
                padding: '15px', 
                border: `3px solid ${cnpjValidado ? '#28a745' : cnpjValue.length > 0 && !cnpjValidado ? '#dc3545' : '#001f3f'}`, 
                borderRadius: '10px', 
                fontSize: '16px', 
                backgroundColor: cnpjValidado ? '#e8f5e8' : '#fff', 
                color: '#001f3f' 
              }} 
            />
              {loading && (
                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#001f3f', fontSize: '16px' }}>
                  🔍 Consultando...
                </div>
              )}
              {!loading && cnpjValue.length >= 18 && (
                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                  {cnpjValidado ? '✅' : '❌'}
                </div>
              )}
            </div>
            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Digite apenas números - a formatação será aplicada automaticamente<br/>
              <strong style={{ color: '#dc3545' }}>⚠️ CNPJ deve ser válido e existente na base de dados para permitir o cadastro</strong>
            </small>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>SETOR INDUSTRIAL *</label>
            <select required value={formData.setor} onChange={(e) => setFormData({...formData, setor: e.target.value})} style={{ width: '100%', padding: '15px', border: '3px solid #001f3f', borderRadius: '10px', fontSize: '16px', backgroundColor: '#fff', color: '#001f3f' }}>
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
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>PORTE DA EMPRESA *</label>
            <select required value={formData.porte} onChange={(e) => setFormData({...formData, porte: e.target.value})} style={{ width: '100%', padding: '15px', border: '3px solid #001f3f', borderRadius: '10px', fontSize: '16px', backgroundColor: '#fff', color: '#001f3f' }}>
              <option value="">Selecione o porte</option>
              <option value="micro">Microempresa (até 19 funcionários)</option>
              <option value="pequena">Pequena (20-99 funcionários)</option>
              <option value="media">Média (100-499 funcionários)</option>
              <option value="grande">Grande (500+ funcionários)</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>ENDEREÇO COMPLETO *</label>
            <input 
              type="text" 
              required 
              placeholder="Rua, número, bairro, cidade - UF" 
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              style={{ width: '100%', padding: '15px', border: '3px solid #001f3f', borderRadius: '10px', fontSize: '16px', backgroundColor: cnpjData?.endereco ? '#e8f5e8' : '#fff', color: '#001f3f' }} 
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>E-MAIL CORPORATIVO *</label>
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
              style={{ width: '100%', padding: '15px', border: `3px solid ${emailError ? '#dc3545' : '#001f3f'}`, borderRadius: '10px', fontSize: '16px', backgroundColor: cnpjData?.email ? '#e8f5e8' : '#fff', color: '#001f3f' }} 
            />
            {emailError && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>❌ {emailError}</span>}
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>SENHA DE ACESSO *</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              style={{ width: '100%', padding: '15px', border: '3px solid #001f3f', borderRadius: '10px', fontSize: '16px', backgroundColor: '#fff', color: '#001f3f' }} 
            />
            {password && <PasswordStrengthMeter password={password} />}
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>CONFIRMAR SENHA *</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              style={{ width: '100%', padding: '15px', border: `3px solid ${confirmPassword && password !== confirmPassword ? '#dc3545' : '#001f3f'}`, borderRadius: '10px', fontSize: '16px', backgroundColor: '#fff', color: '#001f3f' }} 
            />
            {confirmPassword && password !== confirmPassword && (
              <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>❌ As senhas não conferem</span>
            )}
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>TELEFONE PARA CONTATO *</label>
            <input 
              type="tel" 
              required 
              placeholder="(11) 99999-9999" 
              value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
              style={{ width: '100%', padding: '15px', border: '3px solid #001f3f', borderRadius: '10px', fontSize: '16px', backgroundColor: cnpjData?.telefone ? '#e8f5e8' : '#fff', color: '#001f3f' }} 
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>NOME DO RESPONSÁVEL PELO RECRUTAMENTO *</label>
            <input type="text" required value={formData.responsavel} onChange={(e) => setFormData({...formData, responsavel: e.target.value})} style={{ width: '100%', padding: '15px', border: '3px solid #001f3f', borderRadius: '10px', fontSize: '16px', backgroundColor: '#fff', color: '#001f3f' }} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#001f3f', fontSize: '16px' }}>DESCRIÇÃO DA EMPRESA (OPCIONAL)</label>
            <textarea placeholder="Conte um pouco sobre sua empresa, cultura organizacional, benefícios oferecidos..." value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} style={{ width: '100%', padding: '15px', border: '3px solid #001f3f', borderRadius: '10px', minHeight: '100px', resize: 'vertical', fontSize: '16px', backgroundColor: '#fff', color: '#001f3f' }}></textarea>
          </div>

          <div style={{ backgroundColor: '#fff3cd', border: '4px solid #856404', borderRadius: '20px', padding: '30px', marginTop: '30px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '20px', backgroundColor: '#856404', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>⚠️ AVISO IMPORTANTE</div>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0', color: '#856404', fontSize: '18px', lineHeight: '1.6', fontWeight: '600', textAlign: 'center' }}>
                <strong>Documentos comprobatórios podem ser solicitados</strong> para verificar a veracidade das informações fornecidas.<br/>
                Mantenha seus documentos atualizados para agilizar o processo de validação da conta.
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#e7f3ff', border: '4px solid #0066cc', borderRadius: '20px', padding: '30px', marginTop: '30px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '20px', backgroundColor: '#0066cc', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>🔒 PRIVACIDADE E ANONIMATO</div>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0', color: '#0066cc', fontSize: '18px', lineHeight: '1.6', fontWeight: '600', textAlign: 'center' }}>
                <strong>Suas informações são protegidas.</strong> Os dados fornecidos serão utilizados exclusivamente para fins de recrutamento e seleção.<br/>
                <small style={{ fontSize: '14px', color: '#004499' }}>🔒 Seus dados pessoais permanecem anônimos e confidenciais durante todo o processo.</small>
              </p>
            </div>
          </div>

          <div style={{ marginTop: '35px', padding: '30px', border: '4px solid #dc3545', borderRadius: '20px', backgroundColor: '#f8d7da', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '20px', backgroundColor: '#dc3545', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>📋 OBRIGATÓRIO</div>
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ color: '#721c24', margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>DECLARAÇÃO DE VERACIDADE</h4>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '18px', lineHeight: '1.6', backgroundColor: 'white', padding: '20px', borderRadius: '10px', border: '2px solid #721c24' }}>
                <input type="checkbox" required style={{ marginRight: '20px', marginTop: '6px', transform: 'scale(2)', accentColor: '#dc3545' }} />
                <span style={{ color: '#721c24', fontWeight: '600' }}>
                  <strong>Declaro que todas as informações fornecidas são verdadeiras</strong> e estou ciente de que a prestação de informações falsas pode resultar na suspensão ou cancelamento da conta, além de eventuais medidas legais cabíveis.
                </span>
              </label>
            </div>
          </div>

          <div style={{ marginTop: '50px', textAlign: 'center' }}>
            <button 
              type="submit" 
              disabled={!cnpjValidado}
              style={{ 
                backgroundColor: cnpjValidado ? '#001f3f' : '#6c757d', 
                color: 'white', 
                padding: '25px 40px', 
                border: 'none', 
                borderRadius: '20px', 
                fontWeight: '900', 
                cursor: cnpjValidado ? 'pointer' : 'not-allowed', 
                fontSize: '20px', 
                width: '100%', 
                maxWidth: '400px', 
                transition: 'all 0.3s', 
                boxShadow: cnpjValidado ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
                opacity: cnpjValidado ? 1 : 0.6
              }}
            >
              {cnpjValidado ? '🚀 FINALIZAR CADASTRO' : '❌ CNPJ INVÁLIDO - CADASTRO BLOQUEADO'}
            </button>
            <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>Ao clicar, você concorda com os termos acima</p>
          </div>
        </form>
      </div>
    </div>
  );
}