"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut, SessionProvider } from 'next-auth/react';

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  userType?: string;
}

function ClientDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [area, setArea] = useState("");
  const [cargo, setCargo] = useState("");
  const [salario, setSalario] = useState("");
  const [cidadesFiltradas, setCidadesFiltradas] = useState<string[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);

  const listaEstados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  
  const areasIndustria = [
    "Produção / Operacional",
    "Manutenção",
    "Logística / Expedição",
    "Qualidade",
    "Segurança (SESMT)",
    "Recursos Humanos",
    "Financeiro / Contabilidade",
    "Vendas",
    "Planejamento e Controle",
    "Engenharia",
    "Pesquisa e Desenvolvimento",
    "Tecnologia da Informação",
    "Almoxarifado / Estoque",
    "Compras",
    "Administração",
    "Limpeza e Limpeza Industrial",
    "Trabalho em Altura",
    "Operação de Máquinas",
    "Soldagem",
    "Eletricista Industrial",
    "Hidráulica e Pneumática",
    "Montagem e Desmontagem",
    "Inspeção e Testes",
    "Pintura Industrial",
    "Embalagem e Despacho",
    "Metalurgía",
    "Siderurgia",
    "Fundição",
    "Forjaria",
    "Tratamento de Superfície",
    "Usinagem",
    "Estamparia",
    "Trefilação",
    "Laminação",
    "Galvanoplastia",
    "Química Industrial",
    "Petroquímica",
    "Alimentos e Bebidas",
    "Têxtil",
    "Celulose e Papel",
    "Construção Civil",
    "Cerâmica",
    "Vidro",
    "Borracha e Plásticos",
    "Automotiva",
    "Aeronáutica",
    "Naval",
    "Energia Elétrica",
    "Energia Renovável",
    "Telecomunicações",
    "Serviços Gerais",
    "Vigilância",
    "Transportes",
    "Saúde Ocupacional",
    "Treinamento e Desenvolvimento"
  ];

  const cargos = [
    "Operador",
    "Técnico",
    "Supervisor",
    "Encarregado",
    "Coordenador",
    "Gerente",
    "Especialista",
    "Analista",
    "Auxiliar",
    "Ajudante",
    "Aprendiz",
    "Trainee",
    "Consultor",
    "Diretor"
  ];

  const faixasSalario = [
    "Até R$ 1.500",
    "R$ 1.500 - R$ 2.000",
    "R$ 2.000 - R$ 2.500",
    "R$ 2.500 - R$ 3.000",
    "R$ 3.000 - R$ 4.000",
    "R$ 4.000 - R$ 5.000",
    "R$ 5.000 - R$ 7.000",
    "R$ 7.000 - R$ 10.000",
    "R$ 10.000 - R$ 15.000",
    "Acima de R$ 15.000"
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Verifica se o cadastro está completo ao carregar
  useEffect(() => {
    if (status === 'unauthenticated' && mounted) {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && mounted) {
      checkRegistrationStatus();
    }
  }, [status, mounted]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/company/check-registration');
      
      if (!response.ok) {
        router.push('/company/panel?from=/company/dashboard');
        return;
      }

      const data = await response.json();

      if (!data.registrationComplete) {
        router.push('/company/panel?from=/company/dashboard');
        return;
      }

      // Buscar dados da empresa
      setCompanyData(data);
      setIsPremium(data.isPremium || false);
      setIsCheckingRegistration(false);
    } catch (error) {
      console.error('Erro ao verificar registro:', error);
      router.push('/company/panel?from=/company/dashboard');
    }
  };

  useEffect(() => {
    if (estado && !isCheckingRegistration) {
      setCarregandoCidades(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
        .then(res => res.json())
        .then(data => {
          const nomesCidades = data.map((c: any) => c.nome).sort();
          setCidadesFiltradas(nomesCidades);
          setCarregandoCidades(false);
        }).catch(() => setCarregandoCidades(false));
    }
  }, [estado, isCheckingRegistration]);

  const user = session?.user as SessionUser | undefined;

  if (isCheckingRegistration) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f4f8'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Carregando...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f4f8',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* CABEÇALHO */}
      <div style={{
        backgroundColor: '#001f3f',
        color: 'white',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>
            Bem-vindo, {user.name || user.email.split('@')[0]}!
          </h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            {user.email}
          </p>
        </div>
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          🚪 Sair
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* PERFIL DA EMPRESA */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          marginBottom: '30px',
          border: '2px solid #e0e0e0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          alignItems: 'start'
        }}>
          <div>
            <h3 style={{ color: '#001f3f', margin: '0 0 15px 0', fontSize: '22px', fontWeight: 'bold' }}>
              🏢 Perfil da Empresa
            </h3>
            <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <p style={{ margin: '5px 0' }}><strong>Nome:</strong> {companyData?.nome || user.name || 'Empresa'}</p>
              <p style={{ margin: '5px 0' }}><strong>CNPJ:</strong> {companyData?.cnpj || 'Não preenchido'}</p>
              <p style={{ margin: '5px 0' }}><strong>Email:</strong> {user.email}</p>
              <p style={{ margin: '5px 0' }}><strong>Telefone:</strong> {companyData?.telefone || 'Não preenchido'}</p>
              <p style={{ margin: '5px 0' }}><strong>Setor:</strong> {companyData?.setor || 'Não preenchido'}</p>
              <p style={{ margin: '5px 0' }}><strong>Plano:</strong> <span style={{ fontWeight: 'bold', color: isPremium ? '#28a745' : '#ffc107' }}>
                {isPremium ? '⭐ PREMIUM' : '🆓 FREE'}
              </span></p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' }}>
            <button 
              onClick={() => router.push('/company/panel?from=/company/dashboard')}
              style={{
                backgroundColor: '#001f3f',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              ✏️ ATUALIZAR PERFIL
            </button>
            {!isPremium && (
              <button 
                onClick={() => router.push('/company/pagamento')}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                ⭐ UPGRADE PREMIUM
              </button>
            )}
          </div>
        </div>

        {/* EMPRESAS TAMBÉM CONTRATANDO */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          marginBottom: '30px',
          borderLeft: '6px solid #28a745'
        }}>
          <h3 style={{ color: '#001f3f', marginTop: 0, marginBottom: '20px', fontSize: '22px', fontWeight: 'bold' }}>
            🏭 Empresas Também Contratando
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '15px'
          }}>
            {[
              'Vale S.A.',
              'Gerdau',
              'Usiminas',
              'Embraer',
              'Petrobras',
              'Suzano',
              'Braskem',
              'CSN',
              'Metalúrgica XYZ',
              'Indústria ABC'
            ].map((empresa, idx) => (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                padding: '15px',
                borderRadius: '10px',
                border: '3px solid #001f3f',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#001f3f',
                fontSize: '14px'
              }}>
                {empresa}
              </div>
            ))}
          </div>
        </div>

        {/* CARD DE FILTROS */}
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          marginBottom: '30px',
          borderLeft: '6px solid #001f3f'
        }}>
          <h2 style={{ color: '#001f3f', marginTop: 0, marginBottom: '25px', fontSize: '28px' }}>
            🔍 BUSCA DE TALENTOS INDUSTRIAIS
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '25px'
          }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001f3f', fontSize: '14px' }}>
                ESTADO
              </label>
              <select 
                value={estado} 
                onChange={(e) => setEstado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #001f3f',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#001f3f',
                  backgroundColor: '#fff'
                }}
              >
                <option value="">Selecione UF</option>
                {listaEstados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001f3f', fontSize: '14px' }}>
                CIDADE
              </label>
              <select 
                value={cidade} 
                onChange={(e) => setCidade(e.target.value)}
                disabled={!estado}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #001f3f',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#001f3f',
                  backgroundColor: '#fff',
                  opacity: !estado ? 0.5 : 1,
                  cursor: !estado ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">{carregandoCidades ? "Carregando..." : "Selecione Cidade"}</option>
                {cidadesFiltradas.map((c, idx) => <option key={`${c}-${idx}`} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001f3f', fontSize: '14px' }}>
                ÁREA INDUSTRIAL
              </label>
              <select 
                value={area}
                onChange={(e) => setArea(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #001f3f',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#001f3f',
                  backgroundColor: '#fff'
                }}
              >
                <option value="">Selecione Área</option>
                {areasIndustria.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001f3f', fontSize: '14px' }}>
                CARGO
              </label>
              <select 
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #001f3f',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#001f3f',
                  backgroundColor: '#fff'
                }}
              >
                <option value="">Selecione Cargo</option>
                {cargos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#001f3f', fontSize: '14px' }}>
                FAIXA SALARIAL
              </label>
              <select 
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #001f3f',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#001f3f',
                  backgroundColor: '#fff'
                }}
              >
                <option value="">Selecione Faixa</option>
                {faixasSalario.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={() => setMostrarResultados(true)}
            style={{
              width: '100%',
              backgroundColor: '#001f3f',
              color: 'white',
              padding: '15px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '10px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#003366'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#001f3f'}
          >
            🔎 PESQUISAR AGORA
          </button>
        </div>

        {/* RESULTADOS */}
        {mostrarResultados && (
          <div>
            {!isPremium && (
              <div style={{
                backgroundColor: '#e3f2fd',
                border: '2px solid #2196f3',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '30px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#1565c0', margin: '10px 0', fontSize: '14px', fontWeight: 'bold' }}>
                  📊 Você está no plano FREE - Apenas os 5 primeiros resultados são exibidos
                </p>
                <button 
                  onClick={() => router.push('/company/pagamento')}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '10px 30px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginTop: '10px'
                  }}
                >
                  ⭐ UPGRADE PARA VER MAIS
                </button>
              </div>
            )}
            <h3 style={{ color: '#001f3f', marginBottom: '20px', fontSize: '22px' }}>
              📋 Resultados da Busca
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '15px'
            }}>
              {/* CARD DE PROFISSIONAL - EXEMPLO 1 */}
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '3px solid #001f3f',
                transition: 'all 0.3s',
                position: 'relative'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#e0e7ff',
                    border: '3px solid #001f3f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontSize: '30px'
                  }}>
                    👤
                  </div>
                </div>
                <h4 style={{ color: '#001f3f', margin: '10px 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>
                  Erasmo Silva
                </h4>
                <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '12px' }}>
                  Operador de Empilhadeira • {cidade || 'Estado'} - {estado || 'UF'}
                </p>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '8px', 
                  borderRadius: '8px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <p style={{ margin: '3px 0', fontSize: '11px' }}>📍 {estado} - {cidade}</p>
                  <p style={{ margin: '3px 0', fontSize: '11px' }}>🏭 {area}</p>
                  <p style={{ margin: '3px 0', fontSize: '11px' }}>💼 {cargo || 'Cargo'}</p>
                  <p style={{ margin: '3px 0', fontSize: '11px' }}>💰 {salario || 'Salário'}</p>
                  <p style={{ margin: '3px 0', fontSize: '11px' }}>⭐ 4.8/5.0</p>
                  <p style={{ margin: '3px 0', borderTop: '1px solid #ddd', paddingTop: '3px', color: '#001f3f', fontWeight: 'bold', fontSize: '11px' }}>👁️ 1.234 visualizações</p>
                </div>
                <button 
                  onClick={() => router.push('/company/profile/erasmo')}
                  style={{
                    width: '100%',
                    backgroundColor: '#001f3f',
                    color: 'white',
                    padding: '8px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  📄 ABRIR PERFIL
                </button>
              </div>

              {/* CARDS LIVRES (4 MAIS) + 1 APAGADO + 4 MAIS APAGADOS */}
              {[
                { nome: 'João Santos', cargo: 'Técnico em Manutenção', rating: 4.9, views: 892 },
                { nome: 'Maria Oliveira', cargo: 'Supervisora de Produção', rating: 4.7, views: 1156 },
                { nome: 'Carlos Ferreira', cargo: 'Eletricista Industrial', rating: 4.8, views: 754 },
                { nome: 'Ana Costa', cargo: 'Analista de Qualidade', rating: 4.6, views: 523 },
                { nome: 'Roberto Lima', cargo: 'Gerente de Produção', rating: 4.9, views: 1045 },
                { nome: 'Fernando Silva', cargo: 'Supervisor de Manutenção', rating: 4.8, views: 967 },
                { nome: 'Patricia Gomes', cargo: 'Engenheira de Produção', rating: 4.9, views: 1112 },
                { nome: 'Lucas Martins', cargo: 'Operador CNC', rating: 4.7, views: 845 },
                { nome: 'Beatriz Costa', cargo: 'Coordenadora de Qualidade', rating: 4.8, views: 1003 }
              ].map((prof, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '3px solid #001f3f',
                  transition: 'all 0.3s',
                  position: 'relative',
                  opacity: !isPremium && idx >= 4 ? 0.4 : 1,
                  pointerEvents: !isPremium && idx >= 4 ? 'none' : 'auto'
                }}>
                  {!isPremium && idx >= 4 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px',
                      zIndex: 10
                    }}>🔒</div>
                  )}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e7ff',
                      border: '3px solid #001f3f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      fontSize: '30px'
                    }}>
                      👤
                    </div>
                  </div>
                  <h4 style={{ color: '#001f3f', margin: '10px 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>
                    {prof.nome}
                  </h4>
                  <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '12px' }}>
                    {prof.cargo} • {cidade || 'Estado'} - {estado || 'UF'}
                  </p>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '8px', 
                    borderRadius: '8px',
                    marginBottom: '10px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <p style={{ margin: '3px 0', fontSize: '11px' }}>📍 {estado} - {cidade}</p>
                    <p style={{ margin: '3px 0', fontSize: '11px' }}>🏭 {area}</p>
                    <p style={{ margin: '3px 0', fontSize: '11px' }}>💼 {cargo || 'Cargo'}</p>
                    <p style={{ margin: '3px 0', fontSize: '11px' }}>💰 {salario || 'Salário'}</p>
                    <p style={{ margin: '3px 0', fontSize: '11px' }}>⭐ {prof.rating}/5.0</p>
                    <p style={{ margin: '3px 0', borderTop: '1px solid #ddd', paddingTop: '3px', color: '#001f3f', fontWeight: 'bold', fontSize: '11px' }}>👁️ {prof.views.toLocaleString('pt-BR')} visualizações</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/company/profile/${prof.nome.toLowerCase().replace(' ', '-')}`)}
                    style={{
                      width: '100%',
                      backgroundColor: '#001f3f',
                      color: 'white',
                      padding: '8px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📄 ABRIR PERFIL
                  </button>
                  </div>
                </div>
              ))}

              {/* CARDS PREMIUM (BLOQUEADOS) - REMOVIDO */}
            </div>
          </div>
        )}
      </div>

      {/* RODAPÉ COM CONTATO */}
      <div style={{
        backgroundColor: '#001f3f',
        color: 'white',
        padding: '30px 40px',
        textAlign: 'center',
        marginTop: '60px',
        borderTop: '2px solid #0a3c7d'
      }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
          Tendo problemas? Entre em contato conosco:
        </p>
        <a 
          href="mailto:suporte@recruta-industria.com.br"
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#28a745',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          📧 suporte@recruta-industria.com.br
        </a>
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
          Estamos aqui para ajudar com qualquer dúvida ou problema que você encontre.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SessionProvider>
      <ClientDashboard />
    </SessionProvider>
  );
}