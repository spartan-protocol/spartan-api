import { VercelRequest, VercelResponse } from "@vercel/node";
import { getAddress } from "@ethersproject/address";
import axios from "axios";
import { abis, addr, BN, getRPC, subgraphAPI, weiToUnit } from "../../../utils";
import { ethers } from "ethers";
import { kv } from "@vercel/kv";

export type PoolData = {
  pool: {
    id: string;
    token0: { id: string; symbol: string; name: string };
  };
  volRollingUSD: string;
  volRollingSPARTA: string;
  volRollingTOKEN: string;
};

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

  let hostname = req.headers.host;
  if (hostname?.includes("localhost")) {
    hostname = "http://localhost:3000";
  } else {
    hostname = `https://${hostname}`;
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(rpc.url); // Get provider via RPC
    const utilsContract = new ethers.Contract(addr.utils, abis.utils, provider); // Get UTILS contract
    const poolAddr = await utilsContract.getPool(getAddress(req.query.address));
    let spartaPrice = "0.013";

    const ssutilsContract = new ethers.Contract(
      addr.ssutils,
      abis.ssutils,
      provider
    ); // Get SpartanSwap Utils contract

    try {
      const { data } = await axios.get(
        `${hostname}/api/v1/internalPrice?rpcUrl=${rpc.url}`
      );
      spartaPrice = data;
    } catch (error) {
      res.status(500).json({
        error: {
          code: 500,
          message: "error getting SPARTA price",
        },
      });
    }

    if (poolAddr === addr.bnb) {
      res.status(400).json({
        error: {
          code: 400,
          message: "Token address not valid (dont use pool address)",
        },
      });
      return;
    }

    let baseAmount = BN("0");
    let tokenAmount = BN("0");
    let tvlUSD = BN("0");
    try {
      const poolDeets = await ssutilsContract.getPoolDetails(addr.bnb, [
        req.query.address,
      ]);
      baseAmount = BN(poolDeets[0].baseAmount.toString());
      tokenAmount = BN(poolDeets[0].tokenAmount.toString());
      tvlUSD = baseAmount.times(spartaPrice).times(2);
    } catch (error) {
      res.status(500).json({
        error: {
          code: 500,
          message: error.message,
        },
      });
      return;
    }

    const poolsQuery = `
      query {
        metricsPoolDays(first: 1, orderBy: timestamp, orderDirection: desc, where: {pool: "${poolAddr.toLowerCase()}"}) {
          pool {id, token0 {id, symbol, name}}
          volRollingUSD,
          volRollingSPARTA,
          volRollingTOKEN,
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

    // Cached result of pool data by pool address
    let pools: PoolData[] = await kv.get<PoolData[]>(poolAddr.toLowerCase());
    if (!pools) {
      try {
        const response = await axios({
          url: endpoint,
          method: "post",
          headers: headers,
          data: graphqlQuery,
        });
        pools = response.data.data.metricsPoolDays;
        await kv.set(poolAddr.toLowerCase(), pools, {
          ex: 21600, // Cache for 6 hours
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 500,
            message: error.message,
          },
        });
        return;
      }
    }

    if (!pools || pools.length === 0) {
      res.status(400).json({
        error: {
          code: 400,
          message: "No pools found",
        },
      });
      return;
    }

    const poolResult = pools.reduce((prev, current) => {
      const basePrice = baseAmount.div(tokenAmount);
      const tokenPrice = tokenAmount.div(baseAmount);
      const usdPrice = basePrice.times(spartaPrice);

      const depthTwoPcPlus = tokenAmount.div(100);
      const depthTwoPcPlusUsd = weiToUnit(depthTwoPcPlus)
        .div(tokenPrice)
        .times(spartaPrice);
      const depthTwoPcMinus = baseAmount.div(100);
      const depthTwoPcMinusUsd = weiToUnit(depthTwoPcMinus).times(spartaPrice);

      prev[`${addr.spartav2}_${getAddress(current.pool.token0.id)}`] = {
        ticker_id: "SPARTA_" + current.pool.token0.symbol,
        pool_address: getAddress(current.pool.id),
        base_id: "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102",
        base_name: "Spartan Protocol Token",
        base_symbol: "SPARTA",
        quote_id: getAddress(current.pool.token0.id),
        quote_name: current.pool.token0.name,
        quote_symbol: current.pool.token0.symbol,
        last_price: basePrice,
        last_price_quote: tokenPrice,
        last_price_usd: usdPrice,
        volume: weiToUnit(current.volRollingSPARTA),
        volume_quote: weiToUnit(current.volRollingTOKEN),
        volume_usd: weiToUnit(current.volRollingUSD),
        liquidity_usd: weiToUnit(tvlUSD),
        depth_two_pc_plus_quote: weiToUnit(depthTwoPcPlus),
        depth_two_pc_plus_usd: depthTwoPcPlusUsd,
        depth_two_pc_minus_base: weiToUnit(depthTwoPcMinus),
        depth_two_pc_minus_usd: depthTwoPcMinusUsd,
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
    return;
  }
};
