import BigNumber from "bignumber.js";
import abiErc20 from "./ABIs/ERC20.json";
import abiPoolFactory from "./ABIs/PoolFactory.json";
import abiUtils from "./ABIs/Utils.json";

export const rpcs = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.defibit.io/",
  "https://bsc-dataseed1.ninicoin.io/",
  // BACKUPS BELOW
  // 'https://bsc-dataseed2.defibit.io/',
  // 'https://bsc-dataseed3.defibit.io/',
  // 'https://bsc-dataseed4.defibit.io/',
  // 'https://bsc-dataseed2.ninicoin.io/',
  // 'https://bsc-dataseed3.ninicoin.io/',
  // 'https://bsc-dataseed4.ninicoin.io/',
  // 'https://bsc-dataseed1.binance.org/',
  // 'https://bsc-dataseed2.binance.org/',
  // 'https://bsc-dataseed3.binance.org/',
  // 'https://bsc-dataseed4.binance.org/',
  // 'https://binance.ankr.com/',
];

export const addr = {
  bnb: "0x0000000000000000000000000000000000000000",
  spartav2: "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102",
  dao: "0x80531284f27d8b479aCA8dbA18fD6303B4bF1567",
  reserve: "0xe548561782c2F4f1145B654A41C47F49159913B0",
  dead: "0x000000000000000000000000000000000000dead",
  poolFactory: "0x2C577706579E08A88bd30df0Fd7A5778A707c3AD",
  utils: "0xFC7eAd29ee55EabEC54dBc38bd03852e1fF46D50",
};

export const abis = {
  erc20: abiErc20.abi,
  poolFactory: abiPoolFactory.abi,
  utils: abiUtils.abi,
};

export const BN = (string) => {
  return new BigNumber(string);
};

export const weiToUnit = (weiString) => {
  return BN(weiString).shiftedBy(-18);
};

export const subgraphAPI =
  "https://api.thegraph.com/subgraphs/name/spartan-protocol/pool-factory";
