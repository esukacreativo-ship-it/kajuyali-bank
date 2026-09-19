function obtenerSesion() {
  const sesion = sessionStorage.getItem("sesion");
  if (!sesion) {
    window.location.href = "login.html";
    return null;
  }
  return JSON.parse(sesion);
}

function cerrarSesion() {
  sessionStorage.removeItem("sesion");
  window.location.href = "login.html";
}