export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex justify-between items-end mb-6">
      <div>
        <span className="block w-10 h-1 rounded-full bg-gradient-to-r from-primary to-[#c83858] mb-3" aria-hidden />
        <h2 className="text-[1.6rem] font-extrabold tracking-tight">{title}</h2>
        {subtitle && <p className="text-ink-muted text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
