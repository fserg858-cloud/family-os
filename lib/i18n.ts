export type Locale = "ru" | "en";

export const LOCALES: Locale[] = ["ru", "en"];

const DICT = {
  // Bottom nav
  "nav.home": { ru: "Главная", en: "Home" },
  "nav.tasks": { ru: "Задачи", en: "Tasks" },
  "nav.events": { ru: "События", en: "Events" },
  "nav.profile": { ru: "Профиль", en: "Profile" },
  "nav.add_task": { ru: "Добавить задачу", en: "Add task" },

  // Top bar
  "top.greeting": { ru: "Привет", en: "Hi" },
  "top.notifications": { ru: "Уведомления", en: "Notifications" },

  // Dashboard
  "dash.today": { ru: "сегодня", en: "today" },
  "dash.family": { ru: "Семья", en: "Family" },
  "dash.see_all": { ru: "Все →", en: "All →" },
  "dash.today_tasks": { ru: "Задачи на сегодня", en: "Today's tasks" },
  "dash.free_day": { ru: "Свободный день. Можно", en: "Free day. You can" },
  "dash.add_task_inline": { ru: "добавить задачу", en: "add a task" },
  "dash.events": { ru: "События", en: "Events" },
  "dash.history": { ru: "История →", en: "History →" },
  "dash.quiet": { ru: "Сегодня тихо", en: "Quiet today" },
  "dash.shortcut.calendar": { ru: "Календарь", en: "Calendar" },
  "dash.shortcut.menu": { ru: "Меню недели", en: "Weekly menu" },
  "dash.shortcut.shopping": { ru: "Покупки", en: "Shopping" },

  // Profile
  "profile.level": { ru: "Уровень", en: "Level" },
  "profile.tasks_today": { ru: "Задач сегодня", en: "Tasks today" },
  "profile.streak": { ru: "Серия", en: "Streak" },
  "profile.xp_total": { ru: "XP всего", en: "Total XP" },
  "profile.achievements": { ru: "Достижения", en: "Achievements" },
  "profile.no_achievements": {
    ru: "Пусто. Закрывай задачи и привычки — здесь появятся.",
    en: "Empty. Close tasks and habits — they'll show up here.",
  },
  "profile.today_tasks": { ru: "Задачи на сегодня", en: "Today's tasks" },
  "profile.free": { ru: "Свободно", en: "Free" },
  "profile.sections": { ru: "Разделы", en: "Sections" },
  "profile.section.assistant": { ru: "AI ассистент", en: "AI assistant" },
  "profile.section.memory": { ru: "Память агента", en: "Agent memory" },
  "profile.section.habits": { ru: "Привычки", en: "Habits" },
  "profile.section.goals": { ru: "Цели", en: "Goals" },
  "profile.section.health": { ru: "Здоровье", en: "Health" },
  "profile.section.reflection": { ru: "Рефлексия", en: "Reflection" },
  "profile.section.growth": { ru: "Развитие", en: "Growth" },
  "profile.section.shopping": { ru: "Покупки", en: "Shopping" },
  "profile.section.report": { ru: "Отчёт недели", en: "Weekly report" },
  "profile.logout": { ru: "Выйти", en: "Sign out" },

  // Settings
  "settings.title": { ru: "Настройки", en: "Settings" },
  "settings.theme": { ru: "Тема", en: "Theme" },
  "settings.theme.dark": { ru: "Тёмная", en: "Dark" },
  "settings.theme.light": { ru: "Светлая", en: "Light" },
  "settings.language": { ru: "Язык", en: "Language" },
  "settings.language.ru": { ru: "Русский", en: "Russian" },
  "settings.language.en": { ru: "Английский", en: "English" },

  // Common
  "common.someone": { ru: "Кто-то", en: "Someone" },
  "common.cancel": { ru: "Отмена", en: "Cancel" },
  "common.save": { ru: "Сохранить", en: "Save" },
  "common.saving": { ru: "Сохраняю...", en: "Saving..." },
  "common.add": { ru: "Добавить", en: "Add" },
  "common.delete": { ru: "Удалить", en: "Delete" },
  "common.done": { ru: "Готово", en: "Done" },
  "common.error": { ru: "Ошибка", en: "Error" },
  "common.loading": { ru: "Загрузка...", en: "Loading..." },
  "common.empty": { ru: "Пусто", en: "Empty" },
  "common.back_home": { ru: "На главную", en: "Back home" },
  "common.or": { ru: "или", en: "or" },
  "common.password": { ru: "Пароль", en: "Password" },
  "common.thinking": { ru: "Думаю...", en: "Thinking..." },
  "common.update": { ru: "Обновить", en: "Refresh" },

  // Time-ago
  "time.just_now": { ru: "только что", en: "just now" },
  "time.minutes_ago": { ru: "мин назад", en: "min ago" },
  "time.hours_ago": { ru: "ч назад", en: "h ago" },
  "time.days_ago": { ru: "дн назад", en: "d ago" },
  "time.today": { ru: "Сегодня", en: "Today" },
  "time.earlier": { ru: "Ранее", en: "Earlier" },

  // Meta / app
  "meta.description": {
    ru: "Семейный хаб: задачи, события, привычки и AI-ассистент",
    en: "Family hub: tasks, events, habits and AI assistant",
  },

  // 404
  "notfound.title": { ru: "Страница не найдена", en: "Page not found" },

  // Auth pages
  "auth.tagline": { ru: "Семейный хаб для всех", en: "Family hub for everyone" },
  "auth.login": { ru: "Войти", en: "Sign in" },
  "auth.logging_in": { ru: "Вход...", en: "Signing in..." },
  "auth.no_account": { ru: "Нет аккаунта?", en: "No account?" },
  "auth.register": { ru: "Зарегистрироваться", en: "Sign up" },
  "auth.have_account": { ru: "Уже есть аккаунт?", en: "Already have an account?" },
  "auth.or_email": { ru: "или email", en: "or email" },
  "auth.name": { ru: "Имя", en: "Name" },
  "auth.name_placeholder": { ru: "Как тебя зовут", en: "Your name" },
  "auth.password_placeholder": { ru: "Минимум 6 символов", en: "Min 6 characters" },
  "auth.create_account": { ru: "Создать аккаунт", en: "Create account" },
  "auth.creating": { ru: "Создание...", en: "Creating..." },

  // Setup page
  "setup.env_url": { ru: "URL Supabase-проекта", en: "Supabase project URL" },
  "setup.env_anon": { ru: "Публичный anon-ключ", en: "Public anon key" },
  "setup.env_service": { ru: "Service role (только сервер)", en: "Service role (server only)" },
  "setup.env_claude": { ru: "Ключ Claude API", en: "Claude API key" },
  "setup.env_app_url": { ru: "Публичный URL приложения", en: "Public app URL" },
  "setup.env_cron": { ru: "Случайная строка для cron", en: "Random cron string" },
  "setup.title": { ru: "Не выставлены переменные окружения", en: "Environment variables not set" },
  "setup.instructions": {
    ru: "Добавь ключи в Vercel → Project → Settings → Environment Variables, затем нажми Redeploy.",
    en: "Add keys in Vercel → Project → Settings → Environment Variables, then click Redeploy.",
  },
  "setup.missing": { ru: "нет", en: "missing" },
  "setup.ok": { ru: "ok", en: "ok" },
  "setup.final": {
    ru: "После добавления — Vercel → Deployments → ⋯ → Redeploy. Эта страница исчезнет.",
    en: "After adding — Vercel → Deployments → ⋯ → Redeploy. This page will disappear.",
  },

  // Events page
  "events.title": { ru: "События", en: "Events" },
  "events.subtitle": { ru: "Что происходит в семье на неделе", en: "What's happening in the family this week" },
  "events.section": { ru: "События", en: "Events" },
  "events.empty": { ru: "Тихо", en: "Quiet" },
  "events.day_tasks": { ru: "Задачи дня", en: "Tasks of the day" },
  "events.no_tasks": { ru: "Задач нет", en: "No tasks" },
  "events.any": { ru: "Любой", en: "Anyone" },

  // Event descriptions (kind → text)
  "event.habit_logged": { ru: "закрыл привычку", en: "completed habit" },
  "event.task_completed": { ru: "выполнил задачу", en: "completed task" },
  "event.task_created": { ru: "добавил задачу", en: "created task" },
  "event.reflection_saved": { ru: "записал рефлексию", en: "logged a reflection" },
  "event.goal_completed": { ru: "достиг цели", en: "reached goal" },
  "event.challenge_progress": { ru: "продвинулся в челлендже", en: "progressed in challenge" },
  "event.shopping_added": { ru: "добавил в список", en: "added to list" },

  // Tasks
  "tasks.title": { ru: "Задачи", en: "Tasks" },
  "tasks.subtitle": { ru: "Свайп вправо — выполнить, влево — удалить", en: "Swipe right to complete, left to delete" },
  "tasks.filter.all": { ru: "Все", en: "All" },
  "tasks.filter.active": { ru: "Активные", en: "Active" },
  "tasks.filter.done": { ru: "Готово", en: "Done" },
  "tasks.empty": { ru: "Здесь пусто. Жми + внизу, чтобы добавить.", en: "Empty here. Tap + below to add one." },
  "tasks.swipe.done": { ru: "Готово", en: "Done" },
  "tasks.swipe.delete": { ru: "Удалить", en: "Delete" },

  // Create task
  "task.new": { ru: "Новая задача", en: "New task" },
  "task.form.title": { ru: "Название", en: "Title" },
  "task.form.title_placeholder": { ru: "Помыть посуду", en: "Wash the dishes" },
  "task.form.note": { ru: "Заметка", en: "Note" },
  "task.form.note_placeholder": { ru: "Детали, контекст, ссылки", en: "Details, context, links" },
  "task.form.assignee": { ru: "Кому", en: "Assignee" },
  "task.form.due": { ru: "Срок", en: "Due" },
  "task.form.category": { ru: "Категория", en: "Category" },
  "task.form.repeat": { ru: "Повтор", en: "Repeat" },
  "task.form.repeat.none": { ru: "Без повтора", en: "No repeat" },
  "task.form.repeat.daily": { ru: "Каждый день", en: "Daily" },
  "task.form.repeat.weekly": { ru: "Каждую неделю", en: "Weekly" },
  "task.form.repeat.monthly": { ru: "Каждый месяц", en: "Monthly" },
  "task.form.priority": { ru: "Приоритет", en: "Priority" },
  "task.form.points": { ru: "Баллы за выполнение", en: "Points on completion" },
  "task.form.create": { ru: "Создать задачу", en: "Create task" },
  "task.form.creating": { ru: "Создание...", en: "Creating..." },

  // Habits
  "habits.title": { ru: "Привычки", en: "Habits" },
  "habits.subtitle": { ru: "Стрики, миелинизация, повторения", en: "Streaks, myelination, repetitions" },
  "habits.new": { ru: "Новая", en: "New" },
  "habits.form.name": { ru: "Привычка", en: "Habit" },
  "habits.form.name_placeholder": { ru: "30 мин чтения", en: "30 min reading" },
  "habits.form.why": { ru: "Зачем", en: "Why" },
  "habits.form.why_placeholder": { ru: "Снижает кортизол, готовит ко сну", en: "Lowers cortisol, prepares for sleep" },
  "habits.empty": { ru: "Пусто. Добавь первую привычку.", en: "Empty. Add your first habit." },
  "habits.streak": { ru: "стрик", en: "streak" },

  // Goals
  "goals.title": { ru: "Цели", en: "Goals" },
  "goals.subtitle": { ru: "Дневные / недельные / месячные / годовые", en: "Daily / weekly / monthly / yearly" },
  "goals.new": { ru: "Новая цель", en: "New goal" },
  "goals.form.name": { ru: "Цель", en: "Goal" },
  "goals.form.name_placeholder": { ru: "Подтянуться 10 раз", en: "10 pull-ups" },
  "goals.form.horizon": { ru: "Горизонт", en: "Horizon" },
  "goals.form.description": { ru: "Описание", en: "Description" },
  "goals.form.description_placeholder": { ru: "Зачем и как пойму, что достигнута", en: "Why and how I'll know it's done" },
  "goals.empty": { ru: "Нет целей", en: "No goals" },
  "goals.horizon.day": { ru: "День", en: "Day" },
  "goals.horizon.week": { ru: "Неделя", en: "Week" },
  "goals.horizon.month": { ru: "Месяц", en: "Month" },
  "goals.horizon.year": { ru: "Год", en: "Year" },

  // Health
  "health.title": { ru: "Здоровье", en: "Health" },
  "health.tab.nutrition": { ru: "Питание", en: "Nutrition" },
  "health.tab.sleep": { ru: "Сон", en: "Sleep" },
  "health.tab.workout": { ru: "Тренировки", en: "Workouts" },
  "health.tab.metric": { ru: "Метрики", en: "Metrics" },
  "health.tab.water": { ru: "Вода", en: "Water" },
  "health.history": { ru: "История", en: "History" },
  "health.empty": { ru: "Пусто", en: "Empty" },
  "health.log": { ru: "Записать", en: "Log" },
  "health.nutrition.what": { ru: "Что съел/выпил", en: "What you ate/drank" },
  "health.nutrition.placeholder": { ru: "Овсянка с орехами", en: "Oatmeal with nuts" },
  "health.nutrition.kcal": { ru: "Ккал", en: "Kcal" },
  "health.nutrition.protein": { ru: "Б", en: "P" },
  "health.nutrition.fat": { ru: "Ж", en: "F" },
  "health.nutrition.carbs": { ru: "У", en: "C" },
  "health.sleep.hours": { ru: "Часов", en: "Hours" },
  "health.sleep.quality": { ru: "Качество (1–5)", en: "Quality (1–5)" },
  "health.workout.type": { ru: "Тип", en: "Type" },
  "health.workout.placeholder": { ru: "Силовая / бег / йога", en: "Strength / running / yoga" },
  "health.workout.minutes": { ru: "Минут", en: "Minutes" },
  "health.workout.intensity": { ru: "Интенс. (1–5)", en: "Intensity (1–5)" },
  "health.metric.weight": { ru: "Вес", en: "Weight" },
  "health.metric.bp": { ru: "Давление", en: "BP" },
  "health.metric.bp_placeholder": { ru: "120/80", en: "120/80" },
  "health.metric.pulse": { ru: "Пульс", en: "Pulse" },
  "health.water.target_suffix": { ru: "мл", en: "ml" },

  // Shopping
  "shopping.title": { ru: "Покупки", en: "Shopping" },
  "shopping.subtitle": { ru: "Один список на всю семью", en: "One list for the whole family" },
  "shopping.form.what": { ru: "Что купить", en: "What to buy" },
  "shopping.form.what_placeholder": { ru: "Хлеб", en: "Bread" },
  "shopping.form.qty": { ru: "Кол-во", en: "Qty" },
  "shopping.form.qty_placeholder": { ru: "2 шт", en: "2 pcs" },
  "shopping.form.category": { ru: "Категория", en: "Category" },
  "shopping.empty": { ru: "Пусто. Добавь первый продукт ↑", en: "Empty. Add the first item ↑" },
  "shopping.aria.bought": { ru: "Куплено", en: "Bought" },

  // Reflection
  "reflection.title": { ru: "Рефлексия", en: "Reflection" },
  "reflection.subtitle": { ru: "15 минут вечером — мощнее, чем кажется", en: "15 minutes in the evening — more powerful than it seems" },
  "reflection.last_7": { ru: "Последние 7 дней", en: "Last 7 days" },
  "reflection.empty": { ru: "Пока нет записей", en: "No entries yet" },
  "reflection.win_label": { ru: "Победа", en: "Win" },
  "reflection.lesson_label": { ru: "Урок", en: "Lesson" },
  "reflection.step_label": { ru: "Шаг", en: "Step" },
  "reflection.mood": { ru: "Настроение", en: "Mood" },
  "reflection.win": { ru: "Главная победа дня", en: "Top win of the day" },
  "reflection.win_placeholder": { ru: "Что я сделал лучше", en: "What I did better" },
  "reflection.lesson": { ru: "Главный урок", en: "Top lesson" },
  "reflection.lesson_placeholder": { ru: "Что я понял", en: "What I realised" },
  "reflection.step": { ru: "Шаг на завтра", en: "Step for tomorrow" },
  "reflection.step_placeholder": { ru: "Конкретное действие", en: "A specific action" },
  "reflection.submit": { ru: "Сохранить и получить инсайт", en: "Save and get insight" },
  "reflection.ai_insight": { ru: "AI инсайт", en: "AI insight" },

  // Growth
  "growth.title": { ru: "Развитие", en: "Growth" },
  "growth.subtitle": { ru: "Компетенции, материалы, летопись", en: "Skills, materials, milestones" },
  "growth.skills": { ru: "Компетенции", en: "Skills" },
  "growth.empty_skills": { ru: "Добавь первую компетенцию ниже", en: "Add your first skill below" },
  "growth.skill_general": { ru: "общая", en: "general" },
  "growth.timeline": { ru: "Летопись", en: "Timeline" },
  "growth.timeline_empty": { ru: "Достижения появятся, когда выполнишь цели и стрики.", en: "Achievements will appear once you finish goals and streaks." },
  "growth.add_skill": { ru: "Добавить компетенцию", en: "Add skill" },
  "growth.skill_name": { ru: "Название", en: "Name" },
  "growth.skill_name_placeholder": { ru: "Английский", en: "English" },
  "growth.skill_category": { ru: "Категория", en: "Category" },
  "growth.skill_category_placeholder": { ru: "Языки", en: "Languages" },
  "growth.have_already": { ru: "Уже есть: ", en: "Already have: " },
  "growth.materials": { ru: "Учебные материалы", en: "Learning materials" },
  "growth.material_name": { ru: "Название", en: "Title" },
  "growth.material_name_placeholder": { ru: "Why we sleep — M.Walker", en: "Why we sleep — M.Walker" },
  "growth.material_source": { ru: "Источник", en: "Source" },
  "growth.material_source_placeholder": { ru: "Книга / Курс", en: "Book / Course" },
  "growth.material_link": { ru: "Ссылка", en: "Link" },
  "growth.empty": { ru: "Пусто", en: "Empty" },
  "growth.link": { ru: "ссылка", en: "link" },
  "growth.status.queued": { ru: "в очереди", en: "queued" },
  "growth.status.active": { ru: "в работе", en: "active" },
  "growth.status.done": { ru: "завершено", en: "done" },

  // Memory
  "memory.title": { ru: "Память", en: "Memory" },
  "memory.subtitle": { ru: "Что агент знает о тебе", en: "What the agent knows about you" },
  "memory.confirm_clear": { ru: "Удалить ВСЕ паттерны, решения и память? Это необратимо.", en: "Delete ALL patterns, decisions and memory? This cannot be undone." },
  "memory.patterns": { ru: "Мои паттерны", en: "My patterns" },
  "memory.patterns_empty": { ru: "Паттерны накапливаются по мере использования", en: "Patterns accumulate as you use the app" },
  "memory.confirmed_times": { ru: "Подтверждено", en: "Confirmed" },
  "memory.times_unit": { ru: "раз", en: "times" },
  "memory.decisions": { ru: "Сохранённые решения", en: "Saved decisions" },
  "memory.decisions_empty": { ru: "Решений пока нет", en: "No decisions yet" },
  "memory.used_times": { ru: "исп.", en: "used" },
  "memory.useful": { ru: "Полезно", en: "Useful" },
  "memory.useless": { ru: "Бесполезно", en: "Useless" },
  "memory.unrated": { ru: "Не оценено", en: "Unrated" },
  "memory.history": { ru: "История памяти", en: "Memory history" },
  "memory.history_empty": { ru: "Записей нет", en: "No entries" },
  "memory.clear_all": { ru: "Очистить всю память", en: "Clear all memory" },

  // Pattern types
  "pattern.behavior": { ru: "Поведение", en: "Behavior" },
  "pattern.preference": { ru: "Предпочтение", en: "Preference" },
  "pattern.trigger": { ru: "Триггер", en: "Trigger" },
  "pattern.correlation": { ru: "Корреляция", en: "Correlation" },
  "pattern.ritual": { ru: "Ритуал", en: "Ritual" },

  // Family
  "family.title": { ru: "Семья", en: "Family" },
  "family.subtitle": { ru: "Выбери участника, чтобы увидеть его задачи и прогресс", en: "Pick a member to see their tasks and progress" },
  "family.tasks": { ru: "Задачи", en: "Tasks" },
  "family.tasks_of": { ru: "Задачи семьи", en: "Family tasks" },
  "family.no_tasks": { ru: "Нет задач", en: "No tasks" },
  "family.all": { ru: "Все", en: "All" },

  // Calendar
  "calendar.title": { ru: "Календарь семьи", en: "Family calendar" },
  "calendar.subtitle": { ru: "Совместные события + напоминания за 24ч и за 1ч в Telegram", en: "Shared events + 24h and 1h reminders in Telegram" },
  "calendar.error_required": { ru: "Введите название и время", en: "Enter title and time" },
  "calendar.error_generic": { ru: "ошибка", en: "error" },
  "calendar.confirm_delete": { ru: "Удалить событие?", en: "Delete event?" },
  "calendar.new": { ru: "Новое событие", en: "New event" },
  "calendar.form.title": { ru: "Название", en: "Title" },
  "calendar.form.title_placeholder": { ru: "Например: ужин у бабушки", en: "e.g. dinner at grandma's" },
  "calendar.form.when": { ru: "Когда", en: "When" },
  "calendar.form.location": { ru: "Место (необязательно)", en: "Location (optional)" },
  "calendar.form.location_placeholder": { ru: "Например: дом бабушки", en: "e.g. grandma's house" },
  "calendar.form.note": { ru: "Заметка", en: "Note" },
  "calendar.form.note_placeholder": { ru: "Подробности, что взять, кто едет...", en: "Details, what to bring, who goes..." },
  "calendar.upcoming": { ru: "Ближайшие события", en: "Upcoming events" },
  "calendar.empty": { ru: "Пока ничего не запланировано. Добавь первое событие — за 24ч и за 1ч придёт напоминание в Telegram всем участникам.", en: "Nothing planned yet. Add the first event — Telegram reminders go out 24h and 1h before to everyone." },

  // Menu
  "menu.title": { ru: "Меню недели", en: "Weekly menu" },
  "menu.subtitle": { ru: "AI-нутрициолог составит план на 7 дней + список покупок", en: "An AI nutritionist will plan 7 days + a shopping list" },
  "menu.preferences": { ru: "Предпочтения и стиль", en: "Preferences and style" },
  "menu.preferences_placeholder": { ru: "Например: средиземноморский стиль, больше рыбы, минимум сахара, готовлю на 30 мин", en: "e.g. Mediterranean style, more fish, minimal sugar, cook within 30 min" },
  "menu.allergies": { ru: "Аллергии / непереносимости", en: "Allergies / intolerances" },
  "menu.allergies_placeholder": { ru: "Например: лактоза у Игната, орехи", en: "e.g. lactose for Ignat, nuts" },
  "menu.generate": { ru: "Сгенерировать меню недели", en: "Generate weekly menu" },
  "menu.generating": { ru: "Думаю над меню...", en: "Thinking up a menu..." },
  "menu.from_ai": { ru: "от AI-нутрициолога", en: "from the AI nutritionist" },
  "menu.7_days": { ru: "7 дней", en: "7 days" },
  "menu.shopping_list": { ru: "Список покупок", en: "Shopping list" },
  "menu.add_all": { ru: "Добавить всё в список покупок", en: "Add all to shopping list" },
  "menu.added": { ru: "Добавлено", en: "Added" },
  "menu.adding": { ru: "Добавляю…", en: "Adding…" },
  "menu.added_items_suffix": { ru: "позиций ✓", en: "items ✓" },
  "menu.regenerate": { ru: "Сгенерировать заново", en: "Regenerate" },

  // Notifications
  "notifications.title": { ru: "Уведомления", en: "Notifications" },
  "notifications.empty": { ru: "Уведомлений пока нет", en: "No notifications yet" },

  // Report
  "report.title": { ru: "Отчёт недели", en: "Weekly report" },
  "report.from_date": { ru: "с", en: "from" },
  "report.family": { ru: "Семья", en: "Family" },
  "report.events_week": { ru: "События недели", en: "Events this week" },
  "report.ai_overview": { ru: "AI-обзор", en: "AI overview" },
  "report.generate": { ru: "Сгенерировать", en: "Generate" },
  "report.refresh": { ru: "Обновить", en: "Refresh" },
  "report.help": { ru: "Нажми «Сгенерировать» — Claude соберёт обзор по событиям недели.", en: "Tap “Generate” — Claude will assemble a weekly overview from events." },

  // Assistant
  "assistant.title": { ru: "Ассистент", en: "Assistant" },
  "assistant.greeting": { ru: "Привет", en: "Hi" },
  "assistant.ask_prompt": { ru: "Спроси что-нибудь:", en: "Ask anything:" },
  "assistant.placeholder": { ru: "Спроси меня…", en: "Ask me…" },
  "assistant.starter.wake": { ru: "Почему сложно проснуться?", en: "Why is it hard to wake up?" },
  "assistant.starter.dopamine": { ru: "Как работает дофамин?", en: "How does dopamine work?" },
  "assistant.starter.week": { ru: "Разбор моей недели", en: "Review my week" },
  "assistant.starter.today": { ru: "Что сделать сегодня?", en: "What should I do today?" },
  "assistant.starter.stress": { ru: "Объясни механизм стресса", en: "Explain the stress mechanism" },
  "assistant.starter.sleep": { ru: "Как улучшить сон?", en: "How can I improve sleep?" },

  // Telegram button
  "tg.expired": { ru: "Срок действия ссылки истёк. Нажми ещё раз.", en: "Link expired. Tap again." },
  "tg.open_and_start": { ru: "Открой Telegram и нажми «Start»", en: "Open Telegram and press “Start”" },
  "tg.after_confirm": { ru: "После подтверждения в боте эта страница автоматически залогинит тебя.", en: "After confirming in the bot, this page will sign you in automatically." },
  "tg.waiting": { ru: "Жду подтверждения…", en: "Waiting for confirmation…" },
  "tg.fallback": { ru: "Окно с ботом не открылось? Открой вручную", en: "Bot window didn't open? Open it manually" },
  "tg.login": { ru: "Войти через Telegram", en: "Sign in with Telegram" },

  // Proactive message
  "proactive.got_it": { ru: "Понял", en: "Got it" },
  "proactive.open_chat": { ru: "Открыть чат", en: "Open chat" },
  "proactive.close": { ru: "Закрыть", en: "Close" },

  // Member roles
  "member.role.fedor": { ru: "Старший сын", en: "Eldest son" },
  "member.role.ignat": { ru: "Младший сын", en: "Younger son" },
  "member.role.nikolay": { ru: "Папа", en: "Dad" },
  "member.role.elena": { ru: "Мама", en: "Mom" },
  "member.role.tatyana": { ru: "Бабушка", en: "Grandma" },
  "member.role.polina": { ru: "Девушка Фёдора", en: "Fedor's girlfriend" },

  // Task categories
  "task_category.home": { ru: "Дом", en: "Home" },
  "task_category.kids": { ru: "Дети", en: "Kids" },
  "task_category.health": { ru: "Здоровье", en: "Health" },
  "task_category.shopping": { ru: "Покупки", en: "Shopping" },
  "task_category.finance": { ru: "Финансы", en: "Finance" },
  "task_category.other": { ru: "Другое", en: "Other" },

  // Task priorities
  "task_priority.low": { ru: "Низкий", en: "Low" },
  "task_priority.med": { ru: "Средний", en: "Medium" },
  "task_priority.high": { ru: "Высокий", en: "High" },

  // Shopping categories
  "shopping_category.produce": { ru: "Овощи и фрукты", en: "Produce" },
  "shopping_category.dairy": { ru: "Молочное", en: "Dairy" },
  "shopping_category.meat": { ru: "Мясо и рыба", en: "Meat & fish" },
  "shopping_category.grain": { ru: "Бакалея", en: "Pantry" },
  "shopping_category.bakery": { ru: "Хлеб", en: "Bakery" },
  "shopping_category.household": { ru: "Бытовое", en: "Household" },
  "shopping_category.other": { ru: "Другое", en: "Other" },

  // Weekday short
  "weekday.0": { ru: "вс", en: "Sun" },
  "weekday.1": { ru: "пн", en: "Mon" },
  "weekday.2": { ru: "вт", en: "Tue" },
  "weekday.3": { ru: "ср", en: "Wed" },
  "weekday.4": { ru: "чт", en: "Thu" },
  "weekday.5": { ru: "пт", en: "Fri" },
  "weekday.6": { ru: "сб", en: "Sat" },
} as const;

