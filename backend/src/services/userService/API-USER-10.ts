import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { exportJobs } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { exportUsers } from "./API-USER-EXPORT.js";

const logger = getAppLogger(["services", "users", "API-USER-10"]);

type ExportParams = {
	name?: string | undefined;
	email?: string | undefined;
	phone?: string | undefined;
	workTypeNames?: string[] | undefined;
	sortKey?: "name" | "email" | "phone" | null | undefined;
	sortOrder?: "asc" | "desc" | undefined;
};

export async function submitExportJob(params: ExportParams): Promise<string> {
	const [job] = await db
		.insert(exportJobs)
		.values({ status: "pending" })
		.returning({ id: exportJobs.id });

	if (!job) throw new Error("ジョブの作成に失敗しました");

	void runExportJob(job.id, params);

	logger.info("エクスポートジョブ作成", { jobId: job.id });
	return job.id;
}

async function runExportJob(jobId: string, params: ExportParams): Promise<void> {
	await db
		.update(exportJobs)
		.set({ status: "processing", updatedAt: new Date() })
		.where(eq(exportJobs.id, jobId));

	try {
		const csvContent = await exportUsers(params);

		await db
			.update(exportJobs)
			.set({ status: "completed", csvContent, updatedAt: new Date() })
			.where(eq(exportJobs.id, jobId));

		logger.info("エクスポートジョブ完了", { jobId });
	} catch (err) {
		const error = err instanceof Error ? err.message : "エクスポートに失敗しました";

		await db
			.update(exportJobs)
			.set({ status: "failed", errors: [error], updatedAt: new Date() })
			.where(eq(exportJobs.id, jobId));

		logger.warn("エクスポートジョブ失敗", { jobId, error });
	}
}
