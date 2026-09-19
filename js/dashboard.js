const sesion = obtenerSesion();

document.getElementById("nombreCliente").textContent = sesion.nombre;
document.getElementById("saldoActual").textContent = formatearMoneda(sesion.saldo);

if (sesion.estado === "mora") {
  document.getElementById("avisoEstado").textContent =
    "⚠️ Tienes una cuota vencida. Tu cuenta sigue activa, pero revisa tu crédito.";
} else if (sesion.estado === "bloqueado") {
  document.getElementById("avisoEstado").textContent =
    "🔒 Tu cuenta está bloqueada por mora. Solo puedes consultar saldo hasta pagar la cuota vencida.";
  document.querySelectorAll(".tarjeta-accion").forEach(el => {
    if (!el.href.includes("historial")) {
      el.classList.add("deshabilitada");
      el.addEventListener("click", (e) => e.preventDefault());
    }
  });
}

document.getElementById("btnCerrarSesion").addEventListener("click", cerrarSesion);

function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor);
}