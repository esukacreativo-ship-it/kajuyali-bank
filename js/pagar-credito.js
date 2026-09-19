const sesion = obtenerSesion();
document.getElementById("nombreCuenta").textContent = sesion.nombre;

const inputMonto = document.getElementById("monto");

inputMonto.addEventListener("input", () => {
  let valor = inputMonto.value.replace(/\D/g, "");
  inputMonto.value = valor ? formatearConPuntos(valor) : "";
});

function formatearConPuntos(numeroStr) {
  numeroStr = numeroStr.replace(/^0+(?=\d)/, "");
  return numeroStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function obtenerMontoNumerico() {
  return Number(inputMonto.value.replace(/\D/g, ""));
}

cargarCredito();

async function cargarCredito() {
  const mensajeCarga = document.getElementById("mensajeCarga");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "obtenerCreditoActual", clienteId: sesion.id })
    });
    const data = await res.json();

    mensajeCarga.remove();

    if (data.error) {
      document.getElementById("sinCredito").classList.remove("oculto");
      return;
    }

    if (!data.tieneCredito) {
      document.getElementById("sinCredito").classList.remove("oculto");
      return;
    }

    mostrarCredito(data);

  } catch (err) {
    mensajeCarga.textContent = "No se pudo conectar con el servidor";
  }
}

function mostrarCredito(data) {
  document.getElementById("conCredito").classList.remove("oculto");
  document.getElementById("saldoPendiente").textContent = formatearMoneda(data.saldoPendiente);
  document.getElementById("cuotaMensual").textContent = formatearMoneda(data.cuotaMensual);
  document.getElementById("cuotasPagadas").textContent = `${data.cuotasPagadas} de ${data.cuotasTotal}`;
  document.getElementById("fechaCorte").textContent = formatearFecha(data.fechaProximoPago);

  const aviso = document.getElementById("avisoMora");
  if (data.estado === "mora") {
    aviso.textContent = `⚠️ Tienes ${data.diasMora} día(s) de atraso. Ponte al día para evitar el bloqueo de tu cuenta.`;
  }

  // Precargamos la cuota ya formateada con puntos de miles
  inputMonto.value = formatearConPuntos(String(data.cuotaMensual));
}

document.getElementById("formPagar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const monto = obtenerMontoNumerico();
  const mensaje = document.getElementById("mensaje");
  const boton = e.target.querySelector("button");

  if (!monto || monto <= 0) {
    mensaje.textContent = "Ingresa un monto válido";
    mensaje.style.color = "#c0392b";
    return;
  }

  mensaje.textContent = "";
  boton.disabled = true;
  boton.textContent = "Procesando...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "pagarCuota", clienteId: sesion.id, monto })
    });
    const data = await res.json();

    if (data.error) {
      mensaje.textContent = data.error;
      mensaje.style.color = "#c0392b";
      boton.disabled = false;
      boton.textContent = "Pagar";
      return;
    }

    sesion.saldo = data.nuevoSaldo;
    sessionStorage.setItem("sesion", JSON.stringify(sesion));

    mensaje.style.color = "#15803d";
    mensaje.textContent = "✅ " + data.mensaje;
    boton.textContent = "Pago realizado";

    if (data.creditoPagado) {
      setTimeout(() => window.location.reload(), 1500);
    } else {
      boton.disabled = false;
      boton.textContent = "Pagar";
      document.getElementById("saldoPendiente").textContent = formatearMoneda(data.saldoPendienteCredito);
    }

  } catch (err) {
    mensaje.textContent = "No se pudo conectar con el servidor";
    boton.disabled = false;
    boton.textContent = "Pagar";
  }
});

function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0
  }).format(valor);
}

function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}-${mes}-${anio}`;
}