import { create } from 'zustand';

export const ViewMode = {
    GRAPH: 'GRAPH',
    TABLE: 'TABLE'
};

export const useMachine = create((set) => ({
    // State
    machineId: '',
    visualizationMode: ViewMode.TABLE,

    // Actions
    setMachineId: (payload) => set(() => ({
        machineId: payload
    })),
    setVisualizationMode: (payload) => set(() => ({
        visualizationMode: payload
    }))
}));