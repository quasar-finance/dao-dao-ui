const { join } = require('path')
const telescope = require('@cosmology/telescope').default
// const rimraf = require('rimraf').rimrafSync

const protoDirs = [join(__dirname, '../proto')]
const outPath = join(__dirname, '../codegen')
// rimraf(outPath)

telescope({
  protoDirs,
  outPath,
  options: {
    interfaces: {
      enabled: true,
      useUseInterfacesParams: true,
      useByDefault: false,
      useByDefaultRpc: true,
      useUnionTypes: false,
    },
    tsDisable: {
      patterns: [
        '**/*.registry.ts',
        '**/authz.ts',
        '**/binary.ts',
        '**/tx.ts',
        '**/utf8.ts',
        '**/genesis.ts',
        '**/gov.ts',
        '**/query.ts',
        '**/feegrant.ts',
      ],
    },
    removeUnusedImports: true,
    experimentalGlobalProtoNamespace: true,
    prototypes: {
      addTypeUrlToDecoders: true,
      addTypeUrlToObjects: true,
      allowUndefinedTypes: true,
      includePackageVar: false,
      includes: {
        packages: [
          'cosmos.auth.v1beta1',
          'cosmos.authz.v1beta1',
          'cosmos.bank.v1beta1',
          'cosmos.base.query.v1beta1',
          'cosmos.base.tendermint.v1beta1',
          'cosmos.crypto.ed25519',
          'cosmos.crypto.multisig',
          'cosmos.crypto.secp256k1',
          'cosmos.distribution.v1beta1',
          'cosmos.feegrant.v1beta1',
          'cosmos.gov.v1',
          'cosmos.gov.v1beta1',
          'cosmos.mint.v1beta1',
          'cosmos.params.v1beta1',
          'cosmos.slashing.v1beta1',
          'cosmos.staking.v1beta1',
          'cosmos.tx.v1beta1',
          'cosmos.upgrade.v1beta1',
          'cosmwasm.tokenfactory.v1beta1',
          'cosmwasm.wasm.v1',
          'gaia.globalfee.v1beta1',
          'google.protobuf',
          'ibc.applications.transfer.v1',
          'ibc.applications.interchain_accounts.v1',
          'ibc.applications.interchain_accounts.host.v1',
          'ibc.applications.interchain_accounts.controller.v1',
          'ibc.core.channel.v1',
          'ibc.core.client.v1',
          'ibc.core.connection.v1',
          'juno.feeshare.v1',
          'juno.mint',
          'neutron.contractmanager.v1',
          'neutron.cron',
          'neutron.dex',
          'neutron.feeburner',
          'neutron.feerefunder',
          'neutron.interchainqueries',
          'neutron.interchaintxs.v1',
          'neutron.transfer.v1',
          'noble.tariff',
          'osmosis.concentratedliquidity.v1beta1',
          'osmosis.concentratedliquidity.poolmodel.concentrated.v1beta1',
          'osmosis.cosmwasmpool.v1beta1',
          'osmosis.gamm.v1beta1',
          'osmosis.gamm.poolmodels.balancer.v1beta1',
          'osmosis.gamm.poolmodels.stableswap.v1beta1',
          'osmosis.incentives',
          'osmosis.lockup',
          'osmosis.poolincentives.v1beta1',
          'osmosis.poolmanager.v1beta1',
          'osmosis.protorev.v1beta1',
          'osmosis.smartaccount.v1beta1',
          'osmosis.superfluid',
          'osmosis.superfluid.v1beta1',
          'osmosis.tokenfactory.v1beta1',
          'osmosis.txfees.v1beta1',
          'osmosis.valsetpref.v1beta1',
          'publicawesome.stargaze.alloc.v1beta1',
          'publicawesome.stargaze.cron.v1',
          'publicawesome.stargaze.globalfee.v1',
          'publicawesome.stargaze.mint.v1beta1',
          'regen.data.v1',
          'regen.data.v2',
          'regen.ecocredit.basket.v1',
          'regen.ecocredit.marketplace.v1',
          'regen.ecocredit.orderbook.v1alpha1',
          'regen.ecocredit.v1',
          'regen.ecocredit.v1alpha1',
          'regen.intertx.v1',
          'alliance.alliance',
          'circle.cctp.v1',
          'kujira.denom',
          'kujira.oracle',
          'kujira.scheduler',
          'pstake.liquidstake.v1beta1',
          'pstake.liquidstakeibc.v1beta1',
          'pstake.lscosmos.v1beta1',
          'pstake.ratesync.v1beta1',
          'bitsong.fantoken',
          'bitsong.fantoken.v1beta1',
          'feemarket.feemarket.v1',
          'secret.compute.v1beta1',
          'secret.emergencybutton.v1beta1',
          'secret.intertx.v1beta1',
          'secret.registration.v1beta1',
          'OmniFlix.onft.v1beta1',
          'interchain_security.ccv.consumer.v1',

          // interferes with v1beta1 MsgSubmitProposal amino encoders since the
          // type names overlap
          //
          // 'cosmos.adminmodule.adminmodule',
        ],
      },
      // excluded: {
      //   packages: [
      //     // 'ibc.applications.fee.v1',

      //     'cosmos.app.v1alpha1',
      //     'cosmos.app.v1beta1',
      //     'cosmos.autocli.v1',
      //     'cosmos.base.kv.v1beta1',
      //     'cosmos.base.reflection.v1beta1',
      //     'cosmos.base.snapshots.v1beta1',
      //     'cosmos.base.store.v1beta1',
      //     'cosmos.base.tendermint.v1beta1',
      //     'cosmos.capability.v1beta1',
      //     'cosmos.crisis.v1beta1',
      //     'cosmos.evidence.v1beta1',
      //     'cosmos.feegrant.v1beta1',
      //     'cosmos.genutil.v1beta1',
      //     // 'cosmos.gov.v1',
      //     'cosmos.group.v1',
      //     'cosmos.group.v1beta1',
      //     'cosmos.mint.v1beta1',
      //     'cosmos.msg.v1',
      //     'cosmos.nft.v1beta1',
      //     'cosmos.orm.v1',
      //     'cosmos.orm.v1alpha1',
      //     'cosmos.params.v1beta1',
      //     'cosmos.slashing.v1beta1',
      //     'cosmos.vesting.v1beta1',
      //     // 'google.api',
      //     'ibc.core.port.v1',
      //     'ibc.core.types.v1',
      //   ],
      // },
      methods: {
        fromJSON: false,
        toJSON: false,
        encode: true,
        decode: true,
        fromPartial: true,
        toAmino: true,
        fromAmino: true,
        fromProto: true,
        toProto: true,
      },
      parser: {
        keepCase: false,
      },
      typingsFormat: {
        duration: 'duration',
        timestamp: 'date',
        useExact: false,
        useDeepPartial: false,
        num64: 'bigint',
        customTypes: {
          useCosmosSDKDec: true,
        },
      },
      patch: {
        // AccessType in wasm types has custom serialization names in the x/wasm
        // module, so replace the default generated names with the correct ones
        // to fix Amino encoding.
        'cosmwasm/wasm/v1/types.proto': [
          {
            op: 'remove',
            path: '@/AccessType/values/ACCESS_TYPE_UNSPECIFIED',
          },
          {
            op: 'add',
            path: '@/AccessType/values/Unspecified',
            value: 0,
          },
          {
            op: 'remove',
            path: '@/AccessType/values/ACCESS_TYPE_NOBODY',
          },
          {
            op: 'add',
            path: '@/AccessType/values/Nobody',
            value: 1,
          },
          {
            op: 'remove',
            path: '@/AccessType/values/ACCESS_TYPE_EVERYBODY',
          },
          {
            op: 'add',
            path: '@/AccessType/values/Everybody',
            value: 3,
          },
          {
            op: 'remove',
            path: '@/AccessType/values/ACCESS_TYPE_ANY_OF_ADDRESSES',
          },
          {
            op: 'add',
            path: '@/AccessType/values/AnyOfAddresses',
            value: 4,
          },
        ],
      },
    },
    aminoEncoding: {
      enabled: true,
      // exceptions: AMINO_MAP,
      useRecursiveV2encoding: true,
    },
    lcdClients: {
      enabled: false,
    },
    rpcClients: {
      enabled: true,
      camelCase: true,
    },
  },
})
  .then(() => {
    console.log('✨ all done!')
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
