(function () {
  var paginaAtual = 0;
  var paginas = document.querySelectorAll(".pagina");
  var progresso = document.getElementById("progresso");
  var btnVoltar = document.getElementById("btn-voltar");
  var btnProxima = document.getElementById("btn-proxima");

  if (paginas.length === 0) return;

  function mostrar(n) {
    paginas[paginaAtual].style.display = "none";
    paginaAtual = n;
    paginas[paginaAtual].style.display = "flex";
    progresso.textContent = "Página " + (paginaAtual + 1) + " de " + paginas.length;
    btnVoltar.disabled = paginaAtual === 0;
    btnProxima.disabled = paginaAtual === paginas.length - 1;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  btnVoltar.addEventListener("click", function () {
    if (paginaAtual > 0) mostrar(paginaAtual - 1);
  });

  btnProxima.addEventListener("click", function () {
    if (paginaAtual < paginas.length - 1) mostrar(paginaAtual + 1);
  });

  paginas[0].style.display = "flex";
  progresso.textContent = "Página 1 de " + paginas.length;
  btnVoltar.disabled = true;
  btnProxima.disabled = paginas.length <= 1;
})();