export type TKey = keyof typeof DICT;

export function t(key: TKey, locale: Locale): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[locale] ?? entry.ru ?? key;
}

export function isLocale(v: unknown): v is Locale {
  return v === "ru" || v === "en";
}

export function dateLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "ru-RU";
}

// --- Lookups for dynamic data --------------------------------------------------

export function translateRole(memberKey: string | null | undefined, locale: Locale): string {
  if (!memberKey) return "";
  const k = `member.role.${memberKey}`;
  if (!(k in DICT)) return "";
  return t(k as TKey, locale);
}

export function translateTaskCategory(catKey: string | null | undefined, locale: Locale): string {
  if (!catKey) return "";
  const k = `task_category.${catKey}`;
  if (!(k in DICT)) return catKey;
  return t(k as TKey, locale);
}

export function translateTaskPriority(pKey: string | null | undefined, locale: Locale): string {
  if (!pKey) return "";
  const k = `task_priority.${pKey}`;
  if (!(k in DICT)) return pKey;
  return t(k as TKey, locale);
}

export function translateShoppingCategory(catKey: string | null | undefined, locale: Locale): string {
  if (!catKey) return "";
  const k = `shopping_category.${catKey}`;
  if (!(k in DICT)) return catKey;
  return t(k as TKey, locale);
}

