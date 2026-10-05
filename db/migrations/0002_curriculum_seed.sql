INSERT INTO courses (slug, title, description, importance, order_index, color, icon) VALUES
  ('logica-programacao', 'Lógica de programação', 'Aprenda a decompor problemas e transformar ideias em passos claros.', 'essential', 1, '#7357e8', 'workflow'),
  ('html', 'HTML', 'Entenda como dar estrutura e significado ao conteúdo da web.', 'essential', 2, '#e87942', 'file-code'),
  ('css', 'CSS', 'Organize a apresentação visual e crie interfaces responsivas.', 'essential', 3, '#4286e8', 'palette'),
  ('javascript', 'JavaScript', 'Adicione comportamento e lógica às aplicações web.', 'essential', 4, '#d6a92d', 'braces'),
  ('git-github', 'Git e GitHub', 'Registre mudanças e colabore com segurança em projetos.', 'essential', 5, '#38383d', 'git-branch'),
  ('javascript-avancado', 'JavaScript avançado', 'Aprofunde escopo, assincronicidade, módulos e estruturas de dados.', 'useful', 6, '#c59b24', 'braces'),
  ('internet-http-apis', 'Internet, HTTP e APIs', 'Entenda como sistemas web trocam informações.', 'essential', 7, '#4199b9', 'globe'),
  ('typescript', 'TypeScript', 'Adicione tipos para tornar aplicações JavaScript mais previsíveis.', 'useful', 8, '#3782c4', 'braces'),
  ('frontend-profissional', 'Front-end profissional', 'Construa interfaces robustas, acessíveis e fáceis de manter.', 'essential', 9, '#5d6ee0', 'panels-top-left'),
  ('backend', 'Backend', 'Crie serviços que validam regras, autorizam ações e conectam sistemas.', 'essential', 10, '#59616e', 'server'),
  ('bancos-de-dados', 'Bancos de dados', 'Modele, consulte e mantenha dados de aplicações reais.', 'essential', 11, '#448b83', 'database'),
  ('apis-profissionais', 'APIs profissionais', 'Projete contratos estáveis, validação e integração entre serviços.', 'useful', 12, '#368ca7', 'network'),
  ('seguranca', 'Segurança', 'Reduza riscos com validação, autenticação e desenho seguro.', 'essential', 13, '#cd5664', 'shield'),
  ('testes', 'Testes', 'Verifique comportamento e proteja o software contra regressões.', 'essential', 14, '#5b9a72', 'circle-check'),
  ('arquitetura-software', 'Arquitetura de software', 'Divida sistemas em partes compreensíveis e evolutivas.', 'useful', 15, '#8163b5', 'blocks'),
  ('linux-devops', 'Linux e DevOps', 'Automatize execução, entrega e operação de aplicações.', 'useful', 16, '#647184', 'terminal'),
  ('performance', 'Performance', 'Identifique gargalos e melhore a experiência sem adivinhação.', 'contextual', 17, '#c77b3b', 'gauge'),
  ('engenharia-software', 'Engenharia de software', 'Planeje mudanças, colaboração e manutenção de longo prazo.', 'essential', 18, '#5b7c99', 'workflow'),
  ('especializacao', 'Especialização', 'Aprofunde a trilha de acordo com os problemas que deseja resolver.', 'contextual', 19, '#8c5eab', 'compass')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (slug, course_slug, title, description, order_index)
