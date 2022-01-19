import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
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
    return
  }

  try {
    const provider = new ethers.providers.StaticJsonRpcProvider(rpc.url); // simple provider unsigned & cached chainId

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

    const poolArray = await poolFactory.getPoolAssets();

    let awaitArray = [];
    for (let i = 0; i < poolArray.length; i++) {
      awaitArray.push(spartaContract.balanceOf(poolArray[i])); // Get pool's SPARTA balance
    }

    awaitArray = await Promise.all(awaitArray);

    let spartaTVL = BN(0);
    for (let i = 0; i < poolArray.length; i++) {
      spartaTVL = spartaTVL.plus(awaitArray[i].toString());
    }

    const resp = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=spartan-protocol-token&vs_currencies=usd"
    );
    const spartaPrice = resp.data["spartan-protocol-token"].usd;

    spartaTVL = spartaTVL.times(2).times(spartaPrice);
    res.status(200).json(weiToUnit(spartaTVL).toNumber());
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
  }
};
