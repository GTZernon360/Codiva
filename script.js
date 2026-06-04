const paginas = document.querySelectorAll(".pagina");
paginas[0].style.display = "flex";

function trocarPagina(numero) {
  if (numero < 0 || numero >= paginas.length) return;
  paginas.forEach(function(pagina) {
    pagina.style.display = "none";
  });
  paginas[numero].style.display = "flex";
}
