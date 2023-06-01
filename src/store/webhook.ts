import type { Client } from '@urql/core'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const initialWebhookUrl = atomWithStorage('webhookUrl', '')

export const intialUrqlClient = atom<Client | null>(null)
