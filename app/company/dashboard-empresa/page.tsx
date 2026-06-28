"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  userType?: string;
}

function ClientDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && mounted) {
      router.push("/login?redirect=/company/dashboard-empresa");
    }
  }, [status, router, mounted]);

  useEffect(() => {
    if (status === "authenticated" && mounted) {
      checkRegistrationStatus();
    }
  }, [status, mounted]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch("/api/company/check-registration");

      if (!response.ok) {
        setIsCheckingRegistration(false);
        return;
      }

      const data = await response.json();
      setRegistrationComplete(data.registrationComplete || false);
    } catch (error) {
      console.error("Erro ao verificar registro:", error);
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const user = session?.user as SessionUser | undefined;

  if (status === "loading" || isCheckingRegistration) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f4f8",
        }}
      >
        <p style={{ fontSize: "18px", color: "#666" }}>
          Carregando...
        </p>
      </div>
    );
  }

  if (!user) return null;

  // cadastro incompleto
  if (!registrationComplete) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f0f4f8",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            backgroundColor: "#001f3f",
            color: "white",
            padding: "20px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
              Dashboard
            </h1>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
              Bem-vindo
            </p>
          </div>

          <button
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </header>

        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              backgroundColor: "white",
              padding: "50px 40px",
              borderRadius: "20px",
              textAlign: "center",
            }}
          >
            <h2>Cadastro incompleto</h2>
            <p>
              Complete o cadastro para acessar todas funcionalidades.
            </p>

            <button
              onClick={() => router.push("/company/register")}
              style={{
                backgroundColor: "#001f3f",
                color: "white",
                padding: "16px 40px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Completar cadastro
            </button>
          </div>
        </main>
      </div>
    );
  }

  // dashboard completo
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
      }}
    >
      <header
        style={{
          backgroundColor: "#001f3f",
          color: "white",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h1>RECRUTA INDÚSTRIA</h1>

        <button
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            padding: "10px 20px",
          }}
        >
          Sair
        </button>
      </header>

      <main style={{ padding: "40px" }}>
        <h2>Dashboard</h2>
        <p>Bem-vindo ao painel!</p>
      </main>
    </div>
  );
}

export default ClientDashboard;
