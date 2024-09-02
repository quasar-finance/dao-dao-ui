import { Rpc } from "../../../helpers";
import { BinaryReader } from "../../../binary";
import { QueryClient, createProtobufRpcClient } from "@cosmjs/stargate";
import { QueryParamsRequest, QueryParamsResponse, GetAuthenticatorRequest, GetAuthenticatorResponse, GetAuthenticatorsRequest, GetAuthenticatorsResponse } from "./query";
/** Query defines the gRPC querier service. */
export interface Query {
  /** Parameters queries the parameters of the module. */
  params(request?: QueryParamsRequest): Promise<QueryParamsResponse>;
  getAuthenticator(request: GetAuthenticatorRequest): Promise<GetAuthenticatorResponse>;
  getAuthenticators(request: GetAuthenticatorsRequest): Promise<GetAuthenticatorsResponse>;
}
export class QueryClientImpl implements Query {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.params = this.params.bind(this);
    this.getAuthenticator = this.getAuthenticator.bind(this);
    this.getAuthenticators = this.getAuthenticators.bind(this);
  }
  params(request: QueryParamsRequest = {}, useInterfaces: boolean = true): Promise<QueryParamsResponse> {
    const data = QueryParamsRequest.encode(request).finish();
    const promise = this.rpc.request("osmosis.smartaccount.v1beta1.Query", "Params", data);
    return promise.then(data => QueryParamsResponse.decode(new BinaryReader(data), undefined, useInterfaces));
  }
  getAuthenticator(request: GetAuthenticatorRequest, useInterfaces: boolean = true): Promise<GetAuthenticatorResponse> {
    const data = GetAuthenticatorRequest.encode(request).finish();
    const promise = this.rpc.request("osmosis.smartaccount.v1beta1.Query", "GetAuthenticator", data);
    return promise.then(data => GetAuthenticatorResponse.decode(new BinaryReader(data), undefined, useInterfaces));
  }
  getAuthenticators(request: GetAuthenticatorsRequest, useInterfaces: boolean = true): Promise<GetAuthenticatorsResponse> {
    const data = GetAuthenticatorsRequest.encode(request).finish();
    const promise = this.rpc.request("osmosis.smartaccount.v1beta1.Query", "GetAuthenticators", data);
    return promise.then(data => GetAuthenticatorsResponse.decode(new BinaryReader(data), undefined, useInterfaces));
  }
}
export const createRpcQueryExtension = (base: QueryClient) => {
  const rpc = createProtobufRpcClient(base);
  const queryService = new QueryClientImpl(rpc);
  return {
    params(request?: QueryParamsRequest, useInterfaces: boolean = true): Promise<QueryParamsResponse> {
      return queryService.params(request, useInterfaces);
    },
    getAuthenticator(request: GetAuthenticatorRequest, useInterfaces: boolean = true): Promise<GetAuthenticatorResponse> {
      return queryService.getAuthenticator(request, useInterfaces);
    },
    getAuthenticators(request: GetAuthenticatorsRequest, useInterfaces: boolean = true): Promise<GetAuthenticatorsResponse> {
      return queryService.getAuthenticators(request, useInterfaces);
    }
  };
};