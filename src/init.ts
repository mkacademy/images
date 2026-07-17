
import { store } from './store'
import { resetPagination } from './store/slices/paginationSlice'
// Reset pagination state now that userApps is available
store.dispatch(resetPagination()) 