if (
  !sessionStorage.idEmpresa ||
  !sessionStorage.idUsuario ||
  !sessionStorage.email ||
  !sessionStorage.tipoUsuario ||
  !sessionStorage.nomeUsuario
) {
  alert("Sua sessão expirou! Logue-se novamente.");
  window.location.href = "../login.html";
}