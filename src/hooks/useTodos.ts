import { useQuery } from '@tanstack/react-query'
import { db } from '../firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'

interface Todo {
  id: string
  title: string
  content: string
  color: 'red' | 'blue' | 'green' | 'purple'
  dueDate?: string
}

function fetchTodos(userId: string): Promise<Todo[]> {
  return new Promise((resolve, reject) => {
    if (!userId) {
      resolve([])
      return
    }

    const q = query(collection(db, 'users', userId, 'todos'))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const todosData: Todo[] = []
        querySnapshot.forEach((doc) => {
          todosData.push({
            id: doc.id,
            ...doc.data() as Omit<Todo, 'id'>
          })
        })
        resolve(todosData)
      },
      (error) => reject(error)
    )

    // Keep listener active but resolve immediately
    return () => unsubscribe()
  })
}

export function useTodos(userId: string | null) {
  return useQuery<Todo[]>({
    queryKey: ['todos', userId],
    queryFn: () => fetchTodos(userId || ''),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5分間
  })
}
