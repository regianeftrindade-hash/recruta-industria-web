import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ padding: '60px 40px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '15px' }}>Recruta Indústria</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '30px' }}>Conectando talentos à indústria</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link href="/login?tipo=profissional" style={{ padding: '14px 40px', background: '#fff', color: '#1e3a8a', textDecoration: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
            Sou Profissional
          </Link>
          <Link href="/login?tipo=empresa" style={{ padding: '14px 40px', background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontWeight: 'bold', border: '2px solid #fff' }}>
            Sou Empresa
          </Link>
        </div>
      </div>
      
      <div style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2rem', color: '#1e3a8a' }}>Por que escolher?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>👨‍💼</div>
            <h3 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Para Profissionais</h3>
            <p>Encontre as melhores oportunidades de trabalho no setor industrial com segurança garantida.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🏢</div>
            <h3 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Para Empresas</h3>
            <p>Recrute os melhores talentos com uma plataforma confiável e candidatos verificados.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🔐</div>
            <h3 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Seguro e Confiável</h3>
            <p>Proteção de dados LGPD, criptografia AES-256 e múltiplas camadas de segurança.</p>
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', marginTop: '40px' }}>
        <p style={{ margin: 0 }}>© 2026 Recruta Indústria - Conectando talentos. Impulsionando a indústria.</p>
      </footer>
    </main>
  );
}
