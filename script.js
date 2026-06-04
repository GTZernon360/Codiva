alert("JS carregou");
const paginas =
  document.querySelectorAll(.pagina);
paginas[0].style.display = "flex";
function trocarPagina(numero){
  paginas.forEach((pagina)=>{
    pagina.style.display = "flex";
  });
  paginas[numero].style.display = "flex;"
}