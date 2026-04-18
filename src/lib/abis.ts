// ═══════════════════════════════════════════
// KortanaDEX ABI Registry
// Pre-parsed ABIs for production use
// ═══════════════════════════════════════════
import { parseAbi } from "viem";

// ─── Factory ───
export const FACTORY_ABI = parseAbi([
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint256)",
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
  "function allPairs(uint256) view returns (address)",
  "function allPairsLength() view returns (uint256)",
  "function createPair(address tokenA, address tokenB) returns (address pair)",
]);

// ─── Router (SwapDNR) ───
export const ROUTER_ABI = parseAbi([
  "function factory() view returns (address)",
  "function WDNR() view returns (address)",
  "function swapExactDNRForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)",
  "function swapExactTokensForDNR(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
  "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
  "function getQuote(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256)",
]);

// ─── Atomic Router ───
export const ATOMIC_ROUTER_ABI = parseAbi([
  "function WDNR() view returns (address)",
  "function swapDNRForTokens(address pair, uint256 amountOutMin, address to, uint256 deadline) payable",
  "function swapTokensForDNR(address pair, address tokenIn, uint256 amountIn, uint256 amountOutMin, address to, uint256 deadline)",
]);

// ─── Pair ───
export const PAIR_ABI = parseAbi([
  "function getReserves() view returns (uint256 reserve0, uint256 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function price0CumulativeLast() view returns (uint256)",
  "function price1CumulativeLast() view returns (uint256)",
]);

// ─── ERC20 ───
export const ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function mint(address to, uint256 amount) external",
  "function transfer(address, uint256) returns (bool)",
  "function transferFrom(address, address, uint256) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
]);

// ─── Token Factory ───
export const TOKEN_FACTORY_ABI = parseAbi([
  "event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 totalSupply)",
  "function createToken(string name, string symbol, uint8 decimals, uint256 totalSupply) returns (address tokenAddress)",
  "function getAllTokens() view returns (address[])",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function totalTokens() view returns (uint256)",
]);

// ─── Liquidity Manager ───
export const LIQUIDITY_ABI = parseAbi([
  "function addLiquidityDNR(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountDNRMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountDNR, uint256 liquidity)",
  "function factory() view returns (address)",
  "function WDNR() view returns (address)",
]);

// ─── Farming ───
export const FARM_ABI = parseAbi([
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function pendingReward(address user) view returns (uint256)",
  "function userInfo(address user) view returns (uint256 amount, uint256 rewardDebt)",
  "function totalStaked() view returns (uint256)",
  "function rewardPerBlock() view returns (uint256)",
  "function setRewardPerBlock(uint256 rewardPerBlock) external",
  "function lpToken() view returns (address)",
  "function rewardToken() view returns (address)",
]);

// ─── Stabilizer ───
export const STABILIZER_ABI = parseAbi([
  "function mint(uint256 collateralAmount, uint256 minKortusdOut) external",
  "function burn(uint256 kortusdAmount, uint256 minCollateralOut) external",
  "function collateralRatio() view returns (uint256)",
  "function totalCollateral() view returns (uint256)",
  "function mintedSupply() view returns (uint256)",
  "function stabilityFee() view returns (uint256)",
  "function collateralToken() view returns (address)",
  "function kortusd() view returns (address)",
  "function oracle() view returns (address)",
]);

// ─── Oracle ───
export const ORACLE_ABI = parseAbi([
  "function getCollateralPrice() view returns (uint256)",
  "function getKORTUSDPrice() view returns (uint256)",
  "function setManualPrices(uint256 dnrPrice, uint256 kusdPrice) external",
]);
// ─── Bridge ───
export const BRIDGE_ABI = parseAbi([
  "function lockTokens(address token, uint256 amount, uint256 destChainId, address destAddress) external payable",
  "function supportedTokens(address) view returns (bool)",
  "function bridgeFee() view returns (uint256)",
]);

// ─── MonoDEX (Native Interface) ───
export const MONODEX_ABI = parseAbi([
  "function swapExactDNRForKTUSD(uint256 minOut18, address to) payable",
  "function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to)",
  "function getQuoteDNRToKTUSD(uint256 amountIn) view returns (uint256)",
  "function getQuoteKTUSDToDNR(uint256 amountIn) view returns (uint256)",
  "function reservesDNR() view returns (uint256)",
  "function reservesKTUSD() view returns (uint256)",
]);
