import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from "@clerk/react";
import { ptBR } from "@clerk/localizations";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import {
  queryClient,
  useCompleteReview,
  useCurrentUser,
  useCurriculum,
  useDashboard,
  useLesson,
  useReviewQueue,
  useSubmitExercise,
  useUpdateProfile,
} from "./lib/api";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside",
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "#dc694b",
    colorForeground: "#203432",
    colorMutedForeground: "#697773",
    colorDanger: "#b94f36",
    colorBackground: "#fffefa",
    colorInput: "#f6f5ef",
    colorInputForeground: "#203432",
    colorNeutral: "#e5e5dc",
    fontFamily: "DM Sans, sans-serif",
    borderRadius: "14px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#fffefa] rounded-[22px] w-[440px] max-w-full overflow-hidden border border-[#e5e5dc]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#203432] font-bold",
    headerSubtitle: "text-[#697773]",
    socialButtonsBlockButtonText: "text-[#203432] font-semibold",
    formFieldLabel: "text-[#203432] font-semibold",
    footerActionLink: "text-[#b94f36] font-semibold",
    footerActionText: "text-[#697773]",
    dividerText: "text-[#697773]",
    identityPreviewEditButton: "text-[#b94f36]",
    formFieldSuccessText: "text-[#32796a]",
    alertText: "text-[#b94f36]",
    logoBox: "mb-2",
    logoImage: "max-h-9",
    socialButtonsBlockButton: "border-[#e5e5dc] bg-[#fffefa] rounded-xl hover:bg-[#f6f5ef]",
    formButtonPrimary: "bg-[#dc694b] hover:bg-[#b94f36] rounded-xl font-semibold",
    formFieldInput: "bg-[#f6f5ef] border-[#e5e5dc] text-[#203432] rounded-xl",
    footerAction: "text-[#697773]",
    dividerLine: "bg-[#e5e5dc]",
    alert: "bg-[#fae9e2] border-[#f2d2c7]",
    otpCodeFieldInput: "bg-[#f6f5ef] border-[#e5e5dc] text-[#203432]",
    formFieldRow: "mb-4",
    main: "gap-4",
  },
};

const ThemeContext = createContext(null);
function useTheme() {
  return useContext(ThemeContext);
}

const iconPaths = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  map: <><path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z" /><path d="M8.5 4v13.5M15.5 6.5V20" /></>,
  review: <><path d="M4 5h16v15H4zM8 3v4M16 3v4M7.5 11h9M7.5 15h5" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.1 3-4.8 7-4.8s6.3 1.7 7 4.8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.3 1-1.5 2.6-1.6-.6a7.8 7.8 0 0 1-1.7 1l-.3 1.7h-3l-.3-1.7a7.8 7.8 0 0 1-1.7-1l-1.6.6-1.5-2.6 1.3-1a7.5 7.5 0 0 1 0-2l-1.3-1 1.5-2.6 1.6.6a7.8 7.8 0 0 1 1.7-1l.3-1.7h3l.3 1.7a7.8 7.8 0 0 1 1.7 1l1.6-.6 1.5 2.6-1.3 1a7.5 7.5 0 0 1 0 2Z" transform="translate(-1 -1)" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5v16M8 7h8M8 11h7" /></>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
  flame: <><path d="M12 22c4.4 0 7-3.2 7-7.2 0-3.4-2-6-4.4-8.8.2 2.5-.7 3.8-1.8 4.6C12.3 6.7 10.4 4.7 8 3 8.6 7 5 9.4 5 14.6 5 18.8 7.8 22 12 22Z" /><path d="M12 22c-2.1 0-3.5-1.5-3.5-3.6 0-1.7 1-2.8 2.4-4.3.1 1.3.6 2 1.4 2.5.1-1.7 1-2.8 2.2-3.8-.1 1.9 1 3 1 5.2 0 2.3-1.4 4-3.5 4Z" /></>,
  moon: <path d="M20.5 15.3A8.8 8.8 0 0 1 8.7 3.5 9 9 0 1 0 20.5 15.3Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  code: <><path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14" /></>,
   award: <><circle cx="12" cy="8" r="5" /><path d="m8.2 12-1 9 4.8-2.7 4.8 2.7-1-9" /></>,
   logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h8v18h-8" /></>,
};

function Icon({ name, size = 19 }) {
  return <span className="icon" aria-hidden="true" style={{ width: size, height: size, fontSize: size }}><svg viewBox="0 0 24 24">{iconPaths[name] || iconPaths.spark}</svg></span>;
}

function Logo({ small = false }) {
  return <span className={`logo-lockup${small ? " logo-small" : ""}`}><span className="logo-mark">c.</span><span className="logo-word">codiva<span className="word-dot">.</span></span></span>;
}

function LoadingState({ label = "Preparando seu espaço de aprendizagem" }) {
  return <div className="loading-stack" role="status" aria-label={label}>
    <div className="skeleton skeleton-line" style={{ width: "38%" }} />
    <div className="skeleton skeleton-line" style={{ width: "65%", height: 28 }} />
    <div className="skeleton skeleton-block" />
    <div className="skeleton skeleton-block" />
  </div>;
}

function ErrorState({ error, retry }) {
  return <section className="error-card" role="alert">
    <div className="empty-symbol"><Icon name="code" size={23} /></div>
    <h2>Não conseguimos carregar esta etapa</h2>
    <p>{error?.message || "Sua jornada continua aqui. Confira sua conexão e tente novamente."}</p>
    <button type="button" className="btn btn-primary" onClick={retry}>Tentar novamente</button>
  </section>;
}

