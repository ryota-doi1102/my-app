import { Link } from "react-router-dom";
import { EmailInputField } from "@/components/shadcn/custom/input/email";
import { PasswordInputField } from "@/components/shadcn/custom/input/password";
import { Button } from "@/components/shadcn/original/button";
import { useSignIn } from "./useSignIn";

export function SignInPage() {
	const { control, handleSubmit, error } = useSignIn();

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-1 text-center">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">サインイン</h1>
					<p className="text-sm text-muted-foreground">アカウントにサインインしてください</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<EmailInputField name="email" control={control} required />

					<div className="space-y-1.5">
						<PasswordInputField name="password" control={control} required />
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<Button type="submit" className="w-full" size="lg">
						サインイン
					</Button>
				</form>

				<Link
					to="/reset-password"
					className="text-sm font-medium text-blue-600 hover:underline underline-offset-4 dark:text-blue-400"
				>
					パスワードをお忘れですか？
				</Link>

				<p className="text-center text-sm text-muted-foreground">
					アカウントをお持ちでない方は
					<Link
						to="/sign-up"
						className="font-medium text-blue-600 hover:underline underline-offset-4 dark:text-blue-400"
					>
						サインアップ
					</Link>
				</p>
			</div>
		</div>
	);
}
