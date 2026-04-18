import { BigInt } from "@graphprotocol/graph-ts"
import { PairCreated } from "../../generated/KortanaFactory/KortanaFactory"
import { Factory, Pair, Token } from "../../generated/schema"
import { KortanaPair } from "../../generated/templates"

export function handlePairCreated(event: PairCreated): void {
  // load factory
  let factory = Factory.load("1")
  if (factory === null) {
    factory = new Factory("1")
    factory.pairCount = BigInt.fromI32(0)
  }
  factory.pairCount = factory.pairCount.plus(BigInt.fromI32(1))
  factory.save()

  // load token0
  let token0 = Token.load(event.params.token0.toHexString())
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = "UNKNOWN"
    token0.name = "Unknown Token"
    token0.decimals = BigInt.fromI32(18)
    token0.save()
  }

  // load token1
  let token1 = Token.load(event.params.token1.toHexString())
  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = "UNKNOWN"
    token1.name = "Unknown Token"
    token1.decimals = BigInt.fromI32(18)
    token1.save()
  }

  // create pair
  let pair = new Pair(event.params.pair.toHexString())
  pair.token0 = token0.id
  pair.token1 = token1.id
  pair.reserve0 = BigInt.fromI32(0).toBigDecimal()
  pair.reserve1 = BigInt.fromI32(0).toBigDecimal()
  pair.totalSupply = BigInt.fromI32(0).toBigDecimal()
  pair.createdAtTimestamp = event.block.timestamp
  pair.createdAtBlockNumber = event.block.number
  pair.save()

  // instantiate tracking for the new pair contract
  KortanaPair.create(event.params.pair)
}
