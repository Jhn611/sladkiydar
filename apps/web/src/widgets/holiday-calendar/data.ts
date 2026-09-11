import type { IconName } from '../../shared/ui/Icon';

export const occasions: readonly {
  id: string;
  label: string;
  icon: IconName;
  description: string;
  image: string;
  alt: string;
}[] = [
  {
    id: 'new-year',
    label: 'Новый год',
    icon: 'snowflake',
    description: 'Для компаний, организаций и больших праздничных событий.',
    image: 'winter-gifts',
    alt: 'Иллюстрация подарочной коробки с новогодним оформлением',
  },
  {
    id: 'spring',
    label: '8 марта / 23 февраля',
    icon: 'flower',
    description: 'Знак внимания тем, кто рядом каждый день.',
    image: 'eco-gifts',
    alt: 'Иллюстрация компактного сладкого подарка к весенним праздникам',
  },
  {
    id: 'corporate',
    label: 'Корпоратив',
    icon: 'users',
    description: 'Поблагодарить команду и отметить общие победы.',
    image: 'welcome-gifts',
    alt: 'Иллюстрация подарочной коробки для корпоративного поздравления',
  },
  {
    id: 'resale',
    label: 'Для перепродажи',
    icon: 'box',
    description: 'Наборы для вашей сезонной и постоянной витрины.',
    image: 'winter-gifts',
    alt: 'Иллюстрация праздничного набора для розничной витрины',
  },
  {
    id: 'custom',
    label: 'Индивидуальный набор',
    icon: 'heart',
    description: 'Ваш повод, ваш состав и ваши любимые цвета.',
    image: 'hero-gifts',
    alt: 'Иллюстрация подарочного набора с индивидуальным оформлением',
  },
];
