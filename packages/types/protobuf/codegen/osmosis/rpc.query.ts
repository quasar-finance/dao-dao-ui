import { Tendermint34Client, HttpEndpoint } from "@cosmjs/tendermint-rpc";
import { QueryClient } from "@cosmjs/stargate";
export const createRPCQueryClient = async ({
  rpcEndpoint
}: {
  rpcEndpoint: string | HttpEndpoint;
}) => {
  const tmClient = await Tendermint34Client.connect(rpcEndpoint);
  const client = new QueryClient(tmClient);
  return {
    cosmos: {
      auth: {
        v1beta1: (await import("../cosmos/auth/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      authz: {
        v1beta1: (await import("../cosmos/authz/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      bank: {
        v1beta1: (await import("../cosmos/bank/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      base: {
        tendermint: {
          v1beta1: (await import("../cosmos/base/tendermint/v1beta1/query.rpc.Service")).createRpcQueryExtension(client)
        }
      },
      distribution: {
        v1beta1: (await import("../cosmos/distribution/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      feegrant: {
        v1beta1: (await import("../cosmos/feegrant/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      gov: {
        v1: (await import("../cosmos/gov/v1/query.rpc.Query")).createRpcQueryExtension(client),
        v1beta1: (await import("../cosmos/gov/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      mint: {
        v1beta1: (await import("../cosmos/mint/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      params: {
        v1beta1: (await import("../cosmos/params/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      slashing: {
        v1beta1: (await import("../cosmos/slashing/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      staking: {
        v1beta1: (await import("../cosmos/staking/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      tx: {
        v1beta1: (await import("../cosmos/tx/v1beta1/service.rpc.Service")).createRpcQueryExtension(client)
      },
      upgrade: {
        v1beta1: (await import("../cosmos/upgrade/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      }
    },
    osmosis: {
      concentratedliquidity: {
        v1beta1: (await import("./concentratedliquidity/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      cosmwasmpool: {
        v1beta1: (await import("./cosmwasmpool/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      gamm: {
        v1beta1: (await import("./gamm/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      incentives: (await import("./incentives/query.rpc.Query")).createRpcQueryExtension(client),
      lockup: (await import("./lockup/query.rpc.Query")).createRpcQueryExtension(client),
      poolincentives: {
        v1beta1: (await import("./pool-incentives/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      poolmanager: {
        v1beta1: (await import("./poolmanager/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      protorev: {
        v1beta1: (await import("./protorev/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      smartaccount: {
        v1beta1: (await import("./smartaccount/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      superfluid: (await import("./superfluid/query.rpc.Query")).createRpcQueryExtension(client),
      tokenfactory: {
        v1beta1: (await import("./tokenfactory/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      txfees: {
        v1beta1: (await import("./txfees/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      },
      valsetpref: {
        v1beta1: (await import("./valset-pref/v1beta1/query.rpc.Query")).createRpcQueryExtension(client)
      }
    }
  };
};