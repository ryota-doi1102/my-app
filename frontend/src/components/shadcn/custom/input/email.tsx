import { Field } from "@base-ui/react/field";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/shadcn/original/input";
import { cn } from "@/lib/utils";

interface EmailInputProps {
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

function EmailInput({
	id = "email",
	label = "メールアドレス",
	value,
	onChange,
	errorMessage,
	placeholder = "example@email.com",
	required,
	disabled,
	className,
}: EmailInputProps) {
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

			<Input
				id={id}
				type="email"
				autoComplete="email"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
			/>

			<Field.Error match={true} className="text-xs text-destructive">
				{errorMessage}
			</Field.Error>
		</Field.Root>
	);
}

// --- react-hook-form 連携 ---

interface EmailInputFieldProps<T extends FieldValues>
	extends Omit<EmailInputProps, "value" | "onChange" | "errorMessage"> {
	control: Control<T>;
	name: Path<T>;
}

function EmailInputField<T extends FieldValues>({
	control,
	name,
	...props
}: EmailInputFieldProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<EmailInput
					value={field.value}
					onChange={field.onChange}
					errorMessage={fieldState.error?.message}
					{...props}
				/>
			)}
		/>
	);
}

export type { EmailInputFieldProps, EmailInputProps };
export { EmailInput, EmailInputField };
