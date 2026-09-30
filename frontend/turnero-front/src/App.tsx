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

type Servicio = {
  nombre: string;
  descripcion: string;
  precio: string;
};

const API = import.meta.env.VITE_API_URL as string;

const servicios: Servicio[] = [
  {
    nombre: "Corte",
    descripcion: "Corte masculino adaptado a tu estilo.",
    precio: "Desde $8.000",
  },
  {
    nombre: "Barba",
    descripcion: "Perfilado y arreglo de barba.",
    precio: "Desde $5.000",
  },
  {
    nombre: "Corte + Barba",
    descripcion: "El servicio completo para renovar tu look.",
    precio: "Desde $12.000",
  },
];

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
  const r = await fetch(
    `${API}/turnos?fecha=${encodeURIComponent(fecha)}`,
  );

  if (!r.ok) {
    throw new Error(await r.text());
  }

  const data = await r.json();

  return data.map((turno: any) => ({
    ...turno,
    hora: new Date(turno.hora).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Cordoba",
    }),
  }));
}

async function crearTurno(datos: {
  nombreCliente: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
}): Promise<Turno> {
  const r = await fetch(`${API}/turnos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (!r.ok) {
    const mensaje = await r.text();

    let errorMensaje = "No se pudo reservar el horario.";

    try {
      const errorJson = JSON.parse(mensaje);

      if (errorJson.message) {
        errorMensaje = Array.isArray(errorJson.message)
          ? errorJson.message.join(", ")
          : errorJson.message;
      }
    } catch {
      // Si la respuesta no es JSON, usamos el mensaje genérico.
    }

    throw new Error(errorMensaje);
  }

  return r.json();
}

function PublicApp() {
  const horarios = useMemo(() => generarHorarios(), []);

  const [fecha, setFecha] = useState(hoyISO());
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [hora, setHora] = useState("");

  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [servicio, setServicio] = useState("Corte");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [reservaEnviada, setReservaEnviada] = useState(false);
  const [guardandoTurno, setGuardandoTurno] = useState(false);

  const ocupados = useMemo(() => {
    const s = new Set<string>();

    turnos.forEach((t) => {
      if (t.estado !== "CANCELADO") {
        s.add(t.hora);
      }
    });

    return s;
  }, [turnos]);

  async function cargar() {
    setErr("");
    setLoading(true);

    try {
      const data = await getTurnos(fecha);

      setTurnos(data);

      if (
        hora &&
        data.some(
          (t) => t.hora === hora && t.estado !== "CANCELADO",
        )
      ) {
        setHora("");
      }
    } catch {
      setErr(
        "No pudimos cargar la disponibilidad. Intentá nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  function seleccionarServicio(nombre: string) {
    setServicio(nombre);
    setMostrarReserva(true);

    setTimeout(() => {
      document
        .getElementById("reserva")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  function comenzarReserva() {
    setMostrarReserva(true);

    setTimeout(() => {
      document
        .getElementById("reserva")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  function continuarReserva() {
    setErr("");

    if (!hora) {
      setErr("Seleccioná un horario para continuar.");
      return;
    }

    setMostrarReserva(true);

    setTimeout(() => {
      document
        .getElementById("datos")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  async function confirmarSolicitud() {
    setErr("");
    setReservaEnviada(false);

    if (!hora) {
      setErr("Seleccioná un horario.");
      return;
    }

    if (!nombreCliente.trim()) {
      setErr("Ingresá tu nombre.");
      return;
    }

    if (!telefono.trim()) {
      setErr("Ingresá tu teléfono.");
      return;
    }

    const horarioOcupado = turnos.some(
      (t) =>
        t.hora === hora &&
        t.estado !== "CANCELADO",
    );

    if (horarioOcupado) {
      setHora("");

      setErr(
        "Este horario acaba de ser ocupado. Seleccioná otro horario.",
      );

      await cargar();

      return;
    }

    setGuardandoTurno(true);

    try {
      await crearTurno({
        nombreCliente: nombreCliente.trim(),
        telefono: telefono.trim(),
        servicio: servicio.trim(),
        fecha,
        hora,
      });

      await cargar();

      setReservaEnviada(true);

      const numeroWhatsApp = "543463401716";

      const mensaje = `Hola! Quiero solicitar un turno en CHÉ Hair Studio:

👤 Nombre: ${nombreCliente.trim()}
📱 Teléfono: ${telefono.trim()}
✂️ Servicio: ${servicio}
📅 Fecha: ${formatearFecha(fecha)}
🕐 Hora: ${hora}

Quedo atento a la confirmación. ¡Gracias!`;

      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
        mensaje,
      )}`;

      window.open(url, "_blank");
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el turno.";

      if (
        mensaje
          .toLowerCase()
          .includes("horario no disponible")
      ) {
        setHora("");

        setErr(
          "Este horario acaba de ser ocupado. Seleccioná otro horario.",
        );

        await cargar();
      } else {
        setErr(mensaje);
      }
    } finally {
      setGuardandoTurno(false);
    }
  }

  function enviarWhatsApp() {
    setErr("");

    if (
      !hora ||
      !nombreCliente.trim() ||
      !telefono.trim()
    ) {
      setErr(
        "Completá todos los datos antes de continuar.",
      );

      return;
    }

    const numeroWhatsApp = "543463401716";

    const mensaje = `Hola! Quiero solicitar un turno en CHÉ Hair Studio:

👤 Nombre: ${nombreCliente.trim()}
📱 Teléfono: ${telefono.trim()}
✂️ Servicio: ${servicio}
📅 Fecha: ${formatearFecha(fecha)}
🕐 Hora: ${hora}

Quedo atento a la confirmación. ¡Gracias!`;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
      mensaje,
    )}`;

    window.open(url, "_blank");
  }

  function formatearFecha(fechaISO: string) {
    const [year, month, day] = fechaISO.split("-");

    return `${day}/${month}/${year}`;
  }

  const servicioActual =
    servicios.find(
      (item) => item.nombre === servicio,
    ) ?? servicios[0];

  return (
    <div className="page">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar__inner">
          <a href="#" className="brand">
            <img
              src="/logo-che.jpg"
              alt="CHÉ Men's Hair Studio"
              className="brand__logo"
            />
          </a>

          <div className="navbar__links">
            <a href="#servicios">Servicios</a>
            <a href="#reserva">Reservar</a>
            <a href="#contacto">Ubicación</a>
          </div>

          <button
            type="button"
            className="button button--nav"
            onClick={comenzarReserva}
          >
            Reservar turno
            <span>→</span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero-section">
        <div className="hero-section__content">
          <div className="hero-logo">
            <img
              src="/logo-che.jpg"
              alt="CHÉ Men's Hair Studio"
            />
          </div>

          <p className="hero-eyebrow">
            <span />
            MEN'S HAIR STUDIO
            <span />
          </p>

          <h1>
            TU ESTILO.
            <br />
            <em>TU IDENTIDAD.</em>
          </h1>

          <p className="hero-description">
            Barbería masculina en Nueva Córdoba.
            <br />
            Cortes, barba y estilo pensados para vos.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="button button--primary"
              onClick={comenzarReserva}
            >
              Reservar turno
              <span>→</span>
            </button>

            <a
              href="#servicios"
              className="hero-link"
            >
              Conocé CHÉ
              <span>↓</span>
            </a>
          </div>
        </div>

        <div className="hero-section__bottom">
          <span>NUEVA CÓRDOBA · ARGENTINA</span>
          <span>LARRAÑAGA 31 · LOCAL 1</span>
        </div>
      </header>

      {/* IDENTIDAD */}
      <section className="section identity-section">
        <div className="identity-section__grid">
          <div>
            <p className="section-eyebrow">
              CHÉ HAIR STUDIO
            </p>

            <h2>
              Más que un
              <br />
              <em>corte.</em>
            </h2>
          </div>

          <div className="identity-section__text">
            <p>
              Un espacio pensado para quienes buscan un estilo
              propio, una atención personalizada y una
              experiencia diferente.
            </p>

            <div className="identity-section__location">
              <span>01</span>

              <div>
                <strong>Nueva Córdoba</strong>
                <p>
                  Larrañaga 31 · Local 1
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="section services-section"
      >
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">
              Servicios
            </p>

            <h2>
              Encontrá tu
              <br />
              <em>estilo.</em>
            </h2>
          </div>

          <p className="section-description">
            Elegí el servicio que querés realizar y
            encontrá un horario disponible para tu próxima
            visita.
          </p>
        </div>

        <div className="services-list">
          {servicios.map((item, index) => (
            <button
              type="button"
              className={`service-row ${
                servicio === item.nombre
                  ? "service-row--active"
                  : ""
              }`}
              key={item.nombre}
              onClick={() =>
                seleccionarServicio(item.nombre)
              }
            >
              <span className="service-row__number">
                0{index + 1}
              </span>

              <div className="service-row__content">
                <h3>{item.nombre}</h3>
                <p>{item.descripcion}</p>
              </div>

              <span className="service-row__price">
                {item.precio}
              </span>

              <span className="service-row__arrow">
                ↗
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* RESERVA */}
      <section
        id="reserva"
        className="section booking-section"
      >
        <div className="booking-header">
          <div>
            <p className="section-eyebrow">
              Reserva online
            </p>

            <h2>
              Reservá tu
              <br />
              <em>momento.</em>
            </h2>
          </div>

          <div className="booking-steps">
            <div className="booking-step booking-step--active">
              <span>01</span>
              <p>Servicio</p>
            </div>

            <div className="booking-step">
              <span>02</span>
              <p>Fecha</p>
            </div>

            <div className="booking-step">
              <span>03</span>
              <p>Horario</p>
            </div>

            <div className="booking-step">
              <span>04</span>
              <p>Datos</p>
            </div>
          </div>
        </div>

        <div className="booking-layout">
          {/* SERVICIO */}
          <div className="booking-panel">
            <div className="booking-panel__heading">
              <span>01</span>

              <div>
                <h3>Elegí tu servicio</h3>

                <p>
                  Seleccioná el servicio que querés
                  realizar.
                </p>
              </div>
            </div>

            <div className="booking-services">
              {servicios.map((item) => (
                <button
                  key={item.nombre}
                  type="button"
                  className={`booking-service ${
                    servicio === item.nombre
                      ? "booking-service--selected"
                      : ""
                  }`}
                  onClick={() =>
                    setServicio(item.nombre)
                  }
                >
                  <span>{item.nombre}</span>

                  {servicio === item.nombre && (
                    <span className="booking-service__check">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* FECHA */}
          <div className="booking-panel">
            <div className="booking-panel__heading">
              <span>02</span>

              <div>
                <h3>Elegí la fecha</h3>

                <p>
                  Seleccioná el día que preferís.
                </p>
              </div>
            </div>

            <div className="date-picker">
              <label htmlFor="fecha">
                Fecha del turno
              </label>

              <input
                id="fecha"
                type="date"
                value={fecha}
                min={hoyISO()}
                onChange={(e) => {
                  setFecha(e.target.value);
                  setHora("");
                  setReservaEnviada(false);
                  setErr("");
                }}
                className="input input--large"
              />
            </div>
          </div>

          {/* HORARIOS */}
          <div className="booking-panel booking-panel--full">
            <div className="booking-panel__heading">
              <span>03</span>

              <div>
                <h3>Elegí tu horario</h3>

                <p>
                  Los horarios ocupados se muestran
                  bloqueados.
                </p>
              </div>
            </div>

            {err && (
              <div className="alert alert--error">
                {err}
              </div>
            )}

            {loading ? (
              <div className="loading-state">
                <span className="loading-spinner" />
                Consultando disponibilidad...
              </div>
            ) : (
              <div className="slots-grid">
                {horarios.map((h) => {
                  const ocupado = ocupados.has(h);
                  const selected = hora === h;

                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={ocupado}
                      onClick={() => {
                        setHora(h);
                        setReservaEnviada(false);
                        setErr("");
                      }}
                      className={[
                        "slot",
                        ocupado
                          ? "slot--occupied"
                          : "",
                        selected
                          ? "slot--selected"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span>{h}</span>

                      {ocupado && (
                        <small>Ocupado</small>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="selected-box">
              <div>
                <span>Tu selección</span>

                <strong>
                  {servicio} ·{" "}
                  {formatearFecha(fecha)}
                </strong>
              </div>

              <strong className="selected-box__time">
                {hora || "--:--"}
              </strong>
            </div>

            <button
              type="button"
              className="button button--primary button--wide"
              onClick={continuarReserva}
              disabled={!hora}
            >
              Continuar
              <span>→</span>
            </button>
          </div>

          {/* DATOS */}
          {mostrarReserva && (
            <div
              id="datos"
              className="booking-panel booking-panel--full"
            >
              <div className="booking-panel__heading">
                <span>04</span>

                <div>
                  <h3>Tus datos</h3>

                  <p>
                    Necesitamos estos datos para
                    preparar tu solicitud.
                  </p>
                </div>
              </div>

              <div className="customer-grid">
                <div className="field">
                  <label htmlFor="nombre">
                    Nombre
                  </label>

                  <input
                    id="nombre"
                    className="input"
                    placeholder="Tu nombre"
                    value={nombreCliente}
                    onChange={(e) =>
                      setNombreCliente(
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="telefono">
                    Teléfono
                  </label>

                  <input
                    id="telefono"
                    className="input"
                    placeholder="Ej. 351 123 4567"
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="booking-summary">
                <div>
                  <span>Servicio</span>
                  <strong>
                    {servicioActual.nombre}
                  </strong>
                </div>

                <div>
                  <span>Fecha</span>
                  <strong>
                    {formatearFecha(fecha)}
                  </strong>
                </div>

                <div>
                  <span>Horario</span>
                  <strong>{hora}</strong>
                </div>
              </div>

              <button
                type="button"
                className="button button--primary button--wide"
                onClick={confirmarSolicitud}
                disabled={guardandoTurno}
              >
                {guardandoTurno
                  ? "Guardando turno..."
                  : "Reservar turno"}

                <span>→</span>
              </button>

              {reservaEnviada && (
                <div className="confirmation-box">
                  <div className="confirmation-box__icon">
                    ✓
                  </div>

                  <div>
                    <h3>
                      Turno reservado
                    </h3>

                    <p>
                      El horario quedó reservado
                      correctamente. WhatsApp se
                      abrirá para enviar la solicitud.
                    </p>

                    <button
                      type="button"
                      className="button button--primary button--wide"
                      onClick={enviarWhatsApp}
                    >
                      Enviar por WhatsApp
                      <span>↗</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* UBICACIÓN */}
      <section
        id="contacto"
        className="location-section"
      >
        <div className="location-section__content">
          <p className="section-eyebrow">
            Encontranos
          </p>

          <h2>
            CHÉ
            <br />
            <em>Hair Studio.</em>
          </h2>

          <p>
            Larrañaga 31 · Local 1
            <br />
            Nueva Córdoba · Córdoba
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={comenzarReserva}
          >
            Reservar turno
            <span>→</span>
          </button>
        </div>

        <div className="location-section__side">
          <span>MEN'S HAIR STUDIO</span>

          <strong>CHÉ</strong>

          <span>
            NUEVA CÓRDOBA · ARGENTINA
          </span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__brand">
          <img
            src="/logo-che.jpg"
            alt="CHÉ Men's Hair Studio"
            className="footer__logo"
          />

          <span>
            LARRAÑAGA 31 · LOCAL 1 · NUEVA CÓRDOBA
          </span>
        </div>

        <div className="footer__right">
          <span>MEN'S HAIR STUDIO</span>

          <p>© 2026 CHÉ Hair Studio</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const pathname = window.location.pathname;

  if (pathname === "/admin/login") {
    return <Login />;
  }

  if (pathname === "/admin") {
    return <AdminApp />;
  }

  return <PublicApp />;
}