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
  const [showInstall, setShowInstall] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se é iOS (não suporta beforeinstallprompt)
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(isIos);

    // Verificar se já está instalado
    const checkInstalled = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
      if (isStandalone) {
        setShowInstall(false);
        console.log('✓ App já está instalado');
      }
    };

    checkInstalled();

    // Verificar se o manifest está acessível
    fetch('/manifest.json')
      .then(res => {
        if (res.ok) {
          console.log('✓ Manifest.json está acessível');
          return res.json();
        } else {
          console.error('❌ Manifest.json não encontrado');
        }
      })
      .then(manifest => {
        if (manifest) {
          console.log('✓ Manifest carregado:', manifest.name);
        }
      })
      .catch(err => console.error('❌ Erro ao carregar manifest:', err));

    // Handler para PWA no Chrome, Edge, Android
    const handler = (e: BeforeInstallPromptEvent) => {
      console.log('🎉 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as any);
      setShowInstall(true);
    };

    // Adicionar listener para o evento
    window.addEventListener('beforeinstallprompt', handler as any);
    
    // Verificar periodicamente se foi instalado
    const interval = setInterval(checkInstalled, 2000);

    // Verificar se service worker está ativo
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        console.log('✓ Service Worker está pronto');
      }).catch(err => {
        console.warn('⚠️ Service Worker não está pronto:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
      clearInterval(interval);
    };
  }, []);

  const handleInstall = async () => {
    console.log('🔵 handleInstall called', { 
      deferredPrompt: !!deferredPrompt, 
      isIOS, 
      isInstalled,
      userAgent: navigator.userAgent 
    });
    
    // Verificar novamente se já está instalado
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      alert('✅ O app já está instalado!');
      setIsInstalled(true);
      return;
    }

    // Se for iOS, mostrar instruções
    if (isIOS) {
      handleIOSInstall();
      return;
    }

    // Verificar se está em HTTPS ou localhost (requisito para PWA)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      alert('⚠️ Para instalar o app, é necessário acessar via HTTPS ou localhost.\n\nAtualmente você está em: ' + window.location.protocol + '//' + window.location.hostname);
      return;
    }

    // Tentar usar o prompt se disponível
    if (deferredPrompt) {
      try {
        console.log('📱 Tentando usar prompt automático...');
        // Verificar se o prompt ainda é válido
        if (typeof deferredPrompt.prompt === 'function') {
          await deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('👤 Escolha do usuário:', outcome);
          
          if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstall(false);
            setIsInstalled(true);
            console.log('✅ Instalação aceita pelo usuário');
            // Aguardar um pouco antes de mostrar mensagem
            setTimeout(() => {
              alert('✅ Instalação iniciada! O app será adicionado à sua tela inicial em breve.');
            }, 500);
          } else {
            console.log('❌ Usuário cancelou a instalação');
            showManualInstructions();
          }
        } else {
          throw new Error('Prompt não disponível - função prompt() não existe');
        }
      } catch (error) {
        console.error('❌ Erro ao chamar prompt:', error);
        // Limpar o prompt inválido
        setDeferredPrompt(null);
        showManualInstructions();
      }
    } else {
      // Se não houver prompt, mostrar instruções manuais
      console.log('⚠️ No deferredPrompt available');
      console.log('📋 Verificando condições PWA...');
      
      // Verificar se service worker está ativo
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
          console.log('✓ Service Worker está pronto');
        }).catch(() => {
          console.warn('⚠️ Service Worker não está pronto');
        });
      }
      
      // Verificar se manifest está acessível
      fetch('/manifest.json')
        .then(res => {
          if (res.ok) {
            console.log('✓ Manifest está acessível');
          } else {
            console.error('❌ Manifest não está acessível');
          }
        })
        .catch(err => console.error('❌ Erro ao verificar manifest:', err));
      
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (/android/.test(userAgent)) {
      instructions = 'Para instalar o app no Android:\n\n' +
        '1. Toque no menu do navegador (⋮ ou ⋯)\n' +
        '2. Selecione "Adicionar à tela inicial" ou "Instalar app"\n' +
        '3. Confirme a instalação\n\n' +
        'Ou procure o ícone de instalação (⬇️) na barra de endereço.';
    } else if (/chrome|edge|opera/.test(userAgent)) {
      instructions = 'Para instalar o app no Chrome/Edge:\n\n' +
        '1. Clique no ícone de instalação (⬇️) na barra de endereço\n' +
        'OU\n' +
        '2. Clique no menu (⋮) → "Instalar Recruta Indústria..."\n' +
        '3. Confirme a instalação';
    } else {
      instructions = 'Para instalar o app:\n\n' +
        '1. Clique no menu do navegador\n' +
        '2. Procure por "Instalar app" ou "Adicionar à tela inicial"\n' +
        '3. Confirme a instalação';
    }

    alert(instructions);
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
            suppressHydrationWarning
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: '#1e40af',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: 'pointer',
              opacity: 1
            }}>
            📥 {isInstalled ? 'APP INSTALADO' : isIOS ? 'ADICIONAR APP' : 'BAIXAR APLICATIVO'}
          </button>
        </div>
        <p style={{ margin: 0 }}>
          © 2026 Recruta Indústria
        </p>
      </footer>
    </main>
  );
}
