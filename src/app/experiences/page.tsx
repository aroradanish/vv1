'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Experience } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { rupees } from '@/lib/utils';

export default function ExperiencesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [booking, setBooking] = useState<string | null>(null);

  useEffect(() => {
    api.experiences().then(setExperiences).catch(() => setExperiences([]));
  }, []);

  const book = async (exp: Experience) => {
    if (!user) {
      alert('Please login to book an experience.');
      router.push('/login');
      return;
    }
    setBooking(exp.id);
    try {
      await api.bookExperience(exp.id);
      alert('Experience booked! View it in your dashboard.');
      router.push('/dashboard');
    } catch (err) {
      alert('Booking failed: ' + (err as Error).message);
    } finally {
      setBooking(null);
    }
  };

  return (
    <>
      <section
        className="h-[350px] flex flex-col justify-center items-center text-white text-center px-5"
        style={{
          background: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/images/bali.webp') center/cover",
        }}
      >
        <h1 className="text-5xl font-extrabold mb-2.5">Local Experiences</h1>
        <p className="text-xl max-w-[600px] opacity-90">
          Go beyond the stay. Connect with local culture, adventure, and flavor with our curated collection of experiences.
        </p>
      </section>

      <div className="max-w-[1200px] mx-auto my-10 px-5">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="block w-10 h-1 rounded-full bg-gradient-to-r from-primary to-[#c83858] mb-3" aria-hidden />
            <h2 className="text-[1.6rem] font-extrabold">Featured Experiences</h2>
            <p className="text-ink-muted text-sm mt-1">Top-rated activities hosted by our community</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-white dark:!bg-[#2a0a0f] rounded-lg overflow-hidden border border-line shadow-sm transition-all duration-300 flex flex-col hover:shadow-lg hover:-translate-y-1.5">
              <div className="h-[220px] overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/${exp.image}`} alt={exp.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                {exp.badge && (
                  <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-pill text-[11px] font-extrabold uppercase shadow-md">
                    {exp.badge}
                  </span>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-primary text-xs font-extrabold uppercase tracking-wide mb-2">{exp.type}</div>
                <h3 className="text-xl font-extrabold mb-2.5 leading-tight">{exp.title}</h3>
                <p className="text-sm text-ink-muted mb-5 leading-relaxed">{exp.desc}</p>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-line">
                  <div className="font-extrabold text-lg">
                    {rupees(exp.price)} <span className="text-[13px] text-ink-muted font-medium">/ person</span>
                  </div>
                  <button onClick={() => book(exp)} disabled={booking === exp.id} className="btn-primary rounded-sm px-5 py-2.5 font-bold">
                    {booking === exp.id ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {experiences.length === 0 && <p className="col-span-full text-center py-12 text-ink-muted">Loading experiences...</p>}
        </div>
      </div>
    </>
  );
}
