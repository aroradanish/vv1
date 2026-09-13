'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/experiences', label: 'Experiences' },
];

const drawerIcons: Record<string, React.ReactNode> = {
  Home: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />,
  Explore: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />,
  Experiences: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />,
  Bookings: <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />,
  Host: <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />,
  Developers: <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />,
};

export default function Header() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [devModal, setDevModal] = useState(false);

  const isHost = user?.role === 'host';
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return (
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle dark={dark} toggle={toggle} />
      </div>
    );
  }

  return (
    <>
      {/* Drawer overlay */}
      <div
        className={`fixed inset-0 z-[1100] bg-black/50 backdrop-blur-[2px] transition-opacity ${
          drawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`fixed top-0 h-full w-[280px] bg-white z-[1200] shadow-2xl transition-all duration-300 ease-out flex flex-col dark:!bg-[#0a0002] ${
          drawerOpen ? 'left-0' : '-left-[300px]'
        }`}
      >
        <div className="p-5 border-b border-line flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl font-extrabold text-primary tracking-tight">VillaVista</span>
            <span className="bg-primary-light text-primary text-[11px] font-bold px-1.5 py-0.5 rounded uppercase">Menu</span>
          </Link>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-ink-muted text-xl">
            ×
          </button>
        </div>
        <ul className="p-2 flex-1">
          <DrawerItem href="/" label="Home" icon={drawerIcons.Home} active={pathname === '/'} onClick={() => setDrawerOpen(false)} />
          <DrawerItem href="/explore" label="Explore All" icon={drawerIcons.Explore} active={pathname === '/explore'} onClick={() => setDrawerOpen(false)} />
          <DrawerItem href="/experiences" label="Experiences" icon={drawerIcons.Experiences} active={pathname === '/experiences'} onClick={() => setDrawerOpen(false)} />
          {user && (
            <DrawerItem
              href={isHost ? '/host' : '/dashboard'}
              label={isHost ? 'Host Dashboard' : 'My Bookings'}
              icon={drawerIcons.Bookings}
              active={pathname === '/dashboard' || pathname === '/host'}
              onClick={() => setDrawerOpen(false)}
            />
          )}
          <li>
            <button
              onClick={() => {
                setDrawerOpen(false);
                setDevModal(true);
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 font-semibold text-[15px] rounded-sm hover:bg-primary-light hover:text-primary text-left transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">{drawerIcons.Developers}</svg>
              About Developers
            </button>
          </li>
        </ul>
      </aside>

      {/* Top header */}
      <header className="sticky top-4 z-[1000] mx-4 sm:mx-8 h-16 flex justify-between items-center px-4 sm:px-8 rounded-pill border border-white/30 bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(128,0,32,0.1)] dark:bg-black/60 dark:border-white/10 dark:shadow-none transition-all duration-300">
        <div className="flex items-center gap-4">
          <button className="text-[22px] px-1.5 rounded hover:bg-black/5" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl font-extrabold text-primary tracking-tight">VillaVista</span>
            <span className="bg-primary-light text-primary text-[11px] font-bold px-1.5 py-0.5 rounded uppercase">
              {isHost ? 'Host' : 'Home'}
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-3">
          <ul className="flex items-center gap-3 list-none m-0 p-0">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`no-underline font-semibold text-sm px-3 py-2 rounded-sm transition-all ${
                    pathname === l.href ? 'bg-white text-primary dark:!bg-transparent' : 'text-ink-main hover:text-primary dark:!text-white'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <ThemeToggle dark={dark} toggle={toggle} />
            </li>
          </ul>
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <Link href={isHost ? '/host' : '/dashboard'} className="btn-outline !text-sm no-underline">
                  {isHost ? 'Host Dashboard' : 'My Bookings'}
                </Link>
                <button
                  className="btn-outline !text-sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to logout?')) {
                      logout();
                      router.push('/');
                    }
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-outline !text-sm no-underline">Log in</Link>
                <Link href="/register" className="btn-primary !text-sm no-underline">Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {devModal && (
        <div
          className="fixed inset-0 z-[5000] bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setDevModal(false)}
        >
          <div
            className="bg-white dark:!bg-[#0f0003] p-9 rounded-[20px] max-w-[440px] w-[90%] shadow-2xl text-center border border-line dark:border-primary/30 animate-modalUp relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-4 right-5 text-2xl cursor-pointer text-ink-muted" onClick={() => setDevModal(false)}>×</button>
            <h2 className="text-primary font-extrabold mb-4 text-2xl">Developed By</h2>
            <p className="font-bold text-lg">Dnish Arora</p>
            <hr className="my-5 border-line" />
            <p className="text-[13px] text-ink-muted">VillaVista Homestay Rental Platform · 2026</p>
          </div>
        </div>
      )}
    </>
  );
}

function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="cursor-pointer px-3.5 py-2 rounded-pill border border-line bg-white text-ink-main font-semibold text-[13px] transition-all hover:border-primary hover:text-primary dark:!bg-transparent dark:!text-white dark:!border-white/20"
    >
      {dark ? '☀️ Light Mode' : '🌙 Mode'}
    </button>
  );
}

function DrawerItem({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3.5 px-4 py-3 font-semibold text-[15px] rounded-sm transition-all no-underline ${
          active ? 'bg-primary-light text-primary' : 'text-ink-main hover:bg-primary-light hover:text-primary dark:!text-white'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">{icon}</svg>
        {label}
      </Link>
    </li>
  );
}
