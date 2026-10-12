import { useState } from 'react'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Transaction } from '@/types'

export function Transactions() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  function handleEdit(tx: Transaction) {
    setEditing(tx)
    setFormOpen(true)
  }

  function handleClose() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-primary">Transactions</h1>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus size={14} />
          Add Transaction
        </Button>
      </div>

      <TransactionTable onEdit={handleEdit} />

      <TransactionForm open={formOpen} onClose={handleClose} editing={editing} />
    </div>
  )
}
