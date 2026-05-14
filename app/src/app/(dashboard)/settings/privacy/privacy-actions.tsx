'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Download, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  requestDataExportAction,
  requestAccountDeletionAction,
  cancelAccountDeletionAction,
} from '@/server/actions/privacy'

export function PrivacyActions({ deletionRequested }: { deletionRequested: boolean }) {
  const t = useTranslations('Settings')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function exportData() {
    start(async () => {
      const res = await requestDataExportAction()
      if (res.ok) toast.success(t('privacyDataExportSubmitted'))
      else toast.error('ไม่สามารถส่งคำขอได้')
    })
  }

  function requestDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    start(async () => {
      const res = await requestAccountDeletionAction()
      if (res.ok) {
        toast.success(t('privacyDeletionSubmitted'))
        setConfirmingDelete(false)
        router.refresh()
      } else {
        toast.error('ไม่สามารถส่งคำขอลบได้')
      }
    })
  }

  function cancelDelete() {
    start(async () => {
      const res = await cancelAccountDeletionAction()
      if (res.ok) {
        toast.success(t('privacyDeletionCancelled'))
        router.refresh()
      } else {
        toast.error('ไม่สามารถยกเลิกได้')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="block"
        onClick={exportData}
        disabled={pending}
        loading={pending}
      >
        <Download className="size-4" />
        {t('privacyDataExportButton')}
      </Button>

      {deletionRequested ? (
        <Button
          type="button"
          variant="outline"
          size="block"
          onClick={cancelDelete}
          disabled={pending}
          loading={pending}
        >
          <X className="size-4" />
          {t('privacyCancelDeletion')}
        </Button>
      ) : (
        <Button
          type="button"
          variant={confirmingDelete ? 'destructive' : 'outline'}
          size="block"
          onClick={requestDelete}
          disabled={pending}
          loading={pending}
          className={confirmingDelete ? '' : 'border-destructive/40 text-destructive hover:bg-destructive/5'}
        >
          <Trash2 className="size-4" />
          {confirmingDelete ? t('privacyDeleteAccountConfirm') : t('privacyDeleteAccountButton')}
        </Button>
      )}

      {confirmingDelete && !deletionRequested && (
        <button
          type="button"
          onClick={() => setConfirmingDelete(false)}
          className="self-center text-xs text-muted-foreground hover:text-foreground"
        >
          ยกเลิก
        </button>
      )}
    </div>
  )
}
