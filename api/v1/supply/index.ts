import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";

import abiErc20 from "./ERC20.json";

const rpcs = [
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

const addr = {
  spartav2: "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102",
  dao: "0x80531284f27d8b479aCA8dbA18fD6303B4bF1567",
  reserve: "0xe548561782c2F4f1145B654A41C47F49159913B0",
  dead: "0x000000000000000000000000000000000000dead",
};

const abis = {
  erc20: abiErc20.abi,
};

const BN = (string) => {
  return new BigNumber(string);
};

const weiToUnit = (weiString) => {
  return BN(weiString).shiftedBy(-18);
};

export default async (req: VercelRequest, res: VercelResponse) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcs[0]); // Get provider via RPC
  const spartaContract = new ethers.Contract(
    addr.spartav2,
    abis.erc20,
    provider
  ); // Get SPARTA contract obj

  let awaitArray = [];
  awaitArray.push(spartaContract.totalSupply()); // Get raw supply
  awaitArray.push(spartaContract.balanceOf(addr.dead)); // Get dead/burned supply
  awaitArray.push(spartaContract.balanceOf(addr.reserve)); // Get reserve held supply
  awaitArray.push(spartaContract.balanceOf(addr.dao)); // Get dao held supply

  awaitArray = await Promise.all(awaitArray);

  const supply = awaitArray[0].toString(); // Raw Supply
  const burned = awaitArray[1].toString(); // Dead/burned supply
  const reserve = awaitArray[2].toString(); // Reserve supply
  const dao = awaitArray[3].toString(); // Dao supply

  const totalSupply = BN(supply).minus(burned);
  const circulatingSupply = BN(totalSupply).minus(reserve).minus(dao);

  res
    .status(200)
    .json({
      totalSupply: weiToUnit(totalSupply).toFixed(),
      circulatingSupply: weiToUnit(circulatingSupply).toFixed(),
      burned: weiToUnit(burned).toFixed(),
    });
};
