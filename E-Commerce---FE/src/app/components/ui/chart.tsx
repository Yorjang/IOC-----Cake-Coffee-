// Public API façade – re-exports from split files.
// chart-core.tsx    → ChartConfig, ChartContainer, ChartStyle, useChart
// chart-widgets.tsx → ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent

export type { ChartConfig } from "./chart-core";
export { ChartContainer, ChartStyle, useChart } from "./chart-core";
export { ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "./chart-widgets";
