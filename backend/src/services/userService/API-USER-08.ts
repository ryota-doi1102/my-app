import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { importJobs } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { ImportValidationError, importUsers } from "./API-USER-IMPORT.js";

const logger = getAppLogger(["services", "users", "API-USER-08"]);

export async function submitImportJob(csvText: string): Promise<string> {
	const [job] = await db
		.insert(importJobs)
		.values({ status: "pending" })
		.returning({ id: importJobs.id });

	if (!job) throw new Error("ジョブの作成に失敗しました");

	void runImportJob(job.id, csvText);

	logger.info("インポートジョブ作成", { jobId: job.id });
	return job.id;
}

async function runImportJob(jobId: string, csvText: string): Promise<void> {
	await db
		.update(importJobs)
		.set({ status: "processing", updatedAt: new Date() })
		.where(eq(importJobs.id, jobId));

	try {
		const result = await importUsers(csvText);

		await db
			.update(importJobs)
			.set({
				status: "completed",
				createdCount: result.created,
				updatedCount: result.updated,
				updatedAt: new Date(),
			})
			.where(eq(importJobs.id, jobId));

		logger.info("インポートジョブ完了", { jobId, ...result });
	} catch (err) {
		const errors =
			err instanceof ImportValidationError
				? err.messages
				: ["インポートに失敗しました"];

		await db
			.update(importJobs)
			.set({ status: "failed", errors, updatedAt: new Date() })
			.where(eq(importJobs.id, jobId));

		logger.warn("インポートジョブ失敗", { jobId, errors });
	}
}