function EmptyState({ title, detail, action }) {
  return <section className="empty-card">
    <div className="empty-symbol"><Icon name="book" size={23} /></div>
    <h2>{title}</h2><p>{detail}</p>{action}
  </section>;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
function getName(profile) {
  return profile?.displayName || "aprendiz";
}
function getInitials(name) {
  return String(name || "C").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "C";
}
function displayStatus(lesson) {
  const status = String(lesson?.status || lesson?.progress?.status || "").toLowerCase();
  if (lesson?.completed || status.includes("complete") || status.includes("done")) return "complete";
  if (lesson?.locked || status.includes("lock") || status.includes("upcoming")) return "locked";
  if (status.includes("current") || status.includes("progress") || status.includes("available") || status.includes("next")) return "next";
  return "";
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function PublicHome() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;
  const signUpUrl = `${basePath}/sign-up`;
  return <main className="landing">
    <header className="landing-nav">
      <Link href="/" className="desktop-brand" aria-label="Codiva, página inicial"><Logo /></Link>
      <div className="landing-actions">
        <Link href="/sign-in" className="btn btn-quiet btn-sm">Entrar</Link>
        <Link href={signUpUrl.replace(basePath, "") || "/sign-up"} className="btn btn-primary btn-sm">Começar a aprender <Icon name="arrow" size={16} /></Link>
      </div>
    </header>
    <section className="landing-hero">
      <div className="landing-copy">
        <p className="eyebrow">Aprender a pensar vem primeiro</p>
        <h1>Entenda a ideia.<br />Depois, <em>escreva código.</em></h1>
        <p>Uma jornada de programação que começa pelo contexto — e cresce com a prática de verdade, no seu ritmo.</p>
        <div className="landing-cta">
          <Link href="/sign-up" className="btn btn-primary">Comece sua jornada <Icon name="arrow" size={17} /></Link>
          <Link href="/sign-in" className="btn btn-outline">Já tenho uma conta</Link>
        </div>
        <div className="landing-meta"><span className="meta-dots"><i /><i /><i /></span><span>Conceitos claros. Prática com propósito.</span></div>
      </div>
      <div className="hero-visual" aria-label="Representação visual de uma ideia se tornando código">
        <div className="hero-orbit" />
        <div className="float-note note-one"><strong>Entender primeiro</strong><span>O que resolve?</span></div>
        <div className="hero-core">
          <div className="core-top"><span>PRIMEIRO PROGRAMA</span><span>01 / 04</span></div>
          <div className="core-window">
            <span className="code-line"><span className="code-key">const</span> <span className="code-name">ideia</span> =</span>
            <span className="code-line">&nbsp;&nbsp;"um passo de cada vez";</span>
            <span className="code-line"><span className="code-key">return</span> prática;</span>
          </div>
          <div className="core-progress" />
        </div>
        <div className="float-note note-two"><strong><span className="note-check">✓</span> Aprendido praticando</strong><span>Seu progresso é real.</span></div>
      </div>
    </section>
    <section className="landing-section">
      <p className="eyebrow">Um jeito diferente de aprender</p>
      <h2>Programar não é decorar comandos. É aprender a fazer perguntas melhores.</h2>
      <div className="principles">
        <div className="principle-list">
          <article className="principle"><span className="principle-num">01</span><div><h3>Contexto antes da sintaxe</h3><p>Entenda o problema, por que uma ideia existe e onde ela aparece no mundo real.</p></div></article>
          <article className="principle"><span className="principle-num">02</span><div><h3>Prática que ensina</h3><p>Exercícios ajudam você a conectar conceitos — com espaço para tentar, errar e rever.</p></div></article>
          <article className="principle"><span className="principle-num">03</span><div><h3>Progresso com significado</h3><p>Avance em uma sequência coerente. Cada etapa concluída representa algo que você praticou.</p></div></article>
        </div>
        <aside className="principle-quote"><blockquote>“Não precisa saber tudo hoje. Precisa entender um pouco mais do que ontem.”</blockquote><cite>Uma ideia de cada vez</cite></aside>
      </div>
    </section>
    <section className="journey-band">
      <div><h2>Seu próximo passo começa com uma boa pergunta.</h2><p>Construa uma base sólida para seguir aprendendo, projeto a projeto.</p></div>
      <Link href="/sign-up" className="btn btn-primary">Conheça a Codiva <Icon name="arrow" size={17} /></Link>
    </section>
    <footer className="landing-footer"><Logo small /><span>Feita para aprender com clareza, prática e curiosidade.</span></footer>
  </main>;
}

function SignInPage() {
  return <main className="clerk-host"><div className="auth-wrap">
    <section className="auth-copy"><Link href="/" aria-label="Voltar para Codiva"><Logo /></Link><h1>Volte de onde sua curiosidade parou.</h1><p>Seu próximo conceito, exercício e descoberta estão a um passo daqui.</p></section>
    <div className="auth-panel"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>
  </div></main>;
}
function SignUpPage() {
  return <main className="clerk-host"><div className="auth-wrap">
    <section className="auth-copy"><Link href="/" aria-label="Voltar para Codiva"><Logo /></Link><h1>Comece com uma ideia. Cresça com a prática.</h1><p>Uma jornada de programação feita para você entender o porquê antes de aprender o como.</p></section>
    <div className="auth-panel"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>
  </div></main>;
}

function Protected({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <main className="page-wrap"><LoadingState /></main>;
  if (!isSignedIn) return <Redirect to="/" />;
  return children;
}

const navigation = [
  { href: "/dashboard", label: "Visão geral", icon: "home" },
  { href: "/learn", label: "Aprender", icon: "map" },
  { href: "/review", label: "Revisar", icon: "review" },
  { href: "/profile", label: "Meu perfil", icon: "user" },
];

function AppFrame({ children, active }) {
  const { user } = useAuth();
  const { data: me } = useCurrentUser(true);
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const profile = me?.profile;
  const name = profile?.displayName || user?.firstName || "Aprendiz";
  return <div className="app-shell">
    {menuOpen && <button aria-label="Fechar menu" className="mobile-scrim" onClick={() => setMenuOpen(false)} />}
    <aside className={`side-rail${menuOpen ? " open" : ""}`}>
      <Link href="/dashboard" className="desktop-brand"><Logo /></Link>
      <p className="nav-caption">Sua jornada</p>
      <nav className="side-nav" aria-label="Navegação principal">
        {navigation.map((item) => <Link key={item.href} href={item.href} className={`nav-item${active === item.href ? " active" : ""}`} aria-current={active === item.href ? "page" : undefined} onClick={() => setMenuOpen(false)}>
          <Icon name={item.icon} /><span>{item.label}</span>
          {item.href === "/review" && Number.isFinite(me?.reviewCount) && me.reviewCount > 0 && <span className="nav-count">{me.reviewCount}</span>}
        </Link>)}
      </nav>
      <div className="rail-spacer" />
      <div className="rail-course"><span>Aprender com intenção</span><strong>Uma etapa de cada vez.</strong><div className="rail-progress"><i style={{ width: `${Math.min(100, Math.max(8, (profile?.lessonsCompleted || 0) * 8))}%` }} /></div></div>
      <div className="rail-bottom">
        <Link href="/settings" className={`nav-item${active === "/settings" ? " active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name="settings" /><span>Configurações</span></Link>
        <button type="button" className="nav-item nav-theme" onClick={toggleTheme}><Icon name={theme === "dark" ? "sun" : "moon"} /><span>Usar tema {theme === "dark" ? "claro" : "escuro"}</span></button>
        <SignOutButton />
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <div className="topbar-left">Olá, <strong>{name}</strong>. Um passo de cada vez.</div>
        <div className="topbar-right">
          <button type="button" className="icon-button mobile-menu" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button>
          <Link href="/dashboard" className="mobile-brand" aria-label="Codiva"><Logo /></Link>
          <button type="button" className="icon-button theme-toggle" aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`} onClick={toggleTheme}><Icon name={theme === "dark" ? "sun" : "moon"} /></button>
          <Link href="/profile" className="avatar" aria-label={`Perfil de ${name}`}>{getInitials(name)}</Link>
        </div>
      </header>
      {children}
    </div>
  </div>;
}

function SignOutButton() {
  const { signOut } = useClerk();
  return <button type="button" className="nav-item" onClick={() => signOut({ redirectUrl: "/" })}>
    <Icon name="logout" /><span>Sair da conta</span>
  </button>;
}

function AppRoute({ active, children }) {
  return <Protected><AppFrame active={active}>{children}</AppFrame></Protected>;
}

function PageContent({ children, className = "page-wrap" }) {
  return <main className={className}>{children}</main>;
}

function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard(true);
  if (isLoading) return <PageContent><LoadingState /></PageContent>;
  if (isError) return <PageContent><ErrorState error={error} retry={refetch} /></PageContent>;
  const profile = data?.profile;
  const courses = safeArray(data?.courses);
  const activities = safeArray(data?.recentActivity);
  const achievements = safeArray(data?.achievements);
  const nextLesson = data?.nextLesson;
  const xp = Number(profile?.xp || 0);
  const level = Number(profile?.level || 1);
  const nextSlug = nextLesson?.slug;
  return <PageContent>
    <div className="dashboard-grid">
      <section className="dashboard-main">
        <div className="welcome-row"><div><p className="eyebrow">Seu espaço de aprendizagem</p><h1>Bom ter você por aqui, {getName(profile)}.</h1><p>O que você vai entender melhor hoje?</p></div></div>
        <section className="focus-card">
          <div className="focus-card-content">
            <p className="eyebrow">Próximo passo</p>
            {nextLesson ? <><h2>{nextLesson.title}</h2><p>{nextLesson.summary || "Continue sua jornada com uma ideia nova e prática para fixar o que aprendeu."}</p>
              <div className="focus-meta"><span><Icon name="book" size={15} />{nextLesson.courseTitle || "Sua trilha"}</span><span><Icon name="clock" size={15} />{nextLesson.estimatedMinutes || 8} min</span></div>
              <Link className="btn btn-primary btn-sm" href={`/learn/${encodeURIComponent(nextSlug)}`}>Continuar aprendendo <Icon name="arrow" size={15} /></Link>
            </> : <><h2>Escolha sua próxima descoberta</h2><p>Explore a trilha de aprendizagem e encontre um bom ponto de partida.</p><Link className="btn btn-primary btn-sm" href="/learn">Ver trilha <Icon name="arrow" size={15} /></Link></>}
          </div>
        </section>
        <section className="progress-card">
          <div className="card-header"><h2>Suas trilhas</h2><Link href="/learn" className="text-link">Ver todas <Icon name="arrow" size={15} /></Link></div>
          {courses.length ? courses.slice(0, 4).map((course, index) => {
            const percent = course.lessonCount ? Math.min(100, Math.round((Number(course.completedLessons || 0) / Number(course.lessonCount)) * 100)) : 0;
            return <div className="course-progress-item" key={course.slug || course.title}>
              <span className="course-index">{String(index + 1).padStart(2, "0")}</span><div className="course-copy"><strong>{course.title}</strong><span>{course.completedLessons || 0} de {course.lessonCount || 0} aulas concluídas</span></div><div className="mini-track" aria-label={`${percent}% concluído`}><i style={{ width: `${percent}%` }} /></div>
            </div>;
          }) : <p className="muted">Sua primeira trilha aparecerá aqui.</p>}
        </section>
        <section className="activity-card progress-card">
          <div className="card-header"><h2>Prática recente</h2><span className="muted" style={{ fontSize: 12 }}>Atividade de verdade</span></div>
          {activities.length ? <div className="activity-list">{activities.slice(0, 4).map((activity, index) => <div className="activity-row" key={activity.id || `${activity.title}-${index}`}>
            <span className="activity-mark"><Icon name={activity.type === "lesson" ? "book" : "check"} size={16} /></span>
            <div><strong>{activity.title || activity.description || "Prática concluída"}</strong><span>{activity.courseTitle || activity.label || "Uma etapa a mais na sua jornada"}</span></div>
          </div>)}</div> : <p className="muted">Quando você praticar, seu histórico aparece aqui.</p>}
        </section>
      </section>
      <aside className="dashboard-side">
        <section className="streak-card">
          <div className="streak-top"><span className="eyebrow" style={{ color: "var(--accent-deep)", margin: 0 }}>Ritmo de prática</span><Icon name="flame" size={25} /></div>
          <div className="streak-count">{profile?.streakDays || 0}</div>
          <p>{profile?.streakDays === 1 ? "dia de prática seguido" : "dias de prática seguidos"}</p>
          <div className="week-strip" aria-label="Semana de prática">
            {safeArray(data?.activityWeek).map((day) => <span key={day.date} className={`week-day${day.active ? " is-done" : ""}${day.isToday ? " is-today" : ""}`} title={`${day.date}${day.active ? " · prática registrada" : " · sem prática registrada"}`} aria-label={`${day.date}${day.active ? ", com prática" : ", sem prática"}`}><i>{day.active ? "✓" : ""}</i>{day.label}</span>)}
          </div>
        </section>
        <div className="stat-pair">
          <article className="stat-card"><span className="stat-icon"><Icon name="star" /></span><strong className="stat-number">{xp.toLocaleString("pt-BR")}</strong><span className="stat-label">pontos de prática</span></article>
          <article className="stat-card"><span className="stat-icon"><Icon name="award" /></span><strong className="stat-number">{level}</strong><span className="stat-label">nível de aprendizagem</span><div className="level-progress" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Number(profile?.xpIntoLevel || 0)}><i style={{ width: `${Math.min(100, Number(profile?.xpIntoLevel || 0))}%` }} /></div><span className="level-next">{100 - Number(profile?.xpIntoLevel || 0)} XP para o nível {level + 1}</span></article>
        </div>
        <section className="achievement-mini progress-card">
          <div className="card-header"><h2>Conquistas</h2><Link href="/profile" className="text-link">Explorar <Icon name="arrow" size={14} /></Link></div>
          {achievements.length ? achievements.slice(0, 3).map((achievement, index) => <div className="achievement-item" key={achievement.id || achievement.title || index}>
            <span className="achievement-medal"><Icon name="award" size={17} /></span><div><strong>{achievement.title || achievement.name || "Primeira prática"}</strong><span>{achievement.description || "Conquistada com dedicação."}</span></div>
          </div>) : <p className="muted" style={{ fontSize: 12 }}>Conquistas chegam com a prática.</p>}
        </section>
        {Number(data?.reviewCount) > 0 && <Link href="/review" className="btn btn-outline"><Icon name="review" />{data.reviewCount} {data.reviewCount === 1 ? "aula para revisar" : "aulas para revisar"}</Link>}
      </aside>
    </div>
  </PageContent>;
}