VALUES (
  'primeiros-passos',
  'logica-programacao',
  'Pensar em passos',
  'Valores, decisões e funções: três ferramentas para descrever soluções.',
  1
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (
  slug, module_slug, title, summary, order_index, estimated_minutes, xp_reward,
  learning_content, example_code, example_explanation
) VALUES
(
  'variaveis-e-valores',
  'primeiros-passos',
  'Variáveis e valores',
  'Dê nomes aos dados para poder usá-los durante a solução de um problema.',
  1, 8, 20,
  '{
    "easy": {
      "context": "Imagine organizar uma mesa de trabalho: você coloca cada item em uma caixa e escreve uma etiqueta para encontrá-lo depois.",
      "what": "Uma variável é um nome ligado a um valor. O valor pode ser um texto, um número ou outro dado.",
      "purpose": "Ela permite guardar uma informação e reutilizá-la sem precisar decorar o valor.",
      "whereUsed": "Em praticamente todo programa: nomes, preços, contagens, escolhas e resultados.",
      "whyCreated": "Programas precisam lembrar dados enquanto resolvem um problema. Nomes tornam esses dados fáceis de localizar.",
      "importance": "ESSENCIAL — todo programador precisa entender nomes e valores.",
      "analogy": "Uma caixa com a etiqueta pontos pode guardar o número 0. A etiqueta ajuda a saber o que há dentro.",
      "alternatives": "Um valor pode aparecer direto no código, mas isso dificulta mudar e reutilizar a informação.",
      "benefits": "Deixa os dados identificáveis, reutilizáveis e fáceis de atualizar.",
      "limitations": "O nome precisa ser claro e o valor precisa fazer sentido para a tarefa.",
      "technical": "Em pseudocódigo, uma atribuição associa um identificador a um valor. Em uma linguagem real, as regras dependem da linguagem e do escopo.",
      "example": {"code": "nome ← \"Lia\"\\nmostre(nome)", "explanation": "O nome recebe o texto Lia; depois, o programa usa o nome para mostrar o valor."}
    },
    "medium": {
      "context": "Um formulário recebe dados e o programa precisa consultá-los em etapas diferentes.",
      "what": "Uma variável associa um identificador a um valor durante a execução do programa.",
      "purpose": "Ela nomeia dados para que outras instruções possam lê-los ou atualizá-los.",
      "whereUsed": "Em cálculos, formulários, regras de negócio, interfaces e processamento de dados.",
      "whyCreated": "Identificadores reduzem repetição e permitem que o algoritmo opere sobre dados que podem mudar.",
      "importance": "ESSENCIAL — variáveis são uma base para construir qualquer fluxo de dados.",
      "analogy": "A etiqueta de um recipiente aponta para o conteúdo atual; trocar o conteúdo não exige trocar o nome.",
      "alternatives": "Constantes diretas funcionam para dados fixos. Recalcular ou repetir valores costuma gerar duplicação e inconsistência.",
      "benefits": "Ajuda a expressar intenção e separar dados de operações.",
      "limitations": "Estado mutável exige cuidado; nomes vagos escondem o significado.",
      "technical": "Uma variável tem identificador, valor e contexto de resolução. Escopo e regras de mutabilidade variam entre linguagens.",
      "example": {"code": "saldo ← 80\\nsaldo ← saldo + 20\\nmostre(saldo)", "explanation": "A segunda instrução lê o valor atual, soma 20 e atualiza o valor associado a saldo."}
    },
    "hard": {
      "context": "Ao modelar um sistema, um nome mal escolhido pode esconder regras e propagar erros por várias partes.",
      "what": "Uma variável é um identificador resolvido em um contexto de execução para acessar um valor.",
      "purpose": "Permite representar estado e dados intermediários com significado explícito.",
      "whereUsed": "Em modelos de domínio, estruturas de controle, transformações, sistemas concorrentes e APIs.",
      "whyCreated": "Abstrair valores por nomes torna algoritmos gerais, componíveis e adaptáveis a entradas diferentes.",
      "importance": "ESSENCIAL — compreender valores, nomes e estado é requisito para raciocinar sobre programas.",
      "analogy": "Uma etiqueta de inventário é uma referência organizada; se vários registros usam a mesma etiqueta de forma ambígua, a operação deixa de ser confiável.",
      "alternatives": "Valores imutáveis, parâmetros, constantes, closures e estruturas de dados podem reduzir estado compartilhado.",
      "benefits": "Expressa intenção e cria pontos de ligação entre partes do algoritmo.",
      "limitations": "Estado mutável aumenta acoplamento temporal; nomes e escopo inadequados elevam o custo de manutenção.",
      "technical": "Resolução de identificadores, binding, escopo léxico, tempo de vida e mutabilidade dependem do modelo de execução da linguagem.",
      "example": {"code": "total ← 0\\npara cada item em itens:\\n  total ← total + item.preco\\nmostre(total)", "explanation": "total representa um estado acumulado; cada iteração o atualiza a partir do item corrente."}
    }
  }'::jsonb,
  'nome ← "Lia"\nmostre(nome)',
  'O nome recebe um valor e pode ser usado em outra instrução.'
),
(
  'decisoes-e-condicoes',
  'primeiros-passos',
  'Decisões e condições',
  'Faça o algoritmo escolher uma ação com base em uma regra.',
  2, 9, 25,
  '{
    "easy": {
      "context": "Uma catraca verifica se a pessoa tem ingresso antes de liberar a entrada.",
      "what": "Uma condição é uma pergunta que pode ter resposta verdadeira ou falsa.",
      "purpose": "Ela permite que um algoritmo escolha entre caminhos diferentes.",
      "whereUsed": "Em validações, permissões, regras de preço, jogos e decisões de interface.",
      "whyCreated": "Problemas reais dependem de situações. Um programa precisa reagir a cada uma delas.",
      "importance": "ESSENCIAL — decisões aparecem em qualquer programa que responda a dados.",
      "analogy": "Se há ingresso, entre; caso contrário, espere. A regra decide qual ação acontece.",
      "alternatives": "Uma sequência fixa serve quando todos os passos são iguais. Para escolhas, uma condição deixa a regra explícita.",
      "benefits": "Representa regras e caminhos alternativos de forma direta.",
      "limitations": "Muitas condições confusas podem esconder a regra; cada caminho precisa ser considerado.",
      "technical": "Uma expressão condicional é avaliada como verdadeira ou falsa e controla qual bloco de instruções será executado.",
      "example": {"code": "se tem_ingresso:\\n  mostre(\"Entre\")\\nsenão:\\n  mostre(\"Aguarde\")", "explanation": "O programa escolhe uma mensagem usando o resultado da condição tem_ingresso."}
    },
    "medium": {
      "context": "Um serviço precisa aplicar regras diferentes para uma compra com ou sem cupom válido.",
      "what": "Uma estrutura condicional direciona a execução conforme uma expressão lógica.",
      "purpose": "Separa políticas e comportamentos que dependem do estado ou da entrada.",
      "whereUsed": "Validação, autorização, fluxos de negócio e tratamento de erros.",
      "whyCreated": "Algoritmos precisam expressar regras sem executar todos os caminhos ao mesmo tempo.",
      "importance": "ESSENCIAL — regras condicionais conectam entradas a resultados.",
      "analogy": "Como uma catraca, a expressão é o teste e cada ramificação é uma ação permitida.",
      "alternatives": "Tabelas de decisão, polimorfismo ou regras declarativas podem ser melhores para muitas opções.",
      "benefits": "Torna critérios explícitos e permite testar cada caminho.",
      "limitations": "Ramificações profundas podem indicar regra mal organizada ou abstração ausente.",
      "technical": "A avaliação booleana, a ordem dos ramos e a short-circuit evaluation influenciam o resultado e os efeitos colaterais.",
      "example": {"code": "se cupom_valido e compra >= minimo:\\n  total ← compra - desconto\\nsenão:\\n  total ← compra", "explanation": "O desconto só é aplicado quando as duas partes da condição são verdadeiras."}
    },
    "hard": {
      "context": "Uma regra de acesso combina identidade, recurso e estado. Uma checagem parcial pode abrir uma falha.",
      "what": "Uma condição é uma decisão de fluxo derivada de uma expressão lógica sobre o estado atual.",
      "purpose": "Codifica invariantes e políticas de domínio que selecionam transições válidas.",
      "whereUsed": "Autorização, validação de domínio, tolerância a falhas e algoritmos de busca.",
      "whyCreated": "Sistemas precisam transformar critérios formais em transições de estado determinísticas.",
      "importance": "ESSENCIAL — erros em condições alteram controle de fluxo e podem se tornar falhas de segurança.",
      "analogy": "Uma política de acesso é uma lista de critérios: permitir exige que todos os critérios definidos sejam satisfeitos.",
      "alternatives": "Guard clauses, funções de política, máquinas de estado e tabelas de decisão reduzem complexidade em regras extensas.",
      "benefits": "Explicita invariantes e facilita a cobertura por testes.",
      "limitations": "Condições duplicadas divergem com o tempo; efeitos colaterais dentro do teste dificultam o raciocínio.",
      "technical": "Decomponha predicados, preserve precedência lógica, considere valores ausentes e teste os limites de cada ramo.",
      "example": {"code": "pode_editar ← usuario.ativo\\n  e usuario.id = recurso.responsavel_id\\n  e recurso.status != \"arquivado\"", "explanation": "A permissão depende de todos os predicados; cada um deve ser validado e testado separadamente."}
    }
  }'::jsonb,
  'se tem_ingresso:\n  mostre("Entre")\nsenão:\n  mostre("Aguarde")',
  'O resultado da condição determina qual bloco será executado.'
),
(
  'funcoes-e-reuso',
  'primeiros-passos',
  'Funções e reutilização',
  'Agrupe uma tarefa com nome, entradas e um resultado previsível.',
  3, 10, 30,
  '{
    "easy": {
      "context": "Uma máquina de suco recebe frutas, executa passos e entrega uma bebida.",
      "what": "Uma função é um bloco de instruções que recebe informações e pode produzir um resultado.",
      "purpose": "Ela dá um nome a uma tarefa para usá-la sem repetir todos os passos.",
      "whereUsed": "Em cálculos, validações, telas, automações e qualquer tarefa que possa ser descrita separadamente.",
      "whyCreated": "Repetir os mesmos passos em vários lugares aumenta o trabalho e facilita erros.",
      "importance": "ESSENCIAL — funções ajudam a dividir problemas e organizar soluções.",
      "analogy": "A máquina recebe frutas e devolve suco; a função recebe dados e devolve um resultado.",
      "alternatives": "Para uma ação usada uma única vez, uma sequência direta pode bastar. Para uma tarefa repetida, uma função dá nome e reuso.",
      "benefits": "Reduz duplicação e deixa cada parte com uma responsabilidade clara.",
      "limitations": "Funções enormes ou com muitos efeitos escondidos ficam difíceis de entender.",
      "technical": "Uma função pode receber parâmetros, executar um corpo e retornar um valor. Funções podem ser compostas para formar algoritmos maiores.",
      "example": {"code": "função dobro(numero):\\n  retorne numero * 2\\n\\nresultado ← dobro(4)", "explanation": "A função recebe 4, multiplica por 2 e devolve 8 para resultado."}
    },
    "medium": {
      "context": "Um sistema calcula valores em diferentes telas e precisa manter a mesma regra em todos os lugares.",
      "what": "Uma função encapsula uma transformação ou ação atrás de uma interface nomeada.",
      "purpose": "Ela cria uma unidade reutilizável e testável que recebe entradas e define saídas.",
      "whereUsed": "Serviços, componentes, regras de domínio, utilitários e operações assíncronas.",
      "whyCreated": "Modularizar reduz duplicação e torna mudanças locais em vez de espalhadas.",
      "importance": "ESSENCIAL — decomposição funcional torna programas mais fáceis de entender e verificar.",
      "analogy": "Uma máquina tem uma interface de entrada e saída; quem a usa não precisa repetir seus mecanismos internos.",
      "alternatives": "Expressões pequenas, métodos de objeto ou composição de funções podem se adequar melhor ao contexto.",
      "benefits": "Cria pontos de teste, reuso e nomeação de intenções.",
      "limitations": "Abstrações prematuras e dependências implícitas tornam chamadas difíceis de prever.",
      "technical": "Parâmetros, retorno, escopo e efeitos colaterais definem o contrato de uma função.",
      "example": {"code": "função calcular_media(valores):\\n  soma ← somar(valores)\\n  retorne soma / quantidade(valores)", "explanation": "A função reúne operações pequenas sob o contrato de calcular uma média."}
    },
    "hard": {
      "context": "Uma mudança de regra precisa ser aplicada sem alterar consumidores que dependem do comportamento existente.",
      "what": "Uma função define uma fronteira de comportamento com entradas, efeitos observáveis e resultado.",
      "purpose": "Ela permite compor comportamento, restringir efeitos e verificar contratos em isolamento.",
      "whereUsed": "Modelos de domínio, pipelines de transformação, serviços, bibliotecas e concorrência.",
      "whyCreated": "Unidades nomeadas de comportamento reduzem complexidade acidental e sustentam evolução do software.",
      "importance": "ESSENCIAL — funções são unidades centrais de composição e teste.",
      "analogy": "Uma máquina modular pode ser trocada se preservar o mesmo contrato de entrada e saída.",
      "alternatives": "Objetos, funções puras, eventos e estratégias são alternativas conforme o estado e o acoplamento necessários.",
      "benefits": "Permite raciocinar sobre contratos, efeitos e composição.",
      "limitations": "Estado global, efeitos não documentados e contratos frágeis reduzem previsibilidade.",
      "technical": "Considere referential transparency, ordem de avaliação, captura de ambiente, exceções e assincronicidade conforme a linguagem.",
      "example": {"code": "função agregar(itens, projetar, combinar):\\n  acumulado ← valor_inicial(combinar)\\n  para cada item em itens:\\n    acumulado ← combinar(acumulado, projetar(item))\\n  retorne acumulado", "explanation": "A operação separa a projeção de cada item da regra de combinação, tornando o comportamento componível."}
    }
  }'::jsonb,
  'função dobro(numero):\n  retorne numero * 2\n\nresultado ← dobro(4)',
  'A chamada fornece uma entrada e usa o valor que a função retorna.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO exercises (
  lesson_slug, difficulty, input_type, prompt, options, starter_code,
  accepted_answers, explanation, corrected_example, hints, order_index
) VALUES
('variaveis-e-valores','easy','choice','O que uma variável ajuda o programa a fazer?',
 '[{"id":"a","label":"Apagar todas as instruções"},{"id":"b","label":"Dar um nome a um valor para reutilizá-lo"},{"id":"c","label":"Escolher a cor da tela"}]'::jsonb,
 NULL,'["b"]'::jsonb,'A variável liga um nome a um valor para que o programa possa encontrá-lo e usá-lo depois.','Exemplo: nome ← "Lia" permite usar nome em outra instrução.','["Pense em uma etiqueta que ajuda a encontrar o conteúdo de uma caixa.","Uma variável guarda um valor com um nome."]'::jsonb,1),
