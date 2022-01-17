import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { abis, addr, BN, rpcs, weiToUnit } from "../../../utils";

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

  awaitArray = await Promise.all(awaitArray);

  const supply = awaitArray[0].toString(); // Raw Supply
  const burned = awaitArray[1].toString(); // Dead/burned supply
  const reserve = awaitArray[2].toString(); // Reserve supply

  const totalSupply = BN(supply).minus(burned);
  const circulatingSupply = BN(totalSupply).minus(reserve);

  res
    .status(200)
    .json({
      totalSupply: weiToUnit(totalSupply).toNumber(),
      circulatingSupply: weiToUnit(circulatingSupply).toNumber(),
      burned: weiToUnit(burned).toNumber(),
    });
};
