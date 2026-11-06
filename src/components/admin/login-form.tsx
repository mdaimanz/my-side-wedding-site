"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/actions/admin";

const initialState: LoginState = { error: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);
  return (
    <form action={action} className="admin-form">
      <label>Nama pengguna<input name="username" autoComplete="username" required /></label>
      <label>Kata laluan<input name="password" type="password" autoComplete="current-password" required /></label>
      <button className="button button-primary" disabled={pending}>{pending ? "Menyemak…" : "Log masuk"}</button>
      {state.error && <p className="form-message error">{state.error}</p>}
    </form>
  );
}

