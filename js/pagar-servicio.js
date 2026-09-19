const sesion = obtenerSesion();
document.getElementById("saldoActual").textContent = formatearMoneda(sesion.saldo);
document.getElementById("nombreCuenta").textContent = sesion.nombre;

cargarServicios();

async function cargarServicios() {
  const select = document.getElementById("servicio");
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "listarServicios" })
    });
    const data = await res.json();

    if (data.ok) {
      data.servicios.forEach(s => {
        const option = document.createElement("option");
        option.value = s.usuario;
        option.textContent = s.nombre;
        select.appendChild(option);
      });
    }
  } catch (err) {
    select.innerHTML = '<option value="" disabled selected>Error al cargar servicios</option>';
  }
}

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

document.getElementById("formPagar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const destinoUsuario = document.getElementById("servicio").value.trim();
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
  boton.textContent = "Pagando...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        accion: "pagarServicio",
        origenId: sesion.id,
        destinoUsuario,
        monto
      })
    });
    const data = await res.json();

    if (data.error) {
      mensaje.textContent = data.error;
      mensaje.style.color = "#c0392b";
    } else {
      sesion.saldo = data.nuevoSaldo;
      sessionStorage.setItem("sesion", JSON.stringify(sesion));
      mensaje.textContent = "✅ Pago realizado con éxito";
      mensaje.style.color = "#15803d";
      document.getElementById("saldoActual").textContent = formatearMoneda(data.nuevoSaldo);
      e.target.reset();
    }
  } catch (err) {
    mensaje.textContent = "No se pudo conectar con el servidor";
  } finally {
    boton.disabled = false;
    boton.textContent = "Pagar";
  }
});

function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0
  }).format(valor);
}