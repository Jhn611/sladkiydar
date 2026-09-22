import type { IconName } from '../../shared/ui/Icon';

export const occasions: readonly {
  id: string;
  label: string;
  icon: IconName;
  description: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
}[] = [
  {
    id: 'new-year',
    label: 'Новый год',
    icon: 'snowflake',
    description: 'Для компаний, организаций и больших праздничных событий.',
    image: 'occasion-new-year-20260922',
    imageWidth: 1440,
    imageHeight: 1080,
    alt: 'Два подарочных набора с Kinder под украшенной новогодней ёлкой',
  },
  {
    id: 'spring',
    label: '8 марта / 23 февраля',
    icon: 'flower',
    description: 'Знак внимания тем, кто рядом каждый день.',
    image: 'occasion-spring-20260922',
    imageWidth: 1440,
    imageHeight: 1080,
    alt: 'Девушка с подарочным набором Kinder и розой под прозрачным колпаком',
  },
  {
    id: 'corporate',
    label: 'Корпоратив',
    icon: 'users',
    description: 'Поблагодарить команду и отметить общие победы.',
    image: 'occasion-corporate-20260922',
    imageWidth: 1440,
    imageHeight: 1080,
    alt: 'Две сотрудницы в офисе с подарочными коробками Kinder и Raffaello',
  },
  {
    id: 'resale',
    label: 'Для перепродажи',
    icon: 'box',
    description: 'Наборы для вашей сезонной и постоянной витрины.',
    image: 'occasion-resale-20260922',
    imageWidth: 1440,
    imageHeight: 1080,
    alt: 'Партия розовых наборов в форме сердца с Kinder, Raffaello и плюшевыми зайцами',
  },
  {
    id: 'custom',
    label: 'Индивидуальный набор',
    icon: 'heart',
    description: 'Ваш повод, ваш состав и ваши любимые цвета.',
    image: 'occasion-custom-20260922',
    imageWidth: 1440,
    imageHeight: 810,
    alt: 'Индивидуальный набор в сине-бежевой коробке со сладостями, кружкой, блокнотом и открыткой',
  },
];
