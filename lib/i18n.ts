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
