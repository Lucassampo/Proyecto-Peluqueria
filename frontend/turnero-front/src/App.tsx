import { useEffect, useMemo, useState } from "react";

type TurnoEstado = "PENDIENTE" | "CONFIRMADO" | "CANCELADO";

type Turno = {
  id: string;
  nombreCliente: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: TurnoEstado;
  createdAt: string;
};

const API = import.meta.env.VITE_API_URL as string;

function hoyISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function generarHorarios() {
  const res: string[] = [];
  for (let h = 9; h <= 17; h++) {
    res.push(`${String(h).padStart(2, "0")}:00`);
    res.push(`${String(h).padStart(2, "0")}:30`);
  }
  res.push("18:00");
  return res;
}

async function getTurnos(fecha: string): Promise<Turno[]> {
  const r = await fetch(`${API}/turnos?fecha=${encodeURIComponent(fecha)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function crearTurno(payload: {
  nombreCliente: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
}): Promise<Turno> {
  const r = await fetch(`${API}/turnos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function actualizarEstado(id: string, estado: TurnoEstado): Promise<Turno> {
  const r = await fetch(`${API}/turnos/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function badgeColor(estado: TurnoEstado) {
  if (estado === "CONFIRMADO") return { bg: "#065f46", fg: "white" };
  if (estado === "CANCELADO") return { bg: "#374151", fg: "white" };
  return { bg: "#1f2937", fg: "white" }; // PENDIENTE
}

export default function App() {
  const horarios = useMemo(() => generarHorarios(), []);
  const [tab, setTab] = useState<"cliente" | "admin">("cliente");

  const [fecha, setFecha] = useState(hoyISO());
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [hora, setHora] = useState("");

  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [servicio, setServicio] = useState("Corte");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | TurnoEstado>("TODOS");

  const ocupados = useMemo(() => {
    const s = new Set<string>();
    turnos.forEach((t) => {
      if (t.estado !== "CANCELADO") s.add(t.hora);
    });
    return s;
  }, [turnos]);

  const turnosFiltrados = useMemo(() => {
    if (filtroEstado === "TODOS") return turnos;
    return turnos.filter((t) => t.estado === filtroEstado);
  }, [turnos, filtroEstado]);

  async function cargar() {
    setErr("");
    setMsg("");
    try {
      const data = await getTurnos(fecha);
      setTurnos(data);
      // Si la hora elegida queda ocupada, la limpiamos
      if (hora && data.some((t) => t.hora === hora && t.estado !== "CANCELADO")) setHora("");
    } catch {
      setErr("Error cargando turnos");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line
  }, [fecha]);

  async function reservar() {
    setErr("");
    setMsg("");
    try {
      if (!hora) throw new Error("Elegí un horario");
      if (!nombreCliente.trim()) throw new Error("Ingresá tu nombre");
      if (!telefono.trim()) throw new Error("Ingresá tu teléfono");

      await crearTurno({ nombreCliente, telefono, servicio, fecha, hora });
      setMsg("✅ Turno reservado correctamente");
      setHora("");
      await cargar();
    } catch (e: any) {
      setErr(e?.message || "Error reservando turno");
    }
  }

  async function confirmar(id: string) {
    setErr("");
    setMsg("");
    try {
      await actualizarEstado(id, "CONFIRMADO");
      setMsg("✅ Turno confirmado");
      await cargar();
    } catch (e: any) {
      setErr(e?.message || "Error confirmando");
    }
  }

  async function cancelar(id: string) {
    setErr("");
    setMsg("");
    try {
      await actualizarEstado(id, "CANCELADO");
      setMsg("✅ Turno cancelado");
      await cargar();
    } catch (e: any) {
      setErr(e?.message || "Error cancelando");
    }
  }

  const inputStyle = {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #374151",
    background: "#1f2937",
    color: "white",
  } as const;

  const buttonGray = {
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#374151",
    color: "white",
    cursor: "pointer",
  } as const;

  return (
    <div
      style={{
        fontFamily: "system-ui",
        maxWidth: 1050,
        margin: "0 auto",
        padding: 30,
        minHeight: "100vh",
        background: "#111827",
        color: "white",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 36, marginBottom: 8 }}>Turnero Peluquería</h1>
          <div style={{ opacity: 0.65 }}>
            API: <code>{API}</code>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setTab("cliente")}
            style={{
              ...buttonGray,
              background: tab === "cliente" ? "#2563eb" : "#374151",
              fontWeight: 600,
            }}
          >
            Cliente
          </button>
          <button
            onClick={() => setTab("admin")}
            style={{
              ...buttonGray,
              background: tab === "admin" ? "#2563eb" : "#374151",
              fontWeight: 600,
            }}
          >
            Admin
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 15, marginTop: 18, marginBottom: 18, flexWrap: "wrap" }}>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
        <button onClick={cargar} style={buttonGray}>
          Recargar
        </button>

        {tab === "admin" && (
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as any)} style={inputStyle}>
            <option value="TODOS">Todos</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="CONFIRMADO">Confirmados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        )}
      </div>

      {err && <div style={{ background: "#7f1d1d", padding: 10, borderRadius: 10, marginBottom: 12 }}>{err}</div>}
      {msg && <div style={{ background: "#065f46", padding: 10, borderRadius: 10, marginBottom: 12 }}>{msg}</div>}

      {tab === "cliente" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            {/* HORARIOS */}
            <div>
              <h2>Horarios</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {horarios.map((h) => {
                  const ocupado = ocupados.has(h);
                  const selected = hora === h;

                  return (
                    <button
                      key={h}
                      disabled={ocupado}
                      onClick={() => setHora(h)}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "none",
                        fontWeight: 600,
                        background: ocupado ? "#7f1d1d" : selected ? "#2563eb" : "#1f2937",
                        color: "white",
                        opacity: ocupado ? 0.6 : 1,
                        cursor: ocupado ? "not-allowed" : "pointer",
                        transition: "0.2s",
                      }}
                      title={ocupado ? "Ocupado" : "Disponible"}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, opacity: 0.75 }}>
                Seleccionado: <strong>{hora || "-"}</strong>
              </div>
            </div>

            {/* RESERVAR */}
            <div>
              <h2>Reservar</h2>
              <div style={{ display: "grid", gap: 12 }}>
                <input
                  placeholder="Nombre"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Teléfono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  style={inputStyle}
                />
                <select value={servicio} onChange={(e) => setServicio(e.target.value)} style={inputStyle}>
                  <option>Corte</option>
                  <option>Barba</option>
                  <option>Corte + Barba</option>
                  <option>Color</option>
                </select>
                <button
                  onClick={reservar}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reservar turno
                </button>
              </div>
            </div>
          </div>

          <hr style={{ margin: "40px 0", borderColor: "#374151" }} />

          <h2>Turnos reservados del día</h2>

          {turnos.length === 0 ? (
            <div style={{ opacity: 0.6 }}>No hay turnos para esta fecha.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {turnos.map((t) => {
                const c = badgeColor(t.estado);
                return (
                  <div
                    key={t.id}
                    style={{
                      borderRadius: 12,
                      padding: 14,
                      background: "#0b1220",
                      border: "1px solid #374151",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {t.hora} — {t.servicio}
                      </div>
                      <div style={{ opacity: 0.8 }}>
                        {t.nombreCliente} ({t.telefono})
                      </div>
                    </div>

                    <span
                      style={{
                        alignSelf: "center",
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: c.bg,
                        color: c.fg,
                        border: "1px solid #374151",
                        fontWeight: 700,
                      }}
                    >
                      {t.estado}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Admin — Gestión de turnos</h2>
          <div style={{ opacity: 0.7, marginBottom: 10 }}>
            Confirmá o cancelá turnos. (Más adelante le ponemos login.)
          </div>

          {turnosFiltrados.length === 0 ? (
            <div style={{ opacity: 0.6 }}>No hay turnos para este filtro/fecha.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {turnosFiltrados.map((t) => {
                const c = badgeColor(t.estado);
                const puedeConfirmar = t.estado !== "CONFIRMADO" && t.estado !== "CANCELADO";
                const puedeCancelar = t.estado !== "CANCELADO";

                return (
                  <div
                    key={t.id}
                    style={{
                      borderRadius: 12,
                      padding: 14,
                      background: "#0b1220",
                      border: "1px solid #374151",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {t.hora} — {t.servicio}
                      </div>
                      <div style={{ opacity: 0.85 }}>
                        {t.nombreCliente} ({t.telefono})
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>ID: {t.id}</div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: c.bg,
                          color: c.fg,
                          border: "1px solid #374151",
                          fontWeight: 700,
                        }}
                      >
                        {t.estado}
                      </span>

                      <button
                        onClick={() => confirmar(t.id)}
                        disabled={!puedeConfirmar}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "none",
                          background: puedeConfirmar ? "#065f46" : "#374151",
                          color: "white",
                          fontWeight: 800,
                          cursor: puedeConfirmar ? "pointer" : "not-allowed",
                          opacity: puedeConfirmar ? 1 : 0.6,
                        }}
                      >
                        Confirmar
                      </button>

                      <button
                        onClick={() => cancelar(t.id)}
                        disabled={!puedeCancelar}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "none",
                          background: puedeCancelar ? "#7f1d1d" : "#374151",
                          color: "white",
                          fontWeight: 800,
                          cursor: puedeCancelar ? "pointer" : "not-allowed",
                          opacity: puedeCancelar ? 1 : 0.6,
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}