import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

/** @type {string | null} */
let jiraBaseUrlCache = null;

/**
 * Obtém o baseUrl do Jira (ex: https://grupojacto.atlassian.net)
 * com cache em memória para evitar chamadas repetidas.
 * @returns {Promise<string | null>}
 */
const getJiraBaseUrl = async () => {
  if (jiraBaseUrlCache) return jiraBaseUrlCache;

  try {
    const url = route`/rest/api/3/serverInfo`;
    const response = await api.asApp().requestJira(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    /** @type {{ baseUrl?: string }} */
    const json = await response.json();
    jiraBaseUrlCache = json?.baseUrl || null;
    return jiraBaseUrlCache;
  } catch (e) {
    console.error("getJiraBaseUrl error:", e);
    return null;
  }
};

/**
 * @typedef {{
 *   "16x16": string | null,
 *   "24x24": string | null,
 *   "32x32": string | null,
 *   "48x48": string | null
 * }} IconItem
 */

/**
 * @typedef {{
 *  accountId: string,
 *  accountType: string,
 *  displayName: string,
 *  timeZone?: string,
 *  avatarUrls: IconItem,
 *  active: boolean
 * }} UserItem
 */

/**
 * @typedef {{
 *  author: UserItem,
 *  timeSpentSeconds: number,
 *  started: string
 * }} WorklogsItems
 */

/**
 * @typedef {{
 *  startAt: number,
 *  maxResults: number,
 *  total: number,
 *  worklogs: Array<WorklogsItems>
 * }} WorklogItem
 */

/**
 * @typedef {{
 *  worklog: WorklogItem
 *  summary?: string
 * }} FieldItem
 */

/**
 * @typedef {{
 *  id: string,
 *  key?: string,
 *  fields: FieldItem
 * }} IssueItem
 */

/**
 * @typedef {{
 *  issues: Array<IssueItem>,
 *  isLast: boolean,
 *  nextPageToken: string
 * }} IssueSearchResult
 */

/**
 * Nó de entrada (recursivo)
 * @typedef {{
 *  value: number;
 *  days?: Record<string, TreeNode>,
 *  issues?: Record<string, TreeNode>,
 *  summary?: string,
 *  url?: string
 * }} TreeNode
 */

/**
 * Nó de saída (recursivo)
 * @typedef {{
 *  color: string;
 *  name: string;
 *  value: number;
 *  children: OutputNode[],
 *  summary?: string,
 *  url?: string
 * }} OutputNode
 */

/**
 * @typedef {{
 *  days: number,
 *  color: string,
 *  query: string,
 *  users: Array<string> | null
 * }} WorklogPayload
 */

/** 
 * @param {Record<string, TreeNode>} data
 * @param {string[]} color
 * @returns {OutputNode[]}
 * */
const createData = (data, color) => {
  /** @type {OutputNode[]} */
  const result = [];

  for (const key in data) {
    if (!Object.hasOwn(data, key)) continue;

    /** @type {TreeNode} */
    const element = data[key];

    /** @type {OutputNode} */
    const node = {
      // Usa o índice atual para começar da primeira cor
      color: color[result.length % color.length],
      name: key,
      value: element.value,
      children: /** @type {OutputNode[]} */([]) // evita never[]
    };

    if (element.summary) {
      node.summary = element.summary;
    }
    if (element.url) {
      node.url = element.url;
    }

    // Próximo nível pode ser 'days' (usuário -> dia) ou 'issues' (dia -> issue)
    /** @type {Record<string, TreeNode> | undefined} */
    const childMap = element.days || element.issues;
    if (childMap) {
      // Ordena as chaves e recria um objeto com a mesma estrutura
      const sortedKeys = Object.keys(childMap).sort((a, b) => a.localeCompare(b));

      /** @type {{ [k: string]: TreeNode }} */
      const ordered = {};
      for (const k of sortedKeys) {
        ordered[k] = childMap[k];
      }

      node.children.push(...createData(ordered, color));
    }

    result.push(node);
  }

  return result;
};

/**
 * @param {string} jql
 * @param {string} nextPageToken
 * @param {number} maxResults
 * @param {Array<IssueItem>} accumulatedIssues
 */
const getDataIssues = async (jql = '', nextPageToken = '', maxResults = 100, accumulatedIssues = []) => {
  // Monta o corpo da requisição
  /** @type {{jql:string, nextPageToken:string, maxResults:number, expand:string, fields:string[]}} */
  const body = {
    jql,
    nextPageToken,
    maxResults,
    expand: 'names',
    fields: ['worklog', 'summary']
  };

  try {
    // Realiza a requisição para a API de busca do Jira
    const url = route`/rest/api/3/search/jql`;
    const response = await api
      .asApp()
      .requestJira(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

    // Converte a resposta para JSON
    /** @type {IssueSearchResult} */
    const json = await response.json();

    // Acumula as issues retornadas
    /** @type {Array<IssueItem>} */
    const issues = json.issues || [];

    accumulatedIssues.push(...issues);

    // Verifica se há mais páginas para buscar
    if (json.isLast === false && json.nextPageToken) {
      // Recursivamente busca as próximas páginas
      return await getDataIssues(jql, json.nextPageToken, maxResults, accumulatedIssues);
    }

    // Retorna todas as issues acumuladas
    return accumulatedIssues;
  } catch (error) {
    console.error("getDataIssues error: ", error);
    throw error;
  }
};

/**
 * @param {string} issueId
 * @param {number} startAt
 * @param {number} maxResults
 * @param {Array<WorklogsItems>} accumulatedWorklogs
 */
const getDataWorklogs = async (issueId, startAt = 0, maxResults = 100, accumulatedWorklogs = []) => {
  try {
    // Realiza a requisição para a API de busca do Jira
    const url = route`/rest/api/3/issue/${issueId}/worklog?startAt=${startAt}&maxResults=${maxResults}`;
    const response = await api
      .asApp()
      .requestJira(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

    // Converte a resposta para JSON
    /** @type {WorklogItem} */
    const json = await response.json();

    // Acumula as issues retornadas
    /** @type {number} */
    const startAtResp = json.startAt || 0;
    /** @type {number} */
    const maxResultsResp = json.maxResults || 0;
    /** @type {number} */
    const totalResp = json.total || 0;
    /** @type {Array<WorklogsItems>} */
    const worklogs = json.worklogs || [];

    accumulatedWorklogs.push(...worklogs);

    // Verifica se há mais páginas para buscar
    if (totalResp > startAtResp + maxResultsResp) {
      // Recursivamente busca as próximas páginas
      return await getDataWorklogs(issueId, startAtResp + maxResultsResp, maxResultsResp, accumulatedWorklogs);
    }

    // Retorna todas as issues acumuladas
    return accumulatedWorklogs;
  } catch (error) {
    console.error("getDataIssues error: ", error);
    throw error;
  }
};

/**
 * @param {number} startAt
 * @param {number} maxResults
 * @param {Array<UserItem>} accumulatedUsers
 */
const getDataUsers = async (startAt = 0, maxResults = 1000, accumulatedUsers = []) => {
  try {
    // Realiza a requisição para a API de busca de usuários do Jira
    const url = route`/rest/api/3/users/search?startAt=${startAt}&maxResults=${maxResults}`;
    const response = await api
      .asApp()
      .requestJira(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

    // Converte a resposta para JSON e trata diferentes formatos
    const json = await response.json();
    /** @type {Array<UserItem>} */
    let users = [];

    // Se a API retornar um objeto com { values: [...] } (algumas endpoints), normalize
    /** @type {Array<UserItem>} */
    const iterable = Array.isArray(json)
      ? json
      : (
        json && Array.isArray(json.values)
          ? json.values
          : null
      );

    // Retorna o acumulado atual para evitar lançar erro na UI
    if (!iterable) {
      return accumulatedUsers;
    }

    // Filtra apenas usuários ativos com accountType 'atlassian'
    for (const /** @type {UserItem} */ element of iterable) {
      // Se o elemento não for válido, pula para o próximo
      if (element && element.accountType === 'atlassian' && element.active === true) {
        // Cria o objeto do usuário
        /** @type {UserItem} */
        const user = {
          accountId: element.accountId,
          accountType: element.accountType,
          active: element.active,
          displayName: element.displayName,
          timeZone: element.timeZone,
          avatarUrls: element.avatarUrls
        };

        users.push(user);
      }
    }

    accumulatedUsers.push(...users);

    // Verifica se há mais usuários para buscar
    if (json.length === 1000) {
      return await getDataUsers(startAt + maxResults, maxResults, accumulatedUsers);
    }

    return accumulatedUsers;
  } catch (error) {
    console.error("getDataUsers error: ", error);
    throw error;
  }
};

/**
 * Obtém os registros de trabalho (worklogs) de um determinado período
 * @param {{payload: WorklogPayload}} param0
 */
resolver.define('getWorklog', async ({ payload }) => {
  /** @type {WorklogPayload} */
  const payloadAny = payload ?? { days: 7, color: 'color', query: '', users: [] };

  // Valida e ajusta os parâmetros
  /** @type {number} */
  const days = payloadAny.days < 0 ? 7 : payloadAny.days;
  /** @type {Array<string>|null} */
  const users = payloadAny.users && payloadAny.users.length > 0 ? payloadAny.users : [];
  /** @type {string} */
  const jql = payloadAny.query;

  // Base URL do Jira para montar links de browse (ex: https://xxx.atlassian.net)
  const jiraBaseUrl = await getJiraBaseUrl();

  // Monta o JQL para buscar as issues com worklogs no período especificado
  /** @type {string} */
  let searchJql = '';
  searchJql += `worklogDate >= startOfDay("-${days}d")`;
  searchJql += users.length > 0 ? ` AND worklogAuthor in (${users.join(',')})` : '';
  searchJql += jql ? ` AND ${jql}` : '';

  // Retorno da lista de issues
  /** @type {Array<IssueItem>} */
  const result = await getDataIssues(searchJql);

  // Agrupa e soma o tempo por autor -> dia -> issue
  /** @type {Record<string, {value: number, days: {[day: string]: {value: number, issues: {[issue: string]: {value: number, summary?: string, url?: string}}}}}>} */
  let authorTimes = {};

  // Verifica se há issues retornadas
  if (result.length > 0) {
    // Percorre as issues retornadas
    for (const /** @type {IssueItem} */ issue of result) {
      // Obtém o ID da issue
      /** @type {string} */
      const issueId = issue.id;

      // Se a issue não tiver ID, pula para a próxima
      if (!issueId) {
        continue;
      }

      // Obtém o total de worklogs da issue
      /** @type {number} */
      const totalWorklogs = issue.fields?.worklog?.total || 0;

      // Se não houver worklogs, pula para a próxima issue
      if (totalWorklogs === 0) {
        continue;
      }

      /** @type {Array<WorklogsItems>} */
      let worklogs = [];

      // Se houver mais de 20 worklogs, buscar todos via paginação
      if (totalWorklogs > 20) {
        worklogs = await getDataWorklogs(issueId);
      } else {
        worklogs = issue.fields?.worklog?.worklogs || [];
      }

      // Label e metadados do issue (para o 3º nível)
      /** @type {string} */
      const browseKey = (/** @type {{key?: string}} */(issue))?.key || '';
      /** @type {string} */
      const issueKey = browseKey || issueId;
      /** @type {string | undefined} */
      const issueSummary = issue.fields?.summary;
      /** @type {string | undefined} */
      const issueUrl = (jiraBaseUrl && browseKey) ? `${jiraBaseUrl}/browse/${browseKey}` : undefined;

      // Percorre os worklogs da issue
      for (const /** @type {WorklogsItems} */ wl of worklogs) {
        /** @type {UserItem} */
        let author = wl.author;
        /** @type {string} */
        let display_name = author?.displayName || 'Desconhecido';
        /** @type {string} */
        let account_id = author?.accountId || 'unknown';
        /** @type {string} */
        let time_zone = author?.timeZone || 'America/Sao_Paulo';
        /** @type {string} */
        let dayKey = wl.started ? wl.started.split('T')[0] : 'unknown';

        // Considera apenas worklogs com autor válido e, se fornecido, dentro da lista de usuários
        if (display_name && (users.length === 0 || users.includes(account_id))) {
          // Inicializa o autor no objeto se ainda não existir
          if (!(display_name in authorTimes)) {
            authorTimes[display_name] = { value: 0, days: {} };
          }

          // Verifica a data do worklog
          /** @type {Date | null} */
          let started = wl.started ? new Date(wl.started) : null;
          /** @type {Date} */
          let now = new Date();
          now.setHours(0, 0, 0, 0); // zera horas, minutos, segundos e ms
          /** @type {Date} */
          let analyzeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

          // Considera apenas worklogs dentro do período especificado
          if (started && started >= analyzeStart) {
            // Garante que a chave do dia exista antes de acumular horas
            if (!(dayKey in authorTimes[display_name].days)) {
              authorTimes[display_name].days[dayKey] = { value: 0, issues: {} };
            }

            // Garante que o issue exista dentro do dia
            if (!(issueKey in authorTimes[display_name].days[dayKey].issues)) {
              authorTimes[display_name].days[dayKey].issues[issueKey] = {
                value: 0,
                summary: issueSummary,
                url: issueUrl
              };
            }

            // Converte o tempo gasto para horas e acumula
            /** @type {number} */
            let hours = wl.timeSpentSeconds ? wl.timeSpentSeconds / 3600 : 0;

            authorTimes[display_name].value += hours;
            authorTimes[display_name].days[dayKey].value += hours;
            authorTimes[display_name].days[dayKey].issues[issueKey].value += hours;
          }
        }
      }
    }

    // Ordena authorTimes por nome (label) em ordem alfabética
    /** @type {Array<[string, {value: number, days: {[day: string]: {value: number, issues: {[issue: string]: {value: number}}}}}]>} */
    const sortedEntries = Object
      .entries(authorTimes)
      .sort((a, b) => a[0].localeCompare(b[0]));
    // Atualiza authorTimes com a ordem correta
    Object
      .keys(authorTimes)
      .forEach(key => delete authorTimes[key]);
    sortedEntries
      .forEach(([name, value]) => { authorTimes[name] = value; });

    authorTimes = Object.fromEntries(sortedEntries);
  }

  // Mapa de cores
  /** @type {Record<string, string[]>} */
  const colorMap = {
    "color": [
      '#fb2c36', // red
      '#ff6900', // orange
      '#fd9a00', // amber
      '#efb100', // yellow
      '#7ccf00', // lime
      '#00c951', // green
      '#00bc7d', // emerald
      '#00bba7', // teal
      '#00b8db', // cyan
      '#0084d1', // sky
      '#155dfc', // blue
      '#615fff', // indigo
      '#7f22fe', // violet
      '#ad46ff', // purple
      '#e12afb', // fuchsia
      '#f6339a', // pink
      '#ff2056', // rose
      '#4a5565', // gray
      '#525252', // neutral
    ],
    "gray": [
      '#030712', // 950
      '#111827', // 900
      '#1f2937', // 800
      '#374151', // 700
      '#4b5563', // 600
      '#6b7280', // 500
      '#9ca3af', // 400
      '#d1d5db', // 300
      '#e5e7eb', // 200
      '#f3f4f6', // 100
    ],
    "red": [
      '#450a0a', // 950
      '#7f1d1d', // 900
      '#991b1b', // 800
      '#b91c1c', // 700
      '#dc2626', // 600
      '#ef4444', // 500
      '#f87171', // 400
      '#fca5a5', // 300
      '#fecaca', // 200
      '#fee2e2', // 100
    ],
    "blue": [
      '#172554', // 950
      '#1e3a8a', // 900
      '#1e40af', // 800
      '#1d4ed8', // 700
      '#2563eb', // 600
      '#3b82f6', // 500
      '#60a5fa', // 400
      '#93c5fd', // 300
      '#bfdbfe', // 200
      '#dbeafe', // 100
    ],
    "green": [
      '#052e16', // 950
      '#14532d', // 900
      '#166534', // 800
      '#15803d', // 700
      '#16a34a', // 600
      '#22c55e', // 500
      '#4ade80', // 400
      '#86efac', // 300
      '#bbf7d0', // 200
      '#dcfce7', // 100
    ],
    "orange": [
      '#431407', // 950
      '#7c2d12', // 900
      '#9a3412', // 800
      '#c2410c', // 700
      '#ea580c', // 600
      '#f97316', // 500
      '#fb923c', // 400
      '#fdba74', // 300
      '#fed7aa', // 200
      '#ffedd5', // 100
    ],
  };

  // Seleciona o conjunto de cores baseado na chave fornecida (padrão 'color')
  /** @type {string} */
  const colorKey = payloadAny.color in colorMap ? payloadAny.color : 'color';

  // Seleciona o array de cores
  /** @type {string[]} */
  const colorGraph = colorMap[colorKey];

  // Cria a estrutura de dados para o gráfico
  /** @type {OutputNode[]} */
  const arrayData = createData(authorTimes, colorGraph);

  return arrayData;
});

/**
 * Retorna a lista de usuários ativos do Jira (accountType='atlassian' e active=true)
 * no formato { label: displayName, value: accountId }
 * @returns {Array<{label: string, value: string}>}
 */
resolver.define('getUsers', async () => {
  try {
    // Busca todos os usuários ativos
    /** @type {Array<UserItem>} */
    const users = await getDataUsers();

    return users
      .filter((/** @type {UserItem} */ user) =>
        user.accountType === 'atlassian' && user.active === true)
      .map((/** @type {UserItem} */ user) => ({
        label: user.displayName,
        value: user.accountId
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error("getUsers error:", error);
    throw error;
  }
});


export const handler = resolver.getDefinitions();
