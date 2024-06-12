import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { abis, addr, BN, getRPC, weiToUnit } from "../../../utils";

export default async (req: VercelRequest, res: VercelResponse) => {
  const rpc = await getRPC(); // Get good RPC url
  if (!rpc || !rpc.good) {
    res.status(500).json({
      error: {
        code: 500,
        message: "No valid RPC URLs available",
      },
    });
    return;
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(rpc.url); // Get provider via RPC
    const ssutilsContract = new ethers.Contract(
      addr.ssutils,
      abis.ssutils,
      provider
    ); // Get SpartanSwap Utils contract
    const spartaContract = new ethers.Contract(
      addr.spartav2,
      abis.erc20,
      provider
    ); // Get SPARTA contract

    let awaitArray = [];
    awaitArray.push(ssutilsContract.getTotalSupply()); // Total Supply minus burned
    awaitArray.push(ssutilsContract.getCircSupply()); // Circ Supply (minus burned and reserve held)
    awaitArray.push(spartaContract.balanceOf(addr.dead)); // Dead/burned supply

    awaitArray = await Promise.all(awaitArray);

    const totalSupply = awaitArray[0].toString(); // Total Supply minus burned
    const circSupply = awaitArray[1].toString(); // Circ Supply (minus burned and reserve held)
    const burnedSupply = awaitArray[2].toString(); // Dead/burned supply

    // Set the Cache-Control header to cache the response for 15 minutes for clients & CDNs
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate");
    res.status(200).json({
      totalSupply: weiToUnit(totalSupply).toNumber(),
      circulatingSupply: weiToUnit(circSupply).toNumber(),
      burned: weiToUnit(burnedSupply).toNumber(),
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
  }
};
