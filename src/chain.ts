import { Contract, JsonRpcProvider, formatUnits } from 'ethers'
import { CHAIN_CONFIG } from './config'
import type { ChainMetric } from './types'

const TOKEN_ABI = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function currentDailyEmission() view returns (uint256)',
]
const STATE_VIEW_ABI = [
  'function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
]

export const needsDeploymentConfig = () =>
  CHAIN_CONFIG.token === '0x0000000000000000000000000000000000000000' ||
  CHAIN_CONFIG.poolId === `0x${'0'.repeat(64)}`

const compact = (value: bigint, decimals = CHAIN_CONFIG.tokenDecimals) => {
  const number = Number(formatUnits(value, decimals))
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, notation: 'compact' }).format(number)
}

export async function readChainMetrics(): Promise<ChainMetric[]> {
  if (needsDeploymentConfig()) throw new Error('Add the deployed token address and pool ID in src/config.ts.')

  const provider = new JsonRpcProvider(CHAIN_CONFIG.rpcUrl, CHAIN_CONFIG.chainId, { staticNetwork: true })
  const network = await provider.getNetwork()
  if (Number(network.chainId) !== CHAIN_CONFIG.chainId) throw new Error(`RPC returned chain ${network.chainId}.`)

  const token = new Contract(CHAIN_CONFIG.token, TOKEN_ABI, provider)
  const stateView = new Contract(CHAIN_CONFIG.stateView, STATE_VIEW_ABI, provider)
  const [supply, burned, emission, slot0] = await Promise.all([
    token.totalSupply() as Promise<bigint>,
    token.balanceOf(CHAIN_CONFIG.burnAddress) as Promise<bigint>,
    token.currentDailyEmission() as Promise<bigint>,
    stateView.getSlot0(CHAIN_CONFIG.poolId) as Promise<[bigint, bigint, bigint, bigint]>,
  ])

  const ratio = (Number(slot0[0]) / 2 ** 96) ** 2
  const rawPrice = CHAIN_CONFIG.tokenIsCurrency0 ? ratio : 1 / ratio
  const price = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(rawPrice)

  return [
    { label: 'Total Supply', value: compact(supply), detail: '$UP minted' },
    { label: 'Total Burned', value: compact(burned), detail: '$UP at burn address' },
    { label: 'Daily Emission', value: compact(emission), detail: 'current epoch' },
    { label: 'UPTIME / ETH', value: price, detail: 'StateView spot price' },
  ]
}
