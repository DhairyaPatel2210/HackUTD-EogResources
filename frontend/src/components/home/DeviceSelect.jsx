import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/Select';
import { useDeviceSelect } from '@/hooks/home/useDeviceSelect';

export const DeviceSelect = () => {

    const { currentDeviceId, devices, onValueChange } = useDeviceSelect();

    return (
        <Select
            value={currentDeviceId}
            onValueChange={onValueChange}
        >
            <SelectTrigger className='w-fit'>
                <SelectValue placeholder='Select Device' />
            </SelectTrigger>
            <SelectContent>
                {
                    devices.map((device) => (
                        <SelectItem
                            key={device.device_id}
                            value={device.device_id}
                        >
                            {device.device_id}
                        </SelectItem>
                    ))
                }
            </SelectContent>
        </Select>
    );
};