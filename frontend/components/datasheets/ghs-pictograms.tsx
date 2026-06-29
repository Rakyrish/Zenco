const GHS_LABELS: Record<string, string> = {
  GHS01: 'Explosive',
  GHS02: 'Flammable',
  GHS03: 'Oxidising',
  GHS04: 'Compressed gas',
  GHS05: 'Corrosive',
  GHS06: 'Toxic',
  GHS07: 'Harmful',
  GHS08: 'Health hazard',
  GHS09: 'Environmental',
}

export function GhsPictogram({ code }: { code: string }) {
  const normalized = code.toUpperCase().replace(/\s/g, '')
  const label = GHS_LABELS[normalized] || normalized

  return (
    <span
      className="inline-flex h-14 w-14 flex-col items-center justify-center rounded border-2 border-red-600 bg-white text-[9px] font-bold uppercase leading-tight text-red-700"
      title={label}
      aria-label={`GHS pictogram ${label}`}
    >
      <span>{normalized.replace('GHS', '')}</span>
      <span className="mt-0.5 text-[7px] font-semibold normal-case">{label.split(' ')[0]}</span>
    </span>
  )
}

export function GhsPictogramList({ codes }: { codes: string[] }) {
  if (!codes?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {codes.map(code => (
        <GhsPictogram key={code} code={code} />
      ))}
    </div>
  )
}
