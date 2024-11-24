import { useCallback, useEffect, useMemo } from 'react';
import { useCurrentDevice } from '../zustand/useCurrentDevice';
import { useAxios } from '../axios/useAxios';
import { format } from 'date-fns';

const START = 'start';
const END = 'end';

export const useInjectionVolumeOverTimeChart = () => {
  const currentDeviceId = useCurrentDevice((state) => state.currentDeviceId);
  const injectionVolumeOverTimeData = useCurrentDevice(
    (state) => state.injectionVolumeOverTimeData
  );
  const valveOpeningPercentageOverTimeData = useCurrentDevice(
    (state) => state.valveOpeningPercentageOverTimeData
  );
  const hydrationPeriodData = useCurrentDevice(
    (state) => state.hydrationPeriodData
  );
  const setInjectionVolumeOverTimeData = useCurrentDevice(
    (state) => state.setInjectionVolumeOverTimeData
  );
  const setValveOpeningPercentageOverTimeData = useCurrentDevice(
    (state) => state.setValveOpeningPercentageOverTimeData
  );
  const setHydrationPeriodData = useCurrentDevice(
    (state) => state.setHydrationPeriodData
  );
  const { axiosInstance } = useAxios();

  const options = useMemo(() => {
    return {
      chart: {
        type: 'line',
        zooming: { type: 'x' },
      },
      title: { text: undefined },
      xAxis: {
        title: {
          text: 'Time',
        },
        type: 'datetime',
        tickPixelInterval: 150,
        plotBands: hydrationPeriodData.map((band) => ({
          from: band.from,
          to: band.to,
          color: '#FF8A8A70',
        })),
      },
      yAxis: [
        { title: { text: 'Gas Injection Volume' } },
        {
          title: { text: 'Valve Opening Percentage' },
          min: 0,
          max: 100,
        },
      ],
      credits: { enabled: false },
      legend: { enabled: true },
      series: [
        {
          name: 'Gas Injection Volume',
          yAxis: 0,
          data: injectionVolumeOverTimeData,
        },
        {
          name: 'Valve Opening Percentage',
          yAxis: 1,
          data: valveOpeningPercentageOverTimeData,
        },
      ],
    };
  }, [
    injectionVolumeOverTimeData,
    valveOpeningPercentageOverTimeData,
    hydrationPeriodData,
  ]);

  const fetchHistoricalData = useCallback(async () => {
    try {
      const dataSize = injectionVolumeOverTimeData.length;

      const response = await axiosInstance.get('/historical-data', {
        params: {
          device_id: currentDeviceId,
          ...(dataSize && {
            timestamp: format(
              new Date(injectionVolumeOverTimeData[dataSize - 1][0]),
              'MM/dd/yyyy hh:mm:ss a'
            ),
          }),
          query_limit: 10000,
        },
      });

      const injectionVolumeOverTimeChunk = [];
      const valveOpeningPercentageOverTimeChunk = [];

      response.data.data.forEach((point) => {
        const timeStamp = new Date(point.timestamp).getTime();

        if (point.is_hydration === START) {
          hydrationPeriodData.push({
            active: true,
            from: timeStamp,
            to: timeStamp,
          });
        } else if (
          hydrationPeriodData[hydrationPeriodData.length - 1]?.active
        ) {
          hydrationPeriodData[hydrationPeriodData.length - 1] = {
            ...hydrationPeriodData[hydrationPeriodData.length - 1],
            to: timeStamp,
            ...(point.is_hydration === END && { active: false }),
          };
        }
        injectionVolumeOverTimeChunk.push([
          timeStamp,
          point.gas_meter_volume_instant,
        ]);
        valveOpeningPercentageOverTimeChunk.push([
          timeStamp,
          point.gas_valve_percent_open,
        ]);
      });

      setInjectionVolumeOverTimeData(injectionVolumeOverTimeChunk);
      setValveOpeningPercentageOverTimeData(
        valveOpeningPercentageOverTimeChunk
      );
      setHydrationPeriodData(hydrationPeriodData);
    } catch (err) {
      console.error(err);
    }
  }, [
    currentDeviceId,
    injectionVolumeOverTimeData,
    hydrationPeriodData,
    axiosInstance,
  ]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchHistoricalData();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchHistoricalData]);

  return {
    options,
  };
};
