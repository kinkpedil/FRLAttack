type Props = {
  kicker?: React.ReactNode;
  title: string;
  // Nama pengguna tidak dikapitalkan agar sama persis dengan yang diketik.
  keepCase?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageTitle({ kicker, title, keepCase = false, actions, children }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker ? <p className="label mb-1">{kicker}</p> : null}
        <h1 className={`heading text-[28px] ${keepCase ? "normal-case" : ""}`}>{title}</h1>
        {children ? <div className="mt-2 max-w-[680px] text-ink-2">{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
