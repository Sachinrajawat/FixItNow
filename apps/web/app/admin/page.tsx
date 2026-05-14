import Link from "next/link";
import { FolderTree } from "lucide-react";

interface AdminSection {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SECTIONS: AdminSection[] = [
  {
    href: "/admin/categories",
    title: "Categories",
    description:
      "Add, rename, and retire service categories. Categories drive the home page tiles and the search sidebar.",
    icon: <FolderTree className="text-primary h-6 w-6" />,
  },
];

export default function AdminHomePage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className="bg-card hover:border-primary flex flex-col gap-3 rounded-lg border p-5 transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            {s.icon}
            <h2 className="font-semibold">{s.title}</h2>
          </div>
          <p className="text-muted-foreground text-sm">{s.description}</p>
        </Link>
      ))}
    </div>
  );
}
