"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors py-1"
    >
      Sair
    </button>
  );
}
