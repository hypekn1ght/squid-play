import { Squid, TokenData, ChainData, ChainName } from "@0xsquid/sdk";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

(async () => {

  //************ WATCH OUT QUOTE ONLY */
  const quoteOnly = false;
  const integratorID = "none"; //"trustwallet-api"
  const nativeSwap = true;
  //************ WATCH OUT QUOTE ONLY */
  
  // instantiate the SDK
  const squid = new Squid({
    baseUrl: "https://squid-api-git-main-cosmos-mainnet-0xsquid.vercel.app", // for mainnet use "https://api.0xsquid.com" "https://testnet.api.squidrouter.com"
    integratorId: integratorID
  });

  // squid.setConfig({
  //   baseUrl: "https://api.0xsquid.com", // for mainnet use "https://testnet.api.squidrouter.com"
  //   integratorId: "your-integrator-id"
  // });

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

  const sourceChain = squid.chains.find(
    c =>
      c.chainName === ChainName.MOONBEAM
  );
  console.log(`source chain : ${sourceChain?.chainName} , ${sourceChain?.chainId}`);

  const sourceToken = squid.tokens.find(
    t => 
      t.chainId == sourceChain?.chainId &&
      t.symbol === "WAVAX"
  )
  if (nativeSwap) {
    console.log("native swap")
  } else {
    console.log(`source token : ${sourceToken?.symbol} at ${sourceToken?.address}`);
  }
  
  const destChain = squid.chains.find(
    c =>
      c.chainName === ChainName.ARBITRUM
  );
  console.log(`destination chain : ${destChain?.chainName} , ${destChain?.chainId}`);

  const destToken = squid.tokens.find(
    t => 
      t.chainId == destChain?.chainId &&
      t.symbol === "WGLMR"
  );

  if (nativeSwap) {
    console.log("native swap")
  } else {
    console.log(`destination token : ${destToken?.symbol} at ${destToken?.address}`);
  }
  const params = {
    fromChain: sourceChain!.chainId, // avalanche
    fromToken: nativeSwap ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : sourceToken!.address, // native : 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
    fromAmount: "30000000000000000000", //60 glmr 
    toChain: destChain!.chainId, // 
    toToken: nativeSwap ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : destToken!.address, // native : 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
    toAddress: "0xE5ebC33267Dda14a1eEFf4d09eaEAF8032f8F188", // the recipient of the trade
    slippage: 1.00, // 1.00 = 1% max slippage across the entire route
    enableForecall: true, // instant execution service, defaults to true
    quoteOnly: quoteOnly, // optional, defaults to false
    collectFees: {
      integratorAddress: "0xE5ebC33267Dda14a1eEFf4d09eaEAF8032f8F188",
      fee: 10
    }
  };
  console.log("starting route gen")
  const { route } = await squid.getRoute(params);
  console.log(`fees: ${JSON.stringify(route.estimate.feeCosts, null, 2)}`);

  console.log(route.estimate.toAmount);

  if (!quoteOnly) {
    // console.log(`token found: ${JSON.stringify(fromToken, null, 2)}`)
    const PK = process.env.PRIVATE_KEY!;
    const provider = new ethers.providers.JsonRpcProvider(sourceChain?.rpc);
    const signer = new ethers.Wallet(PK, provider);
    const tx = (await squid.executeRoute({
      signer,
      route,
    })) as ethers.providers.TransactionResponse;
    const txReceipt = await tx.wait();

    const axelarScanLink =
      "https://axelarscan.io/gmp/" + txReceipt.transactionHash;
    console.log(
      "Finished! Please check Axelarscan for more details: ",
      axelarScanLink,
      "\n"
    );
  }

})();