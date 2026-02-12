import { Sidebar } from "@/components/layout/sidebar";
import { cookies } from "next/headers";

function decodeToken(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    );
    return decoded;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  const user = token ? decodeToken(token) : null;

  return (
    <div className="flex">
      <Sidebar user={user} />
      <main className="flex-1 w-[80%] ml-[20%]">{children}</main>
    </div>
  );
}
