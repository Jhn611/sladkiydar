import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import HomePage from '../../pages/home/HomePage';
import { Header } from '../../widgets/header/Header';
import { Footer } from '../../widgets/footer/Footer';
import { Container } from '../../shared/ui/Container';
import { Seo } from '../../shared/lib/Seo';
const CasesPage = lazy(() => import('../../pages/cases/CasesPage'));
const CaseDetailsPage = lazy(() => import('../../pages/case-details/CaseDetailsPage'));
const ContactsPage = lazy(() => import('../../pages/contacts/ContactsPage'));
const PrivacyPage = lazy(() => import('../../pages/privacy/PrivacyPage'));
const AgreementPage = lazy(() => import('../../pages/agreement/AgreementPage'));
const CatalogPage = lazy(() => import('../../pages/catalog/CatalogPage'));
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    } else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
export function AppRouter() {
  return (
    <>
      <ScrollManager />
      <a href="#main" className="skip-link">
        Перейти к содержанию
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              Загружаем страницу…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:slug" element={<CaseDetailsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/agreement" element={<AgreementPage />} />
            <Route
              path="*"
              element={
                <Container className="page-loading">
                  <Seo
                    title="Страница не найдена"
                    description="Вернитесь в каталог сладких подарков."
                    path="/404"
                  />
                  <h1>Кажется, здесь пусто</h1>
                  <p>А в нашем каталоге — много сладких идей.</p>
                  <Link to="/catalog" className="text-link">
                    Перейти в каталог
                  </Link>
                </Container>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
