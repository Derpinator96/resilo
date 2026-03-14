import React from 'react';

const WokwiSimulation = () => {
    // Your specific project URL
    const wokwiUrl = "https://wokwi.com/projects/458500393804670977";

    return (
        <div className="w-full h-[500px] border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Live ESP32 Telemetry Hub</span>
                <span className="flex items-center gap-2 text-xs text-green-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    System Online
                </span>
            </div>
            <iframe
                src={wokwiUrl}
                width="100%"
                height="100%"
                title="Wokwi ESP32 Simulation"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                style={{ border: 'none' }}
            ></iframe>
        </div>
    );
};

export default WokwiSimulation;