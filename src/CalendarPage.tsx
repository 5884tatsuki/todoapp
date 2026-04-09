import { useState } from 'react'
import './CalendarPage.css'

interface Todo {
  id: string
  title: string
  content: string
  color: 'red' | 'blue' | 'green' | 'purple'
  dueDate?: string
}

interface CalendarPageProps {
  todos: Todo[]
  onBack: () => void
  onEditTodo: (todo: Todo) => void
  onDeleteTodo: (todoId: string) => void
}

export default function CalendarPage({ todos, onBack, onEditTodo, onDeleteTodo }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 27)) // March 27, 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editColor, setEditColor] = useState<'red' | 'blue' | 'green' | 'purple'>('red')
  const [editDueDate, setEditDueDate] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getTodosForDate = (date: string): Todo[] => {
    return todos.filter((todo) => todo.dueDate === date)
  }

  const handleOpenEditModal = (todo: Todo) => {
    setEditingTodo(todo)
    setEditTitle(todo.title)
    setEditContent(todo.content)
    setEditColor(todo.color)
    setEditDueDate(todo.dueDate || '')
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingTodo(null)
    setEditTitle('')
    setEditContent('')
    setEditColor('red')
    setEditDueDate('')
  }

  const handleSaveEdit = () => {
    if (editingTodo && editTitle.trim()) {
      onEditTodo({
        ...editingTodo,
        title: editTitle,
        content: editContent,
        color: editColor,
        dueDate: editDueDate || undefined
      })
      handleCloseEditModal()
    }
  }

  const formatDate = (day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const calendarDays = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <button onClick={onBack} className="btn-back">← 戻る</button>
        <h1>カレンダー</h1>
      </div>

      <div className="calendar-container">
        <div className="calendar-navigation">
          <button onClick={prevMonth} className="btn-nav-month">◀</button>
          <h2>{year}年 {monthNames[month]}</h2>
          <button onClick={nextMonth} className="btn-nav-month">▶</button>
        </div>

        <div className="calendar-grid">
          {weekDays.map((day) => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            const dateStr = day ? formatDate(day) : null
            const dayTodos = dateStr ? getTodosForDate(dateStr) : []
            const isSelected = dateStr === selectedDate
            const uniqueColors = [...new Set(dayTodos.map(todo => todo.color))]

            return (
              <div
                key={index}
                className={`calendar-day ${day ? '' : 'empty'} ${isSelected ? 'selected' : ''}`}
                onClick={() => dateStr && setSelectedDate(dateStr)}
              >
                {day && (
                  <>
                    <div className="day-number">{day}</div>
                    <div className="day-todos">
                      {dayTodos.slice(0, 2).map((todo) => (
                        <div
                          key={todo.id}
                          className={`mini-todo todo-${todo.color}`}
                          title={todo.title}
                        >
                          {todo.title}
                        </div>
                      ))}
                      {dayTodos.length > 2 && (
                        <div className="todos-more">+{dayTodos.length - 2}件</div>
                      )}
                    </div>
                    {uniqueColors.length > 0 && (
                      <div className="color-indicators">
                        {uniqueColors.map((color) => (
                          <div
                            key={color}
                            className={`color-dot color-dot-${color}`}
                            title={`${dayTodos.filter(t => t.color === color).length}件`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {selectedDate && (
          <div className="selected-date-details">
            <h3>{selectedDate}の予定</h3>
            <div className="todo-details-list">
              {getTodosForDate(selectedDate).length === 0 ? (
                <p className="no-todos">この日の予定はありません</p>
              ) : (
                getTodosForDate(selectedDate).map((todo) => (
                  <div key={todo.id} className={`detail-todo todo-${todo.color}`}>
                    <div className="detail-todo-header">
                      <div>
                        <h4>{todo.title}</h4>
                        <p>{todo.content}</p>
                      </div>
                      <div className="detail-todo-actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleOpenEditModal(todo)}
                          title="編集"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => {
                            if (confirm('このTODOを削除しますか？')) {
                              onDeleteTodo(todo.id)
                            }
                          }}
                          title="削除"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="modal-overlay" onClick={handleCloseEditModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>TODOを編集</h2>
              
              <div className="form-group">
                <label>タイトル</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="タイトルを入力"
                />
              </div>

              <div className="form-group">
                <label>内容</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="内容を入力"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>色を選択</label>
                <div className="color-options">
                  {(['red', 'blue', 'green', 'purple'] as const).map((color) => (
                    <button
                      key={color}
                      className={`color-btn color-${color} ${editColor === color ? 'selected' : ''}`}
                      onClick={() => setEditColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>期限日</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>

              <div className="modal-buttons">
                <button onClick={handleSaveEdit} className="btn-submit">
                  更新
                </button>
                <button onClick={handleCloseEditModal} className="btn-cancel">キャンセル</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
