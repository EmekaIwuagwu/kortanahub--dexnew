import { Swap as SwapEvent, Sync as SyncEvent } from "../../generated/templates/KortanaPair/KortanaPair"
import { Pair, Swap } from "../../generated/schema"
import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"

export function handleSwap(event: SwapEvent): void {
  let pair = Pair.load(event.address.toHexString())
  if (pair === null) return

  let swap = new Swap(event.transaction.hash.toHexString() + "-" + event.logIndex.toString())
  swap.pair = pair.id
  swap.sender = event.params.sender
  swap.to = event.params.to
  swap.amount0In = event.params.amount0In.toBigDecimal()
  swap.amount1In = event.params.amount1In.toBigDecimal()
  swap.amount0Out = event.params.amount0Out.toBigDecimal()
  swap.amount1Out = event.params.amount1Out.toBigDecimal()
  swap.timestamp = event.block.timestamp
  swap.save()
}

export function handleSync(event: SyncEvent): void {
  let pair = Pair.load(event.address.toHexString())
  if (pair === null) return

  pair.reserve0 = event.params.reserve0.toBigDecimal()
  pair.reserve1 = event.params.reserve1.toBigDecimal()
  pair.save()
}
