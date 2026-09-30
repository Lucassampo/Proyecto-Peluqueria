import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL as string;

type TurnoEstado =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "CANCELADO"
  | "COMPLETADO";

type Turno = {
  id: string;
  fecha: string;
  hora: string;
  estado: TurnoEstado;
  clientes: {
    id: string;
    nombre: string;
    telefono: string;
  };
  servicios: {
    id: string;
    nombre: string;
    precio: string | null;
    duracion_minutos: number;
  };
};

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
};

function hoyISO() {
  const d = new Date();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminApp() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [turnosMes, setTurnosMes] = useState<Turno[]>([]);
  const [fecha, setFecha] = useState(hoyISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("che_token");
    const usuarioGuardado = localStorage.getItem("che_usuario");

    if (!token || !usuarioGuardado) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      setUsuario(JSON.parse(usuarioGuardado));
    } catch {
      localStorage.removeItem("che_token");
      localStorage.removeItem("che_usuario");
      window.location.href = "/admin/login";
    }
  }, []);

  async function cargarTurnos() {
    const token = localStorage.getItem("che_token");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/turnos/admin?fecha=${encodeURIComponent(fecha)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("che_token");
        localStorage.removeItem("che_usuario");
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudieron cargar los turnos.");
      }

      const data = await response.json();

      setTurnos(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los turnos.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function cargarTurnosMes() {
    const token = localStorage.getItem("che_token");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      const [year, month] = fecha.split("-");

      const response = await fetch(
        `${API}/turnos/admin/mes?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("che_token");
        localStorage.removeItem("che_usuario");
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          "No se pudieron cargar las estadísticas.",
        );
      }

      const data = await response.json();

      setTurnosMes(data);
    } catch {
      setTurnosMes([]);
    }
  }

  async function actualizarEstado(
    id: string,
    estado: TurnoEstado,
  ) {
    const token = localStorage.getItem("che_token");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `${API}/turnos/${id}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado,
          }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("che_token");
        localStorage.removeItem("che_usuario");
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || "No se pudo actualizar el estado.",
        );
      }

      await Promise.all([
        cargarTurnos(),
        cargarTurnosMes(),
      ]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado.",
      );
    }
  }

  useEffect(() => {
    if (usuario) {
      cargarTurnos();
      cargarTurnosMes();
    }
  }, [usuario, fecha]);

  function cerrarSesion() {
    localStorage.removeItem("che_token");
    localStorage.removeItem("che_usuario");

    window.location.href = "/admin/login";
  }

  function formatearHora(hora: string) {
    return new Date(hora).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Cordoba",
    });
  }

  function formatearFecha(fechaISO: string) {
    const [year, month, day] = fechaISO.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatearMes(fechaISO: string) {
    const [year, month] = fechaISO.split("-");

    const fecha = new Date(
      Number(year),
      Number(month) - 1,
      1,
    );

    return fecha.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  }

  function claseEstado(estado: TurnoEstado) {
    switch (estado) {
      case "CONFIRMADO":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "CANCELADO":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      case "COMPLETADO":
        return "border-white/10 bg-white/10 text-white/60";

      default:
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    }
  }

  const totalMes = turnosMes.length;

  const confirmadosMes = turnosMes.filter(
    (turno) => turno.estado === "CONFIRMADO",
  ).length;

  const pendientesMes = turnosMes.filter(
    (turno) => turno.estado === "PENDIENTE",
  ).length;

  const completadosMes = turnosMes.filter(
    (turno) => turno.estado === "COMPLETADO",
  ).length;

  const [year, month] = fecha.split("-");

const diasDelMes = new Date(
  Number(year),
  Number(month),
  0,
).getDate();

const actividadMes = Array.from(
  { length: diasDelMes },
  (_, index) => {
    const dia = index + 1;

    const cantidad = turnosMes.filter((turno) => {
      const fechaTurno = new Date(turno.fecha);

      return (
        fechaTurno.getDate() === dia
      );
    }).length;

    return {
      dia,
      cantidad,
    };
  },
);

const maxActividad = Math.max(
  ...actividadMes.map((item) => item.cantidad),
  1,
);

  if (!usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] text-white">
        <p className="text-sm text-white/40">
          Cargando panel...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0d0d0d] lg:sticky lg:top-0 lg:h-screen lg:self-start lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <img
              src="/logo-che.jpg"
              alt="CHÉ Hair Studio"
              className="h-10 w-10 rounded-full object-cover"
            />

            <div>
              <p className="text-sm font-semibold tracking-wide">
                CHÉ
              </p>

              <p className="text-[11px] text-white/35">
                Hair Studio
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
              Gestión
            </p>

            <div className="space-y-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-medium text-white"
              >
                <span className="text-base">⌂</span>
                Inicio
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-base">◷</span>
                Agenda
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-base">♙</span>
                Clientes
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-base">✦</span>
                Servicios
              </button>
            </div>

            <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
              Sistema
            </p>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-base">⚙</span>
              Configuración
            </button>
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {usuario.nombre}
                </p>

                <p className="text-[11px] text-white/35">
                  {usuario.rol}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cerrarSesion}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/40 transition hover:bg-red-500/5 hover:text-red-300"
            >
              <span>↪</span>
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#0d0d0d] px-5 lg:hidden">
            <div className="flex items-center gap-3">
              <img
                src="/logo-che.jpg"
                alt="CHÉ Hair Studio"
                className="h-9 w-9 rounded-full object-cover"
              />

              <div>
                <p className="text-sm font-semibold">
                  CHÉ Hair Studio
                </p>

                <p className="text-[11px] text-white/35">
                  Panel de administración
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50"
            >
              Salir
            </button>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {/* HEADING */}
            <div className="mb-10">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-white/30">
                Dashboard
              </p>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Buenos días, {usuario.nombre.split(" ")[0]}
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Acá tenés el resumen de CHÉ Hair Studio.
              </p>
            </div>

            {/* ESTADÍSTICAS DEL MES */}
            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Total */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition duration-200 hover:border-white/20 hover:bg-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/30">
                      Turnos del mes
                    </p>

                    <p className="mt-4 text-3xl font-semibold tracking-tight">
                      {totalMes}
                    </p>

                    <p className="mt-1 text-xs capitalize text-white/30">
                      {formatearMes(fecha)}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50">
                    ◷
                  </div>
                </div>
              </div>

              {/* Confirmados */}
              <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.03] p-5 transition duration-200 hover:border-emerald-400/20 hover:bg-emerald-400/[0.05]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/30">
                      Confirmados
                    </p>

                    <p className="mt-4 text-3xl font-semibold tracking-tight text-emerald-300">
                      {confirmadosMes}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      Turnos confirmados
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    ✓
                  </div>
                </div>
              </div>

              {/* Pendientes */}
              <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] p-5 transition duration-200 hover:border-amber-400/20 hover:bg-amber-400/[0.05]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/30">
                      Pendientes
                    </p>

                    <p className="mt-4 text-3xl font-semibold tracking-tight text-amber-300">
                      {pendientesMes}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      Requieren atención
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                    !
                  </div>
                </div>
              </div>

              {/* Completados */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition duration-200 hover:border-white/20 hover:bg-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/30">
                      Completados
                    </p>

                    <p className="mt-4 text-3xl font-semibold tracking-tight">
                      {completadosMes}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      Servicios finalizados
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50">
                    ✓
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIVIDAD DEL MES */}
<div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
  <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/30">
        Actividad
      </p>

      <h2 className="mt-1 text-xl font-semibold">
        Turnos por día
      </h2>
    </div>

    <p className="text-xs capitalize text-white/30">
      {formatearMes(fecha)}
    </p>
  </div>

  <div className="overflow-x-auto">
    <div className="flex min-w-[700px] items-end gap-2">
      {actividadMes.map((item) => {
        const altura =
          item.cantidad === 0
            ? 4
            : Math.max(
                (item.cantidad / maxActividad) * 100,
                8,
              );

        return (
          <div
            key={item.dia}
            className="flex min-w-[18px] flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="flex h-40 w-full items-end justify-center">
              <div
                className="w-full max-w-6 rounded-t-md bg-white/20 transition-all duration-300 hover:bg-white/40"
                style={{
                  height: `${altura}%`,
                }}
                title={`${item.cantidad} turno${
                  item.cantidad === 1 ? "" : "s"
                } - día ${item.dia}`}
              />
            </div>

            <span className="text-[10px] text-white/25">
              {item.dia}
            </span>
          </div>
        );
      })}
    </div>
  </div>

  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
    <p className="text-xs text-white/30">
      Total de turnos:{" "}
      <span className="font-medium text-white/60">
        {totalMes}
      </span>
    </p>

    <p className="text-xs text-white/25">
      Actividad diaria
    </p>
  </div>
