import { useState } from "react";
import type { FormEvent } from "react";

const API = import.meta.env.VITE_API_URL as string;

type LoginResponse = {
  access_token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setCargando(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Credenciales inválidas");
      }

      const result = data as LoginResponse;

      localStorage.setItem("che_token", result.access_token);
      localStorage.setItem("che_usuario", JSON.stringify(result.usuario));

      window.location.href = "/admin";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/logo-che.jpg"
            alt="CHÉ Hair Studio"
            className="mx-auto mb-6 h-20 w-20 rounded-full object-cover"
          />

          <h1 className="text-3xl font-semibold tracking-tight">
            Panel CHÉ
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Administración de turnos
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-white/70"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@chehair.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition focus:border-white/30"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-white/70"
              >
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition focus:border-white/30"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando ? "Ingresando..." : "Ingresar al panel"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}