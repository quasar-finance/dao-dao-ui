import * as _158 from "./accum/v1beta1/accum";
import * as _159 from "./concentratedliquidity/params";
import * as _160 from "./cosmwasmpool/v1beta1/genesis";
import * as _161 from "./cosmwasmpool/v1beta1/gov";
import * as _162 from "./cosmwasmpool/v1beta1/model/instantiate_msg";
import * as _163 from "./cosmwasmpool/v1beta1/model/module_query_msg";
import * as _164 from "./cosmwasmpool/v1beta1/model/module_sudo_msg";
import * as _165 from "./cosmwasmpool/v1beta1/model/pool_query_msg";
import * as _166 from "./cosmwasmpool/v1beta1/model/pool";
import * as _167 from "./cosmwasmpool/v1beta1/model/transmuter_msgs";
import * as _168 from "./cosmwasmpool/v1beta1/model/tx";
import * as _169 from "./cosmwasmpool/v1beta1/params";
import * as _170 from "./cosmwasmpool/v1beta1/query";
import * as _171 from "./cosmwasmpool/v1beta1/tx";
import * as _172 from "./gamm/pool-models/balancer/balancerPool";
import * as _173 from "./gamm/v1beta1/genesis";
import * as _174 from "./gamm/v1beta1/gov";
import * as _175 from "./gamm/v1beta1/query";
import * as _176 from "./gamm/v1beta1/shared";
import * as _177 from "./gamm/v1beta1/tx";
import * as _178 from "./gamm/pool-models/balancer/tx/tx";
import * as _179 from "./gamm/pool-models/stableswap/stableswap_pool";
import * as _180 from "./gamm/pool-models/stableswap/tx";
import * as _181 from "./incentives/gauge";
import * as _182 from "./incentives/genesis";
import * as _183 from "./incentives/gov";
import * as _184 from "./incentives/group";
import * as _185 from "./incentives/params";
import * as _186 from "./incentives/query";
import * as _187 from "./incentives/tx";
import * as _188 from "./lockup/genesis";
import * as _189 from "./lockup/lock";
import * as _190 from "./lockup/params";
import * as _191 from "./lockup/query";
import * as _192 from "./lockup/tx";
import * as _193 from "./pool-incentives/v1beta1/genesis";
import * as _194 from "./pool-incentives/v1beta1/gov";
import * as _195 from "./pool-incentives/v1beta1/incentives";
import * as _196 from "./pool-incentives/v1beta1/query";
import * as _197 from "./pool-incentives/v1beta1/shared";
import * as _198 from "./poolmanager/v1beta1/genesis";
import * as _199 from "./poolmanager/v1beta1/gov";
import * as _200 from "./poolmanager/v1beta1/module_route";
import * as _201 from "./poolmanager/v1beta1/query";
import * as _202 from "./poolmanager/v1beta1/swap_route";
import * as _203 from "./poolmanager/v1beta1/tx";
import * as _204 from "./protorev/v1beta1/genesis";
import * as _205 from "./protorev/v1beta1/gov";
import * as _206 from "./protorev/v1beta1/params";
import * as _207 from "./protorev/v1beta1/protorev";
import * as _208 from "./protorev/v1beta1/query";
import * as _209 from "./protorev/v1beta1/tx";
import * as _210 from "./superfluid/genesis";
import * as _211 from "./superfluid/params";
import * as _212 from "./superfluid/query";
import * as _213 from "./superfluid/superfluid";
import * as _214 from "./superfluid/tx";
import * as _215 from "./tokenfactory/v1beta1/authorityMetadata";
import * as _216 from "./tokenfactory/v1beta1/genesis";
import * as _217 from "./tokenfactory/v1beta1/params";
import * as _218 from "./tokenfactory/v1beta1/query";
import * as _219 from "./tokenfactory/v1beta1/tx";
import * as _220 from "./txfees/v1beta1/feetoken";
import * as _221 from "./txfees/v1beta1/genesis";
import * as _222 from "./txfees/v1beta1/gov";
import * as _223 from "./txfees/v1beta1/query";
import * as _224 from "./valset-pref/v1beta1/query";
import * as _225 from "./valset-pref/v1beta1/state";
import * as _226 from "./valset-pref/v1beta1/tx";
import * as _392 from "./concentratedliquidity/poolmodel/concentrated/v1beta1/tx.amino";
import * as _393 from "./concentratedliquidity/v1beta1/tx.amino";
import * as _394 from "./gamm/pool-models/balancer/tx/tx.amino";
import * as _395 from "./gamm/pool-models/stableswap/tx.amino";
import * as _396 from "./gamm/v1beta1/tx.amino";
import * as _397 from "./incentives/tx.amino";
import * as _398 from "./lockup/tx.amino";
import * as _399 from "./poolmanager/v1beta1/tx.amino";
import * as _400 from "./protorev/v1beta1/tx.amino";
import * as _401 from "./superfluid/tx.amino";
import * as _402 from "./tokenfactory/v1beta1/tx.amino";
import * as _403 from "./valset-pref/v1beta1/tx.amino";
import * as _404 from "./concentratedliquidity/poolmodel/concentrated/v1beta1/tx.registry";
import * as _405 from "./concentratedliquidity/v1beta1/tx.registry";
import * as _406 from "./gamm/pool-models/balancer/tx/tx.registry";
import * as _407 from "./gamm/pool-models/stableswap/tx.registry";
import * as _408 from "./gamm/v1beta1/tx.registry";
import * as _409 from "./incentives/tx.registry";
import * as _410 from "./lockup/tx.registry";
import * as _411 from "./poolmanager/v1beta1/tx.registry";
import * as _412 from "./protorev/v1beta1/tx.registry";
import * as _413 from "./superfluid/tx.registry";
import * as _414 from "./tokenfactory/v1beta1/tx.registry";
import * as _415 from "./valset-pref/v1beta1/tx.registry";
import * as _416 from "./concentratedliquidity/v1beta1/query.rpc.Query";
import * as _417 from "./cosmwasmpool/v1beta1/query.rpc.Query";
import * as _418 from "./gamm/v1beta1/query.rpc.Query";
import * as _419 from "./incentives/query.rpc.Query";
import * as _420 from "./lockup/query.rpc.Query";
import * as _421 from "./pool-incentives/v1beta1/query.rpc.Query";
import * as _422 from "./poolmanager/v1beta1/query.rpc.Query";
import * as _423 from "./protorev/v1beta1/query.rpc.Query";
import * as _424 from "./superfluid/query.rpc.Query";
import * as _425 from "./tokenfactory/v1beta1/query.rpc.Query";
import * as _426 from "./txfees/v1beta1/query.rpc.Query";
import * as _427 from "./valset-pref/v1beta1/query.rpc.Query";
import * as _428 from "./concentratedliquidity/poolmodel/concentrated/v1beta1/tx.rpc.msg";
import * as _429 from "./concentratedliquidity/v1beta1/tx.rpc.msg";
import * as _430 from "./gamm/pool-models/balancer/tx/tx.rpc.msg";
import * as _431 from "./gamm/pool-models/stableswap/tx.rpc.msg";
import * as _432 from "./gamm/v1beta1/tx.rpc.msg";
import * as _433 from "./incentives/tx.rpc.msg";
import * as _434 from "./lockup/tx.rpc.msg";
import * as _435 from "./poolmanager/v1beta1/tx.rpc.msg";
import * as _436 from "./protorev/v1beta1/tx.rpc.msg";
import * as _437 from "./superfluid/tx.rpc.msg";
import * as _438 from "./tokenfactory/v1beta1/tx.rpc.msg";
import * as _439 from "./valset-pref/v1beta1/tx.rpc.msg";
import * as _490 from "./rpc.query";
import * as _491 from "./rpc.tx";
export namespace osmosis {
  export namespace accum {
    export const v1beta1 = {
      ..._158
    };
  }
  export const concentratedliquidity = {
    ..._159,
    poolmodel: {
      concentrated: {
        v1beta1: {
          ..._392,
          ..._404,
          ..._428
        }
      }
    },
    v1beta1: {
      ..._393,
      ..._405,
      ..._416,
      ..._429
    }
  };
  export namespace cosmwasmpool {
    export const v1beta1 = {
      ..._160,
      ..._161,
      ..._162,
      ..._163,
      ..._164,
      ..._165,
      ..._166,
      ..._167,
      ..._168,
      ..._169,
      ..._170,
      ..._171,
      ..._417
    };
  }
  export namespace gamm {
    export const v1beta1 = {
      ..._172,
      ..._173,
      ..._174,
      ..._175,
      ..._176,
      ..._177,
      ..._396,
      ..._408,
      ..._418,
      ..._432
    };
    export namespace poolmodels {
      export namespace balancer {
        export const v1beta1 = {
          ..._178,
          ..._394,
          ..._406,
          ..._430
        };
      }
      export namespace stableswap {
        export const v1beta1 = {
          ..._179,
          ..._180,
          ..._395,
          ..._407,
          ..._431
        };
      }
    }
  }
  export const incentives = {
    ..._181,
    ..._182,
    ..._183,
    ..._184,
    ..._185,
    ..._186,
    ..._187,
    ..._397,
    ..._409,
    ..._419,
    ..._433
  };
  export const lockup = {
    ..._188,
    ..._189,
    ..._190,
    ..._191,
    ..._192,
    ..._398,
    ..._410,
    ..._420,
    ..._434
  };
  export namespace poolincentives {
    export const v1beta1 = {
      ..._193,
      ..._194,
      ..._195,
      ..._196,
      ..._197,
      ..._421
    };
  }
  export namespace poolmanager {
    export const v1beta1 = {
      ..._198,
      ..._199,
      ..._200,
      ..._201,
      ..._202,
      ..._203,
      ..._399,
      ..._411,
      ..._422,
      ..._435
    };
  }
  export namespace protorev {
    export const v1beta1 = {
      ..._204,
      ..._205,
      ..._206,
      ..._207,
      ..._208,
      ..._209,
      ..._400,
      ..._412,
      ..._423,
      ..._436
    };
  }
  export const superfluid = {
    ..._210,
    ..._211,
    ..._212,
    ..._213,
    ..._214,
    ..._401,
    ..._413,
    ..._424,
    ..._437
  };
  export namespace tokenfactory {
    export const v1beta1 = {
      ..._215,
      ..._216,
      ..._217,
      ..._218,
      ..._219,
      ..._402,
      ..._414,
      ..._425,
      ..._438
    };
  }
  export namespace txfees {
    export const v1beta1 = {
      ..._220,
      ..._221,
      ..._222,
      ..._223,
      ..._426
    };
  }
  export namespace valsetpref {
    export const v1beta1 = {
      ..._224,
      ..._225,
      ..._226,
      ..._403,
      ..._415,
      ..._427,
      ..._439
    };
  }
  export const ClientFactory = {
    ..._490,
    ..._491
  };
}