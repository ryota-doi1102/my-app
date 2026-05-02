import { Field } from "@base-ui/react/field";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Textarea } from "@/components/shadcn/original/textarea";
import { cn } from "@/lib/utils";

interface TextAreaInputProps {
	id?: string;
	label?: string;
	value: string;
	onChange: (value: string) => void;
	errorMessage?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	rows?: number;
	className?: string;
}

function TextAreaInput({
	id,
	label,
	value,
	onChange,
	errorMessage,
	placeholder,
	required,
	disabled,
	rows,
	className,
}: TextAreaInputProps) {
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
			<Textarea
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				rows={rows}
			/>
			<Field.Error match={true} className="text-xs text-destructive">
				{errorMessage}
			</Field.Error>
		</Field.Root>
	);
}

// --- react-hook-form 連携 ---

interface TextAreaInputFieldProps<T extends FieldValues>
	extends Omit<TextAreaInputProps, "value" | "onChange" | "errorMessage"> {
	control: Control<T>;
	name: Path<T>;
}

function TextAreaInputField<T extends FieldValues>({
	control,
	name,
	...props
}: TextAreaInputFieldProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<TextAreaInput
					value={field.value}
					onChange={field.onChange}
					errorMessage={fieldState.error?.message}
					{...props}
				/>
			)}
		/>
	);
}

export type { TextAreaInputFieldProps, TextAreaInputProps };
export { TextAreaInput, TextAreaInputField };
