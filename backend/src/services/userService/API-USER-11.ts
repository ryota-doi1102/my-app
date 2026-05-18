import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { exportJobs } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";

const logger = getAppLogger(["services", "users", "API-USER-11"]);

export type ExportJobStatus = {
	id: string;
	status: string;
	csvContent?: string;
	errors?: string[];
};

export async function getExportJob(jobId: string): Promise<ExportJobStatus> {
	const [job] = await db
		.select()
		.from(exportJobs)
		.where(eq(exportJobs.id, jobId))
		.limit(1);

	if (!job) {
		logger.warn("エクスポートジョブが見つからない", { jobId });
		throw new AppError(404, "NOT_FOUND", "ジョブが見つかりません");
	}

	const response: ExportJobStatus = { id: job.id, status: job.status };

	if (job.status === "completed" && job.csvContent != null) {
		response.csvContent = job.csvContent;
	}
	if (job.status === "failed" && job.errors != null) {
		response.errors = job.errors;
	}

	return response;
}
