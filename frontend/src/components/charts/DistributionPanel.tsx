import { BarChartPanel } from './BarChartPanel'

export function DistributionPanel({ data }: { data: Record<string, string | number>[] }) {
  return <BarChartPanel barColor="#0F766E" data={data} />
}
