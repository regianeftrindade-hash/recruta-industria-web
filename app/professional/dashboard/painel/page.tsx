"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  nome?: string;
  email?: string;
  profissao?: string;
  cargoDesejado?: string;
  localizacao?: string;
  experiencia?: string;
  formacao?: string;
  habilidades?: string[];
  dataVisualizacoes?: number;
  plano?: 'free' | 'premium' | string;
  avatar?: string | null;
  telefone?: string;
  whatsapp?: string;
  fotoPerfil?: string | null;
  curriculo?: string | null;
  portfolio?: string | null;
  experiencias?: string;
  descricaoPessoal?: string;
  viewCount?: number;
}

interface Tip {
  id: string;
  message: string;
  isAnonymous: boolean;
  rating?: number;
  createdAt: string;
}

interface ProfileView {
  id: string;
  companyUserId: string;
  viewType: string;
  createdAt: string;
}

const hasUsefulProfileData = (profile: ProfileData) => {
  return Boolean(
    profile.nome?.trim() ||
    profile.email?.trim() ||
    profile.telefone?.trim() ||
    profile.whatsapp?.trim() ||
    profile.cargoDesejado?.trim() ||
    profile.profissao?.trim() ||
    profile.experiencias?.trim() ||
    profile.curriculo ||
    profile.fotoPerfil ||
    profile.avatar
  );
};

