// GNU AFFERO GENERAL PUBLIC LICENSE Version 3. Copyright (C) 2022 DAO DAO Contributors.
// See the "LICENSE" file in the root directory of this package for more copyright information.

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const withInterceptStdout = require('next-intercept-stdout')

const { withSentryConfig } = require('@sentry/nextjs')
/** @type {import("@sentry/nextjs").SentryWebpackPluginOptions} */
const sentryWebpackPluginOptions = {
  silent: true,
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
}

const { i18n } = require('./next-i18next.config')

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: [
    '@dao-dao/stateless',
    '@dao-dao/utils',
    '@dao-dao/state',
    '@dao-dao/stateful',
    '@dao-dao/i18n',
    '@dao-dao/types',
    '@cosmos-kit/web3auth',
    'chartjs-adapter-date-fns',
    'chartjs-plugin-annotation',
  ],
  // Because @cosmos-kit/web3auth uses a Worker ESM import.
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config) => {
    // @cosmos-kit/web3auth uses eccrypto, which uses `stream`. This needs to be
    // polyfilled.
    config.resolve.alias['stream'] = 'stream-browserify'
    return config
  },
  i18n,
  /*
    The reactStrictMode flag is set to false
    to allow for the proposal JSON editor to show.
  */
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  eslint: {
    dirs: [
      'atoms',
      'components',
      'pages',
      'selectors',
      'services',
      'types',
      'util',
      'server',
    ],
  },
  redirects: async () => [
    // Redirect /dao/address to /address.
    {
      source: '/dao/:slug*',
      destination: '/:slug*',
      permanent: true,
    },
    {
      source: '/:locale',
      destination: '/' + process.env.NEXT_PUBLIC_SDA_DEFAULT_DAO_ADDRESS,
      permanent: false,
      locale: false,
    },
  ],
  // Only upload source maps to Sentry in CI action when token is provided.
  sentry: {
    disableServerWebpackPlugin:
      process.env.CI !== 'true' || !process.env.SENTRY_AUTH_TOKEN,
    disableClientWebpackPlugin:
      process.env.CI !== 'true' || !process.env.SENTRY_AUTH_TOKEN,
  },
  images: {
    unoptimized: true,
    domains: [
      'ipfs.stargaze.zone',
      'ipfs-gw.stargaze-apis.com',
      'i.stargaze-apis.com',
      'nftstorage.link',
      'ipfs.daodao.zone',
      'img-proxy.daodao.zone',
      'raw.githubusercontent.com',
    ],
  },
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
}

module.exports = withSentryConfig(
  withBundleAnalyzer(
    withInterceptStdout(
      config,
      // Silence Recoil duplicate warnings on dev.
      (text) =>
        process.env.NODE_ENV === 'development' &&
        text.includes('Expectation Violation: Duplicate atom key')
          ? ''
          : text
    )
  ),
  sentryWebpackPluginOptions
)
