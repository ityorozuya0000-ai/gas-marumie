import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  plugins: {
    title: {
      display: true,
      text: '月次収支チャート',
    },
    tooltip: {
        callbacks: {
            label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += Math.abs(context.parsed.y).toLocaleString() + ' 円';
                }
                return label;
            }
        }
    }
  },
  responsive: true,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      ticks: {
          callback: function(value: any) {
              return Math.abs(value).toLocaleString();
          }
      }
    },
  },
};

// ... imports ...

interface MonthlyBalanceChartProps {
  data: { month: string; income: number; expense: number }[];
}

export function MonthlyBalanceChart({ data }: MonthlyBalanceChartProps) {
  const labels = data.map(d => d.month);
  const incomeData = data.map(d => d.income);
  const expenseData = data.map(d => -Math.abs(d.expense)); // Ensure expense is negative

  const chartData = {
    labels,
    datasets: [
      {
        label: '収入',
        data: incomeData,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: '支出',
        data: expenseData,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  return <Bar options={options} data={chartData} />;
}