export default function PainelProfissional() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [profileViews, setProfileViews] = useState({
    totalViews: 0,
    uniqueCompanies: 0
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/professional/profile', {
          credentials: 'include'
        });
        
        // Se não autenticado, redireciona para login
        if (res.status === 401) {
          router.push('/login?tipo=profissional');
          return;
        }
        
        if (!res.ok) throw new Error('Erro ao buscar perfil');
        const data = await res.json();
        setProfileData(data);

        // Buscar dicas das empresas
        const tipsRes = await fetch('/api/professional/tips', {
          credentials: 'include'
        });
        if (tipsRes.ok) {
          const tipsData = await tipsRes.json();
          setTips(tipsData.tips || []);
        }

        // Buscar visualizações do perfil
        const viewsRes = await fetch('/api/professional/profile-views', {
          credentials: 'include'
        });
        if (viewsRes.ok) {
          const viewsData = await viewsRes.json();
          setProfileViews({
            totalViews: viewsData.totalViews || 0,
            uniqueCompanies: viewsData.uniqueCompanies || 0
          });
        }
      } catch (err) {
        setError('Não foi possível carregar o perfil.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (params?.get('upgrade') === 'success') {
      setUpgradeSuccess(true);
      setProfileData(prev => (prev ? { ...prev, plano: 'premium' } : prev));
      if (typeof window !== 'undefined') window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setUpgradeSuccess(false), 5000);
    }
  }, []);

  const handleFotoClick = () => fileInputRef.current?.click();

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatars');

      // Upload para API
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        alert(`Erro ao fazer upload: ${errorData.error}`);
        return;
      }

      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.file.url;

      // Aqui você poderia salvar a URL no perfil do usuário
      // Por enquanto, apenas atualizamos o state local
      setProfileData(prev => prev ? { ...prev, avatar: fileUrl } : prev);
      alert('Foto salva com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da foto. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    try {
      window.location.href = '/api/auth/logout';
    } catch (e) {
      window.location.href = '/login?tipo=profissional';
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>Carregando perfil...</div>;
  if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red', fontSize: 20 }}>{error}</div>;
  if (!profileData) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray', fontSize: 20 }}>Perfil não encontrado.</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#001f3f', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Bem-vindo, {profileData.nome || profileData.email?.split('@')[0] || 'Usuário'}!</h1>
        <button onClick={handleLogout} style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>🚪 Sair</button>
      </div>

      <div style={{ padding: 40, maxWidth: 1400, margin: '0 auto' }}>
        {upgradeSuccess && <div style={{ backgroundColor: '#d4edda', border: '2px solid #28a745', color: '#155724', padding: 20, borderRadius: 8, marginBottom: 30, fontWeight: 'bold', textAlign: 'center' }}>Upgrade para Premium realizado com sucesso!</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
          {/* COLUNA ESQUERDA - CADASTRO COMPLETO */}
          <div>
            <div style={{ backgroundColor: 'white', padding: 30, borderRadius: 15, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#001f3f', marginTop: 0, marginBottom: 25 }}>📋 Resumo do Cadastro</h3>
              <div style={{ textAlign: 'center', marginBottom: 25 }}>
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Foto do perfil" style={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid #003366', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: '50%', backgroundColor: '#e0e7ff', border: '4px solid #003366', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 50 }}>👤</div>
                )}
                <button onClick={handleFotoClick} style={{ marginTop: 15, backgroundColor: '#0066cc', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>📷 Alterar Foto</button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Nome Completo</p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{profileData.nome || 'Não preenchido'}</p>
                </div>
                <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Email</p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{profileData.email || 'Não preenchido'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Profissão/Cargo</p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{profileData.profissao || profileData.cargoDesejado || 'Não preenchido'}</p>
                </div>
                <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Localização</p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{profileData.localizacao || 'Não preenchido'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Telefone</p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{profileData.telefone || 'Não preenchido'}</p>
                </div>
                <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Experiência</p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{profileData.experiencia || profileData.experiencias || 'Não preenchido'}</p>
                </div>
              </div>

              {profileData.formacao && (
                <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 20 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Formação</p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{profileData.formacao}</p>
                </div>
              )}

              {Array.isArray(profileData.habilidades) && profileData.habilidades.length > 0 && (
                <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 20 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Habilidades</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profileData.habilidades.map((skill: any, idx: number) => (
                      <span key={idx} style={{ backgroundColor: '#0066cc', color: 'white', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>
                        {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={async () => {
                try {
                  if (typeof window !== 'undefined') {
                    const res = await fetch('/api/professional/profile', { credentials: 'include' });
                    let profile = profileData;
                    if (res.ok) {
                      profile = await res.json();
                    }

                    if (profile && hasUsefulProfileData(profile)) {
                      const dadosParaSalvar = {
                        ...profile,
                        nome: profile.nome || profile.email || '',
                        email: profile.email || '',
                        telefone: profile.telefone || '',                        
                        whatsapp: profile.whatsapp || 'Não',
                        fotoPerfil: profile.fotoPerfil || profile.avatar || null,
                        curriculo: profile.curriculo || null,
                        experiencias: profile.experiencias || profile.experiencia || ''
                      } as any;
                      localStorage.setItem('dadosFormularioCompleto', JSON.stringify(dadosParaSalvar));
                    } else {
                      localStorage.removeItem('dadosFormularioCompleto');
                    }
                  }
                } catch (e) {
                  console.error('Erro ao salvar dados para edição do cadastro:', e);
                }
                router.push('/professional/register');
              }} style={{ backgroundColor: '#003366', color: 'white', padding: '12px 25px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>✏️ Atualizar Cadastro</button>
            </div>
          </div>

          {/* COLUNA DIREITA - DICAS, VISUALIZAÇÕES E ACESSO */}
          <div>
            <div style={{ backgroundColor: '#e8f4f8', padding: 30, borderRadius: 15, borderLeft: '6px solid #0066cc', marginBottom: 30 }}>
              <h3 style={{ color: '#0066cc', marginTop: 0, marginBottom: 20 }}>📎 Documentos</h3>
              {profileData.curriculo ? (
                <div style={{ padding: 15, backgroundColor: 'white', borderRadius: 8, marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#001f3f', fontWeight: 'bold', margin: '0 0 5px 0' }}>📎 Currículo</p>
                    <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Enviado e anexado.</p>
                  </div>
                  <a href={profileData.curriculo} download style={{ backgroundColor: '#0066cc', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none' }}>
                    📥 Download
                  </a>
                </div>
              ) : (
                <div style={{ padding: 15, backgroundColor: '#fff3cd', borderRadius: 8, color: '#856404' }}>
                  ⚠️ Nenhum currículo. <a href="/professional/register" style={{ color: '#856404', textDecoration: 'underline', fontWeight: 'bold' }}>Envie aqui</a>.
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#e8f4f8', padding: 30, borderRadius: 15, borderLeft: '6px solid #0066cc', marginBottom: 30 }}>
              <h3 style={{ color: '#0066cc', marginTop: 0, marginBottom: 20 }}>👁️ Visualizações</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div style={{ padding: 15, backgroundColor: 'white', borderRadius: 8 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Total</p>
                  <p style={{ color: '#0066cc', fontWeight: 'bold', margin: 0, fontSize: 28 }}>{profileViews.totalViews}</p>
                </div>
                <div style={{ padding: 15, backgroundColor: 'white', borderRadius: 8 }}>
                  <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px 0', fontWeight: 'bold' }}>Empresas</p>
                  <p style={{ color: '#0066cc', fontWeight: 'bold', margin: 0, fontSize: 28 }}>{profileViews.uniqueCompanies}</p>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff3e0', padding: 30, borderRadius: 15, borderLeft: '6px solid #ff9800', marginBottom: 30 }}>
              <h3 style={{ color: '#ff9800', marginTop: 0, marginBottom: 20 }}>💡 Dicas das Empresas</h3>
              {tips && tips.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '380px', overflowY: 'auto' }}>
                  {tips.map((tip: Tip, idx: number) => (
                    <div key={idx} style={{ padding: 12, backgroundColor: 'white', borderRadius: 8, borderLeft: '4px solid #ff9800' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                        <p style={{ color: '#ff9800', fontWeight: 'bold', margin: 0, fontSize: 12 }}>
                          {tip.isAnonymous ? '🔒 Anônima' : '🏢 Empresa'}
                        </p>
                        {tip.rating && (
                          <span style={{ color: '#ffc107', fontWeight: 'bold', fontSize: 11 }}>
                            {'⭐'.repeat(tip.rating)}
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#333', margin: '0 0 6px 0', lineHeight: '1.4', fontSize: 12 }}>{tip.message}</p>
                      <p style={{ color: '#999', fontSize: 11, margin: 0 }}>
                        {new Date(tip.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 15, backgroundColor: '#fff9e6', borderRadius: 8, color: '#ff9800', fontSize: 12 }}>
                  ℹ️ Sem dicas ainda. Quando empresas visualizarem seu perfil, aparecerão aqui.
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#e8f5e9', padding: 30, borderRadius: 15, borderLeft: '6px solid #4caf50' }}>
              <h3 style={{ color: '#2e7d32', marginTop: 0, marginBottom: 15 }}>✅ Acesso Completo</h3>
              <ul style={{ color: '#2e7d32', margin: 0, paddingLeft: '20px', listStyle: 'disc', fontSize: 13, lineHeight: '1.8' }}>
                <li>Perfil completo e visível</li>
                <li>Todas as dicas das empresas</li>
                <li>Visualização de todas as empresas</li>
                <li>Suporte prioritário</li>
                <li>Prioridade em buscas</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
