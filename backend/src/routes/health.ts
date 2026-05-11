import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const health = new OpenAPIHono();

const healthRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["System"],
	summary: "ヘルスチェック",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						status_code: z.number(),
						is_success: z.literal(true),
						data: z.object({
							status: z.string(),
							timestamp: z.string(),
						}),
					}),
				},
			},
			description: "サーバー正常稼働中",
		},
	},
});

health.openapi(healthRoute, (c) => {
	return c.json(
		{
			status_code: 200,
			is_success: true,
			data: {
				status: "ok",
				timestamp: new Date().toISOString(),
			},
		},
		200,
	);
});

export default health;