function CurriculumPage() {
  const { data, isLoading, isError, error, refetch } = useCurriculum(true);
  if (isLoading) return <PageContent><LoadingState label="Carregando trilhas" /></PageContent>;
  if (isError) return <PageContent><ErrorState error={error} retry={refetch} /></PageContent>;
  const courses = safeArray(data?.courses);
  return <PageContent>
    <div className="page-heading"><div><p className="eyebrow">A jornada, em etapas</p><h1>Aprender</h1><p>Uma trilha em sequência, pensada para conectar cada ideia à próxima.</p></div></div>
    {courses.length ? <div className="course-list">{courses.map((course, courseIndex) => {
      const lessons = safeArray(course.lessons);
      return <section className="course-panel" key={course.slug || course.title}>
        <div className="course-panel-head"><div><p className="eyebrow" style={{ marginBottom: 4 }}>Módulo {String(courseIndex + 1).padStart(2, "0")}</p><h2>{course.title}</h2><p>{course.description || course.importance || "Uma base para pensar com clareza e avançar na programação."}</p></div><span className="course-count">{course.completedLessons || 0}/{course.lessonCount ?? lessons.length}</span></div>
        <div className="lesson-list">{lessons.map((lesson, lessonIndex) => {
          const status = displayStatus(lesson);
          const completed = status === "complete" || (!status && lessonIndex < Number(course.completedLessons || 0));
          const available = status === "next" || (!status && lessonIndex === Number(course.completedLessons || 0) && !String(course.status || "").toLowerCase().includes("lock"));
          const locked = status === "locked" || (!completed && !available && lessonIndex >= Number(course.completedLessons || 0));
          const slug = lesson.slug;
          const lessonTitle = lesson.title || `Aula ${lessonIndex + 1}`;
          const info = lesson.summary || lesson.moduleTitle || `${lesson.estimatedMinutes || 8} minutos de aprendizagem`;
          return <div className={`lesson-row${locked ? " locked" : ""}`} key={slug || lessonTitle}>
            <span className={`lesson-node${completed ? " complete" : ""}${available ? " next" : ""}`}>{completed ? <Icon name="check" size={17} /> : locked ? <Icon name="lock" size={15} /> : lessonIndex + 1}</span>
            <div><h3>{lessonTitle}</h3><p>{info}</p></div>
            <div className="lesson-row-action">
              <span className={`lesson-status${available ? " available" : ""}`}>{completed ? "Concluída" : available ? "Disponível" : "Em breve"}</span>
              {locked || !slug ? <span className="lesson-status"><Icon name="lock" size={14} /></span> : <Link className="text-link" href={`/learn/${encodeURIComponent(slug)}`}>{completed ? "Rever" : "Estudar"} <Icon name="chevron" size={14} /></Link>}
            </div>
          </div>;
        })}</div>
      </section>;
    })}</div> : <EmptyState title="Sua trilha está sendo preparada" detail="Volte em breve para encontrar as primeiras etapas de aprendizagem." />}
  </PageContent>;
}

