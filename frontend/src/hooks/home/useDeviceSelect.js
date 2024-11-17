import { useCallback, useEffect, useState } from 'react';
import { useAxios } from '../axios/useAxios';
import { useCurrentDevice } from '../zustand/useCurrentDevice';

export const useDeviceSelect = () => {

    const currentDeviceId = useCurrentDevice((state) => state.currentDeviceId);
    const setCurrentDeviceId = useCurrentDevice((state) => state.setCurrentDeviceId);
    const [devices, setDevices] = useState([]);
    const { axiosInstance } = useAxios();

    const fetchDevicesList = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/user/devices');
            console.log(response);

            setDevices(response.data.devices);
            setCurrentDeviceId(response.data.devices[0].device_id);

        } catch (err) {
            console.error(err);
        }
    }, [axiosInstance]);

    const onValueChange = useCallback((value) => {
        setCurrentDeviceId(value);
    }, [setCurrentDeviceId]);

    useEffect(() => {
        fetchDevicesList();
    }, []);

    return {
        currentDeviceId,
        devices,
        onValueChange
    };
};