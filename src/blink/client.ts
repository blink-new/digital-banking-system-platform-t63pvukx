import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'digital-banking-system-platform-t63pvukx',
  authRequired: true
})

export default blink