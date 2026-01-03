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

export default function Home() {
  return (
    <main style={{ backgroundColor: '#f8f9fa', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '25px 40px', 
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
        <div style={{ background: 'rgba(30, 64, 175, 0.5)', padding: '12px 0', borderRadius: '8px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0px', fontWeight: 'bold', letterSpacing: '3px' }}>
            RECRUTA INDÚSTRIA
          </h1>
        </div>
      </div>

      <div style={{ flex: '1 1 auto', overflow: 'hidden', padding: '60px 40px 15px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '50px' }}>
          <div style={{
            background: '#fff',
            borderRadius: '15px',
            boxShadow: '0 10px 35px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 35px rgba(0,0,0,0.15)';
          }}>
            <div style={{
              height: '280px',
              backgroundImage: 'url("/profissional.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '15px 15px 0 0'
            }}>
            </div>
            <div style={{ padding: '25px 20px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#1e40af', marginBottom: '12px', fontWeight: 'bold' }}>
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
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: 'none'
              }} 
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e3a8a';
                e.currentTarget.style.transform = 'scale(1.05)';
              }} 
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1e40af';
                e.currentTarget.style.transform = 'scale(1)';
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
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 35px rgba(0,0,0,0.15)';
          }}>
            <div style={{
              height: '280px',
              backgroundImage: 'url("/empresa.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '15px 15px 0 0'
            }}>
            </div>
            <div style={{ padding: '25px 20px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#1e40af', marginBottom: '12px', fontWeight: 'bold' }}>
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
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: 'none'
              }} 
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e3a8a';
                e.currentTarget.style.transform = 'scale(1.05)';
              }} 
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1e40af';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
                CONTRATAR TALENTOS
              </Link>
            </div>
          </div>
        </div>

        <div style={{
          backgroundImage: 'url("/profissional.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff',
          padding: '14px',
          textAlign: 'center',
          borderRadius: '12px',
          marginBottom: '15px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          letterSpacing: '1px',
          backgroundColor: '#4da6d6',
          backgroundBlendMode: 'multiply'
        }}>
          <div style={{ background: 'rgba(30, 64, 175, 0.5)', padding: '10px', borderRadius: '8px' }}>
            CONECTANDO TALENTOS. IMPULSIONANDO A INDÚSTRIA.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '1.1rem', 
            color: '#1e40af', 
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            🔒 Segurança
          </h2>
          
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {[
              { icon: '🔐', title: 'Senhas Criptografadas' },
              { icon: '🛡️', title: 'CSRF Protection' },
              { icon: '🚫', title: 'Account Lockout' },
              { icon: '🔍', title: 'Recaptcha' },
              { icon: '⚠️', title: 'Detecção de Anomalias' },
              { icon: '📊', title: 'Auditoria Completa' },
              { icon: '🔑', title: 'Security Headers' },
              { icon: '📱', title: 'Rate Limiting' },
              { icon: '👁️', title: 'IP Blacklist' },
              { icon: '📋', title: 'Checklist Segurança' }
            ].map((item, index) => (
              <div key={index} style={{
                background: '#fff',
                padding: '6px 10px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                textAlign: 'center',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{item.icon}</div>
                <h3 style={{ color: '#1e40af', fontSize: '0.55rem', fontWeight: 'bold', margin: 0, lineHeight: '1' }}>
                  {item.title}
                </h3>
              </div>
            ))}
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
        <div style={{ marginBottom: '8px' }}>
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/recruta-industria.apk';
              link.download = 'recruta-industria.apk';
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                document.body.removeChild(link);
              }, 100);
            }}
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
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1e3a8a';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1e40af';
            e.currentTarget.style.transform = 'scale(1)';
          }}>
            📥 BAIXAR APLICATIVO
          </button>
        </div>
        <p style={{ margin: 0 }}>
          © 2026 Recruta Indústria
        </p>
      </footer>
    </main>
  );
}
