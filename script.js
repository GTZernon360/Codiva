var paginaAtual = 0;
var paginas = document.querySelectorAll(".pagina");
var progresso = document.getElementById("progresso");
var btnVoltar = document.getElementById("btn-voltar");
var btnProxima = document.getElementById("btn-proxima");

function trocarPagina(numero) {
  if (numero < 0 || numero >= paginas.length) return;
  paginas[paginaAtual].style.display = "none";
  paginaAtual = numero;
  paginas[paginaAtual].style.display = "flex";
  progresso.textContent = "Página " + (paginaAtual + 1) + " de " + paginas.length;
  btnVoltar.disabled = paginaAtual === 0;
  btnProxima.disabled = paginaAtual === paginas.length - 1;
}

paginas[0].style.display = "flex";
btnVoltar.disabled = true;
