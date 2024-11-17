import { Toggle } from '@/components/ui/Toggle';
import { useMachine, ViewMode } from '@/hooks/zustand/useMachine';
import { useCallback } from 'react';

export const VisualizationModeToogle = () => {

    const visualizationMode = useMachine((state) => state.visualizationMode);
    const setVisualizationMode = useMachine((state) => state.setVisualizationMode);

    const onPressedChange = useCallback((value) => {
        setVisualizationMode(value ? ViewMode.GRAPH : ViewMode.TABLE);
    });

    return (
        <Toggle
            pressed={visualizationMode === ViewMode.GRAPH}
            onPressedChange={onPressedChange}
            variant='outline'
            className='w-32'
        >
            {
                visualizationMode === ViewMode.TABLE ? 'Table View' : 'Graph View'
            }
        </Toggle>
    );
};