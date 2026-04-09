import './App.css'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from './firebase'
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { useAuth, useTodos } from './hooks'
import CalendarPage from './CalendarPage'

interface Todo {
  id: string
  title: string
  content: string
  color: 'red' | 'blue' | 'green' | 'purple'
  dueDate?: string
}

function Page() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.uid || null
  
  const { data: todos = [], isLoading: todosLoading } = useTodos(userId)
  const queryClient = useQueryClient()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedColor, setSelectedColor] = useState<'red' | 'blue' | 'green' | 'purple'>('red')
  const [dueDate, setDueDate] = useState('')
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list')

  const addTodoMutation = useMutation({
    mutationFn: async (newTodo: Omit<Todo, 'id'>) => {
      return await addDoc(collection(db, 'users', userId!, 'todos'), {
        ...newTodo,
        createdAt: new Date()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', userId] })
    }
  })

  const updateTodoMutation = useMutation({
    mutationFn: async (data: { id: string; todo: Omit<Todo, 'id'> }) => {
      return await updateDoc(doc(db, 'users', userId!, 'todos', data.id), {
        ...data.todo,
        updatedAt: new Date()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', userId] })
    }
  })

  const deleteTodoMutation = useMutation({
    mutationFn: async (todoId: string) => {
      return await deleteDoc(doc(db, 'users', userId!, 'todos', todoId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', userId] })
    }
  })

  const resetForm = () => {
    setTitle('')
    setContent('')
    setSelectedColor('red')
    setDueDate('')
    setEditingTodoId(null)
  }

  const handleOpenModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleEditTodo = (todo: Todo) => {
    setTitle(todo.title)
    setContent(todo.content)
    setSelectedColor(todo.color)
    setDueDate(todo.dueDate || '')
    setEditingTodoId(todo.id)
    setIsModalOpen(true)
  }

  const handleSaveTodo = async () => {
    if (!userId) {
      alert('ログインしてください')
      return
    }

    if (title.trim()) {
      try {
        const todoData = {
          title,
          content,
          color: selectedColor,
          dueDate: dueDate || null
        }

        if (editingTodoId) {
          await updateTodoMutation.mutateAsync({ id: editingTodoId, todo: todoData as Omit<Todo, 'id'> })
        } else {
          await addTodoMutation.mutateAsync(todoData as Omit<Todo, 'id'>)
        }

        resetForm()
        setIsModalOpen(false)
      } catch (error) {
        console.error('Error saving todo: ', error)
        alert('TODOの保存に失敗しました')
      }
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!userId) return

    if (confirm('このTODOを削除しますか？')) {
      try {
        await deleteTodoMutation.mutateAsync(todoId)
      } catch (error) {
        console.error('Error deleting todo: ', error)
        alert('TODOの削除に失敗しました')
      }
    }
  }

  const handleUpdateTodoFromCalendar = async (updatedTodo: Todo) => {
    if (!userId) return

    try {
      const todoData = {
        title: updatedTodo.title,
        content: updatedTodo.content,
        color: updatedTodo.color,
        dueDate: updatedTodo.dueDate || null
      }
      await updateTodoMutation.mutateAsync({ id: updatedTodo.id, todo: todoData as Omit<Todo, 'id'> })
    } catch (error) {
      console.error('Error updating todo: ', error)
      alert('TODOの更新に失敗しました')
    }
  }

  const handleCloseModal = () => {
    resetForm()
    setIsModalOpen(false)
  }

  const filteredTodos = todos.filter((todo) =>
    todo.title.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  const colorOptions = ['red', 'blue', 'green', 'purple'] as const

  if (authLoading || todosLoading) {
    return <div className="page"><p>読み込み中...</p></div>
  }

  if (!userId) {
    return (
      <div className="page">
        <h1>Welcome to My Page</h1>
        <p>ログインしてTODOを使用できます</p>
      </div>
    )
  }

  if (currentView === 'calendar') {
    return (
      <CalendarPage 
        todos={todos} 
        onBack={() => setCurrentView('list')}
        onEditTodo={handleUpdateTodoFromCalendar}
        onDeleteTodo={handleDeleteTodo}
      />
    )
  }

  return (
    <div className="page">
      <h1>あなたのTodoへようこそ</h1>

      <div className="todo-controls">
        <button onClick={handleOpenModal} className="btn-add">+ TODOを追加</button>
        
        <div className="search-container">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="タイトルで検索..."
            className="search-input"
          />
          {searchKeyword && (
            <button
              className="btn-clear-search"
              onClick={() => setSearchKeyword('')}
            >
              ✕
            </button>
          )}
        </div>

        <button onClick={() => setCurrentView('calendar')} className="btn-calendar">
          📅 カレンダー
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTodoId ? 'TODOを編集' : '新しいTODOを追加'}</h2>
            
            <div className="form-group">
              <label>タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="タイトルを入力"
              />
            </div>

            <div className="form-group">
              <label>内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="内容を入力"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>色を選択</label>
              <div className="color-options">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`color-btn color-${color} ${selectedColor === color ? 'selected' : ''}`}
                    onClick={() => setSelectedColor(color)}
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
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="modal-buttons">
              <button onClick={handleSaveTodo} className="btn-submit">
                {editingTodoId ? '更新' : '追加'}
              </button>
              <button onClick={handleCloseModal} className="btn-cancel">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      <div className="todos-list">
        {filteredTodos.length === 0 ? (
          <p className="no-todos">
            {searchKeyword ? '検索結果がありません' : 'TODOがありません'}
          </p>
        ) : (
          <>
            <p className="search-result-count">
              {searchKeyword && `${filteredTodos.length}件の検索結果`}
            </p>
            {filteredTodos.map((todo) => (
              <div key={todo.id} className={`todo-item todo-${todo.color}`}>
                <div className="todo-header">
                  <h3>{todo.title}</h3>
                  <div className="todo-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditTodo(todo)}
                    >
                      ✎
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteTodo(todo.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p>{todo.content}</p>
                {todo.dueDate && (
                  <p className="todo-due-date">期限: {new Date(todo.dueDate).toLocaleDateString('ja-JP')}</p>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default Page
