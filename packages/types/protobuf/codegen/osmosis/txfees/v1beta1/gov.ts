//@ts-nocheck
import { FeeToken, FeeTokenAmino, FeeTokenSDKType } from "./feetoken";
import { BinaryReader, BinaryWriter } from "../../../binary";
/**
 * UpdateFeeTokenProposal is a gov Content type for adding new whitelisted fee
 * token(s). It must specify a denom along with gamm pool ID to use as a spot
 * price calculator. It can be used to add new denoms to the whitelist. It can
 * also be used to update the Pool to associate with the denom. If Pool ID is
 * set to 0, it will remove the denom from the whitelisted set.
 */
export interface UpdateFeeTokenProposal {
  $typeUrl?: "/osmosis.txfees.v1beta1.UpdateFeeTokenProposal";
  title: string;
  description: string;
  feetokens: FeeToken[];
}
export interface UpdateFeeTokenProposalProtoMsg {
  typeUrl: "/osmosis.txfees.v1beta1.UpdateFeeTokenProposal";
  value: Uint8Array;
}
/**
 * UpdateFeeTokenProposal is a gov Content type for adding new whitelisted fee
 * token(s). It must specify a denom along with gamm pool ID to use as a spot
 * price calculator. It can be used to add new denoms to the whitelist. It can
 * also be used to update the Pool to associate with the denom. If Pool ID is
 * set to 0, it will remove the denom from the whitelisted set.
 */
export interface UpdateFeeTokenProposalAmino {
  title?: string;
  description?: string;
  feetokens?: FeeTokenAmino[];
}
export interface UpdateFeeTokenProposalAminoMsg {
  type: "osmosis/UpdateFeeTokenProposal";
  value: UpdateFeeTokenProposalAmino;
}
/**
 * UpdateFeeTokenProposal is a gov Content type for adding new whitelisted fee
 * token(s). It must specify a denom along with gamm pool ID to use as a spot
 * price calculator. It can be used to add new denoms to the whitelist. It can
 * also be used to update the Pool to associate with the denom. If Pool ID is
 * set to 0, it will remove the denom from the whitelisted set.
 */
export interface UpdateFeeTokenProposalSDKType {
  $typeUrl?: "/osmosis.txfees.v1beta1.UpdateFeeTokenProposal";
  title: string;
  description: string;
  feetokens: FeeTokenSDKType[];
}
function createBaseUpdateFeeTokenProposal(): UpdateFeeTokenProposal {
  return {
    $typeUrl: "/osmosis.txfees.v1beta1.UpdateFeeTokenProposal",
    title: "",
    description: "",
    feetokens: []
  };
}
export const UpdateFeeTokenProposal = {
  typeUrl: "/osmosis.txfees.v1beta1.UpdateFeeTokenProposal",
  encode(message: UpdateFeeTokenProposal, writer: BinaryWriter = BinaryWriter.create()): BinaryWriter {
    if (message.title !== "") {
      writer.uint32(10).string(message.title);
    }
    if (message.description !== "") {
      writer.uint32(18).string(message.description);
    }
    for (const v of message.feetokens) {
      FeeToken.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },
  decode(input: BinaryReader | Uint8Array, length?: number, useInterfaces: boolean = false): UpdateFeeTokenProposal {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateFeeTokenProposal();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.title = reader.string();
          break;
        case 2:
          message.description = reader.string();
          break;
        case 3:
          message.feetokens.push(FeeToken.decode(reader, reader.uint32(), useInterfaces));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromPartial(object: Partial<UpdateFeeTokenProposal>): UpdateFeeTokenProposal {
    const message = createBaseUpdateFeeTokenProposal();
    message.title = object.title ?? "";
    message.description = object.description ?? "";
    message.feetokens = object.feetokens?.map(e => FeeToken.fromPartial(e)) || [];
    return message;
  },
  fromAmino(object: UpdateFeeTokenProposalAmino): UpdateFeeTokenProposal {
    const message = createBaseUpdateFeeTokenProposal();
    if (object.title !== undefined && object.title !== null) {
      message.title = object.title;
    }
    if (object.description !== undefined && object.description !== null) {
      message.description = object.description;
    }
    message.feetokens = object.feetokens?.map(e => FeeToken.fromAmino(e)) || [];
    return message;
  },
  toAmino(message: UpdateFeeTokenProposal, useInterfaces: boolean = false): UpdateFeeTokenProposalAmino {
    const obj: any = {};
    obj.title = message.title === "" ? undefined : message.title;
    obj.description = message.description === "" ? undefined : message.description;
    if (message.feetokens) {
      obj.feetokens = message.feetokens.map(e => e ? FeeToken.toAmino(e, useInterfaces) : undefined);
    } else {
      obj.feetokens = message.feetokens;
    }
    return obj;
  },
  fromAminoMsg(object: UpdateFeeTokenProposalAminoMsg): UpdateFeeTokenProposal {
    return UpdateFeeTokenProposal.fromAmino(object.value);
  },
  toAminoMsg(message: UpdateFeeTokenProposal, useInterfaces: boolean = false): UpdateFeeTokenProposalAminoMsg {
    return {
      type: "osmosis/UpdateFeeTokenProposal",
      value: UpdateFeeTokenProposal.toAmino(message, useInterfaces)
    };
  },
  fromProtoMsg(message: UpdateFeeTokenProposalProtoMsg, useInterfaces: boolean = false): UpdateFeeTokenProposal {
    return UpdateFeeTokenProposal.decode(message.value, undefined, useInterfaces);
  },
  toProto(message: UpdateFeeTokenProposal): Uint8Array {
    return UpdateFeeTokenProposal.encode(message).finish();
  },
  toProtoMsg(message: UpdateFeeTokenProposal): UpdateFeeTokenProposalProtoMsg {
    return {
      typeUrl: "/osmosis.txfees.v1beta1.UpdateFeeTokenProposal",
      value: UpdateFeeTokenProposal.encode(message).finish()
    };
  }
};