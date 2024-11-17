import { useInjectionVolumeOverTimeChart } from '@/hooks/home/useInjectionVolumeOverTimeChart';
import HighCharts from 'highcharts';
import HighChartsReact from 'highcharts-react-official';

export const InjectionVolumeOverTimeChart = () => {

    const { options } = useInjectionVolumeOverTimeChart();

    return <HighChartsReact highcharts={HighCharts} options={options} />;
};