('variaveis-e-valores','easy','short','Qual é o nome da variável neste exemplo? nome ← "Lia"',
 NULL,NULL,'["nome"]'::jsonb,'O identificador é o nome usado para se referir ao valor.','nome ← "Lia"','["Observe o texto que aparece antes da seta.","O nome é o identificador à esquerda da atribuição."]'::jsonb,2),
('variaveis-e-valores','medium','choice','Depois de saldo ← 80 e saldo ← saldo + 20, qual valor fica associado a saldo?',
 '[{"id":"a","label":"20"},{"id":"b","label":"80"},{"id":"c","label":"100"},{"id":"d","label":"80 e 20 ao mesmo tempo"}]'::jsonb,
 NULL,'["c"]'::jsonb,'A segunda instrução lê 80, soma 20 e atualiza o valor associado ao nome saldo.','saldo ← 80; depois saldo ← 80 + 20; resultado: 100.','["A atribuição da direita usa o saldo que já existia.","Some o valor anterior ao novo incremento."]'::jsonb,1),
('variaveis-e-valores','medium','short','Complete: pontos ← 3; pontos ← pontos + 4. Qual valor deve ser mostrado?',
 NULL,NULL,'["7"]'::jsonb,'A expressão usa o valor anterior e adiciona 4 antes de atualizar pontos.','pontos ← 3 + 4; mostre(pontos) → 7','["Substitua pontos pelo valor que ele tinha na primeira linha.","Calcule 3 + 4."]'::jsonb,2),
