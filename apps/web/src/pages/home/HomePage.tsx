import { AutomaticLeadPrompt } from '../../features/open-lead-modal/AutomaticLeadPrompt';
import { Seo } from '../../shared/lib/Seo';
import { Hero } from '../../widgets/hero/Hero';
import { Benefits } from '../../widgets/benefits/Benefits';
import { HolidayCalendar } from '../../widgets/holiday-calendar/HolidayCalendar';
import { CatalogShowcase } from '../../widgets/catalog-showcase/CatalogShowcase';
import { Authenticity } from '../../widgets/authenticity/Authenticity';
import { Capabilities } from '../../widgets/capabilities/Capabilities';
import { Wholesale } from '../../widgets/wholesale/Wholesale';
import { LeadTimes, Warehouse } from '../../widgets/fulfillment/Fulfillment';
import { Delivery } from '../../widgets/delivery/Delivery';
import { Manager } from '../../widgets/manager/Manager';
import { Experience } from '../../widgets/experience/Experience';
import { Reviews } from '../../widgets/reviews/Reviews';
import { Consultation } from '../../widgets/consultation/Consultation';
export default function HomePage() {
  return (
    <>
      <Seo
        title="Наборы с Kinder оптом — под ваш повод и бюджет"
        description="Оригинальный Kinder в подарочных наборах для компаний, школ, родителей и перепродажи. Готовые и индивидуальные наборы, три уровня опта, доставка по России."
        path="/"
      />
      <AutomaticLeadPrompt />
      <Hero />
      <Benefits />
      <HolidayCalendar />
      <CatalogShowcase />
      <Authenticity />
      <Capabilities />
      <Wholesale />
      <LeadTimes />
      <Warehouse />
      <Delivery />
      <Manager />
      <Experience />
      <Reviews />
      <Consultation />
    </>
  );
}
