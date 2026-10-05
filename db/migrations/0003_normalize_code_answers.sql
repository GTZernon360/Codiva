UPDATE exercises
SET accepted_answers = '["se usuario_ativo e responsavel: permita_editar <- verdadeiro; senão: permita_editar <- falso"]'::jsonb
WHERE lesson_slug = 'decisoes-e-condicoes'
  AND difficulty = 'hard'
  AND order_index = 1;