('variaveis-e-valores','hard','code','Declare um identificador pontos com valor inicial 0 usando pseudocódigo.',
 NULL,'pontos ← 0','["pontos <- 0","pontos = 0","pontos := 0"]'::jsonb,'O nome deve identificar claramente o dado e receber o valor inicial antes de ser acumulado.','pontos ← 0','["Escolha um nome que descreva o dado e atribua o valor depois da seta.","A solução tem um identificador, uma atribuição e o número 0."]'::jsonb,1),
('variaveis-e-valores','hard','code','Escreva uma atribuição que acrescente 1 ao valor atual de tentativas.',
 NULL,'tentativas ← tentativas + 1','["tentativas <- tentativas + 1","tentativas = tentativas + 1","tentativas := tentativas + 1"]'::jsonb,'A expressão precisa ler o valor anterior de tentativas antes de atualizá-lo.','tentativas ← tentativas + 1','["Não substitua o total por 1: use o valor que já existe.","Some 1 ao valor atual e salve o resultado no mesmo identificador."]'::jsonb,2),
('decisoes-e-condicoes','easy','choice','Uma condição ajuda o algoritmo a...',
 '[{"id":"a","label":"Escolher uma ação conforme uma regra"},{"id":"b","label":"Guardar imagens no computador"},{"id":"c","label":"Repetir sempre o mesmo resultado"}]'::jsonb,
 NULL,'["a"]'::jsonb,'Uma condição escolhe um caminho com base no resultado verdadeiro ou falso de uma pergunta.','Se tem_ingresso, entre; senão, aguarde.','["Pense na pergunta que a catraca faz.","A resposta verdadeira ou falsa escolhe entre ações."]'::jsonb,1),
