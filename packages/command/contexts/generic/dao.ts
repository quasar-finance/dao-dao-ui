import {
  Check,
  CopyAll,
  HomeOutlined,
  InboxOutlined,
} from '@mui/icons-material'
import { WalletConnectionStatus, useWallet } from '@noahsaso/cosmodal'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useVotingModule } from '@dao-dao/state'
import {
  CommandModalContextMaker,
  CommandModalContextSection,
  CommandModalDaoInfo,
} from '@dao-dao/tstypes/command'
import { CHAIN_ID, getUrlBaseForChainId } from '@dao-dao/utils'

export const makeGenericDaoContext: CommandModalContextMaker<{
  dao: CommandModalDaoInfo
}> = ({ dao: { chainId = CHAIN_ID, coreAddress, name, imageUrl } }) => {
  const useSections = () => {
    const { t } = useTranslation()
    const router = useRouter()

    const { status } = useWallet(chainId)
    const { isMember } = useVotingModule(coreAddress, {
      chainId,
      fetchMembership: true,
    })

    const [copied, setCopied] = useState(false)
    // Debounce clearing copied.
    useEffect(() => {
      const timeout = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timeout)
    }, [copied])

    const [navigatingHref, setNavigatingHref] = useState<string>()
    const daoPageHref = `${getUrlBaseForChainId(chainId)}/dao/${coreAddress}`
    const createProposalHref = `${getUrlBaseForChainId(
      chainId
    )}/dao/${coreAddress}/proposals/create`

    const actionsSection: CommandModalContextSection<
      { href: string } | { onChoose: () => void }
    > = {
      name: t('title.actions'),
      onChoose: (item) => {
        if ('onChoose' in item) {
          return item.onChoose()
        }

        //! 'href' in item
        // Open remote links in new tab.
        if (item.href.startsWith('https://')) {
          window.open(item.href, '_blank')
        } else {
          // Navigate to local links.
          router.push(item.href)
          setNavigatingHref(item.href)
        }
      },
      items: [
        {
          name: t('button.goToDaoPage'),
          Icon: HomeOutlined,
          href: daoPageHref,
          loading: navigatingHref === daoPageHref,
        },
        {
          name: t('button.createAProposal'),
          Icon: InboxOutlined,
          href: createProposalHref,
          disabled: !isMember,
          loading:
            navigatingHref === createProposalHref ||
            status === WalletConnectionStatus.Initializing ||
            status === WalletConnectionStatus.Connecting,
        },
        {
          name: copied
            ? t('button.copiedDaoAddress')
            : t('button.copyDaoAddress'),
          Icon: copied ? Check : CopyAll,
          onChoose: () => {
            navigator.clipboard.writeText(coreAddress)
            setCopied(true)
          },
        },
      ],
    }

    return [actionsSection]
  }

  return {
    name,
    imageUrl,
    useSections,
  }
}
