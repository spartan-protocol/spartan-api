import { VercelRequest, VercelResponse } from "@vercel/node";
import { getAddress } from "@ethersproject/address";
import axios from "axios";
import { abis, addr, BN, getRPC, subgraphAPI, weiToUnit } from "../../../utils";
import { ethers } from "ethers";

export default async (req: VercelRequest, res: VercelResponse) => {
  if (
    !req.query.address ||
    typeof req.query.address !== "string" ||
    !req.query.address.match(/^0x[0-9a-fA-F]{40}$/)
  ) {
    res.status(400).json({
      error: {
        code: 400,
        message: "Token address not valid (dont use pool address)",
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
    const provider = new ethers.providers.JsonRpcProvider(rpc.url); // Get provider via RPC
    const utilsContract = new ethers.Contract(addr.utils, abis.utils, provider); // Get UTILS contract
    const poolAddr = await utilsContract.getPool(getAddress(req.query.address));
    if (poolAddr === addr.bnb) {
      res.status(400).json({
        error: {
          code: 400,
          message: "Token address not valid (dont use pool address)",
        },
      });
      return;
    }
    const poolsQuery = `
      query {
        metricsPoolDays(first: 1, orderBy: timestamp, orderDirection: desc, where: {pool: "${poolAddr.toLowerCase()}"}) {
          pool {id, token0 {id, symbol, name, decimals}, baseAmount, tokenAmount, tvlUSD}
          volUSD,
          volSPARTA,
          volTOKEN,
        }
      }
    `;

    const endpoint = subgraphAPI;

    const headers = {
      "content-type": "application/json",
    };

    const graphqlQuery = {
      operationName: "metricsPoolDays",
      query: poolsQuery,
      variables: {},
    };

    const resp = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=spartan-protocol-token&vs_currencies=usd"
    );
    const spartaPrice = resp.data["spartan-protocol-token"].usd;

    let pools = [];
    try {
      const response = await axios({
        url: endpoint,
        method: "post",
        headers: headers,
        data: graphqlQuery,
      });
      pools = response.data.data.metricsPoolDays;
    } catch (error) {
      res.status(500).json({
        error: {
          code: 500,
          message: error.message,
        },
      });
    }

    const poolResult = pools.reduce((prev, current) => {
      const baseAmount = BN(current.pool.baseAmount);
      const tokenAmount = BN(current.pool.tokenAmount);
      const basePrice = baseAmount.div(tokenAmount);
      const usdPrice = basePrice.times(spartaPrice);

      prev[`${addr.spartav2}_${getAddress(current.pool.token0.id)}`] = {
        pool_address: getAddress(current.pool.id),
        base_id: "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102",
        base_name: "Spartan Protocol Token",
        base_symbol: "SPARTA",
        quote_id: getAddress(current.pool.token0.id),
        quote_name: current.pool.token0.name,
        quote_symbol: current.pool.token0.symbol,
        last_price: basePrice,
        last_price_usd: usdPrice,
        volume: weiToUnit(current.volSPARTA),
        volume_quote: weiToUnit(current.volTOKEN),
        volume_usd: weiToUnit(current.volUSD),
        liquidity_usd: weiToUnit(current.pool.tvlUSD),
        swapUrl:
          "https://dapp.spartanprotocol.org/swap?asset1=" +
          getAddress(current.pool.token0.id),
      };
      return prev;
    }, {});

    res.status(200).json(poolResult);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
  }
};
