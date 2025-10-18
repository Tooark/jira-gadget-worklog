import ReactECharts from 'echarts-for-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useForgeInvoke } from '../hooks';
import type { TreeNode, ViewProps } from '../types';

// Componente de gráfico com drilldown múltiplo
export default function View(props: ViewProps) {
  // Dias para buscar (padrão 7)
  const days = (props.formValues?.days || 7) < 0 ? 7 : props.formValues.days;
  // Chama o backend getWorklog para os últimos N dias (padrão 7)
  const rawData = useForgeInvoke<TreeNode[]>('getWorklog', {
    days,
    color: props.formValues?.color || 'color',
    query: props.formValues?.jql || '',
    users: props.formValues?.users || [],
  });

  props.formValues.days = days;

  // Navegação: pilha de níveis selecionados para drilldown. Root = []
  const [path, setPath] = useState<TreeNode[]>([]);

  // Título base
  const title =
    'Worklog dos últimos ' + days + ' dias';

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
    (params: any) => {
      // params.name é o rótulo mostrado
      const idx = params?.dataIndex;

      // Se o índice for inválido, não faz nada
      if (idx == null) {
        return;
      }

      const node = currentItems[idx];

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
  const option: any = {
    animationDurationUpdate: 300,
    animationEasing: 'cubicInOut',
    title: {
      show: true,
      text:
        title +
        (canGoBack
          ? ` [${path.map((p) => shortName(p.name)).join(' › ')}: ${Math.round(path.reduce((sum, p) => sum + p.value, 0) * 10) / 10}h]`
          : ' [Total: ' +
            Math.round(values.reduce((sum, v) => sum + v, 0) * 10) / 10 +
            'h]'),
      top: 0,
      left: 0,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: function (value: number) {
        return value + 'h';
      },
    },
    toolbox: {
      orient: 'horizontal',
      top: 0,
      right: 0,
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
          optionToContent: function (opt: { series: any; xAxis: any }) {
            var axisData = (opt?.xAxis?.[0]?.data || []) as string[];
            var series = opt.series || [];
            var table =
              '<table style="width:100%;text-align:left"><tbody>' +
              '<tr>' +
              '<th>Nome</th>' +
              '<th>Horas</th>' +
              '</tr>';

            for (var i = 0, l = axisData.length; i < l; i++) {
              table +=
                '<tr>' +
                '<td>' +
                axisData[i] +
                '</td>' +
                '<td>' +
                (series[0]?.data?.[i]?.value ?? series[0]?.data?.[i] ?? '') +
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
      left: 0,
      right: 0,
      top: '60px',
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
  const chartRef = useRef<any>(null);
  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    try {
      // Remove listener antigo e adiciona o atual
      chart.off && chart.off('click');
      chart.on && chart.on('click', handleClick);
    } catch {
      // noop
    }

    return () => {
      try {
        chart?.off && chart.off('click');
      } catch {
        // noop
      }
    };
  }, [handleClick, currentItems]);

  return (
    <div style={{ height: 420 }}>
      <ReactECharts
        option={option}
        style={{ height: 400 }}
        onChartReady={(chart) => {
          chartRef.current = chart;
        }}
      />
    </div>
  );
}
