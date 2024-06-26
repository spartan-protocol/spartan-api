import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { addr, abis, weiToUnit, getRPC } from "../../../utils";

export default async (req: VercelRequest, res: VercelResponse) => {
  let rpc: { url: string; good: boolean; block?: number };
  if (typeof req.query.rpcUrl === "string") {
    rpc = { url: req.query.rpcUrl, good: true };
  } else if (
    Array.isArray(req.query.rpcUrl) &&
    typeof req.query.rpcUrl[0] === "string"
  ) {
    rpc = { url: req.query.rpcUrl[0], good: true };
  }

  if (!rpc) {
    rpc = await getRPC(); // Get good RPC url
  }
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
    const provider = new ethers.providers.JsonRpcProvider(rpc.url);
    const ssutilsContract = new ethers.Contract(
      addr.ssutils,
      abis.ssutils,
      provider
    );

    let spartaPrice = "0.01";
    try {
      spartaPrice = await ssutilsContract.getInternalPrice();
      spartaPrice = weiToUnit(spartaPrice.toString()).toString();
    } catch (error) {
      res.status(500).json({
        error: {
          code: 500,
          message: "error getting SPARTA price",
        },
      });
    }

    // Set the Cache-Control header to cache the response for 1 minute for clients & CDNs
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    res.status(200).json(spartaPrice);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
    return;
  }
};
