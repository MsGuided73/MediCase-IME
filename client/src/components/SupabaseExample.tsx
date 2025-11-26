import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Todo {
  id: number;
  task: string;
  completed: boolean;
}

function SupabaseExample() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodos();
  }, []);

  async function getTodos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*');

      if (error) {
        setError(error.message);
      } else {
        setTodos(data || []);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Supabase Example - Todos</h2>
      {todos.length === 0 ? (
        <p>No todos found. Create some in your Supabase dashboard!</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              {todo.task} {todo.completed ? '✅' : '⏳'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SupabaseExample;
