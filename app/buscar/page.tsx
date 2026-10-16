import type { Metadata } from 'next'
import { SearchView } from '@/components/search-view'

export const metadata: Metadata = { title: 'Buscar' }

export default function SearchPage() {
  return <SearchView />
}
