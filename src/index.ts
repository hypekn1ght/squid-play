import { Squid, TokenData, ChainData, ChainName } from "@0xsquid/sdk";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";
import { DexName } from "@0xsquid/squid-types";
dotenv.config();


const ZERO_POINT_ONE = "100000000000000000";
const ONE = "1000000000000000000";

(async () => {

  //************ WATCH OUT QUOTE ONLY */
  const quoteOnly = true;
  const integratorID = "trustwallet-api"; //""
  //************ WATCH OUT QUOTE ONLY */
  
  // instantiate the SDK
  const squid = new Squid();

  const axelar = new AxelarQueryAPI({
    environment: Environment.MAINNET,
  });

  squid.setConfig({
    baseUrl: "https://squid-api-git-feat-smallamountquotes-0xsquid.vercel.app", // for mainnet use "https://squid-api-git-main-cosmos-mainnet-0xsquid.vercel.app" "https://testnet.api.squidrouter.com"
  });

  // init the SDK
  await squid.init();
  console.log("Squid inited");

  const sourceChain = squid.chains.find(
    c =>
      c.chainName === ChainName.CELO
  );
  console.log(`source chain : ${sourceChain?.chainName} , ${sourceChain?.chainId}`);
  
  const destChain = squid.chains.find(
    c =>
      c.chainName === ChainName.AVALANCHE
  );
  console.log(`destination chain : ${destChain?.chainName} , ${destChain?.chainId}`);
  const params = {
    fromChain: sourceChain!.chainId, 
    // fromToken: squid.tokens.find(
    //   t => 
    //     t.chainId == sourceChain?.chainId &&
    //     t.symbol == "axlUSDC"
    // )!.address, 
    fromToken: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    fromAmount: ZERO_POINT_ONE, // 0.1
    toChain: destChain!.chainId, // 
    // toToken: squid.tokens.find(
    //   t => 
    //     t.chainId == destChain?.chainId &&
    //     t.symbol == "cUSD"
    // )!.address, 
    toToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    toAddress: "0xE5ebC33267Dda14a1eEFf4d09eaEAF8032f8F188", // the recipient of the trade
    slippage: 1.00, // 1.00 = 1% max slippage across the entire route
    enableForecall: true, // instant execution service, defaults to true
    quoteOnly: quoteOnly, // optional, defaults to false
    prefer: [DexName.CURVE_V2]
    // collectFees: {
    //   integratorAddress: "0xE5ebC33267Dda14a1eEFf4d09eaEAF8032f8F188",
    //   fee: 10
    // }
  };
  console.log("starting route gen");
  console.log(params);
  const { route } = await squid.getRoute(params);
  console.log(`fees: ${JSON.stringify(route.estimate.feeCosts, null, 2)}`);

  console.log(route.estimate.toAmount);

  if (!quoteOnly) {
    // console.log(`token found: ${JSON.stringify(fromToken, null, 2)}`)
    const PK = process.env.PRIVATE_KEY!;
    const provider = new ethers.providers.JsonRpcProvider(sourceChain?.rpc);
    const signer = new ethers.Wallet(PK, provider);

    const overrides = {
      maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
      maxFeePerGas: ethers.utils.parseUnits("300", "gwei"),
    };
    const tx = (await squid.executeRoute({
      signer,
      route,
      overrides
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