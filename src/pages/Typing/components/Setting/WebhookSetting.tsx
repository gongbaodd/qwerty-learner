import styles from './index.module.css'
import { initialWebhookUrl, intialUrqlClient } from '@/store/webhook'
import { Client, cacheExchange, fetchExchange, gql } from '@urql/core'
import { useAtom } from 'jotai'
import type { FC } from 'react'
import { useCallback, useRef, useState } from 'react'

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

const WebhookSetting: FC = () => {
  const [isWebhookSaving, setIsWebhookSaving] = useState(false)
  const [_webhookUrl, setWebhookUrl] = useAtom(initialWebhookUrl)
  const [_urqlClient, setUrqlClient] = useAtom(intialUrqlClient)
  const webhookUrlRef = useRef<HTMLInputElement>(null)
  const [isError, setIsError] = useState(false)

  const onClickSaveWebhook = useCallback(async () => {
    const url = webhookUrlRef.current?.value || ''
    if (url) {
      setIsWebhookSaving(true)

      const client = new Client({
        url,
        exchanges: [cacheExchange, fetchExchange],
      })

      const result = await client.query(query, {}).toPromise()

      setIsWebhookSaving(false)

      if (result.error) {
        setIsError(true)
        return
      }

      setIsError(false)
      setUrqlClient(client)
      setWebhookUrl(url)
    }
  }, [])

  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>GraphQL Webhook</span>
      <span className={styles.sectionDescription}>
        请注意，本地数据将被<strong className="text-sm font-bold text-red-500"> 完全覆盖 </strong>当前数据。请谨慎操作。
      </span>
      <div className="flex h-10 w-full items-center justify-start px-5">
        <input
          id="webhook"
          name="webhook"
          type="url"
          className="focus:ring-indiago-300 block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 shadow-sm ring-1  ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-300"
          placeholder="请输入 GraphQL 地址"
          ref={webhookUrlRef}
        />
      </div>
      {isError && (
        <span className={styles.sectionDescription}>
          <strong className="text-sm font-bold text-red-500"> 无效的URL </strong>
        </span>
      )}

      <button
        className="btn-primary ml-4 disabled:bg-gray-300"
        type="button"
        onClick={onClickSaveWebhook}
        disabled={isWebhookSaving}
        title="保存链接"
      >
        保存链接
      </button>
    </div>
  )
}

export default WebhookSetting
