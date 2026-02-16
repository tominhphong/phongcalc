import { Chart, DoughnutController, ArcElement, Tooltip, Legend, LineController, LineElement, PointElement, CategoryScale, LinearScale, BarController, BarElement, Filler } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, LineController, LineElement, PointElement, CategoryScale, LinearScale, BarController, BarElement, Filler);

const COLORS = {
    primary: '#4f8cff',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    accent: '#a78bfa',
    dim: '#555577',
};

let activeCharts: Map<string, Chart> = new Map();

function destroyChart(id: string) {
    const existing = activeCharts.get(id);
    if (existing) {
        existing.destroy();
        activeCharts.delete(id);
    }
}

export function createDonut(
    canvasId: string,
    labels: string[],
    data: number[],
    colors?: string[],
    centerText?: string
): Chart {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas ${canvasId} not found`);

    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors || [COLORS.primary, COLORS.warning, COLORS.success, COLORS.accent, COLORS.danger, COLORS.dim],
                borderWidth: 0,
                hoverOffset: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1a30',
                    titleColor: '#e8e8f0',
                    bodyColor: '#aaaacc',
                    borderColor: 'rgba(79,140,255,0.2)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: 'Inter', weight: '600' as const },
                    bodyFont: { family: 'Inter' },
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.parsed;
                            return ` $${val.toLocaleString()}`;
                        }
                    }
                },
            },
        },
        plugins: centerText ? [{
            id: 'centerText',
            beforeDraw(chart) {
                const { ctx, width, height } = chart;
                ctx.save();
                ctx.font = '700 20px Inter';
                ctx.fillStyle = '#e8e8f0';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(centerText!, width / 2, height / 2);
                ctx.restore();
            }
        }] : [],
    });

    activeCharts.set(canvasId, chart);
    return chart;
}

export function createLine(
    canvasId: string,
    labels: string[],
    datasets: { label: string; data: number[]; color: string; fill?: boolean }[],
    yLabel?: string
): Chart {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas ${canvasId} not found`);

    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                borderColor: ds.color,
                backgroundColor: ds.fill ? ds.color.replace(')', ',0.1)').replace('rgb', 'rgba') : 'transparent',
                fill: ds.fill || false,
                tension: 0.3,
                borderWidth: 2.5,
                pointRadius: 3,
                pointBackgroundColor: ds.color,
                pointHoverRadius: 5,
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' as const },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#8888a0', font: { family: 'Inter', size: 11 } },
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: {
                        color: '#8888a0',
                        font: { family: 'Inter', size: 11 },
                        callback: (v) => '$' + Number(v).toLocaleString(),
                    },
                    title: yLabel ? { display: true, text: yLabel, color: '#8888a0', font: { family: 'Inter', size: 11 } } : undefined,
                },
            },
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: { color: '#aaaacc', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyle: 'circle' },
                },
                tooltip: {
                    backgroundColor: '#1a1a30',
                    titleColor: '#e8e8f0',
                    bodyColor: '#aaaacc',
                    borderColor: 'rgba(79,140,255,0.2)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
                    },
                },
            },
        },
    });

    activeCharts.set(canvasId, chart);
    return chart;
}

export function createBar(
    canvasId: string,
    labels: string[],
    datasets: { label: string; data: number[]; color: string }[]
): Chart {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas ${canvasId} not found`);

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: ds.color,
                borderRadius: 6,
                borderSkipped: false,
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#8888a0', font: { family: 'Inter', size: 11 } },
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: {
                        color: '#8888a0',
                        font: { family: 'Inter', size: 11 },
                        callback: (v) => '$' + Number(v).toLocaleString(),
                    },
                },
            },
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: { color: '#aaaacc', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyle: 'circle' },
                },
                tooltip: {
                    backgroundColor: '#1a1a30',
                    titleColor: '#e8e8f0',
                    bodyColor: '#aaaacc',
                    borderColor: 'rgba(79,140,255,0.2)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                },
            },
        },
    });

    activeCharts.set(canvasId, chart);
    return chart;
}
