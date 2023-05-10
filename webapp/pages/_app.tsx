import { ChakraProvider } from '@chakra-ui/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import "../styles/root.scss"
import ColorManager from '@/components/ColorManager'
import LanguageManager from '@/components/LanguageManager'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider resetCSS>
      <Head>
        <title>League of Legends Win Predictor</title>
      </Head>
      <ColorManager />
      <LanguageManager />

      <Component {...pageProps} />
    </ChakraProvider>
  )
}
