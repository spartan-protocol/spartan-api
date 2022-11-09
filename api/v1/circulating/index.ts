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
    );

    let awaitArray = [];
    awaitArray.push(ssutilsContract.getCircSupply()); // Get circulating supply of SPARTA
    // == RawTotalSupply - BurnedSupply - ReserveHeldSparta(NotYetCirculating) - SpartaUnderlyingReserveHeldLPs

    awaitArray = await Promise.all(awaitArray);

    res.status(200).json(weiToUnit(awaitArray[0].toString()).toNumber());
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
  }
};
