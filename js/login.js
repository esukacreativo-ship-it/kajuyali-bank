document.getElementById("formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value;
  const mensajeError = document.getElementById("mensajeError");
  const boton = e.target.querySelector("button");

  mensajeError.textContent = "";
  boton.disabled = true;
  boton.textContent = "Ingresando...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "login", usuario, password })
    });
    const data = await res.json();

    if (data.error) {
      mensajeError.textContent = data.error;
      boton.disabled = false;
      boton.textContent = "Ingresar";
      return;
    }

    sessionStorage.setItem("sesion", JSON.stringify(data));
    window.location.href = "dashboard.html";

  } catch (err) {
    mensajeError.textContent = "No se pudo conectar con el servidor. Intenta de nuevo.";
    boton.disabled = false;
    boton.textContent = "Ingresar";
  }
});