function textOrFallback(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function LearningContent({ learning }) {
  const data = learning || {};
  const blocks = [
    ["O contexto", data.context],
    ["O que é", data.what],
    ["Para que serve", data.purpose],
    ["Onde aparece", data.whereUsed],
    ["Por que foi criado", data.whyCreated],
    ["Por que importa", data.importance],
    ["Uma analogia", data.analogy],
  ].filter(([, value]) => value);
  const listSections = [["Alternativas", data.alternatives], ["Benefícios", data.benefits], ["Limitações", data.limitations], ["Parte técnica", data.technical]];
  return <article className="learning-panel">
    <h2>Entenda a ideia</h2>
    <p>{textOrFallback(data.context, "Antes de escrever código, vamos entender o problema que este conceito ajuda a resolver.")}</p>
    {blocks.slice(1).map(([heading, body]) => <section className="concept-block" key={heading}><h3>{heading}</h3><p>{body}</p></section>)}
    {listSections.filter(([, value]) => value).map(([heading, value]) => <section key={heading}><h3>{heading}</h3>{Array.isArray(value) ? <ul>{value.map((item, index) => <li key={`${heading}-${index}`}>{item}</li>)}</ul> : <p>{value}</p>}</section>)}
    {data.example && <div className="example-box"><div className="example-title">Um exemplo para observar</div><pre><code>{data.example.code || ""}</code></pre><div className="example-explanation">{data.example.explanation || "Observe como cada parte contribui para a ideia."}</div></div>}
  </article>;
}

function ExerciseFlow({ lesson }) {
  const exercises = safeArray(lesson?.exercises).slice().sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hintIndex, setHintIndex] = useState(-1);
  const [feedback, setFeedback] = useState(null);
  const submit = useSubmitExercise(lesson?.slug);
  const exercise = exercises[index];
  useEffect(() => {
    setIndex(0); setAnswer(""); setHintIndex(-1); setFeedback(null);
  }, [lesson?.slug]);
  useEffect(() => {
    setAnswer(exercise?.starterCode || "");
    setHintIndex(-1);
    setFeedback(null);
  }, [exercise?.id]);
  if (!exercises.length) return <EmptyState title="A prática está a caminho" detail="Esta aula ainda não tem exercícios. Você já pode seguir explorando as ideias." />;
  if (index >= exercises.length) return <div className="lesson-finish"><span className="empty-symbol"><Icon name="check" size={22} /></span><h2>Prática concluída</h2><p>Você trabalhou os conceitos desta aula. Esse progresso é seu.</p><Link href="/learn" className="btn btn-primary">Voltar à trilha <Icon name="arrow" size={16} /></Link></div>;

  const hints = safeArray(exercise.hints);
  const answerValue = answer.trim();
  const ready = answerValue.length > 0 && !submit.isPending;
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!ready) return;
    try {
      const result = await submit.mutateAsync({ exerciseId: exercise.id, answer: answerValue });
      setFeedback(result);
    } catch {
      // React Query exposes the request error in the exercise feedback state below.
    }
  };
  const continueAfter = () => {
    setIndex((current) => current + 1);
    setAnswer("");
    setHintIndex(-1);
    setFeedback(null);
  };
  return <form className="exercise-panel" onSubmit={handleSubmit}>
    <div className="exercise-top"><h2>Agora, pratique</h2><span className="exercise-count">Exercício {index + 1} de {exercises.length}</span></div>
    <p>{exercise.prompt}</p>
    {exercise.inputType === "choice" && safeArray(exercise.options).length ? <div className="choice-list" role="radiogroup" aria-label="Escolha uma resposta">
      {exercise.options.map((option) => <label key={option.id} className={`choice-option${answer === option.id ? " selected" : ""}`}>
        <input type="radio" name={`answer-${exercise.id}`} value={option.id} checked={answer === option.id} onChange={() => { setAnswer(option.id); setFeedback(null); }} />
        <span>{option.label}</span>
      </label>)}
    </div> : exercise.inputType === "code" ? <textarea className="code-input" aria-label="Sua resposta em código" value={answer} onChange={(event) => { setAnswer(event.target.value); setFeedback(null); }} placeholder="// Escreva sua resposta aqui" spellCheck="false" /> :
      <textarea className="answer-input" aria-label="Sua resposta" value={answer} onChange={(event) => { setAnswer(event.target.value); setFeedback(null); }} placeholder="Escreva seu raciocínio..." />}
    {hintIndex >= 0 && hints[hintIndex] && <aside className="hint-panel"><strong>Pista {hintIndex + 1}:</strong> {hints[hintIndex]}</aside>}
    {feedback && <div className={`feedback ${feedback.isCorrect ? "success" : "try-again"}`} role="status">
      <Icon name={feedback.isCorrect ? "check" : "spark"} size={19} />
      <div><strong>{feedback.isCorrect ? "Boa leitura do problema." : "Tem mais uma forma de pensar nisso."}</strong><br />{feedback.feedback || (feedback.isCorrect ? "Sua resposta demonstra que você entendeu o conceito." : "Releia a pergunta e observe o papel de cada parte. Uma pista pode ajudar.")}{feedback.isCorrect && feedback.xpAwarded ? <div style={{ marginTop: 5 }}>+{feedback.xpAwarded} pontos de prática</div> : null}</div>
    </div>}
    {submit.isError && <div className="feedback try-again" role="alert"><Icon name="code" /><div><strong>Não foi possível enviar sua resposta.</strong><br />{submit.error?.message || "Tente novamente em instantes."}</div></div>}
    <div className="exercise-actions">
      {hints.length ? <button type="button" className="btn btn-quiet btn-sm" disabled={hintIndex >= hints.length - 1} onClick={() => setHintIndex((current) => Math.min(current + 1, hints.length - 1))}>{hintIndex >= hints.length - 1 ? "Pistas consultadas" : "Preciso de uma pista"}</button> : <span />}
      {feedback?.isCorrect ? <button type="button" className="btn btn-primary" onClick={continueAfter}>{index === exercises.length - 1 ? "Concluir prática" : "Próximo exercício"} <Icon name="arrow" size={16} /></button> :
        <button type="submit" className="btn btn-primary" disabled={!ready}>{submit.isPending ? "Conferindo..." : "Conferir resposta"} <Icon name="arrow" size={16} /></button>}
    </div>
  </form>;
}

