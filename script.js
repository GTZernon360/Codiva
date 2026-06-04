const paginas = document.querySelectorAll(".pagina");
paginas[0].style.display = "flex";
function trocarPagina(numero) {
  paginas.forEach((pagina) => {
    pagina.style.display = "none";
  });
  paginas[numero].style.display = "flex";
}
