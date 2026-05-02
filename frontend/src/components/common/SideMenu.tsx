import { UserPlus, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ label: "ユーザー一覧", to: "/users/list", icon: Users },
	{ label: "ユーザー作成", to: "/users/create", icon: UserPlus },
] as const;

export function SideMenu() {
	return (
		<aside className="w-60 shrink-0 border-r bg-muted/30">
			<nav className="space-y-1 p-3">
				{NAV_ITEMS.map(({ label, to, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						end
						className={({ isActive }) =>
							cn(
								"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-accent hover:text-foreground",
							)
						}
					>
						<Icon className="size-4 shrink-0" />
						{label}
					</NavLink>
				))}
			</nav>
		</aside>
	);
}
