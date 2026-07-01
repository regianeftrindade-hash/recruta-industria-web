/**
 * 🔒 PÁGINA DE CADASTRO PROFISSIONAL - BLOQUEADA PARA ALTERAÇÕES
 * ============================================================
 * ⚠️ ATENÇÃO: Esta página foi finalizada e aprovada.
 * 
 * RESTRIÇÕES:
 * ✗ NÃO alterar layout ou estrutura principal
 * ✗ NÃO remover campos obrigatórios
 * ✗ NÃO modificar validações críticas
 * ✗ NÃO alterar fluxo de cadastro
 * 
 * ALTERAÇÕES PERMITIDAS:
 * ✓ Adicionar novos campos opcionais
 * ✓ Modificar mensagens de erro
 * ✓ Atualizar validações de segurança
 * ✓ Melhorar UX/UI mantendo layout
 * 
 * Última atualização: 02/01/2026
 * Status: ✅ FINALIZADO E APROVADO
 */

"use client";

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './register.module.css';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { isValidEmail, isValidCPF, sanitizeInput } from '../../../lib/security';

export default function CadastroProfissional() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [cpf, setCpf] = useState('');
  const [senhaPreenchida, setSenhaPreenchida] = useState(false); // Rastreia se senha foi carregada do localStorage
  const [cpfError, setCpfError] = useState('');
  const [cpfValidating, setCpfValidating] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [telefone2, setTelefone2] = useState('');
  const [pretensaoSalarial, setPretensaoSalarial] = useState('');
  const [cursos, setCursos] = useState<string[]>(['']);
  const [dataNascimentoValue, setDataNascimentoValue] = useState('');
  const [empresas, setEmpresas] = useState<{nome: string, cargo: string, dataInicio: string, dataFim: string}[]>([{nome: '', cargo: '', dataInicio: '', dataFim: ''}]);
  
  const [formData, setFormData] = useState({
    nome: '', dataNascimento: '', idade: '', sexoBiologico: '', identidadeGenero: '', orientacaoSexual: '', estadoCivil: '', religiao: '', antecedentes: '',
    possuiFilhos: 'Não', quantidadeFilhos: '', faixaEtariaFilhos: [] as string[],
    email: '', telefone: '', telefone2: '', whatsapp: 'Não',
    estado: '', cidade: '', disponibilidadeMudanca: '',
    escolaridade: '', cursosCertificacoes: '',
    situacaoProfissional: '', areaInteresse: '', cargoDesejado: '', turnoDisponivel: '', disponibilidadeInicio: '',
    trabalhouIndustria: 'Não', tempoExperiencia: '', experiencias: '',
    recolocacao: '', pretensaoSalarial: '',
    fotoPerfil: null as string | null, curriculo: null as string | null, atestado: null as string | null,
    mensagemEmpresas: '',
    autorizoDados: false, declaroVerdadeiro: false
  });

  const [cidades, setCidades] = useState<string[]>([]);
  const listaEstados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  // Carrega dados do cadastro simples quando a página abre
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dadosSalvos = localStorage.getItem('dadosCadastroSimples');
      if (dadosSalvos) {
        try {
          const dados = JSON.parse(dadosSalvos);
          // Pré-preenche os campos com os dados do cadastro simples
          setFormData(prev => ({
            ...prev,
            nome: dados.nome || prev.nome,
            email: dados.email || prev.email,
            telefone: dados.telefone || prev.telefone,
          }));
          setCpf(dados.cpf || '');
          setTelefone(dados.telefone || '');
          
          // Preenche a senha se houver
          if (dados.password) {
            setPassword(dados.password);
            setConfirmPassword(dados.password);
            setSenhaPreenchida(true); // Marca que a senha foi carregada
          } else {
            // Se não há password nos dados, também marcar como preenchida
            setSenhaPreenchida(true);
          }
          
          console.log('✅ Dados do cadastro simples carregados automaticamente:', dados);
        } catch (err) {
          console.error('Erro ao carregar dados do cadastro simples:', err);
          // Em caso de erro, marcar como preenchida para não pedir senha
          setSenhaPreenchida(true);
        }
      } else {
        // Se não há dados no localStorage, significa que é Google Auth
        // Marcar senha como preenchida para não mostrar campos de senha
        setSenhaPreenchida(true);
      }
      
      // Carregar dados do formulário completo se houver
      const dadosFormulario = localStorage.getItem('dadosFormularioCompleto');
      if (dadosFormulario) {
        try {
          const dados = JSON.parse(dadosFormulario);
          console.log('📥 Restaurando do localStorage:', {dataNascimentoDisplay: dados.dataNascimentoDisplay, dataNascimento: dados.dataNascimento});
          
          // Restaurar APENAS dataNascimentoDisplay (o que o usuário vê e digita)
          if (dados.dataNascimentoDisplay) {
            console.log('✅ Restaurando dataNascimentoDisplay:', dados.dataNascimentoDisplay);
            setDataNascimentoValue(dados.dataNascimentoDisplay);
          }
          
          // Restaurar apenas os campos do formData EXCETO dataNascimento (vamos usar o display)
          const formDataRestored: Partial<typeof formData> = {};
          (Object.keys(formData) as Array<keyof typeof formData>).forEach(key => {
            if (key !== 'dataNascimento' && key in dados && dados[key] !== undefined) {
              formDataRestored[key] = dados[key] as any;
            }
          });
          
          setFormData(prev => ({...prev, ...formDataRestored}));
          
          // Restaurar cpf
          if (dados.cpf) {
            setCpf(dados.cpf);
          }
          
          console.log('✅ Dados do formulário completo restaurados');
        } catch (err) {
          console.error('Erro ao carregar dados do formulário:', err);
        }
      }
    }
  }, []);

  // Salvar dados do formulário no localStorage sempre que mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Só salvar se houver algum dado preenchido
      if (Object.values(formData).some(v => v !== '' && v !== false && v !== null) || dataNascimentoValue || cpf) {
        const dadosParaSalvar = {
          ...formData,
          cpf: cpf,
          dataNascimentoDisplay: dataNascimentoValue
        };
        console.log('💾 SALVANDO no localStorage:', {
          dataNascimentoDisplay: dataNascimentoValue,
          dataNascimento: formData.dataNascimento
        });
        localStorage.setItem('dadosFormularioCompleto', JSON.stringify(dadosParaSalvar));
      }
    }
  }, [formData, cpf, dataNascimentoValue]);

  useEffect(() => {
    if (formData.estado) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.estado}/municipios`)
        .then(res => res.json())
        .then(data => setCidades(data.map((c: any) => c.nome).sort()));
    }
  }, [formData.estado]);

  return (
    <div className={styles.container}>
      <div className={styles.card} role="main" aria-labelledby="register-title">
        <h1 id="register-title" className={styles.title}>Cadastro do profissional</h1>

        <form onSubmit={(e) => { 
          e.preventDefault();
          
          console.log('=== SUBMIT PROFISSIONAL ===');
          console.log('CPF:', cpf);
          console.log('CPF Error:', cpfError);
          console.log('senhaPreenchida:', senhaPreenchida);
          console.log('password length:', password.length);
          
          // VALIDAÇÃO 1: CPF obrigatório
          if (!cpf || cpf.length < 14) {
            alert('CPF é obrigatório e deve estar completo (000.000.000-00)');
            return;
          }
          
          // VALIDAÇÃO 2: CPF não pode ter erro
          if (cpfError) {
            alert('CPF inválido: ' + cpfError);
            return;
          }
          
          // APENAS SE senhaPreenchida FOR FALSE, validar a senha
          console.log('Validando senha (senhaPreenchida é false)');
          
          if (!password || password.length < 8) {
            alert('Senha deve ter mínimo 8 caracteres');
            return;
          }
          if (!confirmPassword || password !== confirmPassword) {
            alert('As senhas não conferem');
            return;
          }
          
          // Se chegou aqui, fazer POST para registrar
          const cpfLimpo = cpf.replace(/\D/g, ''); // Remove pontuação
          fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              password: password,
              confirmPassword: confirmPassword,
              userType: 'professional',
              cpf: cpfLimpo,
              name: formData.nome
              ,
              curricoURL: formData.curriculo || null,
              atestadoURL: formData.atestado || null,
              fotoPerfil: formData.fotoPerfil || null,
            })
          })
          .then(res => res.json())
            .then(async (data) => {
              if (data.success) {
                console.log('✅ Usuário registrado com sucesso');
                // Tentar autenticar automaticamente
                const signResult: any = await signIn('credentials', { redirect: false, email: formData.email, password });
                if (signResult?.ok) {
                  console.log('✅ Login automático realizado');
                  // Enviar dados completos do perfil
                  fetch('/api/professional/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                  })
                    .then(res => {
                      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                      return res.json();
                    })
                    .then(data => {
                      if (data.success) {
                        console.log('✅ Perfil salvo com sucesso');
                        localStorage.removeItem('dadosFormularioCompleto');
                        localStorage.removeItem('dadosCadastroSimples');
                        router.push('/professional/dashboard/painel');
                      } else {
                        console.error('Erro:', data);
                        alert('Erro ao salvar perfil: ' + (data.error || 'Desconhecido'));
                      }
                    })
                    .catch(err => {
                      console.error('Erro ao salvar perfil:', err);
                      alert('Erro ao conectar ao servidor: ' + err.message);
                    });
                  return;
                }
                // Se não autenticou automaticamente, direcionar para login
                alert('Cadastro realizado. Faça login para completar o perfil.');
                router.push('/login');
              } else {
                throw new Error(data.error || 'Erro ao registrar');
              }
            })
            .catch(err => {
              console.error('Erro:', err);
              alert('Erro ao conectar ao servidor');
            });
        }} className={styles.form}>
          
          <section>
            <h2 className={styles.sectionTitle}>Dados pessoais</h2>
            
            <label className={styles.label} htmlFor="nome">Nome completo *</label>
            <input 
              id="nome" 
              type="text" 
              required 
              className={styles.input}
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
            />

            <label className={styles.label} htmlFor="cpf">CPF *</label>
            <input 
              id="cpf" 
              type="text" 
              required 
              className={styles.input}
              placeholder="000.000.000-00"
              maxLength={14}
              value={cpf}
              onChange={(e) => {
                const value = e.target.value;
                const cpfLimpo = value.replace(/\D/g, '');
                
                // Limitar a 11 dígitos (não permite digitar mais)
                if (cpfLimpo.length > 11) return;
                
                // Formatar CPF automaticamente: XXX.XXX.XXX-XX
                let cpfFormatado = '';
                if (cpfLimpo.length > 0) {
                  cpfFormatado = cpfLimpo.slice(0, 3);
                  if (cpfLimpo.length > 3) {
                    cpfFormatado += '.' + cpfLimpo.slice(3, 6);
                  }
                  if (cpfLimpo.length > 6) {
                    cpfFormatado += '.' + cpfLimpo.slice(6, 9);
                  }
                  if (cpfLimpo.length > 9) {
                    cpfFormatado += '-' + cpfLimpo.slice(9, 11);
                  }
                }
                
                setCpf(cpfFormatado);
                
                // Validar CPF contra banco de dados apenas quando completo
                if (cpfLimpo.length === 11) {
                  setCpfValidating(true);
                  fetch('/api/auth/validate-cpf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cpf: cpfLimpo })
                  })
                    .then(res => res.json())
                    .then(data => {
                      if (data.valid) {
                        setCpfError('');
                      } else {
                        setCpfError(data.message);
                      }
                      setCpfValidating(false);
                    })
                    .catch(err => {
                      console.error('Erro ao validar CPF:', err);
                      setCpfValidating(false);
                    });
                } else {
                  setCpfError('');
                }
              }}
              style={{ borderColor: cpfError ? '#dc3545' : undefined }}
            />
            {cpfValidating && (
              <div style={{
                color: '#0c5460',
                fontSize: '13px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#d1ecf1',
                border: '1px solid #bee5eb',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>⏳</span>
                <span><strong>Validando CPF...</strong></span>
              </div>
            )}
            {!cpfValidating && cpfError && (
              <div style={{
                color: '#dc3545',
                fontSize: '13px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <span><strong>Erro:</strong> {cpfError}</span>
              </div>
            )}
            {!cpfValidating && cpf.length === 14 && !cpfError && (
              <div style={{
                color: '#155724',
                fontSize: '13px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>✅</span>
                <span><strong>CPF válido e disponível!</strong></span>
              </div>
            )}

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="dataNascimento">Data de nascimento (DD/MM/AAAA) *</label>
                <input 
                  id="dataNascimento" 
                  type="text"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  required 
                  className={styles.input}
                  value={dataNascimentoValue}
                  onChange={e => {
                    let value = e.target.value.replace(/\D/g, ''); // Remove não-números
                    
                    // Formata como DD/MM/AAAA enquanto digita
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2);
                    }
                    if (value.length >= 5) {
                      value = value.slice(0, 5) + '/' + value.slice(5, 9);
                    }
                    
                    setDataNascimentoValue(value);
                    
                    // Se completou a data (DD/MM/AAAA)
                    if (value.length === 10) {
                      const [day, month, year] = value.split('/');
                      const dayNum = parseInt(day);
                      const monthNum = parseInt(month);
                      const yearNum = parseInt(year);
                      
                      console.log('🎯 Data digitada:', {digitado: value, day, month, year, dayNum, monthNum, yearNum});
                      
                      // Validar data
                      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum > 1900) {
                        const birth = new Date(yearNum, monthNum - 1, dayNum);
                        const today = new Date();
                        
                        // Verificar se a data é válida (ex: 31/02 não existe)
                        if (birth.getDate() === dayNum) {
                          const age = today.getFullYear() - birth.getFullYear();
                          const monthDiff = today.getMonth() - birth.getMonth();
                          const dayDiff = today.getDate() - birth.getDate();
                          
                          // Ajustar idade se o aniversário ainda não ocorreu este ano
                          const finalAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
                          
                          // Converter para YYYY-MM-DD para armazenar
                          const isoDate = `${String(yearNum).padStart(4, '0')}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          console.log('💾 Salvando:', {display: value, iso: isoDate, age: finalAge});
                          setFormData({...formData, dataNascimento: isoDate, idade: finalAge.toString()});
                        } else {
                          console.warn('⚠️ Data inválida detectada:', {digitado: value, birthDate: birth.toLocaleDateString(), dayNum});
                        }
                      }
                    }
                  }} 
                />
              </div>
              <div>
                <label className={styles.label} htmlFor="idade">Idade *</label>
                <input id="idade" type="text" required className={styles.input} value={formData.idade} onChange={e => setFormData({...formData, idade: e.target.value})} />
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="sexoBiologico">Sexo biológico *</label>
                <select
                  id="sexoBiologico"
                  className={styles.select}
                  required
                  value={formData.sexoBiologico}
                  onChange={e => setFormData({...formData, sexoBiologico: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option>Masculino</option>
                  <option>Feminino</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="identidadeGenero">Identidade de gênero *</label>
                <select
                  id="identidadeGenero"
                  className={styles.select}
                  required
                  value={formData.identidadeGenero}
                  onChange={e => setFormData({...formData, identidadeGenero: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option>Cisgênero</option>
                  <option>Transgênero</option>
                  <option>Não-binário</option>
                  <option>Outro</option>
                  <option>Prefiro não responder</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="orientacaoSexual">Orientação sexual *</label>
                <select
                  id="orientacaoSexual"
                  className={styles.select}
                  required
                  value={formData.orientacaoSexual}
                  onChange={e => setFormData({...formData, orientacaoSexual: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option>Heterossexual</option>
                  <option>Homossexual</option>
                  <option>Bissexual</option>
                  <option>Outro</option>
                  <option>Prefiro não responder</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="estadoCivil">Estado civil *</label>
                <select
                  id="estadoCivil"
                  className={styles.select}
                  required
                  value={formData.estadoCivil}
                  onChange={e => setFormData({...formData, estadoCivil: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option>Solteiro</option>
                  <option>Casado</option>
                  <option>Divorciado</option>
                  <option>Viúvo</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="religiao">Religião *</label>
                <select
                  id="religiao"
                  className={styles.select}
                  required
                  value={formData.religiao}
                  onChange={e => setFormData({...formData, religiao: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option>Católico</option>
                  <option>Protestante</option>
                  <option>Espírita</option>
                  <option>Ateu</option>
                  <option>Outro</option>
                  <option>Prefiro não responder</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="antecedentes">Possui antecedentes criminais? *</label>
                <select
                  id="antecedentes"
                  className={styles.select}
                  required
                  value={formData.antecedentes}
                  onChange={e => setFormData({...formData, antecedentes: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Filhos</h2>
            
            <label className={styles.label} htmlFor="possuiFilhos">Possui filhos? *</label>
            <select id="possuiFilhos" className={styles.select} required value={formData.possuiFilhos} onChange={e => setFormData({...formData, possuiFilhos: e.target.value})}>
              <option>Não</option>
              <option>Sim</option>
            </select>

            {formData.possuiFilhos === 'Sim' && (
              <>
                <label className={styles.label} htmlFor="quantidadeFilhos">Quantidade de filhos *</label>
                <select 
                  id="quantidadeFilhos" 
                  className={styles.select} 
                  required
                  value={formData.quantidadeFilhos}
                  onChange={e => setFormData({...formData, quantidadeFilhos: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4+</option>
                </select>

                <fieldset>
                  <legend className={styles.label}>Faixa etária dos filhos</legend>
                  {['Menos de 1', '1 a 3', '3 a 5', '5 a 7', '7 a 9', '9 a 12', 'Acima de 12'].map(faixa => (
                    <label key={faixa} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={formData.faixaEtariaFilhos.includes(faixa)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({...formData, faixaEtariaFilhos: [...formData.faixaEtariaFilhos, faixa]});
                          } else {
                            setFormData({...formData, faixaEtariaFilhos: formData.faixaEtariaFilhos.filter(f => f !== faixa)});
                          }
                        }}
                      /> {faixa}
                    </label>
                  ))}
                </fieldset>
              </>
            )}
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Contato</h2>
            
            <label className={styles.label} htmlFor="email">E-mail *</label>
            <input 
              id="email" 
              type="email" 
              required 
              className={styles.input}
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
              style={{ borderColor: emailError ? '#dc3545' : undefined }}
            />
            {emailError && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>❌ {emailError}</span>}

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="telefone">Telefone (DDD) *</label>
                <input 
                  id="telefone" 
                  type="tel" 
                  required 
                  className={styles.input}
                  placeholder="(XX) XXXXX-XXXX"
                  value={telefone}
                  onChange={(e) => {
                    const value = e.target.value;
                    const telefoneLimpo = value.replace(/\D/g, '');
                    
                    // Formatar telefone automaticamente: (XX) XXXXX-XXXX
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
                    
                    setTelefone(telefoneFormatado);
                    setFormData({...formData, telefone: telefoneFormatado});
                  }}
                />
              </div>
              <div>
                <label className={styles.label} htmlFor="whatsapp">Este número é WhatsApp? *</label>
                <select
                  id="whatsapp"
                  className={styles.select}
                  required
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="telefone2">Telefone alternativo (DDD)</label>
                <input 
                  id="telefone2" 
                  type="tel" 
                  className={styles.input}
                  placeholder="(XX) XXXXX-XXXX"
                  value={telefone2}
                  onChange={(e) => {
                    const value = e.target.value;
                    const telefoneLimpo = value.replace(/\D/g, '');
                    
                    // Formatar telefone automaticamente: (XX) XXXXX-XXXX
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
                    
                    setTelefone2(telefoneFormatado);
                    setFormData({...formData, telefone2: telefoneFormatado});
                  }}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Localização</h2>
            
            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="estado">Estado (UF) *</label>
                <select id="estado" className={styles.select} required value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                  <option value="">Selecione</option>
                  {listaEstados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="cidade">Cidade *</label>
                <select
                  id="cidade"
                  className={styles.select}
                  required
                  value={formData.cidade}
                  onChange={e => setFormData({...formData, cidade: e.target.value})}
                >
                  <option value="">Escolha a cidade</option>
                  {cidades.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <label className={styles.label} htmlFor="disponibilidadeMudanca">Disponibilidade para mudança? *</label>
                <select
                  id="disponibilidadeMudanca"
                  className={styles.select}
                  required
                  value={formData.disponibilidadeMudanca}
                  onChange={e => setFormData({...formData, disponibilidadeMudanca: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                  <option value="Dependendo da oportunidade">Dependendo da oportunidade</option>
                </select>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Formação</h2>
            
            <label className={styles.label} htmlFor="escolaridade">Escolaridade *</label>
                <select
                  id="escolaridade"
                  className={styles.select}
                  required
                  value={formData.escolaridade}
                  onChange={e => setFormData({...formData, escolaridade: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option>Fundamental incompleto</option>
                  <option>Fundamental completo</option>
                  <option>Médio incompleto</option>
                  <option>Médio completo</option>
                  <option>Técnico</option>
                  <option>Superior incompleto</option>
                  <option>Superior completo</option>
                  <option>Pós-graduação</option>
                  <option>MBA</option>
                </select>

            <label className={styles.label}>Cursos / Certificações (Ex: Eletricista, Soldador) *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cursos.map((curso, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={`Curso ${index + 1}`}
                    value={curso}
                    required={index === 0}
                    onChange={(e) => {
                      const novosCursos = [...cursos];
                      novosCursos[index] = e.target.value;
                      setCursos(novosCursos);
                      setFormData({...formData, cursosCertificacoes: novosCursos.filter(c => c.trim()).join(', ')});
                    }}
                    style={{ flex: 1 }}
                  />
                  {cursos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const novosCursos = cursos.filter((_, i) => i !== index);
                        setCursos(novosCursos);
                        setFormData({...formData, cursosCertificacoes: novosCursos.filter(c => c.trim()).join(', ')});
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCursos([...cursos, '']);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginTop: '5px'
                }}
              >
                + Adicionar outro curso
              </button>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Perfil profissional</h2>
            
            <label className={styles.label} htmlFor="situacaoProfissional">Situação profissional atual *</label>
            <select 
              id="situacaoProfissional" 
              className={styles.select} 
              required
              value={formData.situacaoProfissional}
              onChange={e => setFormData({...formData, situacaoProfissional: e.target.value})}
            >
              <option value="">Selecione</option>
              <option value="Empregado">Empregado</option>
              <option value="Desempregado">Desempregado</option>
              <option value="Primeiro emprego">Primeiro emprego</option>
              <option value="Jovem Aprendiz (16 a 18)">Jovem Aprendiz (16 a 18)</option>
            </select>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="areaInteresse">Área de interesse *</label>
                <select 
                  id="areaInteresse" 
                  className={styles.select} 
                  required
                  value={formData.areaInteresse}
                  onChange={e => setFormData({...formData, areaInteresse: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option>Automotivo</option>
                  <option>Aviação</option>
                  <option>Celulose e Papel</option>
                  <option>Cerâmica</option>
                  <option>Construção Civil</option>
                  <option>Defesa e Segurança</option>
                  <option>Eletricidade</option>
                  <option>Eletrônica</option>
                  <option>Energia</option>
                  <option>Engenharia</option>
                  <option>Farmacêutica</option>
                  <option>Ferramentas</option>
                  <option>Fiação e Tecelagem</option>
                  <option>Fundição</option>
                  <option>Gás Industrial</option>
                  <option>Indústria Alimentícia</option>
                  <option>Indústria Beverages</option>
                  <option>Indústria Cosmética</option>
                  <option>Indústria de Embalagem</option>
                  <option>Indústria de Máquinas</option>
                  <option>Indústria de Plástico</option>
                  <option>Indústria de Química</option>
                  <option>Indústria de Vestuário</option>
                  <option>Indústria Gráfica</option>
                  <option>Indústria Metal-Mecânica</option>
                  <option>Indústria Têxtil</option>
                  <option>Infraestrutura</option>
                  <option>Instalações Elétricas</option>
                  <option>Laminação</option>
                  <option>Logística Industrial</option>
                  <option>Louças e Vidros</option>
                  <option>Madeira e Móveis</option>
                  <option>Manutenção Industrial</option>
                  <option>Mármore e Granito</option>
                  <option>Materiais de Construção</option>
                  <option>Materiais Elétricos</option>
                  <option>Mecânica de Precisão</option>
                  <option>Mecânica Industrial</option>
                  <option>Metalurgia</option>
                  <option>Mineração</option>
                  <option>Petroquímica</option>
                  <option>Plástico</option>
                  <option>Pneumática e Hidráulica</option>
                  <option>Produtos Químicos</option>
                  <option>Refinaria</option>
                  <option>Siderurgia</option>
                  <option>Solda e Estruturas Metálicas</option>
                  <option>Tratamento de Água</option>
                  <option>Tratamento de Resíduos</option>
                  <option>Tubo e Conexões</option>
                  <option>Usina Hidrelétrica</option>
                  <option>Usina Termelétrica</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="cargoDesejado">Cargo desejado *</label>
                <input 
                  id="cargoDesejado" 
                  type="text" 
                  required 
                  className={styles.input}
                  value={formData.cargoDesejado}
                  onChange={e => setFormData({...formData, cargoDesejado: e.target.value})}
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div>
                <label className={styles.label} htmlFor="turnoDisponivel">Turno disponível *</label>
                <select 
                  id="turnoDisponivel" 
                  className={styles.select} 
                  required
                  value={formData.turnoDisponivel}
                  onChange={e => setFormData({...formData, turnoDisponivel: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="disponibilidadeInicio">Disponibilidade para início *</label>
                <select 
                  id="disponibilidadeInicio" 
                  className={styles.select} 
                  required
                  value={formData.disponibilidadeInicio}
                  onChange={e => setFormData({...formData, disponibilidadeInicio: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option value="Imediata">Imediata</option>
                  <option value="15 dias">15 dias</option>
                  <option value="30 dias">30 dias</option>
                  <option value="2 meses">2 meses</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Experiência profissional</h2>
            
            <label className={styles.label} htmlFor="trabalhouIndustria">Já trabalhou na indústria? *</label>
            <select 
              id="trabalhouIndustria" 
              className={styles.select} 
              required 
              value={formData.trabalhouIndustria} 
              onChange={e => setFormData({...formData, trabalhouIndustria: e.target.value})}
            >
              <option value="">Selecione</option>
              <option value="Não">Não</option>
              <option value="Primeiro emprego">Primeiro emprego</option>
              <option value="Jovem aprendiz">Jovem aprendiz</option>
              <option value="Sim">Sim</option>
            </select>

            {formData.trabalhouIndustria === 'Sim' && (
              <>
                <label className={styles.label} htmlFor="tempoExperiencia">Tempo total de experiência *</label>
                <select 
                  id="tempoExperiencia" 
                  className={styles.select} 
                  required
                  value={formData.tempoExperiencia}
                  onChange={e => setFormData({...formData, tempoExperiencia: e.target.value})}
                >
                  <option value="">Selecione</option>
                  <option value="Menos de 1 ano">Menos de 1 ano</option>
                  <option value="1-2 anos">1-2 anos</option>
                  <option value="3-5 anos">3-5 anos</option>
                  <option value="6-10 anos">6-10 anos</option>
                  <option value="Mais de 10 anos">Mais de 10 anos</option>
                </select>

                <label className={styles.label}>Experiências profissionais *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {empresas.map((empresa, index) => (
                    <div key={index} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Empresa {index + 1}</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Nome da empresa"
                          value={empresa.nome}
                          required={index === 0}
                          onChange={(e) => {
                            const novasEmpresas = [...empresas];
                            novasEmpresas[index].nome = e.target.value;
                            setEmpresas(novasEmpresas);
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cargo</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Ex: Eletricista, Soldador"
                          value={empresa.cargo}
                          required={index === 0}
                          onChange={(e) => {
                            const novasEmpresas = [...empresas];
                            novasEmpresas[index].cargo = e.target.value;
                            setEmpresas(novasEmpresas);
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Início (Mês/Ano)</label>
                          <input
                            type="month"
                            className={styles.input}
                            value={empresa.dataInicio}
                            required={index === 0}
                            onChange={(e) => {
                              const novasEmpresas = [...empresas];
                              novasEmpresas[index].dataInicio = e.target.value;
                              setEmpresas(novasEmpresas);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fim (Mês/Ano)</label>
                          <input
                            type="month"
                            className={styles.input}
                            value={empresa.dataFim}
                            required={index === 0}
                            onChange={(e) => {
                              const novasEmpresas = [...empresas];
                              novasEmpresas[index].dataFim = e.target.value;
                              setEmpresas(novasEmpresas);
                            }}
                          />
                        </div>
                      </div>

                      {empresas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novasEmpresas = empresas.filter((_, i) => i !== index);
                            setEmpresas(novasEmpresas);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✕ Remover empresa
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEmpresas([...empresas, {nome: '', cargo: '', dataInicio: '', dataFim: ''}]);
                    }}
                    style={{
                      padding: '10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    + Adicionar outra empresa
                  </button>
                </div>
              </>
            )}
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Recolocação e salário</h2>
            
            <label className={styles.label} htmlFor="recolocacao">Está em recolocação profissional? *</label>
            <select 
              id="recolocacao" 
              className={styles.select} 
              required
              value={formData.recolocacao}
              onChange={e => setFormData({...formData, recolocacao: e.target.value})}
            >
              <option value="">Selecione</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>

            <label className={styles.label} htmlFor="pretensaoSalarial">Pretensão salarial *</label>
            <input 
              id="pretensaoSalarial" 
              type="text" 
              required 
              className={styles.input} 
              placeholder="Ex: 2.500,00"
              value={pretensaoSalarial}
              onChange={(e) => {
                const value = e.target.value;
                
                // Remove tudo que não é número
                let apenasNumeros = value.replace(/\D/g, '');
                
                // Remove zeros à esquerda
                apenasNumeros = apenasNumeros.replace(/^0+/, '') || '0';
                
                if (apenasNumeros === '0' || apenasNumeros === '') {
                  setPretensaoSalarial('');
                  setFormData({...formData, pretensaoSalarial: ''});
                  return;
                }
                
                // Se tem menos de 3 dígitos, é menor que 10 reais (exemplo: 5 -> 0,05)
                let centavos = '';
                let inteiro = '';
                
                if (apenasNumeros.length === 1) {
                  inteiro = '0';
                  centavos = '0' + apenasNumeros;
                } else if (apenasNumeros.length === 2) {
                  inteiro = '0';
                  centavos = apenasNumeros;
                } else {
                  // Últimos 2 dígitos sempre são centavos
                  centavos = apenasNumeros.slice(-2);
                  inteiro = apenasNumeros.slice(0, -2);
                }
                
                // Formata inteiro com pontos a cada 3 dígitos
                const partes = inteiro.split('').reverse();
                const inteiroFormatado = partes
                  .reduce((acc: string[], digit, index) => {
                    if (index > 0 && index % 3 === 0) {
                      acc.push('.');
                    }
                    acc.push(digit);
                    return acc;
                  }, [])
                  .reverse()
                  .join('');
                
                const salarioFormatado = inteiroFormatado + ',' + centavos;
                
                setPretensaoSalarial(salarioFormatado);
                setFormData({...formData, pretensaoSalarial: salarioFormatado});
              }}
            />
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Mensagem para empresas</h2>
            
            <label className={styles.label} htmlFor="mensagemEmpresas">Deixe uma mensagem para as empresas que visualizarão seu perfil</label>
            <textarea
              id="mensagemEmpresas"
              className={`${styles.input} ${styles.textarea}`}
              rows={4}
              placeholder="Conte um pouco sobre você, seus objetivos profissionais ou qualquer informação que gostaria que as empresas soubessem..."
              value={formData.mensagemEmpresas}
              onChange={e => setFormData({...formData, mensagemEmpresas: e.target.value})}
            ></textarea>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Documentos</h2>
            
            <label className={styles.label} htmlFor="fotoPerfil">Foto de perfil</label>
            <input 
              id="fotoPerfil" 
              type="file" 
              accept="image/*" 
              className={styles.input}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('type', 'avatars');
                  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
                  const data = await res.json();
                  if (res.ok && data.success && data.file?.url) {
                    setFormData({...formData, fotoPerfil: data.file.url});
                  } else if (res.status === 401) {
                    // Não autenticado - salvar localmente como dataURL para enviar depois
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, fotoPerfil: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  } else {
                    console.error('Upload foto falhou', data);
                    alert('Erro ao enviar foto de perfil');
                  }
                } catch (err) {
                  console.error('Erro no upload da foto:', err);
                  alert('Erro ao enviar foto de perfil');
                }
              }}
            />
            {formData.fotoPerfil && (
              <div style={{ marginTop: 8 }}>
                {String(formData.fotoPerfil).startsWith('/uploads') ? (
                  <img src={String(formData.fotoPerfil)} alt="Foto enviada" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0066cc' }} />
                ) : (
                  <div style={{ padding: '6px 10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: 6 }}>Salvo localmente</div>
                )}
              </div>
            )}

            <label className={styles.label} htmlFor="curriculo">Currículo (PDF ou Word) *</label>
            <input 
              id="curriculo" 
              type="file" 
              accept=".pdf,.doc,.docx" 
              required 
              className={styles.input}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('type', 'documents');
                  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
                  const data = await res.json();
                  if (res.ok && data.success && data.file?.url) {
                    // armazenar a URL do currículo no formData (string)
                    setFormData({...formData, curriculo: data.file.url});
                  } else if (res.status === 401) {
                    // Não autenticado - salvar localmente como dataURL para enviar depois
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, curriculo: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  } else {
                    console.error('Upload curriculo falhou', data);
                    alert('Erro ao enviar currículo');
                  }
                } catch (err) {
                  console.error('Erro no upload do currículo:', err);
                  alert('Erro ao enviar currículo');
                }
              }}
            />
            {formData.curriculo && (
              <div style={{ marginTop: 8 }}>
                {String(formData.curriculo).startsWith('/uploads') ? (
                  <a href={String(formData.curriculo)} download style={{ backgroundColor: '#0066cc', color: 'white', padding: '6px 10px', borderRadius: 6, textDecoration: 'none' }}>Arquivo enviado — Download</a>
                ) : (
                  <div style={{ padding: '6px 10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: 6 }}>Salvo localmente</div>
                )}
              </div>
            )}

            <label className={styles.label} htmlFor="atestado">Atestado de antecedentes (opcional)</label>
            <input 
              id="atestado" 
              type="file" 
              accept=".pdf,.jpg,.png" 
              className={styles.input}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('type', 'documents');
                  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
                  const data = await res.json();
                  if (res.ok && data.success && data.file?.url) {
                    setFormData({...formData, atestado: data.file.url});
                  } else if (res.status === 401) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, atestado: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  } else {
                    console.error('Upload atestado falhou', data);
                    alert('Erro ao enviar atestado');
                  }
                } catch (err) {
                  console.error('Erro no upload do atestado:', err);
                  alert('Erro ao enviar atestado');
                }
              }}
            />
            {formData.atestado && (
              <div style={{ marginTop: 8 }}>
                {String(formData.atestado).startsWith('/uploads') ? (
                  <a href={String(formData.atestado)} download style={{ backgroundColor: '#0066cc', color: 'white', padding: '6px 10px', borderRadius: 6, textDecoration: 'none' }}>Atestado enviado — Download</a>
                ) : (
                  <div style={{ padding: '6px 10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: 6 }}>Salvo localmente</div>
                )}
              </div>
            )}

            <p className={styles.seriousNote}>Documento opcional no cadastro inicial. A empresa contratante poderá solicitá-lo posteriormente.</p>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Termos</h2>
            
            <label className={styles.checkboxLabel}>
              <input type="checkbox" required /> Autorizo o uso dos meus dados
            </label>

            <label className={styles.checkboxLabel}>
              <input type="checkbox" required /> Declaro que as informações são verdadeiras
            </label>
          </section>

          <button type="submit" className={styles.submitBtn}>Finalizar meu cadastro</button>
        </form>
      </div>
    </div>
  );
}