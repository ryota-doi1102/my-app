import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/shadcn/original/sonner";
import type { ActiveJob } from "@/contexts/JobsContext";
import { useJobs } from "@/contexts/JobsContext";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SideMenu } from "./SideMenu";

type SnackbarState = {
	severity?: "success" | "error" | "warning" | "info";
	message: string;
};

function useSnackbar() {
	const location = useLocation();
	const shownKeys = useRef(new Set<string>());

	useEffect(() => {
		const state = location.state as { snackbar?: SnackbarState } | null;
		const snackbar = state?.snackbar;
		if (!snackbar?.message || shownKeys.current.has(location.key)) return;
		shownKeys.current.add(location.key);
		switch (snackbar.severity) {
			case "error":
				toast.error(snackbar.message);
				break;
			case "warning":
				toast.warning(snackbar.message);
				break;
			case "info":
				toast.info(snackbar.message);
				break;
			default:
				toast.success(snackbar.message);
		}
	}, [location.key, location.state]);
}

function jobLabel(job: ActiveJob): string {
	const prefix = job.type === "import" ? "インポート" : "エクスポート";
	if (job.status === "pending" || job.status === "processing") return `${prefix}処理中…`;
	if (job.status === "completed") {
		if (job.type === "import" && job.importResult) {
			return `${prefix}完了: 新規${job.importResult.created}件・更新${job.importResult.updated}件`;
		}
		return `${prefix}完了`;
	}
	return `${prefix}失敗`;
}

function JobsPanel() {
	const { jobs, dismissJob } = useJobs();
	if (jobs.length === 0) return null;

	return (
		<div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
			{jobs.map((job) => {
				const isActive = job.status === "pending" || job.status === "processing";
				const isFailed = job.status === "failed";

				return (
					<div
						key={job.id}
						className={[
							"flex min-w-72 items-start gap-3 rounded-lg px-4 py-3 shadow-lg",
							isFailed ? "bg-red-600 text-white" : "bg-gray-800 text-white",
						].join(" ")}
					>
						<span className="mt-0.5 shrink-0">
							{isActive ? (
								<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
							) : isFailed ? (
								"✕"
							) : (
								"✓"
							)}
						</span>
						<div className="flex-1 text-sm">
							<p>{jobLabel(job)}</p>
							{isFailed && job.errors && job.errors.length > 0 && (
								<ul className="mt-1 list-disc pl-4 text-xs opacity-90">
									{job.errors.slice(0, 5).map((e) => (
										<li key={e}>{e}</li>
									))}
									{job.errors.length > 5 && <li>…他{job.errors.length - 5}件</li>}
								</ul>
							)}
						</div>
						{!isActive && (
							<button
								type="button"
								className="shrink-0 opacity-70 hover:opacity-100"
								onClick={() => dismissJob(job.id)}
							>
								✕
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function AppLayout() {
	useSnackbar();

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
			<JobsPanel />
			<Toaster />
		</div>
	);
}
