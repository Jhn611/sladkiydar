import { cases, type Case } from '../model/cases';

/** A small boundary for replacing local content with a CMS or HTTP source. */
export interface CaseRepository {
  list(): Promise<readonly Case[]>;
  findBySlug(slug: string): Promise<Case | undefined>;
}

export const caseRepository: CaseRepository = {
  list: async () => cases,
  findBySlug: async (slug) => cases.find((item) => item.slug === slug),
};
