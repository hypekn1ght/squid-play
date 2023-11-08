import axios from "axios";
import os from "os";
import fs from "fs";

import { Squid, TokenData, ChainData, ChainName } from "@0xsquid/sdk";

interface v1Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  coingeckoId: string;
  commonKey: string;
}

interface AssetDetail {
  assetSymbol: string;
  assetName: string;
  minDepositAmt: number;
  ibcDenom: string;
  fullDenomPath: string;
  tokenAddress: string;
  mintLimit: number;
}

interface ChainAliases {
  [key: string]: AssetDetail
}

interface Asset {
  id: string;
  common_key: {
    devnet: string;
    testnet: string;
    mainnet: string;
  };
  native_chain: string;
  fully_supported: boolean;
  decimals: number;
  wrapped_erc20: string;
  is_gas_token: boolean;
  gas_token_id: string;
  chain_aliases: ChainAliases;
} 

interface AssetResponse {
  [key: string]: Asset
}

let homeDir = os.homedir();

async function commonKeyCheck() {
  const assetUrl = `https://axelar-mainnet.s3.us-east-2.amazonaws.com/mainnet-asset-config.json`;
  const chain = process.argv[2];
  const type = process.argv[3];
  if (!chain) {
    console.log(`chain not specified`);
    process.exit(1);
  }
  try {
    console.log("starting fetch");
    const response = await axios.get<AssetResponse>(assetUrl, {
      headers: {
        Accept: "application/json",
      },
    });
    // console.dir(response.data);
    
    for (let [,asset] of Object.entries(response.data)) {
      // console.log(`${asset.id}`);

      console.log(`🤨 checking asset : ${asset.id}`);
      // loop through all chain aliases of each AXL asset 
      const aliases = asset.chain_aliases;
      
      if (aliases[chain]) {
        const path = `${homeDir}/Documents/squid/squid-core/packages/api/src/v1/constants/tokens/mainnet/${chain}.json`;
          
        const v1File = fs.readFileSync(path);
  
        const v1Tokens = JSON.parse(v1File.toString()) as v1Token[];
        var v1TokenDetail = null;
        if (!type) {
          v1TokenDetail = v1Tokens.find(tokens => tokens.address.toLowerCase() == aliases[chain].tokenAddress.toLocaleLowerCase());
          // console.log(v1TokenDetail);
          if (!v1TokenDetail) console.log(`❌ token ${asset.id} not found on v1 ❌`)
          if (!v1TokenDetail?.commonKey) console.log(`❌ no common key ❌ chain: ${chain}, token: ${asset.id} address: ${aliases[chain].tokenAddress}`);
        } else {
          v1TokenDetail = v1Tokens.find(tokens => tokens.address == aliases[chain].ibcDenom);
          // console.log(v1TokenDetail);
          if (!v1TokenDetail) console.log(`❌ token ${asset.id} not found on v1 ❌`)
          if (!v1TokenDetail?.commonKey) console.log(`❌ no common key ❌ chain: ${chain}, token: ${asset.id} address: ${aliases[chain].ibcDenom}`);
        }
        
      } else {
        console.log(`no axl part on ${chain} ⏭️`);
      }
      // for (let [key, detail] of Object.entries(asset.chain_aliases)) {
      //   
      //   // find token detail from v1 list of tokens.
      //   const tokenDetail = v1Tokens.find((element: v1Token) => element.address == detail.tokenAddress);
      //   console.log(`token : ${tokenDetail.name} found`);
      // }
      
    }
    if (type) console.log("✨");
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

commonKeyCheck();