function LessonPage({ params }) {
  const lessonSlug = decodeURIComponent(params.lessonSlug || "");
  const { data, isLoading, isError, error, refetch } = useLesson(lessonSlug, true);
  const [tab, setTab] = useState("concept");
  useEffect(() => setTab("concept"), [lessonSlug]);
  if (isLoading) return <PageContent className="lesson-page"><LoadingState label="Carregando aula" /></PageContent>;
  if (isError) return <PageContent className="lesson-page"><ErrorState error={error} retry={refetch} /></PageContent>;
  const lesson = data?.lesson;
  if (!lesson) return <PageContent className="lesson-page"><EmptyState title="Aula não encontrada" detail="Esta etapa pode ter mudado de lugar. Explore novamente a trilha." action={<Link href="/learn" className="btn btn-primary">Ver trilha</Link>} /></PageContent>;
  return <PageContent className="lesson-page">
    <nav className="breadcrumbs" aria-label="Trilha de navegação"><Link href="/learn">Aprender</Link><Icon name="chevron" size={13} /><span>{lesson.courseTitle || "Aula"}</span></nav>
    <header className="lesson-header"><p className="eyebrow">{lesson.moduleTitle || lesson.courseTitle || "Aprender com contexto"}</p><h1>{lesson.title}</h1><p>{lesson.summary || lesson.learning?.context || "Antes de praticar, vamos entender a ideia por trás deste conceito."}</p>
      <div className="lesson-meta"><span><Icon name="clock" size={15} />{lesson.estimatedMinutes || 8} min</span><span><Icon name="star" size={15} />{lesson.xpReward || 0} pontos possíveis</span><span><Icon name="code" size={15} />{lesson.difficulty || "No seu ritmo"}</span></div>
    </header>
    <div className="lesson-tabs" role="tablist" aria-label="Conteúdo da aula">
      <button type="button" role="tab" aria-selected={tab === "concept"} className="lesson-tab" onClick={() => setTab("concept")}>Entenda o conceito</button>
      <button type="button" role="tab" aria-selected={tab === "practice"} className="lesson-tab" onClick={() => setTab("practice")}>Pratique</button>
    </div>
    {tab === "concept" ? <><LearningContent learning={lesson.learning} /><div className="exercise-actions"><span className="muted" style={{ fontSize: 12 }}>Entendeu a ideia? Agora experimente.</span><button className="btn btn-primary" type="button" onClick={() => setTab("practice")}>Ir para a prática <Icon name="arrow" size={16} /></button></div></> :
      <ExerciseFlow lesson={lesson} />}
  </PageContent>;
}

