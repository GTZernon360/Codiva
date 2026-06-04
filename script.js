/* Fallback script — só executado se o index.html antigo carregar este arquivo.
   Funciona com qualquer estrutura de HTML sem depender de IDs específicos. */
(function () {
  var paginaAtual = 0;
  var paginas = document.querySelectorAll(".pagina");
  if (paginas.length === 0) return;

  paginas[0].style.display = "flex";

  function trocarPagina(numero) {
    if (numero < 0 || numero >= paginas.length) return;
    paginas[paginaAtual].style.display = "none";
    paginaAtual = numero;
    paginas[paginaAtual].style.display = "flex";
  }

  window.trocarPagina = trocarPagina;

  var btnVoltar = document.getElementById("btn-voltar");
  var btnProxima = document.getElementById("btn-proxima");
  var progresso = document.getElementById("progresso");

  if (btnVoltar) btnVoltar.addEventListener("click", function () { trocarPagina(paginaAtual - 1); });
  if (btnProxima) btnProxima.addEventListener("click", function () { trocarPagina(paginaAtual + 1); });
  if (progresso) progresso.textContent = "Página 1 de " + paginas.length;
  if (btnVoltar) btnVoltar.disabled = true;
})();
