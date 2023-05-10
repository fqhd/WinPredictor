import ColorManager from '@/components/managers/ColorManager'
import { ChakraProvider } from '@chakra-ui/react'
import type { AppProps } from 'next/app'

import theme from "../styles/app.theme"
import "../styles/app.scss"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider resetCSS theme={theme}>
      <ColorManager />

      <Component {...pageProps} />
    </ChakraProvider>
  )
}
