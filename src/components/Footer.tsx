'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) return null;

  return (
    <footer className="bg-black text-zinc-400 px-6 pt-16 pb-10 mt-20 border-t border-white/5 dark:border-primary/20 transition-colors">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <h5 className="text-white font-bold text-base mb-6">Company</h5>
            <ul className="flex flex-col gap-3 list-none p-0">
              <li><Link href="#" className="hover:text-white transition-colors text-[14px]">About VillaVista</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors text-[14px]">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors text-[14px]">Mobile App</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors text-[14px]">Press & Media</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-6">Top Destinations</h5>
            <ul className="flex flex-col gap-3 list-none p-0">
              {[
                ['Goa', 'Goa Homestays'],
                ['Manali', 'Manali Chalets'],
                ['Jaipur', 'Jaipur Havelis'],
                ['Kerala', 'Kerala Houseboats'],
                ['Chennai', 'Chennai Beach Houses'],
              ].map(([loc, label]) => (
                <li key={loc}>
                  <Link href={`/explore?search=${loc}`} className="hover:text-white transition-colors text-[14px]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-6">Properties & Types</h5>
            <ul className="flex flex-col gap-3 list-none p-0">
              <li><Link href="/explore?ai=1" className="hover:text-white transition-colors text-[14px]">✨ AI Trip Planner</Link></li>
              <li><Link href="/experiences" className="hover:text-white transition-colors text-[14px]">⛵ Local Experiences</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors text-[14px]">Beachfront Villas</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors text-[14px]">City Apartments</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-6">Support & Legal</h5>
            <ul className="flex flex-col gap-3 list-none p-0">
              <li><Link href="#" className="hover:text-white transition-colors text-[14px]">Help Center / FAQ</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors text-[14px]">Cancellation Options</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors text-[14px]">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors text-[14px]">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logov.png" alt="VillaVista Logo" className="h-9 w-auto brightness-0 invert opacity-90" />
            <div>
              <span className="text-white font-bold text-xl tracking-tight block">VillaVista</span>
              <p className="text-zinc-500 text-xs mt-0.5">© 2026 VillaVista Inc. All rights reserved.</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <SocialLink href="#" label="Facebook" icon="FB" />
            <SocialLink href="#" label="Twitter" icon="TW" />
            <SocialLink href="#" label="Instagram" icon="IG" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest no-underline border-b border-transparent hover:border-white pb-0.5"
    >
      {icon}
    </a>
  );
}