('decisoes-e-condicoes','easy','choice','Se tem_ingresso for falso, qual caminho do exemplo deve acontecer?',
 '[{"id":"a","label":"Entre"},{"id":"b","label":"Aguarde"}]'::jsonb,
 NULL,'["b"]'::jsonb,'Quando a condição não é verdadeira, o bloco senão é usado.','se tem_ingresso: Entre; senão: Aguarde.','["Leia qual texto está ligado ao caminho senão.","Falso significa que a pessoa não tem ingresso."]'::jsonb,2),
('decisoes-e-condicoes','medium','choice','Um cupom só é aplicado quando cupom_valido e compra >= minimo são verdadeiros. O que acontece se a compra fica abaixo do mínimo?',
 '[{"id":"a","label":"O desconto é aplicado mesmo assim"},{"id":"b","label":"O caminho de desconto não é executado"},{"id":"c","label":"O programa sempre para"}]'::jsonb,
 NULL,'["b"]'::jsonb,'Com o operador e, as duas partes precisam ser verdadeiras. A compra abaixo do mínimo torna a expressão inteira falsa.','A condição completa é: cupom_valido E compra >= minimo.','["Há duas partes ligadas por e.","Com e, uma parte falsa já torna o conjunto falso."]'::jsonb,1),
('decisoes-e-condicoes','medium','short','Se acesso_liberado = falso, quantas vezes o bloco se acesso_liberado executa?',
 NULL,NULL,'["0","zero","nenhuma","nenhuma vez"]'::jsonb,'O bloco do se só executa quando a condição é verdadeira.','falso significa que esse bloco executa zero vezes.','["O bloco do se depende de uma condição verdadeira.","Falso não entra no bloco."]'::jsonb,2),
