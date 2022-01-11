import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { abis, addr, BN, rpcs, weiToUnit } from "../../../utils";

export default async (req: VercelRequest, res: VercelResponse) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcs[0]); // Get provider via RPC
  const poolFactory = new ethers.Contract(
    addr.poolFactory,
    abis.poolFactory,
    provider
  ); // Get PoolFactory contract obj
  const spartaContract = new ethers.Contract(
    addr.spartav2,
    abis.erc20,
    provider
  ); // Get SPARTA contract obj

  const poolArray = await poolFactory.getPoolAssets()

  let awaitArray = [];
  for (let i = 0; i < poolArray.length; i++) {
    awaitArray.push(spartaContract.balanceOf(poolArray[i])); // Get pool's SPARTA balance
  }

  awaitArray = await Promise.all(awaitArray);

  let spartaTVL = BN(0);
  for (let i = 0; i < poolArray.length; i++) {
    spartaTVL = spartaTVL.plus(awaitArray[i].toString())
  }

  spartaTVL = spartaTVL.times(2);

  res.status(200).json(weiToUnit(spartaTVL).toFixed());
};