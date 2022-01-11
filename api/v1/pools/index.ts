import { VercelRequest, VercelResponse } from "@vercel/node";
import { getAddress } from "@ethersproject/address";
import axios from "axios";
import { addr, BN, subgraphAPI, weiToUnit } from "../../../utils";

export default async (req: VercelRequest, res: VercelResponse) => {
  const poolsQuery = `
    query {
      pools(orderBy: baseAmount, orderDirection: desc) {
        id
        symbol
        token0 {id, symbol, name, decimals}
        totalSupply
        baseAmount
        tokenAmount
        tvlUSD
      }
    }
  `;

  const endpoint = subgraphAPI;

  const headers = {
    "content-type": "application/json",
  };

  const graphqlQuery = {
    operationName: "pools",
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
    pools = response.data.data.pools;
  } catch (error) {
    res.status(500).json({
      error: {
        code: 500,
        message: error.message,
      },
    });
  }

  let awaitArray = [];
  for (let i = 0; i < pools.length; i++) {
    const metricQuery = `
      query {
        metricsPoolDays(first: 1, orderBy: timestamp, orderDirection: desc, where: {pool: "${pools[i].id}"}) {
          volUSD
        }
      }
    `;
    const graphqlQuery1 = {
      operationName: "metricsPoolDays",
      query: metricQuery,
      variables: {},
    };
    awaitArray.push(
      axios({
        url: endpoint,
        method: "post",
        headers: headers,
        data: graphqlQuery1,
      })
    );
  }

  awaitArray = await Promise.all(awaitArray);

  for (let i = 0; i < pools.length; i++) {
    pools[i].volUSD = awaitArray[i].data.data.metricsPoolDays[0].volUSD;
  }

  const poolResult = pools.reduce((prev, current) => {
    const baseAmount = BN(current.baseAmount);
    const tokenAmount = BN(current.tokenAmount);
    const basePrice = baseAmount.div(tokenAmount);
    const usdPrice = basePrice.times(spartaPrice);

    prev[`${addr.spartav2}_${getAddress(current.token0.id)}`] = {
      poolAddr: getAddress(current.id),
      base_id: "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102",
      base_name: "Spartan Protocol Token",
      base_symbol: "SPARTA",
      quote_id: getAddress(current.token0.id),
      quote_name: current.token0.name,
      quote_symbol: current.token0.symbol,
      last_price: basePrice,
      last_price_usd: usdPrice,
      volume_usd: weiToUnit(current.volUSD),
      liquidity_usd: weiToUnit(current.tvlUSD),
      swapUrl:
        "https://dapp.spartanprotocol.org/swap?asset1=" +
        getAddress(current.token0.id) +
        "&type1=token&type2=token",
    };
    return prev;
  }, {});

  res.status(200).json(poolResult);
};
