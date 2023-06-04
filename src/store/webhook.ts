import { IChapterRecord, IWordRecord } from '@/utils/db/record'
import { Client, cacheExchange, fetchExchange, gql } from '@urql/core'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

type ICharpter = IChapterRecord
type IMistakes = { index: number; mistakes: string[] }
type IWord = Exclude<IWordRecord, 'mistakes'> & { mistakes: IMistakes[] }

const CLIENT_NOT_READY = 'client is not ready'

const initialWebhookUrl = atomWithStorage('webhookUrl', '')

let client: Client | null = null

const query = gql/* GraphQL */ `
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
export const queryAtom = atom(async (_get) => {
  if (!client) throw new Error(CLIENT_NOT_READY)

  const result = await client.query<{ chapters: ICharpter[]; words: IWord[] }>(query, {}).toPromise()

  if (result.error) {
    throw result.error
  }

  return { chapters: result.data?.chapters || [], words: result.data?.words || [] }
})

const addWord = gql/* GraphQL */ `
  input WordInput {
    word: String!
    timeStamp: Int!
    dict: String!
    chapter: Int
    timing: [Int!]!
    wrongCount: Int!
    mistakes: [LetterMistakesInput!]!
  }

  input LetterMistakesInput {
    index: Int!
    mistakes: [String!]!
  }

  mutation MyMutation($word: WordInput!) {
    addWord(input: $word) {
      word
    }
  }
`

export const addWordAtom = atom(null, async (_get, _set, input: IWord) => {
  if (!client) throw new Error(CLIENT_NOT_READY)

  const result = await client.mutation<Pick<IWord, 'word'>, { input: IWord }>(addWord, { input }).toPromise()

  if (result.error) {
    throw result.error
  }
})

const addChapter = gql/* GraphQL */ `
  input ChapterInput {
    dict: String!
    chapter: Int
    timeStamp: Int!
    time: Int!
    correctCount: Int!
    wrongCount: Int!
    wordCount: Int!
    correctWordIndexes: [Int!]!
    wordNumber: Int!
    wordRecordIds: [Int!]!
  }
  mutation MyMutation($chapter: ChapterInput!) {
    addChapter(input: $chapter) {
      dict
      chapter
    }
  }
`

export const addChapterAtom = atom(null, async (_get, _set, input: ICharpter) => {
  if (!client) throw new Error(CLIENT_NOT_READY)

  const result = await client.mutation<Pick<ICharpter, 'dict' | 'chapter'>, { input: ICharpter }>(addChapter, { input }).toPromise()

  if (result.error) {
    throw result.error
  }
})

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
  async (get, set, url: string) => {
    const newClient = new Client({ url, exchanges: [cacheExchange, fetchExchange] })

    await get(queryAtom)

    client = newClient
    set(initialWebhookUrl, url)
  },
)
