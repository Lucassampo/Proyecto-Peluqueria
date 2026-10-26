
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Login from "./admin/login";
import AdminApp from "./admin/AdminApp";

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
const WHATSAPP = "543463401716";

const servicios = [
  { nombre: "Corte", descripcion: "Corte masculino" },
  { nombre: "Barba", descripcion: "Perfilado y arreglo de barba" },
  { nombre: "Corte + Barba", descripcion: "Servicio completo" },
];

function hoyISO() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function generarHorarios() {
  const horarios: string[] = [];

  for (let hora = 9; hora <= 17; hora++) {
    horarios.push(`${String(hora).padStart(2, "0")}:00`);
    horarios.push(`${String(hora).padStart(2, "0")}:30`);
  }

  horarios.push("18:00");
  return horarios;
}

function normalizarHora(hora: string): string {
  const iso = hora.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;

  const simple = hora.match(/^(\d{2}):(\d{2})/);
  if (simple) return `${simple[1]}:${simple[2]}`;

  return hora;
}

function formatearFecha(fechaISO: string) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

async function getTurnos(fecha: string): Promise<Turno[]> {
  if (!API) {
    throw new Error("Falta configurar la URL del servidor.");
  }

  const respuesta = await fetch(
    `${API}/turnos?fecha=${encodeURIComponent(fecha)}`,
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar la disponibilidad.");
  }

  const datos = await respuesta.json();

  return datos.map((turno: Turno) => ({
    ...turno,
    hora: normalizarHora(turno.hora),
  }));
}

