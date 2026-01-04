/**
 * 🔒 PÁGINA INICIAL - BLOQUEADA PARA ALTERAÇÕES
 * ================================================
 * ⚠️ ATENÇÃO: Esta página foi finalizada e aprovada.
 * 
 * RESTRIÇÕES:
 * ✗ NÃO alterar layout ou espaçamento
 * ✗ NÃO remover componentes
 * ✗ NÃO modificar estilos CSS
 * ✗ NÃO alterar imagens ou conteúdo principal
 * 
 * ALTERAÇÕES PERMITIDAS:
 * ✓ Ajustar URLs de links
 * ✓ Atualizar conteúdo de texto (mantendo layout)
 * ✓ Adicionar novas funcionalidades sem alterar visual
 * 
 * Última atualização: 02/01/2026
 * Status: ✅ FINALIZADO E APROVADO
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verificar se é iOS (não suporta beforeinstallprompt)
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(isIos);

    // Handler para PWA no Chrome, Edge, Android
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler as any);
    
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt as any;
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstall(false);
      }
    }
  };

  // Para iOS, mostrar instrução manual
  const handleIOSInstall = () => {
    alert('🍎 Safari iOS:\n\n1. Toque o botão Compartilhar (↑)\n2. Selecione "Adicionar à Tela de Início"\n3. Confirme com "Adicionar"');
  };
  return (
    <main style={{ backgroundColor: '#f8f9fa', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ 
        padding: 'clamp(12px, 3vw, 25px)', 
        backgroundImage: 'url("/empresa.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff', 
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        flex: '0 0 auto',
        backgroundColor: '#4da6d6',
        backgroundBlendMode: 'multiply'
      }}>
        <div style={{ background: 'rgba(30, 64, 175, 0.5)', padding: '8px 0', borderRadius: '8px' }}>
          <h1 style={{ fontSize: 'clamp(1.3rem, 5vw, 2rem)', marginBottom: '0px', fontWeight: 'bold', letterSpacing: '1px' }}>
            RECRUTA INDÚSTRIA
          </h1>
        </div>
      </div>

      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(15px, 3vw, 30px) clamp(10px, 3vw, 20px)', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(12px, 3vw, 20px)' }}>
          <div style={{
            background: '#fff',
            borderRadius: '15px',
            boxShadow: '0 10px 35px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer'
          }}>
            <div style={{
              height: 'clamp(120px, 30vw, 200px)',
              backgroundImage: 'url("/profissional.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '15px 15px 0 0'
            }}>
            </div>
            <div style={{ padding: 'clamp(15px, 3vw, 25px)', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.3rem)', color: '#1e40af', marginBottom: '12px', fontWeight: 'bold' }}>
                Sou Profissional
              </h2>
              <Link href="/login?tipo=profissional" style={{
                display: 'inline-block',
                padding: '10px 35px',
                background: '#1e40af',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: 'none'
              }}>
                ACESSAR CADASTRO
              </Link>
            </div>
          </div>

          <div style={{
            background: '#fff',
            borderRadius: '15px',
            boxShadow: '0 10px 35px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer'
          }}>
            <div style={{
              height: 'clamp(120px, 30vw, 200px)',
              backgroundImage: 'url("/empresa.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '15px 15px 0 0'
            }}>
            </div>
            <div style={{ padding: 'clamp(15px, 3vw, 25px)', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.3rem)', color: '#1e40af', marginBottom: '12px', fontWeight: 'bold' }}>
                Sou Empresa
              </h2>
              <Link href="/login?tipo=empresa" style={{
                display: 'inline-block',
                padding: '10px 35px',
                background: '#1e40af',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: 'none'
              }}>
                CONTRATAR TALENTOS
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ 
        textAlign: 'center', 
        padding: '12px 20px', 
        backgroundColor: '#fff', 
        borderTop: '1px solid #e5e7eb',
        color: '#666',
        fontSize: '0.75rem',
        flex: '0 0 auto'
      }}>
        <div style={{ marginBottom: '8px' }} suppressHydrationWarning>
          <button 
            onClick={isIOS ? handleIOSInstall : handleInstall}
            disabled={!showInstall && !isIOS}
            suppressHydrationWarning
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: (showInstall || isIOS) ? '#1e40af' : '#9ca3af',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: (showInstall || isIOS) ? 'pointer' : 'not-allowed',
              opacity: (showInstall || isIOS) ? 1 : 0.6
            }}>
            📥 {showInstall ? 'INSTALAR APP' : isIOS ? 'ADICIONAR APP' : 'APP INSTALADO'}
          </button>
        </div>
        <p style={{ margin: 0 }}>
          © 2026 Recruta Indústria
        </p>
      </footer>
    </main>
  );
}
