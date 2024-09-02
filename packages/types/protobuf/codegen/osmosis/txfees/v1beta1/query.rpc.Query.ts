import { Rpc } from "../../../helpers";
import { BinaryReader } from "../../../binary";
import { QueryClient, createProtobufRpcClient } from "@cosmjs/stargate";
import { QueryFeeTokensRequest, QueryFeeTokensResponse, QueryDenomSpotPriceRequest, QueryDenomSpotPriceResponse, QueryDenomPoolIdRequest, QueryDenomPoolIdResponse, QueryBaseDenomRequest, QueryBaseDenomResponse, QueryEipBaseFeeRequest, QueryEipBaseFeeResponse } from "./query";
export interface Query {
  /**
   * FeeTokens returns a list of all the whitelisted fee tokens and their
   * corresponding pools. It does not include the BaseDenom, which has its own
   * query endpoint
   */
  feeTokens(request?: QueryFeeTokensRequest): Promise<QueryFeeTokensResponse>;
  /** DenomSpotPrice returns all spot prices by each registered token denom. */
  denomSpotPrice(request: QueryDenomSpotPriceRequest): Promise<QueryDenomSpotPriceResponse>;
  /** Returns the poolID for a specified denom input. */
  denomPoolId(request: QueryDenomPoolIdRequest): Promise<QueryDenomPoolIdResponse>;
  /** Returns a list of all base denom tokens and their corresponding pools. */
  baseDenom(request?: QueryBaseDenomRequest): Promise<QueryBaseDenomResponse>;
  /** Returns a list of all base denom tokens and their corresponding pools. */
  getEipBaseFee(request?: QueryEipBaseFeeRequest): Promise<QueryEipBaseFeeResponse>;
}
export class QueryClientImpl implements Query {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.feeTokens = this.feeTokens.bind(this);
    this.denomSpotPrice = this.denomSpotPrice.bind(this);
    this.denomPoolId = this.denomPoolId.bind(this);
    this.baseDenom = this.baseDenom.bind(this);
    this.getEipBaseFee = this.getEipBaseFee.bind(this);
  }
  feeTokens(request: QueryFeeTokensRequest = {}, useInterfaces: boolean = true): Promise<QueryFeeTokensResponse> {
    const data = QueryFeeTokensRequest.encode(request).finish();
    const promise = this.rpc.request("osmosis.txfees.v1beta1.Query", "FeeTokens", data);
    return promise.then(data => QueryFeeTokensResponse.decode(new BinaryReader(data), undefined, useInterfaces));
  }
  denomSpotPrice(request: QueryDenomSpotPriceRequest, useInterfaces: boolean = true): Promise<QueryDenomSpotPriceResponse> {
    const data = QueryDenomSpotPriceRequest.encode(request).finish();
    const promise = this.rpc.request("osmosis.txfees.v1beta1.Query", "DenomSpotPrice", data);
    return promise.then(data => QueryDenomSpotPriceResponse.decode(new BinaryReader(data), undefined, useInterfaces));
  }
  denomPoolId(request: QueryDenomPoolIdRequest, useInterfaces: boolean = true): Promise<QueryDenomPoolIdResponse> {
    const data = QueryDenomPoolIdRequest.encode(request).finish();
    const promise = this.rpc.request("osmosis.txfees.v1beta1.Query", "DenomPoolId", data);
    return promise.then(data => QueryDenomPoolIdResponse.decode(new BinaryReader(data), undefined, useInterfaces));
  }
  baseDenom(request: QueryBaseDenomRequest = {}, useInterfaces: boolean = true): Promise<QueryBaseDenomResponse> {
    const data = QueryBaseDenomRequest.encode(request).finish();
    const promise = this.rpc.request("osmosis.txfees.v1beta1.Query", "BaseDenom", data);
    return promise.then(data => QueryBaseDenomResponse.decode(new BinaryReader(data), undefined, useInterfaces));
  }
  getEipBaseFee(request: QueryEipBaseFeeRequest = {}, useInterfaces: boolean = true): Promise<QueryEipBaseFeeResponse> {
    const data = QueryEipBaseFeeRequest.encode(request).finish();
    const promise = this.rpc.request("osmosis.txfees.v1beta1.Query", "GetEipBaseFee", data);
    return promise.then(data => QueryEipBaseFeeResponse.decode(new BinaryReader(data), undefined, useInterfaces));
  }
}
export const createRpcQueryExtension = (base: QueryClient) => {
  const rpc = createProtobufRpcClient(base);
  const queryService = new QueryClientImpl(rpc);
  return {
    feeTokens(request?: QueryFeeTokensRequest, useInterfaces: boolean = true): Promise<QueryFeeTokensResponse> {
      return queryService.feeTokens(request, useInterfaces);
    },
    denomSpotPrice(request: QueryDenomSpotPriceRequest, useInterfaces: boolean = true): Promise<QueryDenomSpotPriceResponse> {
      return queryService.denomSpotPrice(request, useInterfaces);
    },
    denomPoolId(request: QueryDenomPoolIdRequest, useInterfaces: boolean = true): Promise<QueryDenomPoolIdResponse> {
      return queryService.denomPoolId(request, useInterfaces);
    },
    baseDenom(request?: QueryBaseDenomRequest, useInterfaces: boolean = true): Promise<QueryBaseDenomResponse> {
      return queryService.baseDenom(request, useInterfaces);
    },
    getEipBaseFee(request?: QueryEipBaseFeeRequest, useInterfaces: boolean = true): Promise<QueryEipBaseFeeResponse> {
      return queryService.getEipBaseFee(request, useInterfaces);
    }
  };
};