import { useEffect, useState } from "react";

import { app as app_en } from "@/src/lang/en";
import { app as app_el } from "@/src/lang/el";
import { AppLocale } from "@/src/lang/interfaces";

export type LanguageLocale = {
    [key: string]: {
        app: AppLocale
    }
}

const langLocale: LanguageLocale = {
    "en-US": {
        app: app_en
    },
    "en-GB": {
        app: app_en
    },
    "el": {
        app: app_el
    }
}

export default function useLocale(defaultLanguage: string = "en-US") {
    const [lang, setLang] = useState<string>(defaultLanguage)

    useEffect(() => {
        setLang((localStorage.getItem("locale") as string) || "en-US")
    }, [])

    if(!(lang in langLocale)) return {
        locale: langLocale["en-US"],
        lang,
        setLang
    }

    return {
        locale: langLocale[lang],
        lang,
        setLang
    }

}