import { useCallback, useEffect, useMemo } from 'react';
import { useCurrentDevice } from '../zustand/useCurrentDevice';
import { useAxios } from '../axios/useAxios';
import { format } from 'date-fns';

const START = 'start';
const END = 'end';

export const useInjectionVolumeOverTimeChart = () => {

    const currentDeviceId = useCurrentDevice((state) => state.currentDeviceId);
    const injectionVolumeOverTimeData = useCurrentDevice((state) => state.injectionVolumeOverTimeData);
    const valveOpeningPercentageOverTimeData = useCurrentDevice((state) => state.valveOpeningPercentageOverTimeData);
    const hydrationPeriodData = useCurrentDevice((state) => state.hydrationPeriodData);
    const setInjectionVolumeOverTimeData = useCurrentDevice((state) => state.setInjectionVolumeOverTimeData);
    const setValveOpeningPercentageOverTimeData = useCurrentDevice((state) => state.setValveOpeningPercentageOverTimeData);
    const { axiosInstance } = useAxios();

    const options = useMemo(() => {
        return {
            chart: {
                type: 'line',
                zooming: { type: 'x' }
            },
            title: { text: undefined },
            xAxis: {
                title: {
                    text: 'Time'
                },
                type: 'datetime',
                tickPixelInterval: 150,
                plotBands: []
            },
            yAxis: [
                { title: { text: 'Gas Injection Volume' } },
                {
                    title: { text: 'Valve Opening Percentage' },
                    min: 0,
                    max: 100
                }
            ],
            credits: { enabled: false },
            legend: { enabled: true },
            series: [
                {
                    name: 'Gas Injection Volume',
                    yAxis: 0,
                    data: injectionVolumeOverTimeData
                },
                {
                    name: 'Valve Opening Percentage',
                    yAxis: 1,
                    data: valveOpeningPercentageOverTimeData
                }
            ]
        };
    }, [injectionVolumeOverTimeData]);

    const mockApi = useCallback(() => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: [
                        {
                            timestamp: new Date().getTime(),
                            value1: Math.random() * 200,
                            value2: Math.random() * 100,
                            is_hydration: null
                        }
                    ]
                });
            }, 500);
        });
    });

    const fetchHistoricalData = useCallback(async () => {
        try {
            const dataSize = injectionVolumeOverTimeData.length;

            const response = await axiosInstance.get('/historical-data', {
                params: {
                    device_id: currentDeviceId,
                    ...(dataSize && { timestamp: format(new Date(injectionVolumeOverTimeData[dataSize - 1][0]), 'MM/dd/yyyy hh:mm:ss a') }),
                    query_limit: 1000
                }
            });

            const injectionVolumeOverTimeChunk = [];
            const valveOpeningPercentageOverTimeChunk = [];

            response.data.data.forEach((point) => {
                injectionVolumeOverTimeChunk.push([new Date(point.timestamp).getTime(), point.gas_meter_volume_instant]);
                valveOpeningPercentageOverTimeChunk.push([new Date(point.timestamp).getTime(), point.gas_valve_percent_open]);
                console.log(point.is_hydration);
            });

            setInjectionVolumeOverTimeData(injectionVolumeOverTimeChunk);
            setValveOpeningPercentageOverTimeData(valveOpeningPercentageOverTimeChunk);

        } catch (err) {
            console.error(err);
        }
    }, [currentDeviceId, injectionVolumeOverTimeData, axiosInstance]);


    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchHistoricalData();
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [fetchHistoricalData]);

    return {
        options
    };
};