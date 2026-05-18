import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getExportJob, getImportJob } from "@/lib/api/users";

type JobType = "import" | "export";
type JobStatus = "pending" | "processing" | "completed" | "failed";

export type ActiveJob = {
	id: string;
	type: JobType;
	status: JobStatus;
	importResult?: { created: number; updated: number };
	errors?: string[];
	onComplete?: () => void;
};

type JobsContextValue = {
	jobs: ActiveJob[];
	addImportJob: (jobId: string, onComplete?: () => void) => void;
	addExportJob: (jobId: string) => void;
	dismissJob: (jobId: string) => void;
};

const JobsContext = createContext<JobsContextValue | null>(null);

const POLL_INTERVAL_MS = 2000;
const AUTO_DISMISS_MS = 8000;

export function JobsProvider({ children }: { children: React.ReactNode }) {
	const [jobs, setJobs] = useState<ActiveJob[]>([]);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const updateJob = useCallback((id: string, patch: Partial<ActiveJob>) => {
		setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
	}, []);

	const scheduleAutoDismiss = useCallback((jobId: string) => {
		const timer = setTimeout(() => {
			setJobs((prev) => prev.filter((j) => j.id !== jobId));
			dismissTimers.current.delete(jobId);
		}, AUTO_DISMISS_MS);
		dismissTimers.current.set(jobId, timer);
	}, []);

	const addImportJob = useCallback((jobId: string, onComplete?: () => void) => {
		setJobs((prev) => [...prev, { id: jobId, type: "import", status: "pending", onComplete }]);
	}, []);

	const addExportJob = useCallback((jobId: string) => {
		setJobs((prev) => [...prev, { id: jobId, type: "export", status: "pending" }]);
	}, []);

	const dismissJob = useCallback((jobId: string) => {
		const timer = dismissTimers.current.get(jobId);
		if (timer) {
			clearTimeout(timer);
			dismissTimers.current.delete(jobId);
		}
		setJobs((prev) => prev.filter((j) => j.id !== jobId));
	}, []);

	// ポーリング
	useEffect(() => {
		const poll = async () => {
			const activeJobs = jobs.filter((j) => j.status === "pending" || j.status === "processing");
			if (activeJobs.length === 0) return;

			await Promise.allSettled(
				activeJobs.map(async (job) => {
					try {
						if (job.type === "import") {
							const result = await getImportJob(job.id);
							if (result.status === "completed" || result.status === "failed") {
								updateJob(job.id, {
									status: result.status as JobStatus,
									importResult: result.result,
									errors: result.errors,
								});
								if (result.status === "completed") job.onComplete?.();
								scheduleAutoDismiss(job.id);
							} else {
								updateJob(job.id, { status: result.status as JobStatus });
							}
						} else {
							const result = await getExportJob(job.id);
							if (result.status === "completed") {
								const url = URL.createObjectURL(result.csvBlob);
								const a = document.createElement("a");
								a.href = url;
								a.download = "users.csv";
								a.click();
								URL.revokeObjectURL(url);
								updateJob(job.id, { status: "completed" });
								scheduleAutoDismiss(job.id);
							} else if (result.status === "failed") {
								updateJob(job.id, { status: "failed", errors: result.errors });
								scheduleAutoDismiss(job.id);
							} else {
								updateJob(job.id, { status: result.status as JobStatus });
							}
						}
					} catch (err) {
						if (err instanceof ApiError) {
							updateJob(job.id, { status: "failed" });
							scheduleAutoDismiss(job.id);
						}
						// ネットワークエラー等は次のタイミングで再試行
					}
				}),
			);
		};

		const hasActive = jobs.some((j) => j.status === "pending" || j.status === "processing");

		if (hasActive) {
			intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [jobs, updateJob, scheduleAutoDismiss]);

	return (
		<JobsContext.Provider value={{ jobs, addImportJob, addExportJob, dismissJob }}>
			{children}
		</JobsContext.Provider>
	);
}

export function useJobs(): JobsContextValue {
	const ctx = useContext(JobsContext);
	if (!ctx) throw new Error("useJobs must be used within JobsProvider");
	return ctx;
}
