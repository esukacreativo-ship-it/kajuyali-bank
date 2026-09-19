const sesion = obtenerSesion();

document.getElementById("nombreCuenta").textContent = sesion.nombre;

cargarHistorial();

async function cargarHistorial() {
  const mensajeCarga = document.getElementById("mensajeCarga");
  const lista = document.getElementById("listaHistorial");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "obtenerHistorial", clienteId: sesion.id })
    });
    const data = await res.json();

    mensajeCarga.remove();

    if (data.error) {
      lista.innerHTML = `<p class="error">${data.error}</p>`;
      return;
    }

    if (data.transacciones.length === 0) {
      lista.innerHTML = `<p class="etiqueta">Todavía no tienes movimientos.</p>`;
      return;
    }

    data.transacciones.forEach(t => {
      lista.appendChild(crearFilaMovimiento(t));
    });

  } catch (err) {
    mensajeCarga.textContent = "No se pudo conectar con el servidor";
  }
}

function crearFilaMovimiento(t) {
  const div = document.createElement("div");
  div.className = "movimiento";

  const esSalida = t.direccion === "salida";
  const icono = t.tipo === "pago_servicio" ? "🧾" : (esSalida ? "↗️" : "↙️");
  const etiquetaTipo = t.tipo === "pago_servicio"
    ? "Pago de servicio"
    : (esSalida ? "Enviado a" : "Recibido de");

  div.innerHTML = `
    <span class="icono-movimiento">${icono}</span>
    <div class="detalle-movimiento">
      <span class="etiqueta-movimiento">${etiquetaTipo} ${t.contraparte}</span>
      <span class="fecha-movimiento">${t.fecha}</span>
    </div>
    <span class="monto-movimiento ${esSalida ? 'negativo' : 'positivo'}">
      ${esSalida ? "-" : "+"}${formatearMoneda(t.monto)}
    </span>
  `;

  return div;
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0
  }).format(valor);
}