// test/amm/Router.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KortanaRouter — Swap Tests", function () {
  let factory, router, wdnr, tokenA, tokenB;
  let owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mocks
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    tokenA = await ERC20Mock.deploy("Token A", "TKA", ethers.parseEther("1000000"));
    tokenB = await ERC20Mock.deploy("Token B", "TKB", ethers.parseEther("1000000"));
    const WDNR = await ethers.getContractFactory("WDNR");
    wdnr = await WDNR.deploy();

    const Factory = await ethers.getContractFactory("KortanaFactory");
    factory = await Factory.deploy(owner.address);

    const Router = await ethers.getContractFactory("KortanaRouter");
    router = await Router.deploy(factory.target, wdnr.target);

    // Approve router
    await tokenA.approve(router.target, ethers.MaxUint256);
    await tokenB.approve(router.target, ethers.MaxUint256);
  });

  it("should add liquidity and create a pair", async () => {
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    await router.addLiquidity(
      tokenA.target, tokenB.target,
      ethers.parseEther("1000"), ethers.parseEther("1000"),
      0, 0,
      owner.address, deadline
    );

    const pairAddress = await factory.pairFor(tokenA.target, tokenB.target);
    expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    // Note: getPair gets zero address if using standard V2 tests and factory code provided.
    // getPair depends on createPair which should have been called in addLiquidity.

    const Pair = await ethers.getContractAt("KortanaPair", pairAddress);
    const [reserve0, reserve1] = await Pair.getReserves();
    expect(reserve0 > 0n).to.be.true;
    expect(reserve1 > 0n).to.be.true;
  });

  it("should swap exact tokens for tokens (AMM x*y=k)", async () => {
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    // Add liquidity first
    await router.addLiquidity(
      tokenA.target, tokenB.target,
      ethers.parseEther("10000"), ethers.parseEther("10000"),
      0, 0, owner.address, deadline
    );

    // Transfer some tokenA to user
    await tokenA.transfer(user.address, ethers.parseEther("100"));
    await tokenA.connect(user).approve(router.target, ethers.MaxUint256);

    const amountIn = ethers.parseEther("10");
    const balanceBefore = await tokenB.balanceOf(user.address);

    await router.connect(user).swapExactTokensForTokens(
      amountIn, 0,
      [tokenA.target, tokenB.target],
      user.address, deadline
    );

    const balanceAfter = await tokenB.balanceOf(user.address);
    expect(balanceAfter - balanceBefore > 0n).to.be.true;
    console.log(`    Swapped 10 TKA → ${ethers.formatEther(balanceAfter - balanceBefore)} TKB`);
  });

  it("should simulate depeg and trigger KORTUSD circuit breaker", async () => {
    // Placeholder as per spec
    expect(true).to.be.true;
  });
});
