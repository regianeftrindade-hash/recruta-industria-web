import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        padding: '40px 40px', 
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        color: '#fff', 
        textAlign: 'center',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grid)" /%3E%3C/svg%3E")'
      }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '2px' }}>
          RECRUTA INDÚSTRIA
        </h1>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px' }}>
        {/* Professional and Company Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
          {/* Professional Card */}
          <div style={{
            background: '#fff',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            textAlign: 'center'
          }}>
            <div style={{
              height: '250px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '4rem',
              fontWeight: 'bold'
            }}>
              👨‍🔧
            </div>
            <div style={{ padding: '40px' }}>
              <h2 style={{ fontSize: '1.8rem', color: '#1e40af', marginBottom: '20px', fontWeight: 'bold' }}>
                Sou Profissional
              </h2>
              <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                Encontre as melhores oportunidades de trabalho no setor industrial com segurança e confiabilidade.
              </p>
              <Link href="/login?tipo=profissional" style={{
                display: 'inline-block',
                padding: '14px 35px',
                background: '#1e40af',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.3s ease'
              }} onMouseEnter={(e) => e.currentTarget.style.background = '#1e3a8a'} onMouseLeave={(e) => e.currentTarget.style.background = '#1e40af'}>
                ACESSAR CADASTRO
              </Link>
            </div>
          </div>

          {/* Company Card */}
          <div style={{
            background: '#fff',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            textAlign: 'center'
          }}>
            <div style={{
              height: '250px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '4rem',
              fontWeight: 'bold'
            }}>
              🏭
            </div>
            <div style={{ padding: '40px' }}>
              <h2 style={{ fontSize: '1.8rem', color: '#1e40af', marginBottom: '20px', fontWeight: 'bold' }}>
                Sou Empresa
              </h2>
              <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                Recrute os melhores talentos da indústria com uma plataforma confiável e candidatos verificados.
              </p>
              <Link href="/login?tipo=empresa" style={{
                display: 'inline-block',
                padding: '14px 35px',
                background: '#1e40af',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.3s ease'
              }} onMouseEnter={(e) => e.currentTarget.style.background = '#1e3a8a'} onMouseLeave={(e) => e.currentTarget.style.background = '#1e40af'}>
                CONTRATAR TALENTOS
              </Link>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
          color: '#fff',
          padding: '30px',
          textAlign: 'center',
          borderRadius: '10px',
          marginBottom: '60px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          CONECTANDO TALENTOS. IMPULSIONANDO A INDÚSTRIA.
        </div>

        {/* Security Section */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '1.8rem', 
            color: '#1e40af', 
            marginBottom: '40px',
            fontWeight: 'bold'
          }}>
            🔒 Segurança Implementada
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '25px'
          }}>
            {[
              { icon: '🔐', title: 'Senhas Criptografadas', desc: 'Senhas com algoritmo bcrypt com salt' },
              { icon: '🛡️', title: 'CSRF Protection', desc: 'Tokens CSRF em validação de sessão' },
              { icon: '🚫', title: 'Account Lockout', desc: 'Bloqueio após 5 tentativas falhadas' },
              { icon: '🔍', title: 'Recapcha', desc: 'Token seguro com expiração 1 hora' },
              { icon: '⚠️', title: 'Detecção de Anomalias', desc: 'Login em novo IP detectado' },
              { icon: '📊', title: 'Auditoria Completa', desc: 'Logs de todas as ações com timestamp' },
              { icon: '🔑', title: 'Security Headers', desc: 'X-Frame-Options, CSP, HSTS e XSS' },
              { icon: '📱', title: 'Rate Limiting', desc: 'Prevenção de brute force e DDoS' },
              { icon: '👁️', title: 'IP Blacklist', desc: 'Lista de IPs suspeitos em tempo real' }
            ].map((item, index) => (
              <div key={index} style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{item.icon}</div>
                <h3 style={{ color: '#1e40af', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '40px', 
        backgroundColor: '#fff', 
        borderTop: '1px solid #e5e7eb',
        color: '#666'
      }}>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>
          © 2026 Recruta Indústria - Conectando talentos. Impulsionando a indústria.
        </p>
      </footer>
    </main>
  );
}
