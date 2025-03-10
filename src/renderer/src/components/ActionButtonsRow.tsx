import { DeleteChatButton, NewChatButton } from '@/components'
import { ComponentProps } from 'react'

export const ActionButtonsRow = ({ ...props }: ComponentProps<'div'>) => {
  return (
    <div {...props}>
      <NewChatButton />
      <DeleteChatButton />
    </div>
  )
}
