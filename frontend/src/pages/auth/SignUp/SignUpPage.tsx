import { Link } from "react-router-dom";
import { EmailInputField } from "@/components/shadcn/custom/input/email";
import { PasswordInputField } from "@/components/shadcn/custom/input/password";
import { Button } from "@/components/shadcn/original/button";
import { useSignUp } from "./useSignUp";

function SignUpPage() {
	const { control, handleSubmit, error } = useSignUp();

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-1 text-center">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">サインアップ</h1>
					<p className="text-sm text-muted-foreground">新しいアカウントを作成してください</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<EmailInputField name="email" control={control} required />

					<PasswordInputField name="password" control={control} required />

					<PasswordInputField
						name="confirmPassword"
						control={control}
						label="パスワード（確認）"
						id="confirmPassword"
						required
					/>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<Button type="submit" className="w-full" size="lg">
						サインアップ
					</Button>
				</form>

				<p className="text-center text-sm text-muted-foreground">
					すでにアカウントをお持ちの方は
					<Link
						to="/sign-in"
						className="font-medium text-blue-600 hover:underline underline-offset-4 dark:text-blue-400"
					>
						サインイン
					</Link>
				</p>
			</div>
		</div>
	);
}

export default SignUpPage;
