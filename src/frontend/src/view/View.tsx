import { router } from '@forge/bridge';
import ReactECharts from 'echarts-for-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useForgeInvoke } from '../hooks';
import type { TreeNode, ViewProps } from '../types';

// Tipos locais mínimos para evitar dependência direta das exports dos tipos do echarts
type ChartLike = {
  on?: (event: string, handler: (ev?: unknown) => void) => void;
  off?: (event: string) => void;
};

type Option = Record<string, unknown>;

// Componente de gráfico com drilldown múltiplo
export default function View(props: ViewProps) {
  // Dias para buscar (padrão 7)
  const configuredDays = props.formValues?.days ?? 7;
  const days = configuredDays < 0 ? 7 : configuredDays;
  // Chama o backend getWorklog para os últimos N dias (padrão 7)
  const rawData = useForgeInvoke<TreeNode[]>('getWorklog', {
    days,
    color: props.formValues?.color || 'color',
    query: props.formValues?.jql || '',
    users: props.formValues?.users || [],
  });

  // Navegação: pilha de níveis selecionados para drilldown. Root = []
  const [path, setPath] = useState<TreeNode[]>([]);

  // Título base
  const title = 'Worklog dos últimos ' + days + ' dias';

  // Função util para reduzir nomes (primeiro + último)
  const shortName = useCallback((full: string) => {
    const parts = (full || '').trim().split(' ').filter(Boolean);

    // Se tiver só uma parte, retorna ela
    if (parts.length <= 1) {
      return parts[0] || '';
    }

    return `${parts[0]} ${parts[parts.length - 1]}`;
  }, []);

  // Nível atual e lista de itens visíveis no nível atual
  const currentItems: TreeNode[] = useMemo(() => {
    // Se não houver dados brutos, retorna vazio
    if (!rawData) {
      return [];
    }

    // Se o caminho estiver vazio, retorna o nível raiz
    if (path.length === 0) {
      return rawData;
    }

    // Caso contrário, desce na árvore conforme o caminho
    const last = path[path.length - 1];

    return last.children || [];
  }, [rawData, path]);

  // Preparação das séries a partir do nível atual
  const categories = useMemo(
    () => currentItems.map((n) => shortName(n.name)),
    [currentItems, shortName],
  );
  const values = useMemo(
    () => currentItems.map((n) => Math.round(n.value * 10) / 10),
    [currentItems],
  );
  const colors = useMemo(
    () => currentItems.map((n) => n.color || '#737373'),
    [currentItems],
  );

  // Pode voltar se o caminho não estiver vazio
  const canGoBack = path.length > 0;

  // Handler de clique para descer um nível
  const handleClick = useCallback(
    (params: unknown) => {
      const p = (Array.isArray(params) ? params[0] : params) as {
        dataIndex?: number;
        name?: string;
        value?: unknown;
      };

      const idx = p?.dataIndex;

      // Se o índice for inválido, não faz nada
      if (idx == null) {
        return;
      }

      const node = currentItems[idx];

      // Se for um issue (tem URL), abre em nova aba
      if (node?.url) {
        try {
          // Em Custom UI (Forge), window.open pode ser bloqueado por sandbox.
          // router.open abre corretamente fora do iframe.
          void router.open(node.url);
        } catch {
          try {
            window.location.href = node.url;
          } catch {
            // ignore
          }
        }
        return;
      }

      // Se o nó tiver filhos, desce um nível
      if (node && node.children && node.children.length > 0) {
        setPath((prev) => [...prev, node]);
      }
    },
    [currentItems],
  );

  // Voltar um nível
  const goBack = useCallback(() => {
    setPath((prev) => prev.slice(0, -1));
  }, []);

  // Construção do option multi-drilldown
  const option: Option = {
    animationDurationUpdate: 300,
    animationEasing: 'cubicInOut',
    title: {
      show: true,
      text:
        title +
        (canGoBack
          ? ` [${path.map((p) => shortName(p.name)).join(' › ')}: ${Math.round(path[path.length - 1].value * 10) / 10}h]`
          : ' [Total: ' +
            Math.round(values.reduce((sum, v) => sum + v, 0) * 10) / 10 +
            'h]'),
      top: '10px',
      left: '10px',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params: unknown) {
        const p = (Array.isArray(params) ? params[0] : params) as {
          dataIndex?: number;
          name?: string;
          value?: unknown;
        };
        const idx = p?.dataIndex;
        const node = idx != null ? currentItems[idx] : undefined;

        const escapeHtml = (s: string) =>
          s
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');

        const name = escapeHtml(String(node?.name ?? p?.name ?? ''));
        const summary = node?.summary
          ? `: ${escapeHtml(String(node.summary))}`
          : '';
        const rawValue = p?.value;
        const value =
          typeof rawValue === 'number'
            ? rawValue
            : rawValue && typeof rawValue === 'object' && 'value' in rawValue
              ? (rawValue as { value?: unknown }).value
              : rawValue;

        return `<strong>${name}</strong>${summary}<br/>${value}h`;
      },
    },
    toolbox: {
      orient: 'horizontal',
      top: '10px',
      right: '10px',
      feature: {
        // Botão customizado de voltar
        myBack: {
          show: canGoBack,
          title: 'Voltar',
          icon: 'path://M512 64L192 384l320 320 45.3-45.3L303 384 557.3 109.3 512 64z',
          onclick: goBack,
        },
        saveAsImage: { show: true, title: 'Exportar Gráfico' },
        dataView: {
          show: true,
          title: 'Visualizar Dados',
          optionToContent: function (opt: unknown) {
            type OptType = {
              xAxis?: Array<{ data?: string[] }>;
              series?: Array<{ data?: Array<unknown> }>;
            };

            const o = (opt as OptType) || {};
            const axisData = (o?.xAxis?.[0]?.data || []) as string[];
            const series = o.series || [];
            let table =
              '<table style="width:100%;text-align:left"><tbody>' +
              '<tr>' +
              '<th>Título</th>' +
              '<th>Horas</th>' +
              '</tr>';

            for (let i = 0, l = axisData.length; i < l; i++) {
              const cell = series[0]?.data?.[i] as unknown;
              const value =
                cell && typeof cell === 'object' && 'value' in (cell as object)
                  ? (cell as { value?: unknown }).value
                  : cell;
              table +=
                '<tr>' +
                '<td>' +
                axisData[i] +
                '</td>' +
                '<td>' +
                (value ?? '') +
                '</td>' +
                '</tr>';
            }

            table += '</tbody></table>';

            return table;
          },
        },
        dataZoom: { show: true, title: { back: 'Remover Zoom' } },
        magicType: {
          show: true,
          title: { line: 'Gráfico de Linhas', bar: 'Gráfico de Barras' },
          type: ['line', 'bar'],
        },
      },
    },
    grid: {
      left: '20px',
      right: '20px',
      top: '65px',
      bottom: '20px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: 90,
        interval: 0,
        nameTextStyle: { overflow: 'break' },
      },
    },
    yAxis: { type: 'value', name: 'Horas' },
    series: [
      {
        id: 'main',
        type: 'bar',
        universalTransition: true,
        data: values.map((v, i) => ({
          value: v,
          name: categories[i],
          id: (currentItems[i]?.name || categories[i]) + '', // id estável para animação
          itemStyle: { color: colors[i] || '#737373' },
        })),
      },
    ],
  };

  // Registrar evento de clique diretamente no chart
  const chartRef = useRef<ChartLike | null>(null);
  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    try {
      // Remove listener antigo e adiciona o atual
      if (typeof chart.off === 'function') {
        chart.off('click');
      }
      if (typeof chart.on === 'function') {
        chart.on('click', (ev: unknown) => handleClick(ev));
      }
    } catch {
      // noop
    }

    return () => {
      try {
        if (chart && typeof chart.off === 'function') {
          chart.off('click');
        }
      } catch {
        // noop
      }
    };
  }, [handleClick, currentItems]);

  return (
    <div style={{ height: '100%', width: '100%', margin: 0, padding: 0 }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%', margin: 0, padding: 0 }}
        onChartReady={(chart) => {
          chartRef.current = chart as ChartLike;
        }}
      />
    </div>
  );
}
