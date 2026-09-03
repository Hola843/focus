import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";
import { Bar, Doughnut, Line, Radar } from "react-chartjs-2";
import { fmtHours, fmtMinutes } from "../lib/core";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
);

ChartJS.defaults.font.family = "'IBM Plex Sans', sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = "#8b7fa5";

const GRID = "rgba(255,255,255,0.055)";

const tooltip = {
  backgroundColor: "rgba(11,9,16,0.96)",
  borderColor: "rgba(255,255,255,0.12)",
  borderWidth: 1,
  padding: 12,
  titleColor: "#f7f4fc",
  bodyColor: "#b3a8c9",
  titleFont: { size: 12, weight: 600 as const },
  bodyFont: { size: 12 },
  boxWidth: 8,
  boxHeight: 8,
  boxPadding: 4,
  usePointStyle: true,
  cornerRadius: 10,
};

/* ---------------------------- horas por día ------------------------------- */

export function DayBars({
  labels,
  minutes,
  color = "#f2a93b",
  target,
}: {
  labels: string[];
  minutes: number[];
  color?: string;
  target?: number;
}) {
  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (c) => ` ${fmtMinutes(Number(c.parsed.y))} de estudio` } },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0 } },
        y: {
          beginAtZero: true,
          grid: { color: GRID },
          border: { display: false },
          ticks: { maxTicksLimit: 4, callback: (v) => fmtHours(Number(v)) },
        },
      },
    }),
    [],
  );

  const max = Math.max(...minutes, target ?? 0, 1);

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            data: minutes,
            backgroundColor: (ctx) => {
              const value = ctx.parsed?.y ?? 0;
              return target && value >= target ? "#37c7b0" : color;
            },
            hoverBackgroundColor: "#ffc96b",
            borderRadius: 7,
            borderSkipped: false,
            barPercentage: 0.62,
            categoryPercentage: 0.78,
          },
        ],
      }}
      options={options}
      plugins={
        target
          ? [
              {
                id: "targetLine",
                afterDatasetsDraw(chart) {
                  const { ctx, chartArea, scales } = chart;
                  const y = scales.y.getPixelForValue(Math.min(target, max));
                  ctx.save();
                  ctx.setLineDash([5, 5]);
                  ctx.strokeStyle = "rgba(247,244,252,0.35)";
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(chartArea.left, y);
                  ctx.lineTo(chartArea.right, y);
                  ctx.stroke();
                  ctx.restore();
                },
              },
            ]
          : undefined
      }
    />
  );
}

/* --------------------------- dónut de materias ---------------------------- */

export function SubjectDoughnut({
  labels,
  minutes,
  colors,
}: {
  labels: string[];
  minutes: number[];
  colors: string[];
}) {
  const options = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: (c) => {
              const total = (c.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const v = Number(c.parsed);
              return ` ${fmtMinutes(v)} · ${total ? Math.round((v / total) * 100) : 0} %`;
            },
          },
        },
      },
      animation: { animateRotate: true, duration: 900 },
    }),
    [],
  );

  return (
    <Doughnut
      data={{
        labels,
        datasets: [
          {
            data: minutes,
            backgroundColor: colors,
            borderColor: "#17141f",
            borderWidth: 3,
            hoverOffset: 10,
          },
        ],
      }}
      options={options}
    />
  );
}

/* ------------------------- líneas de tendencia ---------------------------- */

export function TrendLine({
  labels,
  series,
  unit = "minutes",
}: {
  labels: string[];
  series: { label: string; color: string; data: number[] }[];
  unit?: "minutes" | "percent";
}) {
  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: (c) =>
              unit === "percent"
                ? ` ${c.dataset.label}: ${Math.round(Number(c.parsed.y) * 100)} %`
                : ` ${c.dataset.label}: ${fmtMinutes(Number(c.parsed.y))}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, maxTicksLimit: 8 } },
        y: {
          beginAtZero: true,
          grid: { color: GRID },
          border: { display: false },
          ticks: {
            maxTicksLimit: 4,
            callback: (v) => (unit === "percent" ? `${Math.round(Number(v) * 100)}%` : fmtHours(Number(v))),
          },
        },
      },
    }),
    [unit],
  );

  return (
    <Line
      data={{
        labels,
        datasets: series.map((s) => ({
          label: s.label,
          data: s.data,
          borderColor: s.color,
          borderWidth: 2.2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: s.color,
          pointHoverBorderColor: "#121017",
          pointHoverBorderWidth: 2,
          fill: series.length === 1,
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return `${s.color}22`;
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, `${s.color}44`);
            g.addColorStop(1, `${s.color}00`);
            return g;
          },
        })),
      }}
      options={options}
    />
  );
}

/* ------------------------------ radar balance ----------------------------- */

export function BalanceRadar({ labels, data, color = "#7c93ff" }: { labels: string[]; data: number[]; color?: string }) {
  const options = useMemo<ChartOptions<"radar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (c) => ` ${fmtMinutes(Number(c.parsed.r))}` } },
      },
      scales: {
        r: {
          beginAtZero: true,
          angleLines: { color: GRID },
          grid: { color: GRID },
          pointLabels: { color: "#b3a8c9", font: { size: 11 } },
          ticks: { display: false },
        },
      },
    }),
    [],
  );

  return (
    <Radar
      data={{
        labels,
        datasets: [
          {
            data,
            borderColor: color,
            backgroundColor: `${color}28`,
            pointBackgroundColor: color,
            pointBorderColor: "#17141f",
            pointRadius: 3,
            borderWidth: 2,
          },
        ],
      }}
      options={options}
    />
  );
}


