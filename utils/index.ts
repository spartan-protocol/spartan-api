import BigNumber from "bignumber.js";
import abiErc20 from "./ABIs/ERC20.json";

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
  spartav2: "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102",
  dao: "0x80531284f27d8b479aCA8dbA18fD6303B4bF1567",
  reserve: "0xe548561782c2F4f1145B654A41C47F49159913B0",
  dead: "0x000000000000000000000000000000000000dead",
};

export const abis = {
  erc20: abiErc20.abi,
};

export const BN = (string) => {
  return new BigNumber(string);
};

export const weiToUnit = (weiString) => {
  return BN(weiString).shiftedBy(-18);
};