type Props = {
  kicker?: string;
  title: string;
  // Nama pengguna tidak dikapitalkan agar sama persis dengan yang diketik.
  keepCase?: boolean;
  children?: React.ReactNode;
};

export function PageTitle({ kicker, title, keepCase = false, children }: Props) {
  return (
    <div className="mb-8 border-b border-rule pb-4">
      {kicker ? <p className="label mb-1">{kicker}</p> : null}
      <h1 className={`heading text-[28px] ${keepCase ? "normal-case" : ""}`}>{title}</h1>
      {children ? <div className="mt-2 max-w-[640px] text-ink-2">{children}</div> : null}
    </div>
  );
}
