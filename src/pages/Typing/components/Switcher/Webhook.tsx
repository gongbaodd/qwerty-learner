import { clientAtom, downloadAtom, queryAtom, uploadAtom } from '@/store/webhook'
import { db } from '@/utils/db'
import { useAtom, useAtomValue } from 'jotai'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import IconCloud from '~icons/tabler/cloud'
import IconDown from '~icons/tabler/cloud-down'
import IconUp from '~icons/tabler/cloud-up'

export const WebhookState: FC = () => {
  const webhook = useAtomValue(clientAtom)
  const upload = useAtomValue(uploadAtom)
  const download = useAtomValue(downloadAtom)
  const [query, setQuery] = useAtom(queryAtom)
  const [updatingDB, setUpdatingDB] = useState(false)

  const handleClick = useCallback(() => {
    // TODO: open settings
  }, [])

  useEffect(() => {
    if (query) {
      setUpdatingDB(true)

      Promise.all([db.chapterRecords.clear(), db.wordRecords.clear()]).then(() => {
        query.chapters.forEach(async (chapter) => {
          await db.chapterRecords.put({
            ...chapter,
          })
        })

        query.words.forEach(async (word) => {
          await db.wordRecords.put({
            ...word,
            mistakes: word.mistakes.reduce((acc, mistake) => {
              return {
                ...acc,
                [mistake.index]: mistake.mistakes,
              }
            }, {}),
          })
        })
        setUpdatingDB(false)
      })
    }
  }, [query])

  useEffect(() => {
    if (webhook.host) {
      setQuery()
    }
  }, [webhook])

  return (
    <button
      className={`p-[2px] text-lg ${webhook.host ? 'text-indigo-500' : 'text-gray-500'} focus:outline-none`}
      type="button"
      onClick={handleClick}
      aria-label="查看云同步设置"
    >
      {upload && <IconUp className="icon" />}
      {(download || updatingDB) && <IconDown className="icon" />}
      {!upload && !download && !updatingDB && <IconCloud className="icon" />}
    </button>
  )
}