</div>

            {/* AGENDA */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Agenda
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Turnos del día
                </h2>

                <p className="mt-1 text-sm text-white/35">
                  {formatearFecha(fecha)}
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) =>
                    setFecha(event.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                />

                <button
                  type="button"
                  onClick={() => {
                    cargarTurnos();
                    cargarTurnosMes();
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Actualizar
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* TURNS */}
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <p className="text-sm text-white/35">
                  Cargando turnos...
                </p>
              </div>
            ) : turnos.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl text-white/40">
                  ◷
                </div>

                <p className="text-base font-medium">
                  No hay turnos para esta fecha.
                </p>

                <p className="mt-2 text-sm text-white/35">
                  Probá seleccionando otro día.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {turnos.map((turno) => (
                  <article
                    key={turno.id}
                    className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition duration-200 hover:border-white/20 hover:bg-white/[0.04] sm:p-5"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      {/* Client + time */}
                      <div className="flex items-center gap-5">
                        <div className="min-w-[72px]">
                          <p className="text-2xl font-semibold tracking-tight">
                            {formatearHora(turno.hora)}
                          </p>

                          <p className="mt-1 text-[11px] uppercase tracking-wider text-white/25">
                            Turno
                          </p>
                        </div>

                        <div className="h-10 w-px bg-white/10" />

                        <div>
                          <h3 className="text-base font-medium">
                            {turno.clientes.nombre}
                          </h3>

                          <p className="mt-1 text-sm text-white/35">
                            {turno.clientes.telefono}
                          </p>
                        </div>
                      </div>

                      {/* Service + status + actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="mr-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                          <p className="text-sm">
                            {turno.servicios.nombre}
                          </p>

                          <p className="mt-0.5 text-[11px] text-white/30">
                            {turno.servicios.duracion_minutos} min
                          </p>
                        </div>

                        <span
                          className={`rounded-xl border px-3 py-2.5 text-[11px] font-medium ${claseEstado(
                            turno.estado,
                          )}`}
                        >
                          {turno.estado}
                        </span>

                        {turno.estado === "PENDIENTE" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                actualizarEstado(
                                  turno.id,
                                  "CONFIRMADO",
                                )
                              }
                              className="rounded-xl bg-emerald-400/10 px-3 py-2.5 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-400/20"
                            >
                              Confirmar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                actualizarEstado(
                                  turno.id,
                                  "CANCELADO",
                                )
                              }
                              className="rounded-xl bg-red-400/10 px-3 py-2.5 text-[11px] font-medium text-red-300 transition hover:bg-red-400/20"
                            >
                              Cancelar
                            </button>
                          </>
                        )}

                        {turno.estado === "CONFIRMADO" && (
                          <button
                            type="button"
                            onClick={() =>
                              actualizarEstado(
                                turno.id,
                                "COMPLETADO",
                              )
                            }
                            className="rounded-xl bg-white/10 px-3 py-2.5 text-[11px] font-medium text-white/60 transition hover:bg-white/15 hover:text-white"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}