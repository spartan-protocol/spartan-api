import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import abiErc20 from "./ABIs/ERC20.json";
import abiPool from "./ABIs/Pool.json";
import abiPoolFactory from "./ABIs/PoolFactory.json";
import abiUtils from "./ABIs/Utils.json";
import abiSSUtils from "./ABIs/SpartanSwapUtils.json";

export const rpcs = [
  // Main RPCs
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.defibit.io/",
  "https://bsc-dataseed1.ninicoin.io/",
  // BACKUPS BELOW
  // "https://bsc-dataseed2.defibit.io/",
  // "https://bsc-dataseed3.defibit.io/",
  // "https://bsc-dataseed4.defibit.io/",
  // "https://bsc-dataseed2.ninicoin.io/",
  // "https://bsc-dataseed3.ninicoin.io/",
  // "https://bsc-dataseed4.ninicoin.io/",
  // "https://bsc-dataseed1.binance.org/",
  // "https://bsc-dataseed2.binance.org/",
  // "https://bsc-dataseed3.binance.org/",
  // "https://bsc-dataseed4.binance.org/",
  // "https://rpc.ankr.com/bsc",
  // "https://bscrpc.com",
  // "https://binance.nodereal.io",
  // ENV conditionals - Make sure conditional RPCs are not the first index of this array
  process.env.NODE_ENV === "production"
    ? "https://bsc-mainnet.nodereal.io/v1/6466b598f3ce4c7aa04b13f19fe0f359" // Permissioned to the SP domain (whitelist)
    : process.env.REACT_APP_NODEREAL_PRIVATE,
];

export const addr = {
  bnb: "0x0000000000000000000000000000000000000000",
  spartav2: "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102",
  dao: "0x80531284f27d8b479aCA8dbA18fD6303B4bF1567",
  reserve: "0xe548561782c2F4f1145B654A41C47F49159913B0",
  dead: "0x000000000000000000000000000000000000dead",
  poolFactory: "0x2C577706579E08A88bd30df0Fd7A5778A707c3AD",
  utils: "0xFC7eAd29ee55EabEC54dBc38bd03852e1fF46D50",
  ssutils: "0xB7B3216A199893aC00486Fe30439A8F4388fF4C9",
};

export const abis = {
  erc20: abiErc20.abi,
  pool: abiPool.abi,
  poolFactory: abiPoolFactory.abi,
  utils: abiUtils.abi,
  ssutils: abiSSUtils.abi,
};

export const BN = (string) => {
  return new BigNumber(string);
};

export const weiToUnit = (weiString) => {
  return BN(weiString).shiftedBy(-18);
};

export const subgraphAPI =
  "https://api.thegraph.com/subgraphs/name/spartan-protocol/pool-factory";

const checkResolved = (settledItem, errorMsg) => {
  if (settledItem.status === "fulfilled") {
    return settledItem.value;
  }
  return errorMsg;
};

const withTimeout = (millis, promise) => {
  const timeout = new Promise((resolve, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${millis} ms.`)), millis)
  );
  return Promise.race([promise, timeout]);
};

export const getRPC = async () => {
  // const provider = new ethers.providers.StaticJsonRpcProvider(rpcs[index]); // simple provider unsigned & cached chainId
  try {
    let awaitArray = [];
    for (let i = 0; i < rpcs.length; i++) {
      const provider = new ethers.providers.StaticJsonRpcProvider(rpcs[i]); // simple provider unsigned & cached chainId
      awaitArray.push(withTimeout(3000, provider.getBlockNumber()));
    }
    awaitArray = await Promise.allSettled(awaitArray);
    let _rpcs = [];
    for (let i = 0; i < rpcs.length; i++) {
      _rpcs.push({
        url: rpcs[i],
        block: checkResolved(awaitArray[i], 0),
        good: awaitArray[i].status === "fulfilled",
      });
    }
    const isEmpty = _rpcs.filter((x) => x.good === true).length <= 0;
    if (isEmpty) {
      _rpcs[0].block = 100;
      _rpcs[0].good = true;
    }
    _rpcs = _rpcs.sort((a, b) => b.block - a.block);

    return _rpcs[0];
  } catch (error) {
    return false;
  }
};
