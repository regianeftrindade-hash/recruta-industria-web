"use client";

import { signIn } from "next-auth/react";

export function LoginGoogle() {
  return (
    <button
      onClick={() => {
        signIn("google");
      }}
    >
      Entrar com Google
    </button>
  );
}