('decisoes-e-condicoes','hard','code','Escreva uma regra que permite editar somente quando usuario_ativo e responsavel são verdadeiros.',
 NULL,'se usuario_ativo e responsavel:\n  permita_editar ← verdadeiro\nsenão:\n  permita_editar ← falso','["se usuario_ativo e responsavel: permita_editar <- verdadeiro; senão: permita_editar <- falso"]'::jsonb,'A permissão exige que os dois predicados sejam verdadeiros; nenhum deles deve ser omitido.','se usuario_ativo e responsavel: permita_editar ← verdadeiro; senão: permita_editar ← falso','["Use uma conjunção: os dois critérios precisam ser satisfeitos.","Defina um resultado para a condição verdadeira e outro para a falsa."]'::jsonb,1),
('decisoes-e-condicoes','hard','short','Na expressão (usuario_ativo e responsavel) ou administrador, quais valores bastam para liberar acesso?',
 NULL,NULL,'["usuario_ativo e responsavel verdadeiros ou administrador verdadeiro","usuario ativo e responsavel verdadeiros ou administrador verdadeiro"]'::jsonb,'A expressão aceita o par de critérios da esquerda ou o critério de administrador da direita.','Acesso = (usuario_ativo E responsavel) OU administrador.','["Separe a expressão em dois lados ligados por ou.","O primeiro lado pede dois valores verdadeiros; o segundo pede administrador."]'::jsonb,2),
