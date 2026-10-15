import { ClinicShell } from "@/components/ClinicShell";

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return <ClinicShell>{children}</ClinicShell>;
}
