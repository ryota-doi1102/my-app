import { Field } from "@base-ui/react/field";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/shadcn/original/input";
import { cn } from "@/lib/utils";

interface TextInputProps {
	id?: string;
	label?: string;
	type?: "text" | "tel" | "number";
	value: string;
	onChange: (value: string) => void;
	errorMessage?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	maxLength?: number;
	className?: string;
}

function TextInput({
	id,
	label,
	type = "text",
	value,
	onChange,
	errorMessage,
	placeholder,
	required,
	disabled,
	maxLength,
	className,
}: TextInputProps) {
	return (
		<Field.Root invalid={!!errorMessage} className={cn("flex flex-col gap-1.5", className)}>
			{label && (
				<Field.Label className="text-sm font-medium text-foreground">
					{label}
					{required && (
						<span className="ml-1 text-destructive" aria-hidden="true">
							*
						</span>
					)}
				</Field.Label>
			)}
			<Input
				id={id}
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				maxLength={maxLength}
			/>
			<Field.Error match={true} className="text-xs text-destructive">
				{errorMessage}
			</Field.Error>
		</Field.Root>
	);
}

// --- react-hook-form 連携 ---

interface TextInputFieldProps<T extends FieldValues>
	extends Omit<TextInputProps, "value" | "onChange" | "errorMessage"> {
	control: Control<T>;
	name: Path<T>;
}

function TextInputField<T extends FieldValues>({
	control,
	name,
	...props
}: TextInputFieldProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<TextInput
					value={field.value}
					onChange={field.onChange}
					errorMessage={fieldState.error?.message}
					{...props}
				/>
			)}
		/>
	);
}

export type { TextInputFieldProps, TextInputProps };
export { TextInput, TextInputField };
