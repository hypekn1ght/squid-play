import axios from "axios";

enum Source {
  CHAIN_REGISTRY = "chain_registry",
}

interface RPC {
  url: string;
  live: boolean;
  source: Source;
}

async function get_chains() {
  const url = "https://api.github.com/repos/cosmos/chain-registry/contents/";
}

async function rpc_check() {
  const chain = process.argv[2];
  if (!chain) {
    console.log(`chain not specified`);
    process.exit(1);
  }
  const url = `https://api.github.com/repos/cosmos/chain-registry/contents/${chain}/chain.json`;
  //   const url = `https://api.github.com/repos/cosmos/chain-registry/contents/testnets/${chain}testnet/chain.json`;
  try {
    console.log("starting fetch");
    const response = await axios.get(url, {
      headers: {
        Accept: "application/vnd.github.v3.raw",
      },
    });
    let rpcs: RPC[] = [];
    let count = 0;
    for (let rpc of response.data.apis.rpc) {
      let status = false;
      if (count == 3) break;
      try {
        await axios.get(`${rpc.address}/status?`, { timeout: 2000 });
        status = true;
        count++;
        console.log(`${rpc.address} live! ✅`);
      } catch (e) {
        console.log(`${rpc.address} errored ❌`);
      }
      const rpcInstance: RPC = {
        url: rpc.address,
        live: status,
        source: Source.CHAIN_REGISTRY,
      };
      if (rpcInstance.live) rpcs.push(rpcInstance);
    }

    console.log("fetch succesful ✅ :");
    console.dir(rpcs);
    const url2: string = rpcs[1] ? `, "${rpcs[1].url}"` : "";
    const url3: string = rpcs[2] ? `, "${rpcs[2].url}"` : "";
    console.dir(`"${rpcs[0].url}"` + url2 + url3);
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

rpc_check();
