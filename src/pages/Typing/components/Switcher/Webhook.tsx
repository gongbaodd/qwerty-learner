import { clientAtom } from '@/store/webhook'
import { useAtomValue } from 'jotai'
import { FC, useCallback } from 'react'
import IconCloud from '~icons/tabler/cloud'
import IconDown from '~icons/tabler/cloud-arrow-down'
import IconUp from '~icons/tabler/cloud-arrow-up'

export const WebhookState: FC = () => {
  const webhook = useAtomValue(clientAtom)

  const handleClick = useCallback(() => {
    // TODO: open settings
  }, [])

  return (
    <button>
      <button
        className={`p-[2px] text-lg ${webhook.host ? 'text-indigo-500' : 'text-gray-500'} focus:outline-none`}
        type="button"
        onClick={handleClick}
        aria-label="查看云同步设置"
      >
        <IconCloud className="icon" />
      </button>
    </button>
  )
}
