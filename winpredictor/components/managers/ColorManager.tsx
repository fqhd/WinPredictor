import { useColorMode } from "@chakra-ui/react";
import { useEffect } from "react";

export default function ColorManager() {
    const { colorMode, setColorMode } = useColorMode()

    useEffect(() => {
        if(colorMode == "light") setColorMode("dark")
    })

    return <></>
}