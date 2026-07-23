export default function PoliticaPrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-gray-700">
      <h1 className="mb-6 text-xl font-bold text-indigo-700">Política de Privacidad — AGENDA IA</h1>

      <p className="mb-4">
        AGENDA IA es un sistema de gestión de leads y agendamiento (CRM) para clínicas estéticas,
        operado por Agencia Luvo. Esta política describe qué datos recopilamos y cómo los usamos.
      </p>

      <h2 className="mb-2 mt-6 font-semibold text-gray-900">Qué datos recopilamos</h2>
      <p className="mb-4">
        Cuando una persona completa un formulario de contacto (incluyendo formularios de Meta Lead
        Ads) o escribe por WhatsApp a una clínica que usa AGENDA IA, recopilamos: nombre, teléfono,
        respuestas del formulario, e historial de conversación con el objetivo de agendar una cita
        y dar seguimiento comercial.
      </p>

      <h2 className="mb-2 mt-6 font-semibold text-gray-900">Cómo usamos los datos</h2>
      <p className="mb-4">
        Los datos se usan exclusivamente para que la clínica correspondiente pueda contactar al
        lead, responder sus consultas (incluyendo respuestas generadas por un asistente de IA) y
        gestionar su cita. No vendemos ni compartimos estos datos con terceros ajenos a la clínica.
      </p>

      <h2 className="mb-2 mt-6 font-semibold text-gray-900">Con quién compartimos datos</h2>
      <p className="mb-4">
        Usamos proveedores de infraestructura para operar el servicio (hosting, base de datos,
        mensajería de WhatsApp vía Twilio, motor conversacional de Anthropic, calendario de Google),
        quienes procesan los datos únicamente para prestar esos servicios técnicos.
      </p>

      <h2 className="mb-2 mt-6 font-semibold text-gray-900">Eliminación de datos</h2>
      <p className="mb-4">
        Cualquier persona puede solicitar la eliminación de sus datos escribiendo a{' '}
        <a href="mailto:agencialuvo@gmail.com" className="text-indigo-600 underline">
          agencialuvo@gmail.com
        </a>
        .
      </p>

      <h2 className="mb-2 mt-6 font-semibold text-gray-900">Contacto</h2>
      <p>
        Para cualquier consulta sobre esta política, escríbenos a{' '}
        <a href="mailto:agencialuvo@gmail.com" className="text-indigo-600 underline">
          agencialuvo@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
