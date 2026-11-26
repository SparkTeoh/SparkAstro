import { createContext, useContext } from 'react'
import { toLang, type Lang } from '../core/i18n'

export const LangContext = createContext<Lang>('zh-Hans')

export const useT = () => {
  const lang = useContext(LangContext)
  return (s: string) => toLang(s, lang)
}

export const useLang = () => useContext(LangContext)
