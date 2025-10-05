declare module 'echarts-for-react' {
  import { Component } from 'react';

  type EChartsOption = any;

  interface ReactEChartsProps {
    option: EChartsOption;
    style?: Record<string, any>;
    notMerge?: boolean;
    lazyUpdate?: boolean;
    onChartReady?: (chart: any) => void;
  }

  export default class ReactECharts extends Component<ReactEChartsProps> {}
}
