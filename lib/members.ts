export type MemberKey = "fedor" | "ignat" | "nikolay" | "elena" | "tatyana" | "polina";
export type UiProfile = "default" | "teen" | "elder";

export interface MemberDef {
  key: MemberKey;
  display_name: string;
  short_name: string;
  age: number;
  ui_profile: UiProfile;
  role: string;
  emoji: string;
  color: string;
  voice: string;
  focus: string[];
}

export const MEMBERS: Record<MemberKey, MemberDef> = {
  fedor: {
    key: "fedor",
    display_name: "Фёдор",
    short_name: "Ф",
    age: 18,
    ui_profile: "default",
    role: "Старший сын",
    emoji: "⚡",
    color: "#C9A84C",
    voice:
      "Формальный, вдумчивый, как наставник для взрослеющего человека. Уважительный тон, обращайся на «ты», избегай инфантилизма.",
    focus: ["учёба", "карьерный фундамент", "силовые тренировки", "финансовая грамотность"],
  },
  ignat: {
    key: "ignat",
    display_name: "Игнат",
    short_name: "И",
    age: 14,
    ui_profile: "teen",
    role: "Младший сын",
    emoji: "🦖",
    color: "#4CAF50",
    voice:
      "Дружелюбный, энергичный, без занудства. Используй простые формулировки и короткие предложения, давай быстрые победы и геймификацию.",
    focus: ["школа", "спорт", "режим сна", "цифровая гигиена"],
  },
  nikolay: {
    key: "nikolay",
    display_name: "Николай",
    short_name: "Н",
    age: 45,
    ui_profile: "default",
    role: "Папа",
    emoji: "🚀",
    color: "#4A90D9",
    voice:
      "Деловой, прямой, плотный по смыслу. Говори как с CEO семьи: фактологично, по делу, со ссылкой на ROI здоровья и времени.",
    focus: ["энергия", "сон", "силовые", "стратегия семьи", "финансы"],
  },
  elena: {
    key: "elena",
    display_name: "Елена",
    short_name: "Е",
    age: 43,
    ui_profile: "default",
    role: "Мама",
    emoji: "🌸",
    color: "#FF6B8A",
    voice:
      "Тёплый, поддерживающий, конкретный. Говори как с архитектором семейного быта: уважай нагрузку, оптимизируй ресурсы, давай мягкие, но точные шаги.",
    focus: ["гормональный фон", "сон", "питание", "энергия", "семейная атмосфера"],
  },
  tatyana: {
    key: "tatyana",
    display_name: "Татьяна",
    short_name: "Т",
    age: 70,
    ui_profile: "elder",
    role: "Бабушка",
    emoji: "🌷",
    color: "#9B59B6",
    voice:
      "Спокойный, уважительный, неторопливый. Используй простые слова, короткие предложения, избегай сленга и англицизмов. Делай акцент на самочувствии и семейных воспоминаниях.",
    focus: ["самочувствие", "давление", "сон", "память", "истории для внуков"],
  },
  polina: {
    key: "polina",
    display_name: "Полина",
    short_name: "П",
    age: 19,
    ui_profile: "default",
    role: "Девушка Фёдора",
    emoji: "💖",
    color: "#FF8FB1",
    voice:
      "Тёплый, дружелюбный, на «ты». Говори как с близким человеком: уважай личные планы и совместные с Фёдором, поддерживай интересы и собственные цели, без поучений.",
    focus: ["учёба", "красота и уход", "сон", "совместные планы с Фёдором", "энергия"],
  },
};

export const MEMBER_LIST = Object.values(MEMBERS);

export function getMember(key: string | null | undefined): MemberDef | null {
  if (!key) return null;
  return MEMBERS[key as MemberKey] ?? null;
}

export const TASK_CATEGORIES = [
  { key: "home", label: "Дом", color: "#4A90D9", icon: "🏠" },
  { key: "kids", label: "Дети", color: "#FFB02E", icon: "👶" },
  { key: "health", label: "Здоровье", color: "#4CAF50", icon: "🩺" },
  { key: "shopping", label: "Покупки", color: "#FF6B8A", icon: "🛒" },
  { key: "finance", label: "Финансы", color: "#9B59B6", icon: "💰" },
  { key: "other", label: "Другое", color: "#8E8E93", icon: "📌" },
] as const;

export type TaskCategoryKey = (typeof TASK_CATEGORIES)[number]["key"];

export function getCategory(key: string | null | undefined) {
  return TASK_CATEGORIES.find((c) => c.key === key) ?? TASK_CATEGORIES[5];
}

export const TASK_PRIORITIES = [
  { key: "low", label: "Низкий", color: "#8E8E93" },
  { key: "med", label: "Средний", color: "#FFB02E" },
  { key: "high", label: "Высокий", color: "#FF3B30" },
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number]["key"];

export const SHOPPING_CATEGORIES = [
  { key: "produce", label: "Овощи и фрукты", icon: "🥬" },
  { key: "dairy", label: "Молочное", icon: "🥛" },
  { key: "meat", label: "Мясо и рыба", icon: "🥩" },
  { key: "grain", label: "Бакалея", icon: "🌾" },
  { key: "bakery", label: "Хлеб", icon: "🥐" },
  { key: "household", label: "Бытовое", icon: "🧴" },
  { key: "other", label: "Другое", icon: "🛒" },
] as const;

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number]["key"];