async function crearTurno(datos: {
  nombreCliente: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
}): Promise<Turno> {
  const respuesta = await fetch(`${API}/turnos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text();
    let mensaje = "No se pudo reservar el horario.";

    try {
      const json = JSON.parse(texto);
      if (json.message) {
        mensaje = Array.isArray(json.message)
          ? json.message.join(", ")
          : json.message;
      }
    } catch {
      if (texto) mensaje = texto;
    }

    throw new Error(mensaje);
  }

  return respuesta.json();
}

function PublicApp() {
  const horarios = useMemo(() => generarHorarios(), []);

  const [fecha, setFecha] = useState(hoyISO());
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [hora, setHora] = useState("");
  const [servicio, setServicio] = useState("Corte");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");

  const [paso, setPaso] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [err, setErr] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [reservaEnviada, setReservaEnviada] = useState(false);

  const ocupados = useMemo(
    () =>
      new Set(
        turnos
          .filter((turno) => turno.estado !== "CANCELADO")
          .map((turno) => turno.hora),
      ),
    [turnos],
  );

  async function cargar() {
    setLoading(true);
    setErrorCarga("");

    try {
      const datos = await getTurnos(fecha);
      setTurnos(datos);

      if (
        hora &&
        datos.some(
          (turno) =>
            turno.hora === hora && turno.estado !== "CANCELADO",
        )
      ) {
        setHora("");
      }
    } catch {
      setErrorCarga(
        "No pudimos cargar los horarios. Revisá tu conexión e intentá nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  function seleccionarFecha(nuevaFecha: string) {
    setFecha(nuevaFecha);
    setHora("");
    setErr("");
  }

  function continuar() {
    setErr("");

    if (loading || errorCarga) {
      setErr("Esperá a que se cargue la disponibilidad.");
      return;
    }

    if (!hora) {
      setErr("Elegí un horario disponible.");
      return;
    }

    setPaso(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function volver() {
    setPaso(1);
    setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function abrirWhatsAppConHora(horaReservada: string) {
    const mensaje = `Hola! Quiero solicitar un turno en CHÉ Hair Studio:

Nombre: ${nombreCliente.trim()}
Teléfono: ${telefono.trim()}
Servicio: ${servicio}
Fecha: ${formatearFecha(fecha)}
Hora: ${horaReservada}

Quedo atento a la confirmación. ¡Gracias!`;

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function confirmarSolicitud() {
    setErr("");

    if (!nombreCliente.trim()) {
      setErr("Ingresá tu nombre.");
      return;
    }

    if (!telefono.trim()) {
      setErr("Ingresá tu teléfono.");
      return;
    }

    if (!hora) {
      setPaso(1);
      setErr("Elegí un horario disponible.");
      return;
    }

    setGuardando(true);

    try {
      // Comprobamos la disponibilidad antes de guardar.
      const turnosActualizados = await getTurnos(fecha);
      setTurnos(turnosActualizados);

      const ocupado = turnosActualizados.some(
        (turno) =>
          turno.hora === hora && turno.estado !== "CANCELADO",
      );

      if (ocupado) {
        setHora("");
        setPaso(1);
        setErr("Ese horario acaba de ocuparse. Elegí otro.");
        return;
      }

      const horaReservada = hora;

await crearTurno({
  nombreCliente: nombreCliente.trim(),
  telefono: telefono.trim(),
  servicio,
  fecha,
  hora: horaReservada,
});

setReservaEnviada(true);
abrirWhatsAppConHora(horaReservada);

    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo registrar el turno.";

      if (mensaje.toLowerCase().includes("horario no disponible")) {
        setHora("");
        setPaso(1);
        setErr("Ese horario acaba de ocuparse. Elegí otro.");
        await cargar();
      } else {
        setErr(mensaje);
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="booking-page">
      <header className="booking-topbar">
        <a href="#reserva" className="booking-brand" aria-label="CHÉ Hair Studio">
          <img src="/logo-che.jpg" alt="CHÉ Hair Studio" />
          <span>HAIR STUDIO</span>
        </a>

        <div className="booking-address">
          Nueva Córdoba
          <span>Larrañaga 31 · Local 1</span>
        </div>
      </header>

      <section className="reservation" id="reserva">
        <div className="reservation-heading">
          <p className="reservation-eyebrow">CHÉ HAIR STUDIO</p>
          <h1>{reservaEnviada ? "¡Listo!" : "Reservá tu turno"}</h1>
          {!reservaEnviada && (
            <>
              <p className="reservation-subtitle">
                Elegí el servicio, el día y el horario.
              </p>

              <div className="progress">
                <div className="progress-label">
                  <span>PASO {paso} DE 2</span>
                  <span>{paso === 1 ? "50%" : "100%"}</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-value ${
                      paso === 2 ? "progress-value--complete" : ""
                    }`}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {reservaEnviada ? (
          <div className="reservation-card success-card">
            <div className="success-icon">✓</div>
            <h2>Solicitud registrada</h2>
            <p>
              Tu turno quedó registrado. Podés enviar los datos por WhatsApp
              si no se abrió automáticamente.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => abrirWhatsAppConHora(hora)}
            >
              Abrir WhatsApp <span>↗</span>
            </button>
          </div>
        ) : paso === 1 ? (
          <div className="reservation-card">
            <div className="form-section">
              <h2>¿Qué servicio querés?</h2>

              <div className="service-options">
                {servicios.map((item) => (
                  <button
                    key={item.nombre}
                    type="button"
                    className={`service-option ${
                      servicio === item.nombre ? "service-option--active" : ""
                    }`}
                    onClick={() => {
                      setServicio(item.nombre);
                      setErr("");
                    }}
                  >
                    <span className="service-option-text">
                      <strong>{item.nombre}</strong>
                      <small>{item.descripcion}</small>
                    </span>
                    <span className="service-check">
                      {servicio === item.nombre ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="fecha">
                ¿Qué día te queda bien?
              </label>
              <input
                id="fecha"
                className="booking-input"
                type="date"
                value={fecha}
                min={hoyISO()}
                onChange={(event) => seleccionarFecha(event.target.value)}
              />
            </div>

            <div className="form-section">
              <div className="section-title-row">
                <h2>Horarios disponibles</h2>
                {!loading && !errorCarga && (
                  <span className="timezone-note">Cada 30 min</span>
                )}
              </div>

              {loading ? (
                <div className="availability-message">
                  Consultando disponibilidad...
                </div>
              ) : errorCarga ? (
                <div className="availability-error">
                  <p>{errorCarga}</p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={cargar}
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="time-options">
                  {horarios.map((horario) => {
                    const ocupado = ocupados.has(horario);
                    const seleccionado = hora === horario;

                    return (
                      <button
                        key={horario}
                        type="button"
                        disabled={ocupado}
                        aria-pressed={seleccionado}
                        className={`time-option ${
                          seleccionado ? "time-option--active" : ""
                        }`}
                        onClick={() => {
                          setHora(horario);
                          setErr("");
                        }}
                      >
                        {horario}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {err && <p className="form-error">{err}</p>}

            <div className="reservation-summary">
              <div>
                <span>Tu selección</span>
                <strong>{servicio}</strong>
                <small>
                  {formatearFecha(fecha)}
                  {hora ? ` · ${hora}` : ""}
                </small>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={continuar}
              disabled={!hora || loading || Boolean(errorCarga)}
            >
              Continuar <span>→</span>
            </button>
          </div>
        ) : (
          <div className="reservation-card">
            <div className="form-section">
              <h2>Tus datos</h2>
              <p className="section-help">
                ¿A nombre de quién reservamos?
              </p>
            </div>

            <div className="booking-summary">
              <div>
                <span>Servicio</span>
                <strong>{servicio}</strong>
              </div>
              <div>
                <span>Fecha</span>
                <strong>{formatearFecha(fecha)}</strong>
              </div>
              <div>
                <span>Horario</span>
                <strong>{hora}</strong>
              </div>
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="nombre">
                Nombre y apellido
              </label>
              <input
                id="nombre"
                className="booking-input"
                type="text"
                placeholder="Tu nombre"
                autoComplete="name"
                value={nombreCliente}
                onChange={(event) => setNombreCliente(event.target.value)}
              />
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="telefono">
                Teléfono
              </label>
              <input
                id="telefono"
                className="booking-input"
                type="tel"
                placeholder="Tu número de teléfono"
                autoComplete="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
              />
            </div>

            {err && <p className="form-error">{err}</p>}

            <button
              type="button"
              className="primary-button"
              onClick={confirmarSolicitud}
              disabled={guardando}
            >
              {guardando ? "Confirmando..." : "Confirmar turno"}
              {!guardando && <span>→</span>}
            </button>

            <button
              type="button"
              className="back-button"
              onClick={volver}
              disabled={guardando}
            >
              ← Volver a horarios
            </button>
          </div>
        )}
      </section>

      <footer className="booking-footer" id="contacto">
        <span>CHÉ HAIR STUDIO</span>
        <span>Nueva Córdoba · Larrañaga 31 · Local 1</span>
      </footer>
    </main>
  );
}

export default function App() {
  const pathname = window.location.pathname;

  if (pathname === "/admin/login") return <Login />;
  if (pathname === "/admin") return <AdminApp />;

  return <PublicApp />;
}
