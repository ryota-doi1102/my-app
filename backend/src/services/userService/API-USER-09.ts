import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { importJobs } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";

const logger = getAppLogger(["services", "users", "API-USER-09"]);

export type ImportJobStatus = {
	id: string;
	status: string;
	result?: { created: number; updated: number };
	errors?: string[];
};

export async function getImportJob(jobId: string): Promise<ImportJobStatus> {
	const [job] = await db
		.select()
		.from(importJobs)
		.where(eq(importJobs.id, jobId))
		.limit(1);

	if (!job) {
		logger.warn("インポートジョブが見つからない", { jobId });
		throw new AppError(404, "NOT_FOUND", "ジョブが見つかりません");
	}

	const response: ImportJobStatus = { id: job.id, status: job.status };

	if (job.status === "completed" && job.createdCount != null && job.updatedCount != null) {
		response.result = { created: job.createdCount, updated: job.updatedCount };
	}
	if (job.status === "failed" && job.errors != null) {
		response.errors = job.errors;
	}

	return response;
}
