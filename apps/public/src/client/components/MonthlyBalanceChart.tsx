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
        label: function (context: any) {
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
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      ticks: {
        callback: function (value: any) {
          return Math.abs(value).toLocaleString();
        }
      }
    },
  },
};

// ... imports ...

// ... imports ...

interface MonthlyBalanceChartProps {
  data: { month: string; income: number; expense: number }[];
  comparisonData?: { month: string; income: number; expense: number }[];
}

export function MonthlyBalanceChart({ data, comparisonData }: MonthlyBalanceChartProps) {
  // Extract month part for label (e.g., "2024-04" -> "04") and adding "月"
  // Assuming data is sorted and contains 12 months for fiscal year view
  const labels = data.map(d => {
    const parts = d.month.split('-');
    return parts.length === 2 ? `${Number(parts[1])}月` : d.month;
  });

  const incomeData = data.map(d => d.income);
  const expenseData = data.map(d => -Math.abs(d.expense));

  const datasets = [
    {
      label: '収入',
      data: incomeData,
      backgroundColor: 'rgba(53, 162, 235, 0.8)',
      categoryPercentage: 0.6,
      barPercentage: 0.8,
    },
    {
      label: '支出',
      data: expenseData,
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
      categoryPercentage: 0.6,
      barPercentage: 0.8,
    },
  ];

  if (comparisonData && comparisonData.length > 0) {
    const compIncome = comparisonData.map(d => d.income);
    const compExpense = comparisonData.map(d => -Math.abs(d.expense));

    datasets.push(
      {
        label: '収入 (前年)',
        data: compIncome,
        backgroundColor: 'rgba(53, 162, 235, 0.3)',
        categoryPercentage: 0.6,
        barPercentage: 0.8,
      },
      {
        label: '支出 (前年)',
        data: compExpense,
        backgroundColor: 'rgba(255, 99, 132, 0.3)',
        categoryPercentage: 0.6,
        barPercentage: 0.8,
      }
    );
  }

  const chartData = {
    labels,
    datasets,
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Bar options={options} data={chartData} />
    </div>
  );
}
