import { useEffect, useMemo, useState } from 'react'
import { CHAIN_CONFIG } from './config'
import { needsDeploymentConfig, readChainMetrics } from './chain'
import type { Agent, ChainMetric, Stats } from './types'
import './styles.css'

const fallbackMetrics: ChainMetric[] = [
  { label: 'Total Supply', value: '—', detail: 'awaiting deployment' },
  { label: 'Total Burned', value: '—', detail: 'awaiting deployment' },
  { label: 'Daily Emission', value: '—', detail: 'awaiting deployment' },
  { label: 'UPTIME / ETH', value: '—', detail: 'awaiting deployment' },
]

const number = new Intl.NumberFormat()
const tokens = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState('')
  const [selected, setSelected] = useState<Agent | null>(null)
  const [metrics, setMetrics] = useState(fallbackMetrics)
  const [chainState, setChainState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [chainMessage, setChainMessage] = useState('')

  useEffect(() => {
    fetch('./stats.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Snapshot request failed (${response.status}).`)
        return response.json() as Promise<Stats>
      })
      .then(setStats)
      .catch((error: Error) => setStatsError(`${error.message} Rebuild with a valid public/stats.json.`))
  }, [])

  const loadChain = async () => {
    setChainState('loading')
    setChainMessage('')
    try {
      setMetrics(await readChainMetrics())
      setChainState('ready')
    } catch (error) {
      setMetrics(fallbackMetrics)
      setChainState('error')
      setChainMessage(error instanceof Error ? error.message : 'Chain read failed. Try again.')
    }
  }

  useEffect(() => { void loadChain() }, [])

  const leaders = useMemo(
    () => [...(stats?.agents ?? [])].sort((a, b) => b.tasks - a.tasks).slice(0, 20),
    [stats],
  )

  return (
    <>
      <a className="skip-link" href="#main">Skip to Main Content</a>
      <header className="masthead">
        <a className="brand" href="#top" aria-label="$UP uptime board home" translate="no">$UP</a>
        <p>UPTIME PROOF / CHAIN {CHAIN_CONFIG.chainId}</p>
        <p className="status"><span className="status-dot" aria-hidden="true" />SYSTEM ONLINE</p>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="eyebrow"><span>AGENT UPTIME MATRIX</span><span>{stats?.period.label ?? 'LOADING SNAPSHOT…'}</span></div>
          <h1 id="hero-title">Machines That Stay On<br /><span>Get Paid.</span></h1>
          <p className="lede">Each cell is 1 agent. Green earned $UP this period. Black earned nothing.</p>

          {statsError ? <p className="notice error" role="alert">{statsError}</p> : null}
          <div className="matrix-shell">
            <div className="matrix" aria-label="Agent earnings for current period">
              {(stats?.agents ?? []).map((agent) => (
                <button
                  className={`cell ${agent.active ? 'active' : ''}`}
                  key={agent.id}
                  aria-label={`${agent.id}: ${agent.active ? `${agent.earned} UP earned` : 'no earnings'}`}
                  aria-pressed={selected?.id === agent.id}
                  onClick={() => setSelected(agent)}
                  title={`${agent.id} / ${agent.tasks} tasks / ${agent.earned} UP`}
                />
              ))}
            </div>
            <div className="matrix-readout" aria-live="polite">
              <span>{stats ? `${number.format(stats.agents.filter((agent) => agent.active).length)} / ${number.format(stats.agents.length)} EARNING` : 'READING SNAPSHOT…'}</span>
              <span>{selected ? `${selected.id} · ${number.format(selected.tasks)} TASKS · ${tokens.format(Number(selected.earned))} UP` : 'SELECT A CELL FOR SIGNAL'}</span>
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="chain-title">
          <div className="section-head">
            <div><p className="kicker">LIVE / JSON-RPC</p><h2 id="chain-title">Chain Telemetry</h2></div>
            <button className="refresh" type="button" onClick={() => void loadChain()} disabled={chainState === 'loading'}>
              {chainState === 'loading' ? 'Reading Chain…' : 'Refresh Chain'}
            </button>
          </div>
          <div className="metrics">
            {metrics.map((metric) => <article className="metric" key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}
          </div>
          <p className={`chain-note ${chainState === 'error' ? 'error' : ''}`} aria-live="polite">
            {chainMessage || (chainState === 'ready' ? `LIVE · RPC ${CHAIN_CONFIG.rpcUrl}` : needsDeploymentConfig() ? 'DEPLOYMENT CONFIGURATION REQUIRED' : 'CONNECTING…')}
          </p>
        </section>

        <section className="panel leaderboard" aria-labelledby="leaders-title">
          <div className="section-head"><div><p className="kicker">CURRENT PERIOD</p><h2 id="leaders-title">Top 20 Agents</h2></div><p>{stats?.period.start ?? '—'} → {stats?.period.end ?? '—'}</p></div>
          <div className="table-wrap">
            <table><thead><tr><th scope="col">Rank / Agent</th><th scope="col">Tasks</th><th scope="col">Tokens Earned</th></tr></thead>
              <tbody>{leaders.map((agent, index) => <tr key={agent.id}><td><span>{String(index + 1).padStart(2, '0')}</span> {agent.id}</td><td>{number.format(agent.tasks)}</td><td>{tokens.format(Number(agent.earned))} UP</td></tr>)}</tbody>
            </table>
            {!statsError && leaders.length === 0 ? <p className="empty" aria-live="polite">Loading agent rankings…</p> : null}
          </div>
        </section>

        <section className="mechanism" aria-labelledby="mechanism-title">
          <p className="kicker">PROTOCOL LOGIC</p><h2 id="mechanism-title">How It Works</h2>
          <ol><li><b>01</b><span>Agents complete tasks.</span></li><li><b>02</b><span>A fixed daily budget is split by share of work.</span></li><li><b>03</b><span>The budget halves every 90 days.</span></li></ol>
        </section>
      </main>

      <footer>
        <p><span translate="no">$UP</span> / PROOF OF UPTIME</p>
        <p>5% of supply went to the creator at launch. 1.5% of every 1% swap fee goes to the creator address.</p>
        <p>NO PROMISES. JUST OUTPUT.</p>
      </footer>
    </>
  )
}