function ReviewPage() {
  const { data, isLoading, isError, error, refetch } = useReviewQueue(true);
  const completeReview = useCompleteReview();
  const [toast, setToast] = useState("");
  const items = safeArray(data?.items);
  if (isLoading) return <PageContent><LoadingState label="Carregando revisão" /></PageContent>;
  if (isError) return <PageContent><ErrorState error={error} retry={refetch} /></PageContent>;
  return <PageContent>
    <div className="page-heading"><div><p className="eyebrow">Fixar também é aprender</p><h1>Revisão</h1><p>Retome uma ideia no momento certo e fortaleça o que você já praticou.</p></div></div>
    {items.length ? <div className="review-list">{items.map((item, index) => {
      const lessonSlug = item.lessonSlug || item.slug || item.lesson?.slug;
      const title = item.title || item.lessonTitle || item.lesson?.title || "Uma aula para rever";
      const done = completeReview.isSuccess && completeReview.variables === lessonSlug;
      return <article className="review-card" key={lessonSlug || item.id || index}>
        <span className="review-mark"><Icon name="review" size={20} /></span>
        <div><h2>{title}</h2><p>{item.courseTitle || item.lesson?.courseTitle || "Uma revisão curta para consolidar o conceito."}</p></div>
        <div className="review-actions">{done ? <span className="review-completed">Revisão concluída</span> : <>
          {lessonSlug && <Link className="btn btn-outline btn-sm" href={`/learn/${encodeURIComponent(lessonSlug)}`}>Abrir aula</Link>}
          {lessonSlug && <button type="button" className="btn btn-primary btn-sm" disabled={completeReview.isPending} onClick={() => { completeReview.mutate(lessonSlug, { onSuccess: (result) => { if (result.reviewCompleted) { setToast("Revisão registrada. Bom trabalho em voltar ao conceito."); window.setTimeout(() => setToast(""), 3400); } } }); }}>Registrar revisão</button>}
        </>}</div>
        {completeReview.isError && completeReview.variables === lessonSlug && <p className="feedback try-again review-error" role="alert">{completeReview.error?.message || "Abra a aula, pratique os exercícios e volte para registrar a revisão."}</p>}
      </article>;
    })}</div> : <EmptyState title="Nenhuma revisão pendente" detail="Você está em dia. Continue aprendendo e as revisões aparecerão aqui quando fizerem sentido." action={<Link href="/learn" className="btn btn-primary">Continuar aprendendo <Icon name="arrow" size={16} /></Link>} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </PageContent>;
}

function ProfilePage() {
  const { data, isLoading, isError, error, refetch } = useDashboard(true);
  const current = useCurrentUser(true);
  if (isLoading || current.isLoading) return <PageContent><LoadingState label="Carregando perfil" /></PageContent>;
  if (isError || current.isError) return <PageContent><ErrorState error={error || current.error} retry={() => { refetch(); current.refetch(); }} /></PageContent>;
  const profile = current.data?.profile || data?.profile;
  const achievements = safeArray(data?.achievements);
  const allCourses = safeArray(data?.courses);
  const completedLessons = Number(profile?.lessonsCompleted || 0);
  return <PageContent>
    <div className="page-heading"><div><p className="eyebrow">Seu caminho até aqui</p><h1>Meu perfil</h1><p>Um retrato da prática que você construiu, aula após aula.</p></div></div>
    <section className="profile-hero"><div className="profile-avatar">{getInitials(getName(profile))}</div><div><h2>{getName(profile)}</h2><p>Aprendiz de programação · nível {profile?.level || 1}</p>{profile?.email && <p>{profile.email}</p>}</div></section>
    <div className="stats-grid">
      <article className="stat-card"><span className="stat-icon"><Icon name="star" /></span><strong className="stat-number">{Number(profile?.xp || 0).toLocaleString("pt-BR")}</strong><span className="stat-label">pontos de prática</span></article>
      <article className="stat-card"><span className="stat-icon"><Icon name="book" /></span><strong className="stat-number">{completedLessons}</strong><span className="stat-label">aulas concluídas</span></article>
      <article className="stat-card"><span className="stat-icon"><Icon name="flame" /></span><strong className="stat-number">{profile?.streakDays || 0}</strong><span className="stat-label">dias de ritmo atual</span></article>
      <article className="stat-card"><span className="stat-icon"><Icon name="map" /></span><strong className="stat-number">{allCourses.filter((course) => course.lessonCount && course.completedLessons >= course.lessonCount).length}</strong><span className="stat-label">trilhas finalizadas</span></article>
    </div>
    <div className="profile-layout">
      <section className="profile-card"><div className="card-header"><h2>Conquistas de prática</h2><span className="muted" style={{ fontSize: 12 }}>{achievements.length} no total</span></div>
        {achievements.length ? <div className="achievement-grid">{achievements.map((item, index) => <article className={`achievement-tile${item.earned === false || item.unlocked === false ? " locked" : ""}`} key={item.id || item.title || index}>
          <span className="achievement-medal"><Icon name="award" size={19} /></span><div><strong>{item.title || item.name || "Marco de aprendizagem"}</strong><span>{item.description || "Uma conquista construída com curiosidade e prática."}</span></div>
        </article>)}</div> : <p className="muted">Suas conquistas aparecem aqui conforme você pratica.</p>}
      </section>
      <section className="profile-card"><div className="card-header"><h2>Sua jornada</h2><Link href="/learn" className="text-link">Ver trilha <Icon name="arrow" size={14} /></Link></div>
        {allCourses.length ? <div className="activity-list">{allCourses.map((course, index) => <div className="activity-row" key={course.slug || course.title}><span className="course-index">{index + 1}</span><div><strong>{course.title}</strong><span>{course.completedLessons || 0} de {course.lessonCount || 0} aulas</span></div></div>)}</div> : <p className="muted">Sua trilha será exibida conforme as etapas forem disponibilizadas.</p>}
      </section>
    </div>
  </PageContent>;
}

function SettingsPage() {
  const { data, isLoading, isError, error, refetch } = useCurrentUser(true);
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [message, setMessage] = useState("");
  const profile = data?.profile;
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setDifficulty(profile.difficulty || "medium");
    }
  }, [profile?.clerkUserId]);
  if (isLoading) return <PageContent><LoadingState label="Carregando configurações" /></PageContent>;
  if (isError) return <PageContent><ErrorState error={error} retry={refetch} /></PageContent>;
  const saveSettings = (event) => {
    event.preventDefault();
    setMessage("");
    updateProfile.mutate({ displayName: displayName.trim() || profile?.displayName || undefined, difficulty }, {
      onSuccess: () => setMessage("Preferências atualizadas. Seu espaço, seu ritmo."),
    });
  };
  return <PageContent>
    <div className="page-heading"><div><p className="eyebrow">Do seu jeito</p><h1>Configurações</h1><p>Ajuste seu espaço de aprendizagem e escolha o ritmo que combina com você.</p></div></div>
    <div className="settings-grid">
      <form className="settings-card" onSubmit={saveSettings}>
        <h2>Seu perfil de aprendizagem</h2><p>Preferências claras deixam a jornada mais confortável.</p>
        <label className="field-label" htmlFor="displayName">Como devemos chamar você?</label>
        <input id="displayName" className="text-input" maxLength={60} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Seu nome" />
        <span className="field-label">Nível de desafio</span>
        <div className="radio-card-list">
          {[["easy", "Começar com calma", "Mais apoio para construir a base."], ["medium", "No meu ritmo", "Um equilíbrio entre orientação e desafio."], ["hard", "Quero me desafiar", "Mais espaço para resolver por conta própria."]].map(([value, label, description]) => <label className={`radio-card${difficulty === value ? " selected" : ""}`} key={value}>
            <input type="radio" name="difficulty" value={value} checked={difficulty === value} onChange={() => setDifficulty(value)} /><span><strong>{label}</strong><span>{description}</span></span>
          </label>)}
        </div>
        <button type="submit" className="btn btn-primary" disabled={updateProfile.isPending}>{updateProfile.isPending ? "Salvando..." : "Salvar preferências"}</button>
        {message && <p className="feedback success" role="status"><Icon name="check" />{message}</p>}
        {updateProfile.isError && <p className="feedback try-again" role="alert">{updateProfile.error?.message || "Não foi possível salvar. Tente novamente."}</p>}
      </form>
      <section className="settings-card">
        <h2>Aparência</h2><p>Escolha o tema que deixa mais confortável passar um tempo aprendendo.</p>
        <div className="theme-options" role="group" aria-label="Escolha a aparência">
          <button type="button" className={`theme-option${theme === "light" ? " selected" : ""}`} aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Icon name="sun" />Claro</button>
          <button type="button" className={`theme-option${theme === "dark" ? " selected" : ""}`} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Icon name="moon" />Escuro</button>
        </div>
        <div className="concept-block" style={{ marginTop: 24 }}><h3>Um ritmo sustentável</h3><p>Pequenas sessões frequentes criam entendimento duradouro. Não há pressa para chegar ao próximo nível.</p></div>
      </section>
    </div>
  </PageContent>;
}

