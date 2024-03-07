import { VercelRequest, VercelResponse } from "@vercel/node";
import { getAddress } from "@ethersproject/address";
import axios from "axios";
import { abis, addr, BN, getRPC, subgraphAPI, weiToUnit } from "../../../utils";
import { ethers } from "ethers";

export default async (req: VercelRequest, res: VercelResponse) => {
  const poolsQuery = `
    query {
      pools(orderBy: baseAmount, orderDirection: desc, first: 20) {
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

  let spartaPrice = "0.013";
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
    const resp = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=spartan-protocol-token&vs_currencies=usd"
    );
    spartaPrice = resp.data["spartan-protocol-token"].usd;
  }

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
          volRollingUSD,
          volRollingSPARTA,
            volRollingTOKEN,
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
    if (
      awaitArray[i] &&
      awaitArray[i].data &&
      awaitArray[i].data.data &&
      awaitArray[i].data.data.metricsPoolDays &&
      awaitArray[i].data.data.metricsPoolDays[0]
    ) {
      pools[i].volRollingSPARTA =
        awaitArray[i].data.data.metricsPoolDays[0].volRollingSPARTA;
      pools[i].volRollingTOKEN =
        awaitArray[i].data.data.metricsPoolDays[0].volRollingTOKEN;
      pools[i].volRollingUSD =
        awaitArray[i].data.data.metricsPoolDays[0].volRollingUSD;
    } else {
      pools.splice(i, 1); // remove bad pool from array
    }
  }

  const poolResult = pools.reduce((prev, current) => {
    const baseAmount = BN(current.baseAmount);
    const tokenAmount = BN(current.tokenAmount);
    const basePrice = baseAmount.div(tokenAmount);
    const tokenPrice = tokenAmount.div(baseAmount);
    const usdPrice = basePrice.times(spartaPrice);

    const depthTwoPcPlus = tokenAmount.div(100);
    const depthTwoPcPlusUsd = weiToUnit(depthTwoPcPlus)
      .div(tokenPrice)
      .times(spartaPrice);
    const depthTwoPcMinus = baseAmount.div(100);
    const depthTwoPcMinusUsd = weiToUnit(depthTwoPcMinus).times(spartaPrice);

    prev[`${addr.spartav2}_${getAddress(current.token0.id)}`] = {
      ticker_id: "SPARTA_" + current.token0.symbol,
      poolAddr: getAddress(current.id),
      base_id: "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102",
      base_name: "Spartan Protocol Token",
      base_symbol: "SPARTA",
      quote_id: getAddress(current.token0.id),
      quote_name: current.token0.name,
      quote_symbol: current.token0.symbol,
      last_price: basePrice,
      last_price_quote: tokenPrice,
      last_price_usd: usdPrice,
      volume: weiToUnit(current.volRollingSPARTA),
      volume_quote: weiToUnit(current.volRollingTOKEN),
      volume_usd: weiToUnit(current.volRollingUSD),
      liquidity_usd: weiToUnit(current.tvlUSD),
      depth_two_pc_plus_quote: weiToUnit(depthTwoPcPlus),
      depth_two_pc_plus_usd: depthTwoPcPlusUsd,
      depth_two_pc_minus_base: weiToUnit(depthTwoPcMinus),
      depth_two_pc_minus_usd: depthTwoPcMinusUsd,
      swapUrl:
        "https://dapp.spartanprotocol.org/swap?asset1=" +
        getAddress(current.token0.id),
    };
    return prev;
  }, {});

  res.status(200).json(poolResult);
};
