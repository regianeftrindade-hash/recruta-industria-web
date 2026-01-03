"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PerfilCandidato() {
  const router = useRouter();
  const [dica, setDica] = useState("");
  const [enviado, setEnviado] = useState(false);

  const enviarDicaAnonima = () => {
    if (dica.trim() !== "") {
      setEnviado(true);
      setDica("");
      setTimeout(() => setEnviado(false), 3000);
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold', border: '2px solid #001f3f', backgroundColor: '#001f3f', color: 'white', padding: '10px 20px', borderRadius: '5px' }}>← VOLTAR</button>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '4px solid #000', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#001f3f', color: 'white', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px' }}>👤</div>
            <h1 style={{ margin: 0, fontWeight: '900', fontSize: '32px' }}>ERASMO SILVA</h1>
            <p style={{ fontSize: '18px', margin: '10px 0 0 0' }}>OPERADOR DE EMPILHADEIRA</p>
          </div>

          <div style={{ padding: '40px' }}>
            <h3 style={{ borderBottom: '3px solid #001f3f', color: '#001f3f', fontWeight: '900', fontSize: '20px', paddingBottom: '10px' }}>📍 LOCALIZAÇÃO</h3>
            <p style={{ fontSize: '16px', marginTop: '15px' }}>Hortolândia - SP</p>

            <h3 style={{ borderBottom: '3px solid #001f3f', color: '#001f3f', fontWeight: '900', marginTop: '40px', fontSize: '20px', paddingBottom: '10px' }}>👨‍💼 PERFIL PROFISSIONAL</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '2px solid #001f3f', textAlign: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#001f3f' }}>IDADE:</strong><br/>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>43 anos</span>
              </div>
              <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '2px solid #001f3f', textAlign: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#001f3f' }}>EXPERIÊNCIA:</strong><br/>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>8 anos</span>
              </div>
              <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '2px solid #001f3f', textAlign: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#001f3f' }}>FORMAÇÃO:</strong><br/>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Ensino Médio Completo</span>
              </div>
              <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '2px solid #001f3f', textAlign: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#001f3f' }}>DISPONIBILIDADE:</strong><br/>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Integral</span>
              </div>
            </div>

            <h3 style={{ borderBottom: '3px solid #001f3f', color: '#001f3f', fontWeight: '900', marginTop: '40px', fontSize: '20px', paddingBottom: '10px' }}>🎯 HABILIDADES E CERTIFICAÇÕES</h3>
            <div style={{ marginTop: '20px' }}>
              <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '10px', border: '2px solid #001f3f', marginBottom: '15px' }}>
                <strong style={{ color: '#001f3f', fontSize: '16px' }}>NR-12:</strong> <span style={{ fontSize: '16px' }}>Certificado em Segurança no Trabalho</span>
              </div>
              <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '10px', border: '2px solid #001f3f', marginBottom: '15px' }}>
                <strong style={{ color: '#001f3f', fontSize: '16px' }}>CNH B:</strong> <span style={{ fontSize: '16px' }}>Carteira de Habilitação</span>
              </div>
              <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '10px', border: '2px solid #001f3f' }}>
                <strong style={{ color: '#001f3f', fontSize: '16px' }}>Experiência:</strong> <span style={{ fontSize: '16px' }}>Operação de empilhadeiras elétricas e a combustão</span>
              </div>
            </div>

            <h3 style={{ borderBottom: '3px solid #001f3f', color: '#001f3f', fontWeight: '900', marginTop: '40px', fontSize: '20px', paddingBottom: '10px' }}>💼 ÚLTIMAS EXPERIÊNCIAS</h3>
            <div style={{ marginTop: '20px' }}>
              <div style={{ backgroundColor: '#f0f8ff', padding: '25px', borderRadius: '10px', border: '2px solid #001f3f', marginBottom: '20px' }}>
                <strong style={{ fontSize: '18px', color: '#001f3f' }}>Empresa ABC Logística</strong> <span style={{ fontSize: '14px', color: '#666' }}>(2020 - Atual)</span><br/>
                <em style={{ fontSize: '16px', color: '#001f3f' }}>Operador de Empilhadeira Sênior</em><br/>
                <small style={{ fontSize: '14px', lineHeight: '1.5' }}>Responsável por movimentação de cargas, controle de inventário e manutenção preventiva de equipamentos.</small>
              </div>
              <div style={{ backgroundColor: '#f0f8ff', padding: '25px', borderRadius: '10px', border: '2px solid #001f3f' }}>
                <strong style={{ fontSize: '18px', color: '#001f3f' }}>Depósito XYZ</strong> <span style={{ fontSize: '14px', color: '#666' }}>(2018 - 2020)</span><br/>
                <em style={{ fontSize: '16px', color: '#001f3f' }}>Auxiliar de Almoxarifado</em><br/>
                <small style={{ fontSize: '14px', lineHeight: '1.5' }}>Controle de estoque, recebimento de mercadorias e organização de produtos.</small>
              </div>
            </div>
          </div>

          {/* RODAPÉ DE DICAS ANÔNIMAS */}
          <div style={{ backgroundColor: '#fffbe6', padding: '40px', borderTop: '4px solid #000' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404', fontWeight: '900', fontSize: '18px' }}>💡 DEIXE UMA DICA E AJUDE ESSE PROFISSIONAL A CRESCER</h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#856404', fontWeight: 'bold' }}>(Não se preocupe, você ficará anônimo)</p>
            <textarea 
              value={dica}
              onChange={(e) => setDica(e.target.value)}
              placeholder="Escreva aqui seu feedback..."
              style={{ width: '100%', padding: '20px', borderRadius: '10px', border: '3px solid #000', minHeight: '120px', boxSizing: 'border-box', fontSize: '16px' }}
            />
            <button onClick={enviarDicaAnonima} style={{ width: '100%', backgroundColor: '#001f3f', color: 'white', padding: '18px', border: 'none', borderRadius: '10px', fontWeight: '900', marginTop: '15px', cursor: 'pointer', fontSize: '16px' }}>
              {enviado ? "✅ DICA ENVIADA!" : "ENVIAR DICA ANÔNIMA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}