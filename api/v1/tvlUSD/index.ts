import { BigNumber } from 'bignumber.js';
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
    const provider = new ethers.providers.StaticJsonRpcProvider(rpc.url); // simple provider unsigned & cached chainId
    const ssutilsContract = new ethers.Contract(
      addr.ssutils,
      abis.ssutils,
      provider
    ); // Get SpartanSwap Utils contract

    let awaitArray:BigNumber[] = [];
    awaitArray.push(ssutilsContract.getInternalPrice()); // Get internally derived SPARTA price
    awaitArray.push(ssutilsContract.getTVLUnbounded()); // Get total TVL in SPARTA unit value
    awaitArray = await Promise.all(awaitArray);

    const spartaPrice:string = awaitArray[0].toString();
    const tvlSparta:string = awaitArray[1].toString();

    const tvlUSD = weiToUnit(spartaPrice).times(tvlSparta);

    // Set the Cache-Control header to cache the response for 5 minutes for clients & CDNs
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json(weiToUnit(tvlUSD).toNumber());
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
  }
};
