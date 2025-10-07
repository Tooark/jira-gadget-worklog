import type { FormValues } from '../types';
import ReactECharts from 'echarts-for-react';
import { useForgeInvoke } from '../hooks';

interface Props {
  formValues: FormValues;
}

export default function View(props: Props) {
  // Chama o backend getWorklog para os últimos 7 dias (padrão)
  const data = useForgeInvoke<any[]>('getWorklog', {
    days: props.formValues?.days || 7,
    color: props.formValues?.color || 'color',
    query: props.formValues?.jql || '',
    users: props.formValues?.users || [],
  });

  // data expected: array of [color, name, value]
  const names = (data || []).map((d) => {
    const parts = d[1].split(' ');

    if (parts.length === 1) {
      return parts[0];
    }

    return `${parts[0]} ${parts[parts.length - 1]}`;
  });
  const values = (data || []).map((d) => Math.round(d[2] * 10) / 10);
  const colors = (data || []).map((d) => d[0]);

  // Preenche os campos days e jql a partir da API, se disponíveis
  const displayDays = props.formValues?.days || 7;

  const option = {
    title: {
      show: true,
      text: `Worklog dos últimos ${displayDays} dias`,
      top: 0,
      left: 0,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      valueFormatter: function (value: number) {
        return value + 'h';
      },
    },
    toolbox: {
      orient: 'horizontal',
      top: 0,
      right: 0,
      feature: {
        saveAsImage: { show: true, title: 'Exportar Gráfico' },
        dataView: {
          show: true,
          title: 'Visualizar Dados',
          optionToContent: function (opt: { series: any; xAxis: any }) {
            var axisData = opt.xAxis[0].data;
            var series = opt.series;
            var table =
              '<table style="width:100%;text-align:left"><tbody><tr>' +
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
                series[0].data[i] +
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
      data: names,
      axisLabel: {
        rotate: 90,
        interval: 0,
        nameTextStyle: { overflow: 'break' },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Horas',
    },
    series: [
      {
        data: values,
        type: 'bar',
        itemStyle: {
          color: (params: any) => colors[params.dataIndex] || '#5470c6',
        },
      },
    ],
  };

  return (
    <div style={{ height: 400 }}>
      <div style={{ height: 400 }}>
        <ReactECharts option={option} style={{ height: 400 }} />
      </div>
    </div>
  );
}
