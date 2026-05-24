import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '@/lib/api';
import toast from 'react-hot-toast';

export function useJournals(page = 1, mood?: string) {
  return useQuery({
    queryKey: ['journals', page, mood],
    queryFn: () => journalApi.list({ page, limit: 20, mood }),
  });
}

export function useJournal(id: string) {
  return useQuery({
    queryKey: ['journal', id],
    queryFn: () => journalApi.get(id),
    enabled: !!id,
  });
}

export function useDeleteJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => journalApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journals'] });
      qc.invalidateQueries({ queryKey: ['journal-stats'] });
      toast.success('Entry deleted');
    },
    onError: () => toast.error('Could not delete entry'),
  });
}
