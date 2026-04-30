"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, MapPin, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

interface CalendarEvent {
  id: string;
  title: string;
  notes?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  created_by?: string | null;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CalendarClient({ initial }: { initial: CalendarEvent[] }) {
  const [events, setEvents] = useState<CalendarEvent[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInputValue(defaultStart.toISOString()));
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setTitle("");
    setLocation("");
    setNotes("");
    setStartsAt(toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000).toISOString()));
    setError(null);
  }

  async function add() {
    if (!title.trim() || !startsAt) {
      setError("Введите название и время");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/calendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          starts_at: new Date(startsAt).toISOString(),
          location: location.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "ошибка");
      setEvents((prev) =>
        [...prev, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
      );
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить событие?")) return;
    const prev = events;
    setEvents((es) => es.filter((e) => e.id !== id));
    try {
      const r = await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    } catch {
      setEvents(prev);
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} block size="lg">
          <CalendarPlus size={18} />
          Новое событие
        </Button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="surface p-4 space-y-3"
          >
            <div>
              <Label>Название</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: ужин у бабушки"
              />
            </div>
            <div>
              <Label>Когда</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Место (необязательно)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Например: дом бабушки"
              />
            </div>
            <div>
              <Label>Заметка</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Подробности, что взять, кто едет..."
              />
            </div>
            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={add} disabled={busy} block>
                {busy ? "Сохраняю…" : "Сохранить"}
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                variant="ghost"
              >
                Отмена
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-2">
        Ближайшие события
      </h3>

      {events.length === 0 ? (
        <div className="surface p-6 text-center text-sm text-muted">
          Пока ничего не запланировано. Добавь первое событие — за 24ч и за 1ч придёт напоминание в Telegram всем участникам.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-muted mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDateTime(e.starts_at)}
                  </div>
                  {e.location && (
                    <div className="text-xs text-muted mt-1 flex items-center gap-1">
                      <MapPin size={12} />
                      {e.location}
                    </div>
                  )}
                  {e.notes && <div className="text-sm mt-2 text-text/90">{e.notes}</div>}
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="text-muted hover:text-danger p-1 -m-1"
                  aria-label="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
