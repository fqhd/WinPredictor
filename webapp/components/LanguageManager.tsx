import { useEffect } from "react";

export default function LanguageManager() {
    useEffect(() => {
        if(!localStorage.getItem("locale")) localStorage.setItem("locale", navigator.language)
    })

    return <></>
}