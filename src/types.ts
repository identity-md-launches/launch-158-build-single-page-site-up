export type Agent = {
  id: string
  active: boolean
  tasks: number
  earned: string
}

export type Stats = {
  period: { start: string; end: string; label: string }
  agents: Agent[]
}

export type ChainMetric = {
  label: string
  value: string
  detail: string
}
