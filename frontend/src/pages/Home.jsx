import { DeviceSelect } from '@/components/home/DeviceSelect';
import { InjectionVolumeOverTimeChart } from '@/components/home/InjectionVolumeOverTimeChart';
import { useCurrentDevice } from '@/hooks/zustand/useCurrentDevice';

import NoDeviceSelected from '@/assets/decorations/no-device-selected.jpg';

export const Home = () => {

    const currentDeviceId = useCurrentDevice((state) => state.currentDeviceId);

    return (
        <div className='flex flex-col gap-10 w-full h-full p-4'>
            <DeviceSelect />
            {
                currentDeviceId ? <InjectionVolumeOverTimeChart /> : (
                    <div className='flex flex-col w-full self-center items-center justify-center prose'>
                        <img src={NoDeviceSelected} className='w-1/3' />
                        <h4 className='text-gray-500 my-0'>Please select a Device to Continue...</h4>
                    </div>
                )
            }
        </div>
    );
};