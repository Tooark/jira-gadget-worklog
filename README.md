# Jira Worklog Chart Gadget

Gadget Forge para exibir gráficos interativos de worklogs no painel do Jira. O gadget agrega e visualiza tempo de trabalho (worklog) por usuário, permitindo que equipes analisem distribuição de horas, naveguem entre níveis de detalhe (drill-down) e exportem gráficos.

## Principais recursos

- **Filtros dinâmicos:** últimos `n dias`, `usuários`, `jql adicional` configuráveis via `Edit`.
- **Agrupamento:** Gráfico interativo com múltiplos níveis de drilldown/back, exportação e visualização tabular.
- **Navegação interativa:** Por pilha local (drill-down/drill-up) e abertura de issues em nova aba.

**Onde está o código:** veja o diretório [src](src) para frontend/backend.

## Implementação — componentes principais

- **Edit** ([src/frontend/src/edit/Edit.tsx](src/frontend/src/edit/Edit.tsx)): formulário de configuração do gadget.
  - Campos principais:
    - `days` — número de dias (padrão 7).
    - `color` — paleta/cor do gráfico (ex.: `color`, `blue`, `gray`, ...).
    - `users` — seleção múltipla de usuários (obtida via `getUsers` no backend).
    - `jql` — JQL adicional aplicado antes da agregação.
  - Comportamento: usa `useForgeInvoke('getUsers')` para popular o seletor, mantém `props.formValues` e chama `props.view.submit(...)` para salvar/fechar.

- **View** ([src/frontend/src/view/View.tsx](src/frontend/src/view/View.tsx)): renderiza o gráfico usando `echarts-for-react`.
  - Obtém dados do backend usando `useForgeInvoke('getWorklog', { days, color, query, users })`.
  - Mantém uma pilha `path` para drilldown (root = []).
  - Ao clicar numa barra/segmento:
    - se o nó tem `url`, abre a issue com `router.open(url)`;
    - se o nó tem `children`, adiciona o nó à pilha (`setPath([...])`) para descer.
  - Título dinâmico com total ou contexto do nível atual; tooltips customizados com escape de HTML e formatação `value + 'h'`.
  - Toolbox do chart inclui botão `Voltar`, `Exportar Gráfico`, `Visualizar Dados` (gera tabela HTML), zoom e alternância de tipo (`line`/`bar`).
  - O chart registra handlers `on('click', ...)`/`off('click')` diretamente no objeto retornado por `echarts`.

## Como os dados são formatados

- Cada nó retornado pelo backend é um `TreeNode` com pelo menos: `name`, `value`, `color?`, `summary?`, `url?`, `children?`.
- Os valores são arredondados (uma casa decimal) antes da exibição; cores são aplicadas por `itemStyle.color`.

## Imagens de exemplo (diretório `media`)

Coloque imagens de exemplo em `media/` para torná-las visíveis neste README. Sugestões de nomes:

- `media/example-month.png` — exemplo de gráfico mensal.
- `media/example-drilldown.png` — exemplo mostrando drill-down em um usuário/issue.

Se as imagens existirem, o README exibirá as imagens inseridas. Exemplo de sintaxe Markdown para incluir imagens locais:

```md
![Visão mensal](media/example-month.png)
![Drilldown](media/example-drilldown.png)
```

> Observação: o repositório atual inclui a pasta `media/`; adicione imagens com os nomes sugeridos para exemplos rápidos.

### Exemplos do gadget

#### Parâmetro de cor (paleta):

| **Colorido**                                                   | **Azul**                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| <img src="media/gadget-color.svg" alt="Colorido" width="600"/> | <img src="media/gadget-blue.svg" alt="Azul" width="600"/> |

| **Cinza**                                                  | **Laranja**                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| <img src="media/gadget-gray.svg" alt="Cinza" width="600"/> | <img src="media/gadget-orange.svg" alt="Laranja" width="600 "/> |

| **Verde**                                                   | **Vermelho**                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| <img src="media/gadget-green.svg" alt="Verde" width="600"/> | <img src="media/gadget-red.svg" alt="Vermelho" width="600"/> |

#### Visões de resumo e drilldown:

