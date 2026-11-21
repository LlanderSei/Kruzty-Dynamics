import { useState, useEffect } from 'react'
import type { DiscordAccount } from '../../types'

const ACCOUNTS_STORAGE_KEY = 'kd_discord_accounts'

export function useAccounts() {
  const [accounts, setAccounts] = useState<DiscordAccount[]>(() => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // Fallback
    }
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
    } catch {
      // Storage unavailable
    }
  }, [accounts])

  const addAccount = (account: DiscordAccount) => {
    if (accounts.some(existing => existing.id === account.id)) {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'This Discord account is already added.' },
      }))
      return
    }

    setAccounts(prev => {
      if (prev.some(existing => existing.id === account.id)) return prev

      const isFirst = prev.length === 0
      const newAccount = { ...account, isActive: isFirst || account.isActive }
      const updated = isFirst
        ? [newAccount]
        : prev.map(a => (newAccount.isActive ? { ...a, isActive: false } : a)).concat(newAccount)
      return updated
    })
  }

  const removeAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  const setActiveAccount = (id: string) => {
    setAccounts(prev =>
      prev.map(a => ({
        ...a,
        isActive: a.id === id,
      }))
    )
  }

  const unuseAccount = () => {
    setAccounts(prev =>
      prev.map(a => ({
        ...a,
        isActive: false,
      }))
    )
  }

  const activeAccount = accounts.find(a => a.isActive) || null

  return {
    accounts,
    activeAccount,
    addAccount,
    removeAccount,
    setActiveAccount,
    unuseAccount,
  }
}
