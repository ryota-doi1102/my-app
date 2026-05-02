import { Link } from "react-router-dom";
import { EmailInputField } from "@/components/shadcn/custom/input/email";
import { PasswordInputField } from "@/components/shadcn/custom/input/password";
import { Button } from "@/components/shadcn/original/button";
import { useResetPassword } from "./useResetPassword";

function ResetPasswordPage() {
	const { step, requestForm, resetForm, onRequestSubmit, onResetSubmit, backToRequest, error } =
		useResetPassword();

	if (step === "reset") {
		return (
			<div className="flex min-h-screen items-center justify-center px-4">
				<div className="w-full max-w-sm space-y-6">
					<div className="space-y-1 text-center">
						<h1 className="text-2xl font-semibold tracking-tight text-foreground">
							新しいパスワードを設定
						</h1>
						<p className="text-sm text-muted-foreground">新しいパスワードを入力してください</p>
					</div>

					<form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
						<PasswordInputField name="password" control={resetForm.control} required />

						<PasswordInputField
							name="confirmPassword"
							control={resetForm.control}
							label="パスワード（確認）"
							id="confirmPassword"
							required
						/>

						{error && <p className="text-sm text-destructive">{error}</p>}

						<Button type="submit" className="w-full" size="lg">
							パスワードをリセット
						</Button>
					</form>

					<button
						type="button"
						onClick={backToRequest}
						className="block w-full text-center text-sm text-muted-foreground hover:underline underline-offset-4"
					>
						メールアドレスの入力に戻る
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-1 text-center">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						パスワードリセット
					</h1>
					<p className="text-sm text-muted-foreground">
						登録済みのメールアドレスを入力してください
					</p>
				</div>

				<form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
					<EmailInputField name="email" control={requestForm.control} required />

					{error && <p className="text-sm text-destructive">{error}</p>}

					<Button type="submit" className="w-full" size="lg">
						リセットトークンを発行
					</Button>
				</form>

				<Link
					to="/sign-in"
					className="block text-center text-sm font-medium text-blue-600 hover:underline underline-offset-4 dark:text-blue-400"
				>
					サインインへ戻る
				</Link>
			</div>
		</div>
	);
}

export default ResetPasswordPage;
