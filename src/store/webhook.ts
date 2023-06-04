import type { TypingState } from '@/pages/Typing/store'
import { getUTCUnixTimestamp } from '@/utils'
import type { IChapterRecord, IWordRecord } from '@/utils/db/record'
import { Client, cacheExchange, fetchExchange, gql } from '@urql/core'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

type ICharpter = IChapterRecord
type IMistakes = { index: number; mistakes: string[] }
type IWord = Omit<IWordRecord, 'mistakes'> & { mistakes: IMistakes[] }

const initialWebhookUrl = atomWithStorage('webhookUrl', '')

export const uploadAtom = atom(false)

export const downloadAtom = atom(false)

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

type IQueryData = { chapters: ICharpter[]; words: IWord[] }

let queryData: IQueryData | null = null

export const queryAtom = atom(
  () => queryData,
  async (get, set) => {
    const host = get(initialWebhookUrl)

    if (!host) return

    if (!client) client = createClient(host)

    set(downloadAtom, true)

    const result = await client.query<IQueryData>(query, {}).toPromise()

    set(downloadAtom, false)

    if (result.error) {
      throw result.error
    }

    queryData = result.data ?? queryData
  },
)

const addWord = gql/* GraphQL */ `
  mutation AddWord($input: WordInput!) {
    addWord(input: $input) {
      word
    }
  }
`

export const addWordAtom = atom(null, async (get, set, input: IWord) => {
  const host = get(initialWebhookUrl)
  if (!host) return
  if (!client) client = createClient(host)

  set(uploadAtom, true)
  const result = await client.mutation<Pick<IWord, 'word'>, { input: IWord }>(addWord, { input }).toPromise()
  set(uploadAtom, false)

  if (result.error) {
    throw result.error
  }
})

export const addWordSelector = (
  state: Pick<IWordRecord, 'word' | 'wrongCount' | 'mistakes'> & { letterTimeArray: number[] },
): Omit<IWord, 'dict' | 'chapter'> => {
  const { mistakes, letterTimeArray, ...rest } = state
  const mistakesArray: IMistakes[] = Object.entries(mistakes).map(([index, mistakes]) => ({ index: Number(index), mistakes }))
  const timing: number[] = []
  for (let i = 1; i < letterTimeArray.length; i++) {
    const diff = letterTimeArray[i] - letterTimeArray[i - 1]
    timing.push(diff)
  }

  return {
    ...rest,
    mistakes: mistakesArray,
    timeStamp: getUTCUnixTimestamp(),
    timing,
  }
}

const addChapter = gql/* GraphQL */ `
  mutation AddChapter($input: ChapterInput!) {
    addChapter(input: $input) {
      dict
      chapter
    }
  }
`

export const addChapterAtom = atom(null, async (get, set, input: ICharpter) => {
  const host = get(initialWebhookUrl)
  if (!host) return
  if (!client) client = createClient(host)

  set(uploadAtom, true)
  const result = await client.mutation<Pick<ICharpter, 'dict' | 'chapter'>, { input: ICharpter }>(addChapter, { input }).toPromise()
  set(uploadAtom, false)

  if (result.error) {
    throw result.error
  }
})

export const addChapterSelector = (state: TypingState): Omit<ICharpter, 'dict' | 'chapter'> => {
  const {
    chapterData: { correctCount, wrongCount, wordCount, correctWordIndexes, words, wordRecordIds },
    timerData: { time },
  } = state

  return {
    time,
    timeStamp: getUTCUnixTimestamp(),
    correctCount,
    wrongCount,
    wordCount,
    correctWordIndexes,
    wordNumber: words.length,
    wordRecordIds,
  }
}

export const clientAtom = atom(
  (get) => {
    const host = get(initialWebhookUrl)
    if (client) return { client, host }

    if (host) {
      client = createClient(host)
      return { client, host }
    }

    return { client: null, host: '' }
  },
  async (get, set, url: string) => {
    const newClient = createClient(url)

    await get(queryAtom)

    client = newClient
    set(initialWebhookUrl, url)
  },
)

function createClient(host: string) {
  return new Client({ url: host, exchanges: [cacheExchange, fetchExchange] })
}
