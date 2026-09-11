import { Container } from '../../shared/ui/Container';
import { Section } from '../../shared/ui/Section';
import { Button } from '../../shared/ui/Button';
import { useLeadModal } from '../../features/open-lead-modal/useLeadModal';
import s from './Reviews.module.css';
export type VerifiedReview = { id: string; name: string; company?: string; text: string };
// Only verified customer feedback belongs here. An empty collection hides the entire section.
const verifiedReviews: readonly VerifiedReview[] = [];
export function Reviews({ reviews = verifiedReviews }: { reviews?: readonly VerifiedReview[] }) {
  const { openLeadModal } = useLeadModal();
  if (reviews.length === 0) return null;
  return (
    <Section id="reviews">
      <Container>
        <h2>Нам доверяют повторные заказы</h2>
        <div className={s.grid}>
          {reviews.map((review) => (
            <figure key={review.id}>
              <blockquote>{review.text}</blockquote>
              <figcaption>
                {review.name}
                {review.company && <span>{review.company}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
        <Button onClick={() => openLeadModal('reviews')}>Стать следующим довольным клиентом</Button>
      </Container>
    </Section>
  );
}
