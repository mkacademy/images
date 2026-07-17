
import { store } from './store'
import { resetPagination } from './store/slices/paginationSlice'
import { tabluarPrefixes, userApps } from './constants'

// Re-export constants for backward compatibility
export { tabluarPrefixes, userApps }
// Reset pagination state now that userApps is available
store.dispatch(resetPagination()) 