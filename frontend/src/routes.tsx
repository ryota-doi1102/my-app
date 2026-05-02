import type { RouteObject } from "react-router-dom";
import { AppLayout } from "@/components/common/AppLayout";
import { RequireAuth } from "@/components/common/RequireAuth";
import ResetPasswordPage from "@/pages/auth/ResetPassword/ResetPasswordPage";
import SignInPage from "@/pages/auth/SignIn/SignInPage";
import SignUpPage from "@/pages/auth/SignUp/SignUpPage";
import HomePage from "@/pages/home/HomePage";
import { UserCreatePage } from "@/pages/users/create";
import { UserProfilePage } from "@/pages/users/detail";
import { UserListPage } from "@/pages/users/list";

export const routes: RouteObject[] = [
	// 認証画面（レイアウトなし・認証不要）
	{
		path: "/sign-in",
		element: <SignInPage />,
	},
	{
		path: "/sign-up",
		element: <SignUpPage />,
	},
	{
		path: "/reset-password",
		element: <ResetPasswordPage />,
	},
	// アプリ画面（認証必須・共通レイアウトあり）
	{
		element: <RequireAuth />,
		children: [
			{
				element: <AppLayout />,
				children: [
					{
						path: "/",
						element: <HomePage />,
					},
					{
						path: "/users/list",
						element: <UserListPage />,
					},
					{
						path: "/users/create",
						element: <UserCreatePage />,
					},
					{
						path: "/users/:id",
						element: <UserProfilePage />,
					},
				],
			},
		],
	},
];
