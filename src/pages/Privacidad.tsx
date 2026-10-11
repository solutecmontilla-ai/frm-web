import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacidad = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <button
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </button>

        <h1 className="text-3xl font-bold">Política de privacidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">Liga FRM · Última actualización: 11 de octubre de 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Quiénes somos</h2>
            <p>
              Liga FRM (sitio web <strong>frm.amaysgroup.com</strong> y su aplicación para Android) es el portal
              informativo de la Liga FRM de fútbol amateur, operado por Amays Group. Publica resultados, tablas de
              posiciones, goleadores, disciplina y la programación de los partidos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Datos que recopilamos</h2>
            <p>
              La aplicación <strong>no requiere crear una cuenta</strong> y no solicita nombre, correo, teléfono,
              ubicación, contactos ni fotos.
            </p>
            <p className="mt-2">
              Si activas las <strong>notificaciones</strong>, tu navegador o dispositivo nos entrega un identificador
              técnico de suscripción (una dirección del servicio de notificaciones y sus claves de cifrado). Lo
              guardamos únicamente para enviarte avisos de resultados y de la programación de partidos. Este
              identificador no revela tu identidad.
            </p>
            <p className="mt-2">
              En tu dispositivo se guardan preferencias locales (por ejemplo, si ya activaste o descartaste las
              notificaciones). Esta información no sale de tu dispositivo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Información pública de la liga</h2>
            <p>
              Los nombres de jugadores que aparecen en goleadores, amonestaciones y sanciones provienen de los reportes
              oficiales de cada partido de la liga. Si eres jugador y quieres corregir o retirar tu nombre, escríbenos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Con quién compartimos datos</h2>
            <p>
              No vendemos ni compartimos datos con terceros. No usamos publicidad ni herramientas de analítica. Las
              notificaciones se entregan a través del servicio de mensajería de tu navegador (por ejemplo, Google
              Chrome), que solo recibe el aviso cifrado.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Cómo eliminar tus datos</h2>
            <p>
              Puedes desactivar las notificaciones en cualquier momento desde el ícono de la campana en el inicio o
              desde los ajustes de tu dispositivo. Al desactivarlas, borramos tu suscripción de nuestro servidor.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Menores de edad</h2>
            <p>La aplicación está dirigida a adultos y no recopila datos de menores de edad.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política escríbenos a{" "}
              <a href="mailto:mmontilla@amaysgroup.com" className="text-primary underline">
                mmontilla@amaysgroup.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacidad;
