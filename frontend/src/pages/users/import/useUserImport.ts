import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
	downloadTemplate as apiDownloadTemplate,
	getImportJob,
	submitImportJob,
} from "@/lib/api/users";

export type ImportPhase =
	| "idle"
	| "file_selected"
	| "uploading"
	| "polling"
	| "completed"
	| "failed";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DATA_ROWS = 500;
const POLL_INTERVAL_MS = 2000;

async function gzipCompress(
	buffer: ArrayBuffer,
): Promise<{ data: ArrayBuffer; compressed: boolean }> {
	if (typeof CompressionStream === "undefined") {
		return { data: buffer, compressed: false };
	}
	const cs = new CompressionStream("gzip");
	const writer = cs.writable.getWriter();
	await writer.write(buffer);
	await writer.close();
	const data = await new Response(cs.readable).arrayBuffer();
	return { data, compressed: true };
}

async function validateFile(file: File): Promise<string | null> {
	if (file.size > MAX_FILE_SIZE_BYTES) {
		return "ファイルサイズが上限（5MB）を超えています";
	}
	const text = await file.text();
	const stripped = text.startsWith("﻿") ? text.slice(1) : text;
	const dataRows = stripped.split("\n").filter((l) => l.trim().length > 0).length - 1;
	if (dataRows > MAX_DATA_ROWS) {
		return "データ行数が上限（500件）を超えています";
	}
	return null;
}

export function useUserImport() {
	const [phase, setPhase] = useState<ImportPhase>("idle");
	const [file, setFile] = useState<File | null>(null);
	const [clientError, setClientError] = useState<string | null>(null);
	const [result, setResult] = useState<{ created: number; updated: number } | null>(null);
	const [serverErrors, setServerErrors] = useState<string[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stopPolling = useCallback(() => {
		if (pollingRef.current !== null) {
			clearInterval(pollingRef.current);
			pollingRef.current = null;
		}
	}, []);

	useEffect(() => () => stopPolling(), [stopPolling]);

	const applyFile = useCallback(async (f: File) => {
		const error = await validateFile(f);
		setFile(f);
		setClientError(error);
		setPhase(error ? "idle" : "file_selected");
	}, []);

	const handleInputChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const f = e.target.files?.[0];
			if (f) await applyFile(f);
		},
		[applyFile],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const f = e.dataTransfer.files[0];
			if (f) await applyFile(f);
		},
		[applyFile],
	);

	const startPolling = useCallback(
		(jobId: string) => {
			setPhase("polling");
			pollingRef.current = setInterval(async () => {
				try {
					const res = await getImportJob(jobId);
					if (res.status === "completed") {
						stopPolling();
						setResult(res.result ?? null);
						setPhase("completed");
					}
					// pending / processing: continue polling
				} catch (err) {
					stopPolling();
					setServerErrors(
						err instanceof ApiError ? err.messages : ["予期せぬエラーが発生しました"],
					);
					setPhase("failed");
				}
			}, POLL_INTERVAL_MS);
		},
		[stopPolling],
	);

	const handleImport = useCallback(async () => {
		if (!file || clientError) return;

		setPhase("uploading");
		setServerErrors([]);

		try {
			const buffer = await file.arrayBuffer();
			const { data, compressed } = await gzipCompress(buffer);
			const jobId = await submitImportJob(data, compressed);
			startPolling(jobId);
		} catch (err) {
			setServerErrors(err instanceof ApiError ? err.messages : ["予期せぬエラーが発生しました"]);
			setPhase("failed");
		}
	}, [file, clientError, startPolling]);

	const handleReset = useCallback(() => {
		stopPolling();
		setPhase("idle");
		setFile(null);
		setClientError(null);
		setResult(null);
		setServerErrors([]);
	}, [stopPolling]);

	const handleDownloadTemplate = useCallback(async () => {
		const blob = await apiDownloadTemplate();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "users_import_template.csv";
		a.click();
		URL.revokeObjectURL(url);
	}, []);

	const isProcessing = phase === "uploading" || phase === "polling";

	return {
		phase,
		file,
		clientError,
		result,
		serverErrors,
		isDragging,
		isProcessing,
		handleInputChange,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleImport,
		handleReset,
		handleDownloadTemplate,
	};
}