('funcoes-e-reuso','easy','choice','Por que agrupar passos em uma função pode ajudar?',
 '[{"id":"a","label":"Para repetir uma tarefa sem copiar todos os passos"},{"id":"b","label":"Para fazer o programa esquecer os valores"},{"id":"c","label":"Para mudar automaticamente a linguagem"}]'::jsonb,
 NULL,'["a"]'::jsonb,'Uma função dá nome a uma tarefa e permite chamá-la em vários lugares.','função dobro(numero) pode ser chamada com valores diferentes.','["Pense no que acontece quando os mesmos passos aparecem muitas vezes.","Uma função permite reutilizar uma tarefa nomeada."]'::jsonb,1),
('funcoes-e-reuso','easy','choice','Na chamada dobro(4), qual é a entrada fornecida à função?',
 '[{"id":"a","label":"dobro"},{"id":"b","label":"4"},{"id":"c","label":"8"}]'::jsonb,
 NULL,'["b"]'::jsonb,'O valor dentro dos parênteses é enviado como entrada; o resultado da função é 8.','dobro(4) recebe 4 e retorna 8.','["A entrada aparece dentro dos parênteses.","A função multiplica essa entrada por 2 para devolver o resultado."]'::jsonb,2),
('funcoes-e-reuso','medium','short','Uma função triplo(numero) retorna numero * 3. Qual resultado triplo(5) retorna?',
 NULL,NULL,'["15"]'::jsonb,'A entrada 5 é multiplicada por 3.','triplo(5) → 5 * 3 → 15','["Substitua o parâmetro numero pelo argumento 5.","Calcule 5 vezes 3."]'::jsonb,1),
('funcoes-e-reuso','medium','choice','Uma regra de validação foi copiada em quatro telas. Qual mudança mais reduz a chance de divergência?',
 '[{"id":"a","label":"Manter quatro cópias e tentar atualizar todas"},{"id":"b","label":"Extrair a regra para uma função com entradas e resultado claros"},{"id":"c","label":"Remover a validação"}]'::jsonb,
 NULL,'["b"]'::jsonb,'Uma função centraliza a regra, facilita a reutilização e cria um ponto único para teste.','validar_compra(compra, cupom) pode ser usada pelas telas.','["O problema é manter várias cópias da mesma regra.","Procure uma unidade nomeada que todos os pontos possam chamar."]'::jsonb,2),
('funcoes-e-reuso','hard','code','Descreva em pseudocódigo uma função metade(valor) que devolve valor dividido por 2.',
 NULL,'função metade(valor):\n  retorne valor / 2','["função metade valor retorne valor / 2","metade(valor) retorne valor / 2","function metade valor return valor / 2"]'::jsonb,'A função precisa receber um valor e retornar a transformação, sem depender de um dado global.','função metade(valor): retorne valor / 2','["A função recebe um parâmetro chamado valor.","O corpo deve retornar valor dividido por 2."]'::jsonb,1),
('funcoes-e-reuso','hard','short','Uma função pura é chamada com as mesmas entradas duas vezes. O que se espera de suas saídas?',
 NULL,NULL,'["iguais","a mesma","o mesmo resultado","resultados iguais"]'::jsonb,'Sem efeitos ou estado externo alterando o cálculo, a mesma entrada produz a mesma saída.','mesmas entradas → mesma saída','["Considere a definição de uma função sem efeitos colaterais.","A saída depende apenas das entradas."]'::jsonb,2)
ON CONFLICT (lesson_slug, difficulty, order_index) DO NOTHING;

INSERT INTO achievements (slug, title, description, icon, requirement, threshold) VALUES
  ('primeira-licao', 'Primeiro passo', 'Conclua sua primeira lição.', 'flag', 'lessons_completed', 1),
  ('cem-xp', 'Ritmo de aprendizado', 'Acumule 100 XP praticando.', 'sparkles', 'xp', 100),
  ('sequencia-7', 'Uma semana constante', 'Estude em sete dias consecutivos.', 'flame', 'streak', 7),
  ('dez-respostas', 'Mão na massa', 'Responda dez exercícios corretamente.', 'code', 'correct_exercises', 10),
  ('logica-concluida', 'Pensamento estruturado', 'Conclua as três primeiras lições de lógica.', 'award', 'logic_lessons', 3)
ON CONFLICT (slug) DO NOTHING;
