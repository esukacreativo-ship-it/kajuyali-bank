const sesion = obtenerSesion();
document.getElementById("nombreCuenta").textContent = sesion.nombre;
document.getElementById("saldoActual").textContent = formatearMoneda(sesion.saldo);

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

let simulacionActual = null;

verificarCreditoExistente();

async function verificarCreditoExistente() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "obtenerCreditoActual", clienteId: sesion.id })
    });
    const data = await res.json();

    if (data.ok && data.tieneCredito) {
      document.querySelector("main").innerHTML = `
        <div class="tarjeta-saldo">
          <p class="etiqueta">Ya tienes un crédito vigente.</p>
          <p class="etiqueta">Debes terminar de pagarlo antes de solicitar otro.</p>
          <a href="pagar-credito.html" class="btn-confirmar" style="display:block; text-align:center; text-decoration:none; margin-top:1rem;">
            Ver mi crédito
          </a>
        </div>
      `;
    }
  } catch (err) {
    // Si falla la verificación, dejamos que el flujo normal continúe
  }
}

// --- SIMULAR ---
document.getElementById("formSimular").addEventListener("submit", async (e) => {
  e.preventDefault();

  const monto = obtenerMontoNumerico();
  const cuotas = document.getElementById("cuotas").value;
  const mensaje = document.getElementById("mensajeSimular");
  const boton = e.target.querySelector("button");

  if (!monto || monto <= 0) {
    mensaje.textContent = "Ingresa un monto válido";
    return;
  }

  mensaje.textContent = "";
  document.getElementById("resultadoSimulacion").classList.add("oculto");
  boton.disabled = true;
  boton.textContent = "Calculando...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "simularCredito", monto, cuotas, clienteId: sesion.id })
    });
    const data = await res.json();

    if (data.error) {
      mensaje.textContent = data.error;
    } else {
      mostrarSimulacion(monto, Number(cuotas), data.cuotaMensual, data.tasaEA, data.advertenciaCapacidad);
      simulacionActual = { monto, cuotas: Number(cuotas) };
    }
  } catch (err) {
    mensaje.textContent = "No se pudo conectar con el servidor";
  } finally {
    boton.disabled = false;
    boton.textContent = "Simular";
  }
});

function mostrarSimulacion(monto, cuotas, cuotaMensual, tasaEA, advertenciaCapacidad) {
  const total = cuotaMensual * cuotas;
  const intereses = total - monto;

  document.getElementById("simMonto").textContent = formatearMoneda(monto);
  document.getElementById("simCuotas").textContent = cuotas + " cuotas";
  document.getElementById("simTasa").textContent = tasaEA + "% E.A.";
  document.getElementById("simCuotaMensual").textContent = formatearMoneda(cuotaMensual);
  document.getElementById("simTotal").textContent = formatearMoneda(total);
  document.getElementById("simIntereses").textContent = formatearMoneda(intereses);

  const mensajeConfirmar = document.getElementById("mensajeConfirmar");
  const btnConfirmar = document.getElementById("btnConfirmar");

  if (advertenciaCapacidad) {
    mensajeConfirmar.textContent = "⚠️ " + advertenciaCapacidad;
    mensajeConfirmar.style.color = "#c0392b";
    btnConfirmar.disabled = true;
  } else {
    mensajeConfirmar.textContent = "";
    btnConfirmar.disabled = false;
  }

  document.getElementById("resultadoSimulacion").classList.remove("oculto");
}

// --- CONFIRMAR ---
document.getElementById("btnConfirmar").addEventListener("click", async () => {
  if (!simulacionActual) return;

  const mensaje = document.getElementById("mensajeConfirmar");
  const boton = document.getElementById("btnConfirmar");

  mensaje.textContent = "";
  boton.disabled = true;
  boton.textContent = "Procesando...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        accion: "solicitarCredito",
        clienteId: sesion.id,
        monto: simulacionActual.monto,
        cuotas: simulacionActual.cuotas
      })
    });
    const data = await res.json();

    if (data.error) {
      mensaje.textContent = data.error;
      boton.disabled = false;
      boton.textContent = "Confirmar y recibir el dinero";
    } else {
      sesion.saldo = data.nuevoSaldo;
      sessionStorage.setItem("sesion", JSON.stringify(sesion));
      document.getElementById("saldoActual").textContent = formatearMoneda(data.nuevoSaldo);
      mensaje.style.color = "#15803d";
      mensaje.textContent = `✅ Crédito aprobado (${data.creditoId}). El dinero ya está en tu cuenta.`;
      boton.textContent = "Crédito desembolsado";
      document.getElementById("formSimular").querySelector("button").disabled = true;
    }
  } catch (err) {
    mensaje.textContent = "No se pudo conectar con el servidor";
    boton.disabled = false;
    boton.textContent = "Confirmar y recibir el dinero";
  }
});

function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0
  }).format(valor);
}