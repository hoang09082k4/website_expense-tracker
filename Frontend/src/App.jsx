import { useCallback, useEffect, useMemo, useState } from 'react'
import ExpenseForm from './components/ExpenseForm'
import TimeFilterPanel from './components/TimeFilterPanel'
import TransactionsTable from './components/TransactionsTable'
import { defaultForm } from './constants/transactions'
import { formatCurrency } from './utils/formatCurrency'
import { isInFilterRange } from './utils/transactionFilters'
import './App.css'

// Tự động lấy URL từ .env, nếu quên cấu hình thì ưu tiên gọi bản deploy để test
const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

const getFilterLabel = (filterType) => {
  if (filterType === 'day') return 'Theo ngày'
  if (filterType === 'month') return 'Theo tháng'
  if (filterType === 'range') return 'Khoảng thời gian'
  return 'Tất cả giao dịch'
}

function App() {
  const [transactions, setTransactions] = useState([]) 
  const [formData, setFormData] = useState(defaultForm)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listNotice, setListNotice] = useState('')
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [apiReady, setApiReady] = useState(false)

  const [filterType, setFilterType] = useState('all')
  const [dayFilter, setDayFilter] = useState(new Date().toISOString().slice(0, 10))
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  const [rangeFilter, setRangeFilter] = useState({
    from: '',
    to: '',
  })

  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedDetails, setSelectedDetails] = useState(null) 

  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthData, setHealthData] = useState({ status: 'idle', data: null })

  const [showGrandTotalModal, setShowGrandTotalModal] = useState(false)
  const [showFilteredListModal, setShowFilteredListModal] = useState(false)

  // ==========================================
  // LẤY DỮ LIỆU TỪ SUPABASE (GET)
  // ==========================================
  const loadTransactions = useCallback(async () => {
    setListLoading(true)
    setListError('')
    setListNotice('')

    try {
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Lỗi Server: ${response.status}`);
      }

      const data = await response.json();
      setTransactions(data); 
      setApiReady(true);
      setListNotice('Đã đồng bộ dữ liệu từ Supabase.');
    } catch (error) {
      console.error("Lỗi GET:", error);
      setApiReady(false);
      setTransactions([]); 
      setListError('Không thể kết nối đến Database: ' + error.message);
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  // Calling `loadTransactions` triggers state updates inside that function.
  // Suppress the ESLint rule that forbids calling setState directly from effects
  // because the call is intentionally deferred via `setTimeout`.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTransactions()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadTransactions])

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('theme-dark')
    } else {
      document.body.classList.remove('theme-dark')
    }
  }, [isDarkMode])

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aDate = new Date(a.date).getTime()
      const bDate = new Date(b.date).getTime()
      return bDate - aDate
    })
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const range = {
      day: dayFilter,
      month: monthFilter,
      from: rangeFilter.from,
      to: rangeFilter.to,
    }
    return sortedTransactions.filter((item) =>
      isInFilterRange(item.date, filterType, range),
    )
  }, [sortedTransactions, filterType, dayFilter, monthFilter, rangeFilter])

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [filteredTransactions])

  const grandTotalAmount = useMemo(() => {
    return sortedTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [sortedTransactions])

  const latestTransactionDate = sortedTransactions[0]?.date ?? '---'
  const highestExpense = useMemo(() => {
    if (sortedTransactions.length === 0) return 0
    return Math.max(...sortedTransactions.map((item) => Number(item.amount || 0)))
  }, [sortedTransactions])

  const liveDraftTransaction = useMemo(() => {
    const hasAnyValue = Boolean(
      formData.title.trim() || formData.amount || formData.category.trim() || formData.date,
    )
    if (!hasAnyValue) return null

    const amountNumber = Number(formData.amount)
    return {
      id: 'draft-transaction',
      title: formData.title.trim() || 'Đang nhập tên khoản chi...',
      amount: Number.isFinite(amountNumber) && amountNumber > 0 ? amountNumber : 0,
      amountDisplay:
        Number.isFinite(amountNumber) && amountNumber > 0
          ? formatCurrency(amountNumber)
          : 'Chưa có số tiền',
      category: formData.category.trim() || 'Đang nhập danh mục...',
      date: formData.date || '---',
      createdAt: currentTime.toISOString(),
      createdAtDisplay: currentTime.toLocaleString('vi-VN'),
      isDraft: true,
    }
  }, [formData, currentTime])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  // ==========================================
  // GỬI DỮ LIỆU LÊN SUPABASE (POST) VÀ TẠO TASK
  // ==========================================
  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')
    setListNotice('')

    const amountNumber = Number(formData.amount)
    if (!formData.title.trim()) {
      setSubmitError('Vui lòng nhập tên khoản chi.')
      return
    }
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setSubmitError('Số tiền phải lớn hơn 0.')
      return
    }
    if (!formData.date) {
      setSubmitError('Vui lòng chọn ngày chi tiêu.')
      return
    }

    setIsSubmitting(true)
    void (async () => {
      const payload = {
        title: formData.title.trim(),
        amount: amountNumber,
        category: formData.category.trim(),
        date: formData.date,
        createdAt: new Date().toISOString(),
      }

      try {
        // 1. Lưu vào bảng Transactions (Chi tiêu)
        const response = await fetch(`${API_URL}/api/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Lỗi khi lưu dữ liệu lên server');
        }

        // Cập nhật giao diện chi tiêu
        setTransactions((current) => [data, ...current])
        setFormData(defaultForm)
        setSubmitSuccess('Đã lưu thành công vào Supabase!')

        // 2. Tự động đẩy sang API Tasks
        try {
          const taskResponse = await fetch(`${API_URL}/api/task`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: `Xác nhận chi: ${payload.title}`,
              description: `Danh mục: ${payload.category || 'Khác'} | Số tiền: ${formatCurrency(payload.amount)} | Ngày: ${payload.date}`,
            }),
          });

          if (!taskResponse.ok) {
            console.error('Lưu chi tiêu thành công nhưng không thể tạo task.');
          } else {
            console.log('Đã tự động tạo Task thành công!');
          }
        } catch (taskError) {
          console.error('Lỗi khi gọi API /api/tasks:', taskError);
        }

      } catch (error) {
        console.error("Lỗi POST:", error);
        setSubmitError(error.message)
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  const handleOpenDetails = (title, value, description) => {
    setSelectedDetails({ title, value, description })
  }

  const handleCloseDetails = () => {
    setSelectedDetails(null)
  }

  const handleCheckHealth = async () => {
    setShowHealthModal(true)
    setHealthData({ status: 'loading', data: null })
    
    try {
      const res = await fetch(`${API_URL}/api/health`)
      if (!res.ok) throw new Error(`Lỗi kết nối HTTP: ${res.status}`)
      const data = await res.json()
      setHealthData({ status: 'success', data })
    } catch (err) {
      setHealthData({ status: 'error', data: err.message })
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="eyebrow">Quản lý chi tiêu</p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              className="theme-toggle-btn" 
              onClick={handleCheckHealth}
              style={{ background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)' }}
            >
              🚀 Trạng Thái API
            </button>
            
            <button 
              className="theme-toggle-btn" 
              onClick={() => window.open(`${API_URL}/api/health`, '_blank')}
              style={{ background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.4)' }}
            >
              🔗 Link API
            </button>

            <button 
              className="theme-toggle-btn" 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ padding: '0.5rem 1rem' }}
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
        
        <h1>Quản lý chi tiêu cá nhân</h1>
        <p className="subtitle">
          Thêm khoản chi, xem lịch sử giao dịch và tính tổng theo ngày, tháng hoặc khoảng thời gian tùy chọn.
        </p>
      </header>

      <section className="overview-grid" aria-label="Tổng quan chi tiêu">
        <article 
          className="overview-card overview-card--primary clickable"
          style={{ background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15), rgba(15, 118, 110, 0.05))', borderColor: 'var(--accent)' }}
          onClick={() => setShowGrandTotalModal(true)}
        >
          <span>Tổng tiền chính thức</span>
          <strong style={{ color: 'var(--accent)' }}>{formatCurrency(grandTotalAmount)}</strong>
          <p>Nhấn để xem {sortedTransactions.length} giao dịch</p>
        </article>

        <article 
          className="overview-card clickable"
          onClick={() => handleOpenDetails('Tổng chi theo bộ lọc', formatCurrency(totalAmount), 'Chỉ tính các giao dịch trong thời gian bạn đang xem')}
        >
          <span>Chi tiêu đang lọc</span>
          <strong>{formatCurrency(totalAmount)}</strong>
          <p>Tiền trong khoảng bộ lọc</p>
        </article>

        <article 
          className="overview-card clickable"
          onClick={() => handleOpenDetails('Khoản chi lớn nhất', formatCurrency(highestExpense), 'Chi phí cao nhất trong danh sách')}
        >
          <span>Khoản lớn nhất</span>
          <strong>{formatCurrency(highestExpense)}</strong>
          <p>Giao dịch cao nhất</p>
        </article>

        <article 
          className="overview-card clickable"
          onClick={() => handleOpenDetails('Ngày mới nhất', latestTransactionDate, 'Giao dịch gần nhất được thêm vào')}
        >
          <span>Ngày mới nhất</span>
          <strong>{latestTransactionDate}</strong>
          <p>Giao dịch gần nhất</p>
        </article>
      </section>

      <ExpenseForm
        formData={formData}
        currentTime={currentTime}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitSuccess={submitSuccess}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />

      {!apiReady && listError ? (
        <section className="panel panel--notice" style={{ borderColor: 'red', background: 'rgba(255,0,0,0.05)' }}>
          <h2 style={{ color: 'red' }}>Mất kết nối Database</h2>
          <p>{listError}</p>
        </section>
      ) : null}

      <TimeFilterPanel
        filterType={filterType}
        dayFilter={dayFilter}
        monthFilter={monthFilter}
        rangeFilter={rangeFilter}
        totalAmount={totalAmount}
        filteredCount={filteredTransactions.length}
        setFilterType={setFilterType}
        setDayFilter={setDayFilter}
        setMonthFilter={setMonthFilter}
        setRangeFilter={setRangeFilter}
        onOpenFilteredList={() => setShowFilteredListModal(true)} 
      />

      <TransactionsTable
        listLoading={listLoading}
        listError={listError}
        listNotice={listNotice}
        transactions={sortedTransactions}
        liveDraftTransaction={liveDraftTransaction}
        onReload={loadTransactions}
      />

      {selectedDetails && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseDetails}>&times;</button>
            <h2 className="modal-title">Chi Tiết Thẻ</h2>
            <div className="modal-body">
              <span className="modal-label">{selectedDetails.title}</span>
              <strong className="modal-value-large">{selectedDetails.value}</strong>
              <p className="modal-desc-large">{selectedDetails.description}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseDetails}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showHealthModal && (
        <div className="modal-overlay" onClick={() => setShowHealthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="modal-close-btn" onClick={() => setShowHealthModal(false)}>&times;</button>
            
            <h2 className="modal-title">☁️ Trạng Thái Kết Nối API</h2>
            
            <div className="modal-body">
              <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', wordBreak: 'break-all' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Đang truy vấn tới:</span>
                <br />
                <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{API_URL}</strong>
              </div>

              {healthData.status === 'loading' && <p>Đang kiểm tra kết nối...</p>}
              
              {healthData.status === 'error' && (
                <div className="message error">
                  <strong>Thất bại!</strong>
                  <p>{healthData.data}</p>
                </div>
              )}

              {healthData.status === 'success' && (
                <div>
                  <div className="message success" style={{ marginBottom: '1rem' }}>
                    <strong>✅ {healthData.data.message || 'Kết nối thành công'}</strong>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowHealthModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showGrandTotalModal && (
        <div className="modal-overlay" onClick={() => setShowGrandTotalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setShowGrandTotalModal(false)}>&times;</button>
            <h2 className="modal-title">Danh Sách Toàn Bộ Giao Dịch</h2>
            
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', background: 'rgba(45, 212, 191, 0.1)', borderRadius: '14px' }}>
                <span className="modal-label" style={{ margin: 0 }}>Tổng cộng:</span>
                <strong className="modal-value-large" style={{ fontSize: '1.5rem' }}>{formatCurrency(grandTotalAmount)}</strong>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Khoản chi</th>
                      <th>Danh mục</th>
                      <th>Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center' }}>Chưa có dữ liệu</td></tr>
                    ) : (
                      sortedTransactions.map((item, index) => (
                        <tr key={item.id ?? index}>
                          <td>{item.date}</td>
                          <td><strong>{item.title}</strong></td>
                          <td>{item.category}</td>
                          <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                            {formatCurrency(Number(item.amount || 0))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowGrandTotalModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showFilteredListModal && (
        <div className="modal-overlay" onClick={() => setShowFilteredListModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setShowFilteredListModal(false)}>&times;</button>
            <h2 className="modal-title">Danh Sách Đang Lọc ({getFilterLabel(filterType)})</h2>
            
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', background: 'rgba(15, 118, 110, 0.1)', borderRadius: '14px', border: '1px solid var(--accent)' }}>
                <span className="modal-label" style={{ margin: 0 }}>Tổng tiền đã lọc:</span>
                <strong className="modal-value-large" style={{ fontSize: '1.5rem' }}>{formatCurrency(totalAmount)}</strong>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Khoản chi</th>
                      <th>Danh mục</th>
                      <th>Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center' }}>Không có dữ liệu phù hợp bộ lọc</td></tr>
                    ) : (
                      filteredTransactions.map((item, index) => (
                        <tr key={item.id ?? index}>
                          <td>{item.date}</td>
                          <td><strong>{item.title}</strong></td>
                          <td>{item.category}</td>
                          <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                            {formatCurrency(Number(item.amount || 0))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowFilteredListModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App