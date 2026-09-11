export const productAudiences = [
  'Компаниям',
  'Детским садам и школам',
  'Родителям',
  'Для перепродажи',
  'Организаторам',
] as const;
export const productOccasions = [
  'Новый год',
  '8 марта / 23 февраля',
  'Корпоратив',
  'Для перепродажи',
] as const;

export type ProductAudience = (typeof productAudiences)[number];
export type ProductOccasion = (typeof productOccasions)[number];

export interface Product {
  id: string;
  name: string;
  description: string;
  audiences: readonly ProductAudience[];
  occasions: readonly ProductOccasion[];
  image: string;
  imageAlt: string;
  label: string;
  contents: readonly { name: string; quantity: number }[];
  packaging: string;
}

export function getProductCount(product: Product): number {
  return product.contents.reduce((total, item) => total + item.quantity, 0);
}

// Illustrative product concepts. Replace with confirmed catalog photos and compositions.
// Counts describe the proposed composition, not a promise about the illustrated packaging.
export const products: readonly Product[] = [
  {
    id: 'little-joy',
    name: 'Маленькая радость',
    description: 'Небольшой знак внимания для команды, клиентов и партнёров — в нужном вам объёме.',
    audiences: ['Компаниям', 'Детским садам и школам', 'Родителям', 'Организаторам'],
    occasions: ['8 марта / 23 февраля', 'Корпоратив'],
    image: '/images/eco-gifts.webp',
    imageAlt: 'Иллюстрация компактной подарочной коробки со сладостями без логотипов',
    label: 'Для маленьких радостей',
    contents: [
      { name: 'Kinder Chocolate, батончик', quantity: 4 },
      { name: 'Kinder Surprise, шоколадное яйцо', quantity: 1 },
      { name: 'Kinder Bueno, упаковка', quantity: 1 },
    ],
    packaging: 'Небольшая картонная коробка с бумажным наполнителем',
  },
  {
    id: 'team-thanks',
    name: 'Спасибо, команда!',
    description: 'Любимые сладости и личная открытка для каждого сотрудника.',
    audiences: ['Компаниям', 'Организаторам'],
    occasions: ['Корпоратив', '8 марта / 23 февраля'],
    image: '/images/welcome-gifts.webp',
    imageAlt: 'Иллюстрация подарочного набора в светлой коробке с красной лентой без логотипов',
    label: 'Вместе — слаще',
    contents: [
      { name: 'Kinder Chocolate, батончик', quantity: 6 },
      { name: 'Kinder Bueno, упаковка', quantity: 2 },
      { name: 'Kinder Country, батончик', quantity: 2 },
    ],
    packaging: 'Картонная коробка, наполнитель и открытка с вашим поздравлением',
  },
  {
    id: 'new-year-magic',
    name: 'Новогоднее чудо',
    description: 'Праздничный микс для команды, организаций и больших зимних событий.',
    audiences: ['Компаниям', 'Детским садам и школам', 'Родителям', 'Организаторам'],
    occasions: ['Новый год'],
    image: '/images/winter-gifts.webp',
    imageAlt: 'Иллюстрация новогодней коробки со сладостями и еловыми ветками без логотипов',
    label: 'Самый сладкий праздник',
    contents: [
      { name: 'Kinder Chocolate, батончик', quantity: 8 },
      { name: 'Kinder Surprise, шоколадное яйцо', quantity: 2 },
      { name: 'Kinder Bueno, упаковка', quantity: 2 },
    ],
    packaging: 'Праздничная картонная коробка с лентой и открыткой',
  },
  {
    id: 'sweet-thank-you',
    name: 'Сладкое спасибо',
    description: 'Аккуратный знак внимания к весенним праздникам, который легко подарить каждому.',
    audiences: ['Компаниям', 'Для перепродажи'],
    occasions: ['8 марта / 23 февраля', 'Для перепродажи'],
    image: '/images/eco-gifts.webp',
    imageAlt:
      'Иллюстрация небольшой коробки со сладостями и праздничным наполнителем без логотипов',
    label: 'Благодарность со вкусом',
    contents: [
      { name: 'Kinder Chocolate, батончик', quantity: 4 },
      { name: 'Kinder Bueno, упаковка', quantity: 2 },
      { name: 'Kinder Country, батончик', quantity: 2 },
    ],
    packaging: 'Компактная картонная коробка, бумажный наполнитель и лента',
  },
  {
    id: 'winter-together',
    name: 'Празднуем вместе',
    description: 'Большой новогодний набор для команды или праздничной розничной коллекции.',
    audiences: ['Компаниям', 'Для перепродажи', 'Организаторам'],
    occasions: ['Новый год', 'Для перепродажи'],
    image: '/images/winter-gifts.webp',
    imageAlt: 'Иллюстрация подарочной коробки со сладостями в новогоднем оформлении без логотипов',
    label: 'Для вашей команды',
    contents: [
      { name: 'Kinder Chocolate, батончик', quantity: 10 },
      { name: 'Kinder Surprise, шоколадное яйцо', quantity: 2 },
      { name: 'Kinder Bueno, упаковка', quantity: 2 },
      { name: 'Kinder Country, батончик', quantity: 2 },
    ],
    packaging: 'Большая картонная коробка с наполнителем и поздравительной открыткой',
  },
  {
    id: 'big-occasion',
    name: 'Большой повод',
    description: 'Выразительный подарок для корпоратива, клиентов и масштабного мероприятия.',
    audiences: ['Компаниям', 'Для перепродажи', 'Организаторам'],
    occasions: ['Корпоратив', 'Для перепродажи'],
    image: '/images/hero-gifts.webp',
    imageAlt: 'Иллюстрация большой открытой подарочной коробки со сладостями без логотипов',
    label: 'С вниманием к каждому',
    contents: [
      { name: 'Kinder Chocolate, батончик', quantity: 8 },
      { name: 'Kinder Surprise, шоколадное яйцо', quantity: 3 },
      { name: 'Kinder Bueno, упаковка', quantity: 2 },
      { name: 'Kinder Country, батончик', quantity: 1 },
    ],
    packaging: 'Большая картонная коробка, цветной наполнитель и лента',
  },
];
