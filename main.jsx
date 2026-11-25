import React from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  Plus,
  Search,
  LayoutGrid,
  CheckCircle2,
  CircleDashed,
  Clock3,
  AlertCircle,
  X,
  Trash2,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ListFilter,
  Pencil,
} from 'lucide-react';
import './style.css';

const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = Boolean(url && key && !url.includes('YOUR_PROJECT'));
const supabase = configured ? createClient(url, key) : null;
const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'in_progress', label: 'In Progress', color: '#818cf8' },
  { id: 'in_review', label: 'In Review', color: '#fbbf24' },
  { id: 'done', label: 'Done', color: '#34d399' },
];
const initialForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'normal',
  due_date: '',
};
const dateLabel = (d) =>
  d
    ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '';
function TaskCard({ task, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  const overdue =
    task.due_date &&
    task.due_date < new Date().toLocaleDateString('en-CA') &&
    task.status !== 'done';
  return (
    <article
      ref={setNodeRef}
      className={'task-card ' + (isDragging ? 'dragging' : '')}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
      }}
      {...listeners}
      {...attributes}
    >
      <div className="task-top">
        <span className={'priority ' + task.priority}>
          <span className="priority-dot" />
          {task.priority}
        </span>
        <button
          className="icon-btn edit"
          title="Edit task"
          aria-label={'Edit ' + task.title}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(task)}
        >
          <Pencil size={14} />
        </button>
      </div>
      <h3>{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-bottom">
        <span className="task-id">
          TASK-{task.id.slice(0, 4).toUpperCase()}
        </span>
        {task.due_date && (
          <span className={'date ' + (overdue ? 'overdue' : '')}>
            <CalendarDays size={13} />
            {dateLabel(task.due_date)}
          </span>
        )}
      </div>
    </article>
  );
}
function Column({ column, tasks, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section className={'column ' + (isOver ? 'over' : '')} ref={setNodeRef}>
      <header className="column-head">
        <span className="column-mark" style={{ background: column.color }} />
        <h2>{column.label}</h2>
        <span className="count">{tasks.length}</span>
      </header>
      <div className="column-body">
        {tasks.length ? (
          tasks.map((t) => <TaskCard key={t.id} task={t} onEdit={onEdit} />)
        ) : (
          <div className="empty">
            <CircleDashed size={23} />
            <span>No tasks yet</span>
            <small>Drop a task here</small>
          </div>
        )}
      </div>
    </section>
  );
}
function Modal({ task, onClose, onSave, onDelete, busy }) {
  const [form, setForm] = React.useState(
    task ? { ...task, due_date: task.due_date || '' } : initialForm
  );
  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.title.trim()) onSave(form);
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">TASK DETAILS</span>
            <h2>{task ? 'Edit task' : 'Create a task'}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <label>
          Task title{' '}
          <input
            required
            maxLength={200}
            autoFocus
            placeholder="What needs to get done?"
            value={form.title}
            onChange={(e) => change('title', e.target.value)}
          />
        </label>
        <label>
          Description{' '}
          <textarea
            rows={3}
            placeholder="Add some details (optional)"
            value={form.description}
            onChange={(e) => change('description', e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={form.priority}
              onChange={(e) => change('priority', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <label>
          Due date{' '}
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => change('due_date', e.target.value)}
          />
        </label>
        <div className="modal-actions">
          {task && (
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={() => onDelete(task.id)}
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary"
            disabled={busy || !form.title.trim()}
            type="submit"
          >
            {busy ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
function App() {
  const [session, setSession] = React.useState(null),
    [tasks, setTasks] = React.useState([]),
    [loading, setLoading] = React.useState(true),
    [error, setError] = React.useState(''),
    [modal, setModal] = React.useState(undefined),
    [busy, setBusy] = React.useState(false),
    [search, setSearch] = React.useState(''),
    [filter, setFilter] = React.useState('all');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    })
  );
  const load = React.useCallback(async () => {
    if (!supabase) return;
    setError('');
    const { data, error: e } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (e) setError(e.message);
    else setTasks(data || []);
  }, []);
  React.useEffect(() => {
    let active = true;
    async function start() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        let {
          data: { session: s },
          error: e,
        } = await supabase.auth.getSession();
        if (e) throw e;
        if (!s) {
          const res = await supabase.auth.signInAnonymously();
          if (res.error) throw res.error;
          s = res.data.session;
        }
        if (active) setSession(s);
      } catch (e) {
        if (active) setError('Could not start a guest session: ' + e.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    start();
    return () => {
      active = false;
    };
  }, []);
  React.useEffect(() => {
    if (session) load();
  }, [session, load]);
  async function save(form) {
    if (!session) return;
    setBusy(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      description: form.description || '',
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
    };
    let result;
    if (form.id)
      result = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', form.id)
        .select()
        .single();
    else
      result = await supabase
        .from('tasks')
        .insert({ ...payload, user_id: session.user.id })
        .select()
        .single();
    if (result.error) setError(result.error.message);
    else {
      setTasks((old) =>
        form.id
          ? old.map((t) => (t.id === form.id ? result.data : t))
          : [result.data, ...old]
      );
      setModal(undefined);
    }
    setBusy(false);
  }
  async function remove(id) {
    if (!window.confirm('Delete this task?')) return;
    setBusy(true);
    const { error: e } = await supabase.from('tasks').delete().eq('id', id);
    if (e) setError(e.message);
    else {
      setTasks((old) => old.filter((t) => t.id !== id));
      setModal(undefined);
    }
    setBusy(false);
  }
  async function drop({ active, over }) {
    if (!over || !session) return;
    const target = COLUMNS.find((c) => c.id === over.id)?.id;
    if (!target) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === target) return;
    setTasks((old) =>
      old.map((t) => (t.id === task.id ? { ...t, status: target } : t))
    );
    const { error: e } = await supabase
      .from('tasks')
      .update({ status: target })
      .eq('id', task.id);
    if (e) {
      setTasks((old) =>
        old.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      setError('Could not move task: ' + e.message);
    }
  }
  const today = new Date().toLocaleDateString('en-CA');
  const completed = tasks.filter((t) => t.status === 'done').length,
    overdue = tasks.filter(
      (t) => t.due_date && t.due_date < today && t.status !== 'done'
    ).length;
  const visible = tasks.filter(
    (t) =>
      (t.title + ' ' + t.description)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === 'all' || t.priority === filter)
  );
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <LayoutGrid size={21} />
          </div>
          <span>
            orbit<span className="brand-period">.</span>
          </span>
        </div>
        <div className="side-section">WORKSPACE</div>
        <div className="side-active">
          <LayoutGrid size={17} /> My board
        </div>
        <div className="sidebar-bottom">
          <div className="avatar">G</div>
          <div>
            <strong>Guest workspace</strong>
            <small>Private task board</small>
          </div>
          <span className="online" />
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <span>
            Workspace <span className="crumb">/</span> <strong>My board</strong>
          </span>
          <div className="top-right">
            <span className="live-dot" /> Auto-saved to cloud
          </div>
        </div>
        <div className="content">
          <div className="heading">
            <div>
              <div className="eyebrow">
                <Sparkles size={13} /> YOUR WORKSPACE
              </div>
              <h1>
                Project board <span className="heading-star">✳</span>
              </h1>
              <p>Keep your projects moving, one task at a time.</p>
            </div>
            <button
              className="primary new-task"
              disabled={!session}
              onClick={() => setModal(null)}
            >
              <Plus size={18} /> New task
            </button>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-icon violet">
                <LayoutGrid size={19} />
              </span>
              <div>
                <small>Total tasks</small>
                <strong>{tasks.length}</strong>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon blue">
                <Clock3 size={19} />
              </span>
              <div>
                <small>In progress</small>
                <strong>
                  {tasks.filter((t) => t.status === 'in_progress').length}
                </strong>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon green">
                <CheckCircle2 size={19} />
              </span>
              <div>
                <small>Completed</small>
                <strong>{completed}</strong>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon orange">
                <AlertCircle size={19} />
              </span>
              <div>
                <small>Overdue</small>
                <strong>{overdue}</strong>
              </div>
            </div>
          </div>
          <div className="board-header">
            <div>
              <h2>Board view</h2>
              <span>
                {tasks.length} tasks across {COLUMNS.length} stages
              </span>
            </div>
            <div className="tools">
              <div className="search">
                <Search size={17} />
                <input
                  aria-label="Search tasks"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filter">
                <ListFilter size={16} />
                <select
                  aria-label="Filter by priority"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All priorities</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
          {!configured && (
            <div className="notice">
              <AlertCircle size={18} /> Connect Supabase to enable guest sign-in
              and task storage. See README.md for setup instructions.
            </div>
          )}
          {error && (
            <div className="notice error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={load} title="Retry">
                <RefreshCw size={16} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading">
              <RefreshCw size={23} className="spin" /> Starting your workspace…
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={drop}>
              <div className="board">
                {COLUMNS.map((c) => (
                  <Column
                    key={c.id}
                    column={c}
                    tasks={visible.filter((t) => t.status === c.id)}
                    onEdit={setModal}
                  />
                ))}
              </div>
            </DndContext>
          )}
          <footer>
            <span>
              <span className="live-dot" />{' '}
              {session
                ? 'Your changes are saved in Supabase'
                : 'Connect Supabase to start'}
            </span>
            <span>
              Built for focused teams <ArrowRight size={14} />
            </span>
          </footer>
        </div>
      </main>
      {modal !== undefined && (
        <Modal
          key={modal?.id || 'new'}
          task={modal}
          onClose={() => setModal(undefined)}
          onSave={save}
          onDelete={remove}
          busy={busy}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
