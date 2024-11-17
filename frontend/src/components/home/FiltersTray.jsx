import { MachineSelect } from '@/components/home/MachineSelect';
import { VisualizationModeToogle } from '@/components/home/VisualizationModeToggle';

export const FiltersTray = () => {
    return (
        <div className='flex flex-row items-center justify-center gap-3 h-14 w-full px-3'>
            <MachineSelect />
            <VisualizationModeToogle />
        </div>
    );
};