import { Client, cacheExchange, fetchExchange, gql } from '@urql/core'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const initialWebhookUrl = atomWithStorage('webhookUrl', '')

let client: Client | null = null

const testQuery = gql/* GraphQL */ `
  query MyQuery {
    chapters {
      chapter
      correctCount
      correctWordIndexes
      dict
      time
      timeStamp
      wordCount
      wordNumber
      wordRecordIds
      wrongCount
    }
    words {
      chapter
      dict
      mistakes {
        index
        mistakes
      }
      timeStamp
      timing
      word
      wrongCount
    }
  }
`
export const clientAtom = atom(
  (get) => {
    const host = get(initialWebhookUrl)
    if (client) return { client, host }

    if (host) {
      client = new Client({ url: host, exchanges: [cacheExchange, fetchExchange] })
      return { client, host }
    }

    return { client: null, host: '' }
  },
  async (_get, set, url: string) => {
    const newClient = new Client({ url, exchanges: [cacheExchange, fetchExchange] })
    const result = await newClient.query(testQuery, {}).toPromise()

    if (result.error) {
      throw result.error
    }

    client = newClient
    set(initialWebhookUrl, url)
  },
)
