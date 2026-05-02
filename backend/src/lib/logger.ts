import {
	configure,
	getConsoleSink,
	getLogger,
	getTextFormatter,
} from "@logtape/logtape";

const isProduction = process.env.NODE_ENV === "production";

// ロガーを初期化する（アプリ起動時に一度だけ呼び出す）
export async function initLogger(): Promise<void> {
	const textFormatter = getTextFormatter({
		format: ({ timestamp, level, category, message }) =>
			`${timestamp} [${level.toUpperCase()}] ${category}: ${message}`,
	});

	await configure({
		sinks: {
			// 本番: デフォルト（JSON）、開発: テキスト整形
			console: isProduction
				? getConsoleSink()
				: getConsoleSink({ formatter: textFormatter }),
		},
		loggers: [
			{
				category: ["app"],
				sinks: ["console"],
				lowestLevel: isProduction ? "info" : "debug",
			},
		],
	});
}

// カテゴリ別ロガーを取得するヘルパー
export function getAppLogger(category: string[]): ReturnType<typeof getLogger> {
	return getLogger(["app", ...category]);
}
