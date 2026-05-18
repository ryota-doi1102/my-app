import { useLocation } from "react-router-dom";

const STATIC_TITLES: Record<string, string> = {
	"/": "ホーム",
	"/users/list": "ユーザー一覧",
	"/users/create": "ユーザー作成",
	"/users/import": "ユーザーインポート",
};

function getPageTitle(pathname: string): string {
	if (STATIC_TITLES[pathname]) return STATIC_TITLES[pathname];
	if (/^\/users\/(?!list$|create$)[^/]+$/.test(pathname)) return "ユーザー詳細";
	return "";
}

export function Header() {
	const { pathname } = useLocation();
	const pageTitle = getPageTitle(pathname);

	return (
		<header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-orange-500 px-6">
			<span className="text-base font-semibold tracking-tight">My App</span>
			{pageTitle && (
				<>
					<span className="text-orange-300">/</span>
					<span className="text-base font-medium">{pageTitle}</span>
				</>
			)}
		</header>
	);
}
