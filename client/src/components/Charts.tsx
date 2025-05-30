import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';

interface LineChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension?: number;
      fill?: boolean;
    }>;
  };
  options?: any;
  className?: string;
}

export function LineChart({ data, options = {}, className = "" }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        },
        ...options
      }
    };

    chartRef.current = new Chart(canvasRef.current, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, options]);

  return <canvas ref={canvasRef} className={className} />;
}

interface DoughnutChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
  options?: any;
  className?: string;
}

export function DoughnutChart({ data, options = {}, className = "" }: DoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        ...options
      }
    };

    chartRef.current = new Chart(canvasRef.current, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, options]);

  return <canvas ref={canvasRef} className={className} />;
}
