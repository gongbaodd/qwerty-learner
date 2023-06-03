import styles from './index.module.css'
import { clientAtom } from '@/store/webhook'
import { useAtom } from 'jotai'
import type { FC } from 'react'
import { useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { useCallback, useState } from 'react'

const WebhookSetting: FC = () => {
  const [isWebhookSaving, setIsWebhookSaving] = useState(false)
  const [isError, setIsError] = useState(false)
  const [webhook, setWebhook] = useAtom(clientAtom)
  const [url, setUrl] = useState('')
  const onInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }, [])

  useEffect(() => {
    console.log('webhook', webhook)
    setUrl(webhook?.host || '')
  }, [webhook])

  const onClickSaveWebhook = useCallback(async () => {
    if (url) {
      setIsWebhookSaving(true)
      try {
        await setWebhook(url)
      } catch (error) {
        setIsError(true)
        setIsWebhookSaving(false)
        return
      }
      setIsWebhookSaving(false)
      setIsError(false)
    }
  }, [url])

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
          value={url}
          onChange={onInput}
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
