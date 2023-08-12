import { Squid, TokenData, ChainData } from "@0xsquid/sdk";

(async () => {
  // instantiate the SDK
  const squid = new Squid({
    baseUrl: "https://testnet.api.squidrouter.com", // for mainnet use "https://api.0xsquid.com" "https://testnet.api.squidrouter.com"
    integratorId: "your-integrator-id"
  });

  squid.setConfig({
    baseUrl: "https://testnet.api.squidrouter.com", // for mainnet use "https://api.0xsquid.com"
    integratorId: "your-integrator-id"
  });

  // init the SDK
  await squid.init();
  console.log("Squid inited");

  // const tokens = squid.tokens as TokenData[]
  // const chains = squid.chains as ChainData[]

  // const fromToken = tokens.find(
  //     t => 
  //       t.symbol === "USDC" &&
  //       t.chainId === chains.find(c => c.chainName === "Ethereum")?.chainId
  // )

  // console.log(`token found: ${JSON.stringify(fromToken, null, 2)}`)

  const params = {
    fromChain: 43113, // Avalanche Fuji Testnet
    fromToken: "0x57f1c63497aee0be305b8852b354cec793da43bb", // aUSDC on Avalanche Fuji Testnet
    fromAmount: "50000000000000000", // 0.05 WETH
    toChain: 5, // Goerli testnet
    toToken: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", // WETH on Goerli
    toAddress: "0xAD3A87a43489C44f0a8A33113B2745338ae71A9D", // the recipient of the trade
    slippage: 1.00, // 1.00 = 1% max slippage across the entire route
    enableForecall: true, // instant execution service, defaults to true
    quoteOnly: true, // optional, defaults to false
    collectFees: {
      integratorAddress: "0x0x010a87dF2aE2B729DE4F8562B107DD24a549a6dF", 
      fee: 5
    }
  };
  console.log("starting route gen")
  const {route} = await squid.getRoute(params);
  console.log(`route: ${JSON.stringify(route, null, 2)}`);
})();