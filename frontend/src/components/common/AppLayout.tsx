import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SideMenu } from "./SideMenu";

export function AppLayout() {
	return (
		<div className="flex h-screen flex-col overflow-hidden">
			<Header />
			<div className="flex flex-1 overflow-hidden">
				<SideMenu />
				<main className="flex-1 overflow-y-auto bg-yellow-50">
					<Outlet />
				</main>
			</div>
			<Footer />
		</div>
	);
}
