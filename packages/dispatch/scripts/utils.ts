import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import chalk from 'chalk'

import { cwMsgToEncodeObject } from '@dao-dao/types'
import {
  CHAIN_GAS_MULTIPLIER,
  encodeJsonToBase64,
  findEventsAttributeValue,
  getRpcForChainId,
} from '@dao-dao/utils'

const { log } = console

export const instantiateContract = async ({
  client,
  sender,
  chainId,
  id,
  codeId,
  msg,
  label,
  prefixLength,
  override,
}: {
  client: SigningCosmWasmClient
  sender: string
  chainId: string
  id: string
  codeId: number
  msg: Record<string, unknown>
  label: string
  prefixLength: number
  /**
   * If passed, use this contract instead of instantiating a new one.
   */
  override?: string
}) => {
  let contractAddress = override

  if (!contractAddress) {
    let transactionHash
    try {
      transactionHash = await client.signAndBroadcastSync(
        sender,
        [
          cwMsgToEncodeObject(
            chainId,
            {
              wasm: {
                instantiate: {
                  code_id: codeId,
                  msg: encodeJsonToBase64(msg),
                  funds: [],
                  label,
                  admin: undefined,
                },
              },
            },
            sender
          ),
        ],
        CHAIN_GAS_MULTIPLIER
      )
    } catch (err) {
      log(
        chalk.red(
          `[${id}.CONTRACT]${' '.repeat(
            prefixLength - id.length - 11
          )}instantiate failed`
        )
      )
      throw err
    }

    log(
      chalk.greenBright(
        `[${id}.TX]${' '.repeat(
          prefixLength - id.length - 5
        )}${transactionHash}`
      )
    )

    // Poll for TX.
    let events
    let tries = 15
    while (tries > 0) {
      try {
        events = (await client.getTx(transactionHash))?.events
        if (events) {
          break
        }
      } catch {}

      tries--
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    if (!events) {
      log(
        chalk.red(
          `[${id}.CONTRACT]${' '.repeat(
            prefixLength - id.length - 11
          )}TX not found`
        )
      )
      process.exit(1)
    }

    contractAddress = findEventsAttributeValue(
      events,
      'instantiate',
      '_contract_address'
    )

    if (!contractAddress) {
      log(
        chalk.red(
          `[${id}.CONTRACT]${' '.repeat(
            prefixLength - id.length - 11
          )}not found`
        )
      )
      process.exit(1)
    }
  }

  log(
    chalk.green(
      `[${id}.CONTRACT]${' '.repeat(
        prefixLength - id.length - 11
      )}${contractAddress}`
    )
  )

  return contractAddress
}

export const getBlockMaxGas = async ({
  chainId,
}: {
  chainId: string
}): Promise<string> => {
  const blockMaxGas = (
    await (await fetch(`${getRpcForChainId(chainId)}/consensus_params`)).json()
  ).result.consensus_params.block.max_gas

  // if no max gas, default to 100000000
  return blockMaxGas === '-1' ? '100000000' : blockMaxGas
}
