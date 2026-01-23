import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend as ChartLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, ChartLegend);

interface DonutChartProps {
    title: string;
    centerLabel: string;
    totalAmount: number;
    data: { name: string; value: number; color: string }[];
}

export const DonutChart = ({ title, centerLabel, totalAmount, data }: DonutChartProps) => {
    const [activeItem, setActiveItem] = React.useState<{ name: string; value: number; color: string } | null>(null);

    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                data: data.map(d => d.value),
                backgroundColor: data.map(d => d.color),
                borderWidth: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false, // We use a custom legend
            },
            tooltip: {
                enabled: false, // Disable default tooltip to prevent overlap
            }
        },
        cutout: '65%', // Create donut hole
        maintainAspectRatio: false,
        onHover: (event: any, elements: any[]) => {
            if (elements && elements.length > 0) {
                const index = elements[0].index;
                setActiveItem(data[index]);
            } else {
                setActiveItem(null);
            }
        },
    };

    return (
        <div className="flex flex-col items-center w-full">
            <h3 className="text-lg font-bold mb-6 text-slate-700">{title}</h3>

            <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8">
                {/* Chart Container */}
                <div className="relative h-64 w-64">
                    <Doughnut data={chartData} options={options} />

                    {/* Center Text Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-xl font-bold text-slate-500 mb-1">
                            {activeItem ? activeItem.name : centerLabel}
                        </div>
                        <div
                            className={`text-lg font-bold ${activeItem ? '' : 'text-slate-900'}`}
                            style={{ color: activeItem ? activeItem.color : undefined }}
                        >
                            {activeItem ? `${activeItem.value.toLocaleString()}円` : `${totalAmount.toLocaleString()}円`}
                        </div>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm min-w-[200px]">
                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    ></span>
                                    <span className="text-slate-600 font-medium">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700">
                                        {totalAmount > 0 ? Math.round((item.value / totalAmount) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
