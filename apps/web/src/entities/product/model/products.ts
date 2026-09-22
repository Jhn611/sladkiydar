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
  imageWidth: number;
  imageHeight: number;
  label: string;
  contents: readonly { name: string; quantity: number }[];
  packaging: string;
}

export function getProductCount(product: Product): number {
  return product.contents.reduce((total, item) => total + item.quantity, 0);
}

// Examples follow the supplied catalog photos; the final composition is agreed with the client.
// An individually wrapped item or a sealed retail pack counts as one item.
export const products: readonly Product[] = [
  {
    id: 'team-thanks',
    name: 'Спасибо, команда!',
    description: 'Сладкий подарок с голубым наполнителем для сотрудников, клиентов и партнёров.',
    audiences: ['Компаниям', 'Детским садам и школам', 'Родителям', 'Организаторам'],
    occasions: ['Корпоратив', '8 марта / 23 февраля'],
    image: '/images/gallery-blue-20260922.webp',
    imageAlt:
      'Набор с Kinder Bueno, Country, шоколадными яйцами и баночками Nutella в голубом наполнителе',
    imageWidth: 1200,
    imageHeight: 1215,
    label: 'Вместе — слаще',
    contents: [
      { name: 'Kinder Bueno, упаковка', quantity: 2 },
      { name: 'Kinder Country, батончик', quantity: 2 },
      { name: 'Kinder Surprise, шоколадное яйцо', quantity: 2 },
      { name: 'Kinder Chocolate, батончик', quantity: 4 },
      { name: 'Nutella, баночка', quantity: 2 },
    ],
    packaging: 'Белая картонная коробка с голубым бумажным наполнителем',
  },
  {
    id: 'new-year-magic',
    name: 'Новогоднее чудо',
    description: 'Праздничный микс с Kinder и Raffaello для команды и больших зимних событий.',
    audiences: ['Компаниям', 'Детским садам и школам', 'Родителям', 'Организаторам'],
    occasions: ['Новый год'],
    image: '/images/gallery-red-20260922.webp',
    imageAlt:
      'Подарочная коробка с Kinder Chocolate, Bueno, Country, Maxi, четырьмя шоколадными яйцами и Raffaello',
    imageWidth: 1200,
    imageHeight: 1215,
    label: 'Самый сладкий праздник',
    contents: [
      { name: 'Kinder Chocolate, упаковка', quantity: 2 },
      { name: 'Kinder Country, батончик', quantity: 2 },
      { name: 'Kinder Maxi, батончик', quantity: 2 },
      { name: 'Kinder Bueno, упаковка', quantity: 1 },
      { name: 'Kinder Surprise, шоколадное яйцо', quantity: 4 },
      { name: 'Raffaello, конфета', quantity: 6 },
    ],
    packaging: 'Белая картонная коробка с красным бумажным наполнителем',
  },
  {
    id: 'sweet-thank-you',
    name: 'Сладкое спасибо',
    description: 'Подарок в форме сердца с любимыми сладостями и красной атласной лентой.',
    audiences: ['Компаниям', 'Родителям', 'Для перепродажи', 'Организаторам'],
    occasions: ['8 марта / 23 февраля', 'Для перепродажи'],
    image: '/images/gallery-heart-20260922.webp',
    imageAlt:
      'Красная коробка в форме сердца с шестью шоколадными яйцами Kinder, батончиками и Raffaello',
    imageWidth: 1086,
    imageHeight: 1448,
    label: 'Благодарность со вкусом',
    contents: [
      { name: 'Kinder Surprise, шоколадное яйцо', quantity: 6 },
      { name: 'Kinder Country, батончик', quantity: 2 },
      { name: 'Kinder Maxi, батончик', quantity: 1 },
      { name: 'Kinder Chocolate, батончик', quantity: 1 },
      { name: 'Raffaello, конфета', quantity: 7 },
    ],
    packaging: 'Коробка в форме сердца, красный наполнитель и атласная лента',
  },
  {
    id: 'big-occasion',
    name: 'Большой повод',
    description: 'Большой набор с семью шоколадными яйцами для корпоратива и масштабного события.',
    audiences: ['Компаниям', 'Для перепродажи', 'Организаторам'],
    occasions: ['Корпоратив', 'Для перепродажи', 'Новый год'],
    image: '/images/gallery-pink-20260922.webp',
    imageAlt:
      'Большой набор с семью яйцами Kinder Surprise, шоколадом, Bueno, Country и Nutella B-ready в розовом наполнителе',
    imageWidth: 1200,
    imageHeight: 1200,
    label: 'С вниманием к каждому',
    contents: [
      { name: 'Kinder Surprise, шоколадное яйцо', quantity: 7 },
      { name: 'Kinder Country, батончик', quantity: 2 },
      { name: 'Kinder Chocolate, батончик', quantity: 4 },
      { name: 'Kinder Chocolate, упаковка', quantity: 1 },
      { name: 'Kinder Bueno, упаковка', quantity: 2 },
      { name: 'Nutella B-ready, батончик', quantity: 2 },
    ],
    packaging: 'Большая белая картонная коробка с розовым бумажным наполнителем',
  },
];
