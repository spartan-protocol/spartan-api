import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { abis, addr, getRPC, weiToUnit } from "../../../utils";

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

    let awaitArray = [];
    awaitArray.push(ssutilsContract.getTotalSupply()); // Total Supply minus burned

    awaitArray = await Promise.all(awaitArray);

    const supply = awaitArray[0].toString(); // Total Supply minus burned

    res.status(200).json(weiToUnit(supply).toNumber());
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
  }
};
