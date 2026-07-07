"use client";

import { useRouter } from 'next/navigation';

export default function SucessoEmpresa() {
  const router = useRouter();

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', padding: '50px 20px', color: '#F2F2F2' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* HEADER DE SUCESSO */}
        <div style={{ backgroundColor: '#111111', color: '#F2F2F2', padding: '60px 40px', borderRadius: '20px', marginBottom: '40px', boxShadow: '0 8px 25px rgba(0,0,0,0.5)', border: '1px solid #8D6B1F' }}>
          <div style={{ fontSize: '120px', marginBottom: '20px' }}>🏭</div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 15px 0', color: '#C89B3C' }}>CONTA EMPRESARIAL ATIVADA!</h1>
          <p style={{ fontSize: '20px', margin: '0', color: '#F2F2F2' }}>Sua indústria agora faz parte da nossa rede de recrutamento industrial</p>
        </div>

        {/* CARDS DE BENEFÍCIOS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '50px' }}>
          
          <div style={{ backgroundColor: '#111111', padding: '30px', borderRadius: '15px', border: '1px solid #8D6B1F', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🔍</div>
            <h3 style={{ color: '#C89B3C', fontWeight: '900', margin: '0 0 10px 0', fontSize: '18px' }}>BUSCA AVANÇADA</h3>
            <p style={{ color: '#F2F2F2', margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
              Acesse perfis completos de profissionais qualificados na sua região
            </p>
          </div>

          <div style={{ backgroundColor: '#111111', padding: '30px', borderRadius: '15px', border: '1px solid #8D6B1F', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>💡</div>
            <h3 style={{ color: '#C89B3C', fontWeight: '900', margin: '0 0 10px 0', fontSize: '18px' }}>DICAS ANÔNIMAS</h3>
            <p style={{ color: '#F2F2F2', margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
              Forneça feedback construtivo para ajudar candidatos a melhorarem
            </p>
          </div>

          <div style={{ backgroundColor: '#111111', padding: '30px', borderRadius: '15px', border: '1px solid #8D6B1F', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>📊</div>
            <h3 style={{ color: '#C89B3C', fontWeight: '900', margin: '0 0 10px 0', fontSize: '18px' }}>ANÁLISES DE MERCADO</h3>
            <p style={{ color: '#F2F2F2', margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
              Veja quais empresas estão contratando e salários praticados
            </p>
          </div>

        </div>

        {/* MENSAGEM DE BOAS-VINDAS */}
        <div style={{ backgroundColor: '#111111', border: '1px solid #C89B3C', borderRadius: '20px', padding: '40px', marginBottom: '40px', boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}>
          <h2 style={{ color: '#C89B3C', fontWeight: '900', margin: '0 0 20px 0', fontSize: '24px' }}>🎉 BEM-VINDO À COMUNIDADE INDUSTRIAL!</h2>
          <p style={{ color: '#F2F2F2', margin: '0', fontSize: '16px', lineHeight: '1.6', fontWeight: '600' }}>
            Agora você tem acesso completo à nossa plataforma de recrutamento. 
            Explore perfis de candidatos qualificados, forneça feedback anônimo e 
            encontre os melhores talentos para sua empresa.
          </p>
        </div>

        {/* PRÓXIMOS PASSOS */}
        <div style={{ backgroundColor: '#111111', padding: '30px', borderRadius: '15px', border: '1px solid #8D6B1F', marginBottom: '40px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: '#C89B3C', fontWeight: '900', margin: '0 0 20px 0', fontSize: '20px' }}>🚀 PRÓXIMOS PASSOS</h3>
          <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: '#000000', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>1</div>
              <span style={{ color: '#F2F2F2', fontWeight: '600' }}>Configure seus filtros de busca</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: '#000000', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>2</div>
              <span style={{ color: '#F2F2F2', fontWeight: '600' }}>Explore perfis de candidatos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: '#000000', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>3</div>
              <span style={{ color: '#F2F2F2', fontWeight: '600' }}>Entre em contato com os selecionados</span>
            </div>
          </div>
        </div>

        {/* BUTTON PRINCIPAL */}
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => router.push('/company/dashboard-empresa')}
            style={{ 
              background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
              color: '#000000', 
              padding: '20px 50px', 
              border: 'none', 
              borderRadius: '15px', 
              cursor: 'pointer', 
              fontWeight: '900', 
              fontSize: '18px',
              boxShadow: '0 6px 20px rgba(141, 107, 31, 0.4)',
              transition: 'all 0.3s',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🚀 IR PARA PAINEL DA EMPRESA
          </button>
          <p style={{ color: '#F2F2F2', fontSize: '14px', margin: '0' }}>
            Comece agora sua jornada de recrutamento industrial
          </p>
        </div>

      </div>
    </div>
  );
}