<img src="media/gadget-total-hover.svg" alt="Resumo" width="600"/>
<img src="media/gadget-total-date.svg" alt="Drilldown" width="600"/>
<img src="media/gadget-total-user.svg" alt="Drilldown" width="600"/>

## Exemplos de uso (detalhados)

- **Variações de cor**
  - O seletor `Cor do Gráfico` em `Edit` aceita as opções (definidas em [src/frontend/src/edit/Edit.tsx](src/frontend/src/edit/Edit.tsx)):
    - `color` — Colorido (paleta padrão)
    - `blue` — Azul
    - `gray` — Cinza
    - `orange` — Laranja
    - `green` — Verde
    - `red` — Vermelho
  - Exemplo de `formValues` para testar variação de cor:

```json
{
  "days": 14,
  "color": "blue",
  "users": ["alice", "bob"],
  "jql": "project = PROJ-X"
}
```

- Como testar: abra a tela de edição do gadget (`Edit`), altere o campo "Cor do Gráfico" para a opção desejada e clique em "Salvar" — o `View` irá renderizar o gráfico com a paleta selecionada.

- **Drilldown interativo**
  - Comportamento resumido:
    1. O `View` inicia no nível raiz (ex.: agregação por usuário, projeto ou período).
    2. Clique em uma barra/segmento: se o nó possuir `children`, o gadget adiciona o nó à pilha `path` e desce para o próximo nível (drill-down).
    3. Se o nó possuir `url`, o gadget tenta abrir a issue em nova aba via `router.open(url)`.
    4. Use o botão `Voltar` (toolbox) para subir um nível (drill-up).

  - Exemplo prático:
    - Configuração inicial: `days = 30`, `group by = Usuário` (agregação feita no backend).
    - Ações: clique na barra `alice` → o `View` mostra `alice` dividido por `Issue` → clique numa issue com `url` para abrir no Jira.

  - Observação: o título do gráfico mostra o contexto atual e o total de horas, e os tooltips exibem `summary` quando disponível.

## Instalação rápida

1. Instale dependências:

```sh
npm install
```

2. Autentique-se e use `forge` para deploy/desenvolvimento:

```sh
npm run login
npx forge tunnel   # para desenvolver localmente
npm run deploy     # para persistir alterações
```

## Desenvolvimento e extensões

- Frontend: veja [src/frontend](src/frontend) para os componentes React/TSX (incluindo [Edit.tsx](src/frontend/src/edit/Edit.tsx) e [View.tsx](src/frontend/src/view/View.tsx)).
- Backend / resolvers: os endpoints que consultam o Jira estão em [src/backend](src/backend).
- Para adicionar um novo filtro no `Edit`, crie o campo no componente de edição e faça o mapeamento na query/resolver backend.

## Contribuição

- Abra uma issue para sugerir filtros adicionais ou melhorias de UX.
- Pull requests são bem-vindos; mantenha testes e atualize a documentação quando necessário.
- [Link Issues](https://github.com/Tooark/tooark-gadget-worklog/issues) para bugs/sugestões.

## Licenças de terceiros

Este projeto inclui dependências de terceiros que são redistribuídas no bundle do frontend ou consumidas em runtime. Cópias das licenças/avisos relevantes estão em `LICENSES/` para sua referência e para inclusão em distribuições.

- ECharts — Apache License 2.0
  - Arquivo de licença: `LICENSES/echarts-LICENSE.txt`
  - Arquivo NOTICE (se presente): `LICENSES/echarts-NOTICE.txt`
  - Fonte oficial: https://echarts.apache.org/en/js/vendors/echarts/LICENSE

Recomendações:

- Se você gerar um bundle que inclua o código do ECharts (ou outro vendor), inclua os arquivos acima no pacote de distribuição.
- Se houver um arquivo `NOTICE` fornecido pela dependência, sua inclusão pode ser exigida pela seção 4(d) da Apache License 2.0 — mantenha o conteúdo conforme fornecido.

## License

Apache License 2.0

Este repositório é licenciado sob a Apache License, Version 2.0. Consulte o arquivo [LICENSE](LICENSE) para o texto completo e os termos de uso.
