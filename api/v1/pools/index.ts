import { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";
import axios from "axios";
import BigNumber from "bignumber.js";
import { abis, addr, getRPC, subgraphUrl, weiToUnit } from "../../../utils";
import { ethers } from "ethers";

export type TopPoolsQuery = {
  token0: { id: string };
};

type PoolRes = {
  [key: string]: {
    ticker_id: string;
    pool_address: string;
    base_id: string;
    base_name: string;
    base_symbol: string;
    quote_id: string;
    quote_name: string;
    quote_symbol: string;
    last_price: BigNumber;
    last_price_quote: BigNumber;
    last_price_usd: BigNumber;
    volume: BigNumber;
    volume_quote: BigNumber;
    volume_usd: BigNumber;
    liquidity_usd: BigNumber;
    depth_two_pc_plus_quote: BigNumber;
    depth_two_pc_plus_usd: BigNumber;
    depth_two_pc_minus_base: BigNumber;
    depth_two_pc_minus_usd: BigNumber;
    swapUrl: string;
  };
};

type PoolsShape = {
  [key: string]: {
    ticker_id: string;
    poolAddr: string;
    base_id: string;
    base_name: string;
    base_symbol: string;
    quote_id: string;
    quote_name: string;
    quote_symbol: string;
    last_price: BigNumber;
    last_price_quote: BigNumber;
    last_price_usd: BigNumber;
    volume: BigNumber;
    volume_quote: BigNumber;
    volume_usd: BigNumber;
    liquidity_usd: BigNumber;
    depth_two_pc_plus_quote: BigNumber;
    depth_two_pc_plus_usd: BigNumber;
    depth_two_pc_minus_base: BigNumber;
    depth_two_pc_minus_usd: BigNumber;
    swapUrl: string;
  };
};

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

  let spartaPrice: string;
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpc.url); // Get provider via RPC
    const ssutilsContract = new ethers.Contract(
      addr.ssutils,
      abis.ssutils,
      provider
    ); // Get SpartanSwap Utils contract
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

  const topPoolsQuery = `
  query {
    pools(orderBy: baseAmount, orderDirection: desc, first: 10) {
      token0 {id}
    }
  }
`;

  let topPools: TopPoolsQuery[] = await kv.get<TopPoolsQuery[]>("topPools");
  if (!topPools) {
    try {
      const response = await axios({
        url: subgraphUrl,
        method: "post",
        headers: { "content-type": "application/json" },
        data: {
          operationName: "pools",
          query: topPoolsQuery,
          variables: {},
        },
      });
      if (response.data.errors) {
        throw new Error(
          response.data.errors[0]?.message || "Error fetching top pools"
        );
      }
      topPools = response.data.data.pools;
      await kv.set("topPools", topPools, { ex: 60 }); // TODO:set to 21600
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

  // 500 because this should never happen
  if (!topPools || topPools.length === 0) {
    res.status(500).json({
      error: {
        code: 500,
        message: "No pools found",
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

  let awaitArray: Promise<PoolRes>[] = topPools.map((pool) => {
    const url = `${hostname}/api/v1/pool?address=${pool.token0.id}&rpcUrl=${rpc.url}&spartaPrice=${spartaPrice}`;
    return axios.get(url);
  });

  let newPoolsData: PoolRes[];
  let reducedPoolsData: PoolsShape;
  try {
    newPoolsData = await Promise.all(awaitArray);
    const transformedArray = newPoolsData.map((pool) => {
      const key = Object.keys(pool.data)[0];
      const { ticker_id, pool_address, ...rest } = pool.data[key];
      return {
        [key]: {
          ticker_id,
          poolAddr: pool_address,
          ...rest,
        },
      };
    });

    reducedPoolsData = transformedArray.reduce((accumulator, current) => {
      return { ...accumulator, ...current };
    }, {});
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
    return;
  }

  if (!newPoolsData || newPoolsData.length === 0) {
    res.status(500).json({
      error: {
        code: 500,
        message: "No pools found",
      },
    });
    return;
  }

  // Set the Cache-Control header to cache the response for 15 minutes for clients & CDNs
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate"); // TODO: set to 900
  res.status(200).json(reducedPoolsData);
};
