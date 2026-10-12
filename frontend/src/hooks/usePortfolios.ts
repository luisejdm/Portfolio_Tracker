import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { PortfolioInfo } from '@/types'

export function usePortfolios() {
  return useQuery<PortfolioInfo>({
    queryKey: ['portfolios'],
    queryFn: () => api.get('/portfolios').then(r => r.data),
    staleTime: Infinity,
  })
}

export function useCreatePortfolio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.post('/portfolios', { name }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolios'] }),
  })
}

export function useSwitchPortfolio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.put('/portfolios/active', { name }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useDeletePortfolio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.delete(`/portfolios/${name}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(),
  })
}
