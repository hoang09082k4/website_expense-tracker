const API_BASE_URL = import.meta.env.VITE_API_URL

const normalizeBaseUrl = () => {
  if (!API_BASE_URL) {
    // No build-time API host provided -> use same-origin requests via `/api`
    return ''
  }

  return API_BASE_URL.replace(/\/$/, '')
}

// Build final API URL. If no external host is provided, call the relative
// `/api` path so the browser uses the same origin and the frontend's proxy
// (nginx) can forward requests to the backend service.
const buildUrl = (path) => {
  const base = normalizeBaseUrl()
  if (!base) return `/api${path}`
  if (base.endsWith('/api')) return `${base}${path}`
  return `${base}/api${path}`
}

const toFriendlyNetworkError = (error) => {
  if (error instanceof TypeError) {
    return new Error(
      'Không thể kết nối backend. Kiểm tra VITE_API_URL, backend đang chạy và CORS.',
    )
  }

  return error instanceof Error ? error : new Error('Đã xảy ra lỗi khi gọi API.')
}

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json()
    if (payload && typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message
    }
  } catch {
    // ignore JSON parse errors and fall back to a generic message
  }

  return `Yêu cầu API thất bại với mã ${response.status}.`
}

export const fetchTransactions = async () => {
  try {
    const response = await fetch(buildUrl('/transactions'))

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const payload = await response.json()
    return Array.isArray(payload) ? payload : []
  } catch (error) {
    throw toFriendlyNetworkError(error)
  }
}

export const addTransaction = async (transaction) => {
  try {
    const response = await fetch(buildUrl('/transactions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    return response.json()
  } catch (error) {
    throw toFriendlyNetworkError(error)
  }
}
