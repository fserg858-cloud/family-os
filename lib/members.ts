export type MemberKey = "fedor" | "ignat" | "nikolay" | "elena" | "tatyana";
export type UiProfile = "default" | "teen" | "elder";

export interface MemberDef {
  key: MemberKey;
  display_name: string;
  age: number;
  ui_profile: UiProfile;
  role: string;
  voice: string;
  focus: string[];
}

export const MEMBERS: Record<MemberKey, MemberDef> = {
  fedor: {
    key: "fedor",
    display_name: "Фёдор",
    age: 18,
    ui_profile: "default",
    role: "Старший сын, 18 лет",
    voice:
      "Формальный, вдумчивый, как наставник для взрослеющего человека. Уважительный тон, обращайся на «ты», избегай инфантилизма.",
    focus: ["учёба", "карьерный фундамент", "силовые тренировки", "финансовая грамотность"],
  },
  ignat: {
    key: "ignat",
    display_name: "Игнат",
    age: 14,
    ui_profile: "teen",
    role: "Младший сын, подросток",
    voice:
      "Дружелюбный, энергичный, без занудства. Используй простые формулировки и короткие предложения, давай быстрые победы и геймификацию.",
    focus: ["школа", "спорт", "режим сна", "цифровая гигиена"],
  },
  nikolay: {
    key: "nikolay",
    display_name: "Николай",
    age: 45,
    ui_profile: "default",
    role: "Папа, 45 лет",
    voice:
      "Деловой, прямой, плотный по смыслу. Говори как с CEO семьи: фактологично, по делу, со ссылкой на ROI здоровья и времени.",
    focus: ["энергия", "сон", "силовые", "стратегия семьи", "финансы"],
  },
  elena: {
    key: "elena",
    display_name: "Елена",
    age: 43,
    ui_profile: "default",
    role: "Мама, 43 года",
    voice:
      "Тёплый, поддерживающий, конкретный. Говори как с архитектором семейного быта: уважай нагрузку, оптимизируй ресурсы, давай мягкие, но точные шаги.",
    focus: ["гормональный фон", "сон", "питание", "энергия", "семейная атмосфера"],
  },
  tatyana: {
    key: "tatyana",
    display_name: "Татьяна",
    age: 70,
    ui_profile: "elder",
    role: "Бабушка, 70 лет",
    voice:
      "Спокойный, уважительный, неторопливый. Используй простые слова, короткие предложения, избегай сленга и англицизмов. Делай акцент на самочувствии и семейных воспоминаниях.",
    focus: ["самочувствие", "давление", "сон", "память", "истории для внуков"],
  },
};

export const MEMBER_LIST = Object.values(MEMBERS);
