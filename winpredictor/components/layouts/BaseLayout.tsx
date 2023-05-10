import { Flex } from "@chakra-ui/react"
import Head from "next/head"
import { ReactNode } from "react"
import Header from "./Header"

export type BaseLayoutProps = {
    title?: string
    children?: ReactNode,

}

export default function BaseLayout(props: BaseLayoutProps) {

    return (
        <Flex
            className="main"
            width="100vw"
            minHeight="100vh"
        >
            <Head>
                {props.title && <title>{props.title} - LoL WinPredictor</title>}
            </Head>

            <Header />
        </Flex>
    )

}