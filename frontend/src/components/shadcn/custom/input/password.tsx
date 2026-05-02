import { Field } from "@base-ui/react/field";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/shadcn/original/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
	id?: string;
	label?: string;
	value: string;
	onChange: (value: string) => void;
	errorMessage?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

function PasswordInput({
	id = "password",
	label = "パスワード",
	value,
	onChange,
	errorMessage,
	placeholder = "••••••••",
	required,
	disabled,
	className,
}: PasswordInputProps) {
	const [visible, setVisible] = useState(false);

	return (
		<Field.Root invalid={!!errorMessage} className={cn("flex flex-col gap-1.5", className)}>
			<Field.Label className="text-sm font-medium text-foreground">
				{label}
				{required && (
					<span className="ml-1 text-destructive" aria-hidden="true">
						*
					</span>
				)}
			</Field.Label>

			<div className="relative">
				<Input
					id={id}
					type={visible ? "text" : "password"}
					autoComplete="current-password"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					required={required}
					disabled={disabled}
					className="pr-9"
				/>
				<button
					type="button"
					aria-label={visible ? "パスワードを隠す" : "パスワードを表示する"}
					onClick={() => setVisible((v) => !v)}
					disabled={disabled}
					className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
				>
					{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			</div>

			<Field.Error match={true} className="text-xs text-destructive">
				{errorMessage}
			</Field.Error>
		</Field.Root>
	);
}

// --- react-hook-form 連携 ---

interface PasswordInputFieldProps<T extends FieldValues>
	extends Omit<PasswordInputProps, "value" | "onChange" | "errorMessage"> {
	control: Control<T>;
	name: Path<T>;
}

function PasswordInputField<T extends FieldValues>({
	control,
	name,
	...props
}: PasswordInputFieldProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<PasswordInput
					value={field.value}
					onChange={field.onChange}
					errorMessage={fieldState.error?.message}
					{...props}
				/>
			)}
		/>
	);
}

export type { PasswordInputFieldProps, PasswordInputProps };
export { PasswordInput, PasswordInputField };