export function translateGoalHorizon(h: string | null | undefined, locale: Locale): string {
  if (!h) return "";
  const map: Record<string, TKey> = {
    daily: "goals.horizon.day",
    weekly: "goals.horizon.week",
    monthly: "goals.horizon.month",
    yearly: "goals.horizon.year",
  };
  const key = map[h];
  return key ? t(key, locale) : h;
}

export function translateGrowthStatus(s: string | null | undefined, locale: Locale): string {
  if (!s) return "";
  const map: Record<string, TKey> = {
    queued: "growth.status.queued",
    active: "growth.status.active",
    done: "growth.status.done",
  };
  const key = map[s];
  return key ? t(key, locale) : s;
}

export function translatePatternType(p: string | null | undefined, locale: Locale): string {
  if (!p) return "";
  const map: Record<string, TKey> = {
    behavior: "pattern.behavior",
    preference: "pattern.preference",
    trigger: "pattern.trigger",
    correlation: "pattern.correlation",
    ritual: "pattern.ritual",
  };
  const key = map[p];
  return key ? t(key, locale) : p;
}

export function describeEvent(e: { kind?: string; payload?: any }, locale: Locale): string {
  const kind = e.kind ?? "";
  const title = e.payload?.title ?? "";
  const item = e.payload?.item ?? "";
  const xp = e.payload?.xp ?? 0;
  const map: Record<string, TKey> = {
    habit_logged: "event.habit_logged",
    task_completed: "event.task_completed",
    task_created: "event.task_created",
    reflection_saved: "event.reflection_saved",
    goal_completed: "event.goal_completed",
    challenge_progress: "event.challenge_progress",
    shopping_added: "event.shopping_added",
  };
  const key = map[kind];
  if (!key) return ""; // unknown / internal kind (e.g. tg_login) — render nothing
  const verb = t(key, locale);
  switch (kind) {
    case "habit_logged":
    case "task_created":
    case "goal_completed":
    case "challenge_progress":
      return title ? `${verb} «${title}»` : verb;
    case "task_completed":
      return title ? `${verb} «${title}» (+${xp} XP)` : `${verb} (+${xp} XP)`;
    case "reflection_saved":
      return verb;
    case "shopping_added":
      return item ? `${verb} «${item}»` : verb;
    default:
      return verb;
  }
}

export function formatTimeAgo(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return t("time.just_now", locale);
  if (diffMin < 60) return `${diffMin} ${t("time.minutes_ago", locale)}`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} ${t("time.hours_ago", locale)}`;
  const d2 = Math.floor(h / 24);
  return `${d2} ${t("time.days_ago", locale)}`;
}