function NotFound() {
  return <PageContent><EmptyState title="Esta página ainda não está na trilha" detail="Talvez o endereço tenha mudado. Volte ao início e escolha o próximo passo." action={<Link href="/" className="btn btn-primary">Ir para o início</Link>} /></PageContent>;
}

function Routes() {
  const { theme } = useTheme();
  return <div className={`app-root${theme === "dark" ? " theme-dark" : ""}`}>
    <Switch>
      <Route path="/" component={PublicHome} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/dashboard"><Protected><AppFrame active="/dashboard"><DashboardPage /></AppFrame></Protected></Route>
      <Route path="/learn"><Protected><AppFrame active="/learn"><CurriculumPage /></AppFrame></Protected></Route>
      <Route path="/learn/:lessonSlug">{(params) => <Protected><AppFrame active="/learn"><LessonPage params={params} /></AppFrame></Protected>}</Route>
      <Route path="/review"><Protected><AppFrame active="/review"><ReviewPage /></AppFrame></Protected></Route>
      <Route path="/profile"><Protected><AppFrame active="/profile"><ProfilePage /></AppFrame></Protected></Route>
      <Route path="/settings"><Protected><AppFrame active="/settings"><SettingsPage /></AppFrame></Protected></Route>
      <Route><NotFound /></Route>
    </Switch>
  </div>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      ...ptBR,
      signIn: {
        ...ptBR.signIn,
        start: {
          ...ptBR.signIn.start,
          title: "Boas-vindas de volta",
          subtitle: "Entre para continuar sua jornada",
        },
      },
      signUp: {
        ...ptBR.signUp,
        start: {
          ...ptBR.signUp.start,
          title: "Sua jornada começa aqui",
          subtitle: "Crie uma conta e aprenda com contexto e prática",
        },
      },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <ThemeContext.Provider value={useThemeContextValue()}>
        <Routes />
      </ThemeContext.Provider>
    </QueryClientProvider>
  </ClerkProvider>;
}

function useThemeContextValue() {
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem("codiva-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("codiva-theme", theme);
    } catch {
      // Appearance still works for the current session if browser storage is unavailable.
    }
  }, [theme]);
  const setNextTheme = (value) => setTheme(value === "dark" ? "dark" : "light");
  const toggleTheme = () => setTheme((value) => value === "dark" ? "light" : "dark");
  return { theme, setTheme: setNextTheme, toggleTheme };
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;
