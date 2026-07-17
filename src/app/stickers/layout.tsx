import { StickersProvider } from "@/context/StickersContext";

export default function StickersLayout({ children }: { children: React.ReactNode }) {
  return <StickersProvider>{children}</StickersProvider>;
}
