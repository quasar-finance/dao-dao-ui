//@ts-nocheck
import { Params, ParamsAmino, ParamsSDKType } from "./params";
import { HostChain, HostChainAmino, HostChainSDKType, Deposit, DepositAmino, DepositSDKType, Unbonding, UnbondingAmino, UnbondingSDKType, UserUnbonding, UserUnbondingAmino, UserUnbondingSDKType, ValidatorUnbonding, ValidatorUnbondingAmino, ValidatorUnbondingSDKType } from "./liquidstakeibc";
import { BinaryReader, BinaryWriter } from "../../../binary";
/** GenesisState defines the liquidstakeibc module's genesis state. */
export interface GenesisState {
  params: Params | undefined;
  /** initial host chain list */
  hostChains: HostChain[];
  /** initial deposit list */
  deposits: Deposit[];
  /** initial unbondings */
  unbondings: Unbonding[];
  /** initial user unbondings */
  userUnbondings: UserUnbonding[];
  /** validator unbondings */
  validatorUnbondings: ValidatorUnbonding[];
}
export interface GenesisStateProtoMsg {
  typeUrl: "/pstake.liquidstakeibc.v1beta1.GenesisState";
  value: Uint8Array;
}
/** GenesisState defines the liquidstakeibc module's genesis state. */
export interface GenesisStateAmino {
  params?: ParamsAmino | undefined;
  /** initial host chain list */
  host_chains?: HostChainAmino[];
  /** initial deposit list */
  deposits?: DepositAmino[];
  /** initial unbondings */
  unbondings?: UnbondingAmino[];
  /** initial user unbondings */
  user_unbondings?: UserUnbondingAmino[];
  /** validator unbondings */
  validator_unbondings?: ValidatorUnbondingAmino[];
}
export interface GenesisStateAminoMsg {
  type: "/pstake.liquidstakeibc.v1beta1.GenesisState";
  value: GenesisStateAmino;
}
/** GenesisState defines the liquidstakeibc module's genesis state. */
export interface GenesisStateSDKType {
  params: ParamsSDKType | undefined;
  host_chains: HostChainSDKType[];
  deposits: DepositSDKType[];
  unbondings: UnbondingSDKType[];
  user_unbondings: UserUnbondingSDKType[];
  validator_unbondings: ValidatorUnbondingSDKType[];
}
function createBaseGenesisState(): GenesisState {
  return {
    params: Params.fromPartial({}),
    hostChains: [],
    deposits: [],
    unbondings: [],
    userUnbondings: [],
    validatorUnbondings: []
  };
}
export const GenesisState = {
  typeUrl: "/pstake.liquidstakeibc.v1beta1.GenesisState",
  encode(message: GenesisState, writer: BinaryWriter = BinaryWriter.create()): BinaryWriter {
    if (message.params !== undefined) {
      Params.encode(message.params, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.hostChains) {
      HostChain.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.deposits) {
      Deposit.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.unbondings) {
      Unbonding.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.userUnbondings) {
      UserUnbonding.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.validatorUnbondings) {
      ValidatorUnbonding.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },
  decode(input: BinaryReader | Uint8Array, length?: number, useInterfaces: boolean = false): GenesisState {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGenesisState();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.params = Params.decode(reader, reader.uint32(), useInterfaces);
          break;
        case 2:
          message.hostChains.push(HostChain.decode(reader, reader.uint32(), useInterfaces));
          break;
        case 3:
          message.deposits.push(Deposit.decode(reader, reader.uint32(), useInterfaces));
          break;
        case 4:
          message.unbondings.push(Unbonding.decode(reader, reader.uint32(), useInterfaces));
          break;
        case 5:
          message.userUnbondings.push(UserUnbonding.decode(reader, reader.uint32(), useInterfaces));
          break;
        case 6:
          message.validatorUnbondings.push(ValidatorUnbonding.decode(reader, reader.uint32(), useInterfaces));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromPartial(object: Partial<GenesisState>): GenesisState {
    const message = createBaseGenesisState();
    message.params = object.params !== undefined && object.params !== null ? Params.fromPartial(object.params) : undefined;
    message.hostChains = object.hostChains?.map(e => HostChain.fromPartial(e)) || [];
    message.deposits = object.deposits?.map(e => Deposit.fromPartial(e)) || [];
    message.unbondings = object.unbondings?.map(e => Unbonding.fromPartial(e)) || [];
    message.userUnbondings = object.userUnbondings?.map(e => UserUnbonding.fromPartial(e)) || [];
    message.validatorUnbondings = object.validatorUnbondings?.map(e => ValidatorUnbonding.fromPartial(e)) || [];
    return message;
  },
  fromAmino(object: GenesisStateAmino): GenesisState {
    const message = createBaseGenesisState();
    if (object.params !== undefined && object.params !== null) {
      message.params = Params.fromAmino(object.params);
    }
    message.hostChains = object.host_chains?.map(e => HostChain.fromAmino(e)) || [];
    message.deposits = object.deposits?.map(e => Deposit.fromAmino(e)) || [];
    message.unbondings = object.unbondings?.map(e => Unbonding.fromAmino(e)) || [];
    message.userUnbondings = object.user_unbondings?.map(e => UserUnbonding.fromAmino(e)) || [];
    message.validatorUnbondings = object.validator_unbondings?.map(e => ValidatorUnbonding.fromAmino(e)) || [];
    return message;
  },
  toAmino(message: GenesisState, useInterfaces: boolean = false): GenesisStateAmino {
    const obj: any = {};
    obj.params = message.params ? Params.toAmino(message.params, useInterfaces) : undefined;
    if (message.hostChains) {
      obj.host_chains = message.hostChains.map(e => e ? HostChain.toAmino(e, useInterfaces) : undefined);
    } else {
      obj.host_chains = message.hostChains;
    }
    if (message.deposits) {
      obj.deposits = message.deposits.map(e => e ? Deposit.toAmino(e, useInterfaces) : undefined);
    } else {
      obj.deposits = message.deposits;
    }
    if (message.unbondings) {
      obj.unbondings = message.unbondings.map(e => e ? Unbonding.toAmino(e, useInterfaces) : undefined);
    } else {
      obj.unbondings = message.unbondings;
    }
    if (message.userUnbondings) {
      obj.user_unbondings = message.userUnbondings.map(e => e ? UserUnbonding.toAmino(e, useInterfaces) : undefined);
    } else {
      obj.user_unbondings = message.userUnbondings;
    }
    if (message.validatorUnbondings) {
      obj.validator_unbondings = message.validatorUnbondings.map(e => e ? ValidatorUnbonding.toAmino(e, useInterfaces) : undefined);
    } else {
      obj.validator_unbondings = message.validatorUnbondings;
    }
    return obj;
  },
  fromAminoMsg(object: GenesisStateAminoMsg): GenesisState {
    return GenesisState.fromAmino(object.value);
  },
  fromProtoMsg(message: GenesisStateProtoMsg, useInterfaces: boolean = false): GenesisState {
    return GenesisState.decode(message.value, undefined, useInterfaces);
  },
  toProto(message: GenesisState): Uint8Array {
    return GenesisState.encode(message).finish();
  },
  toProtoMsg(message: GenesisState): GenesisStateProtoMsg {
    return {
      typeUrl: "/pstake.liquidstakeibc.v1beta1.GenesisState",
      value: GenesisState.encode(message).finish()
    };
  }
};