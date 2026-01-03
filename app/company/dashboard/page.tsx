"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PainelBuscaIndustrial() {
  const router = useRouter();
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidadesFiltradas, setCidadesFiltradas] = useState<string[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const listaEstados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  const areasIndustria = ["Produção / Operacional", "Manutenção", "Logística / Expedição", "Qualidade", "Segurança (SESMT)"];

  useEffect(() => {
    if (estado) {
      setCarregandoCidades(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
        .then(res => res.json())
        .then(data => {
          const nomesCidades = data.map((c: any) => c.nome).sort();
          setCidadesFiltradas(nomesCidades);
          setCarregandoCidades(false);
        }).catch(() => setCarregandoCidades(false));
    }
  }, [estado]);

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'Arial, sans-serif', paddingBottom: '80px' }}>
      <div style={{ backgroundColor: '#001f3f', color: 'white', padding: '30px 20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900' }}>BUSCA DE TALENTOS INDUSTRIAIS</h1>
      </div>

      <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', border: '3px solid #000' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            <div>
              <label style={{ fontWeight: '900', display: 'block', marginBottom: '8px' }}>ESTADO</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} style={selectStyle}>
                <option value="">Selecione UF</option>
                {listaEstados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: '900', display: 'block', marginBottom: '8px' }}>CIDADE</label>
              <select value={cidade} onChange={(e) => setCidade(e.target.value)} disabled={!estado} style={selectStyle}>
                <option value="">{carregandoCidades ? "Carregando..." : "Selecione Cidade"}</option>
                {/* CORREÇÃO: Usando o index para evitar erro de Americana duplicada */}
                {cidadesFiltradas.map((c, idx) => <option key={`${c}-${idx}`} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: '900', display: 'block', marginBottom: '8px' }}>ÁREA</label>
              <select style={selectStyle}>
                <option value="">Selecione Área</option>
                {/* CORREÇÃO: Sintaxe correta key={a} */}
                {areasIndustria.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => setMostrarResultados(true)} style={btnStyle}>PESQUISAR AGORA</button>
        </div>

        {mostrarResultados && (
          <div style={{ marginTop: '40px', backgroundColor: 'white', padding: '25px', borderRadius: '15px', border: '3px solid #001f3f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontWeight: '900' }}>Erasmo Silva</h4>
              <p style={{ margin: 0 }}>Operador de Empilhadeira • {cidade} - {estado}</p>
            </div>
            <button onClick={() => router.push('/company/profile/erasmo')} style={btnSmallStyle}>ABRIR PERFIL</button>
          </div>
        )}
      </div>
    </div>
  );
}

const selectStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '3px solid #000', fontWeight: 'bold' };
const btnStyle = { width: '100%', backgroundColor: '#001f3f', color: 'white', padding: '18px', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '900', cursor: 'pointer', marginTop: '10px' };
const btnSmallStyle = { backgroundColor: '#001f3f', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };