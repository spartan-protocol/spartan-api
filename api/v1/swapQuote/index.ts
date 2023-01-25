import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { abis, addr, getRPC, weiToUnit } from "../../../utils";

export default async (req: VercelRequest, res: VercelResponse) => {
  if (
    !req.query.inputAddr ||
    typeof req.query.inputAddr !== "string" ||
    !req.query.inputAddr.match(/^0x[0-9a-fA-F]{40}$/)
  ) {
    res.status(400).json({
      error: {
        code: 400,
        message: "Token address not valid",
      },
    });
    return;
  }

  if (
    !req.query.outputAddr ||
    typeof req.query.outputAddr !== "string" ||
    !req.query.outputAddr.match(/^0x[0-9a-fA-F]{40}$/)
  ) {
    res.status(400).json({
      error: {
        code: 400,
        message: "Token address not valid",
      },
    });
    return;
  }

  if (!req.query.inputUnits || typeof req.query.inputUnits !== "string") {
    res.status(400).json({
      error: {
        code: 400,
        message: "Input units not valid",
      },
    });
    return;
  }

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

    const swapOutput = await ssutilsContract.getSwapOutput(
      req.query.inputAddr,
      req.query.outputAddr,
      req.query.inputUnits
    );

    res.status(200).json(swapOutput.toString());
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
  }
};
