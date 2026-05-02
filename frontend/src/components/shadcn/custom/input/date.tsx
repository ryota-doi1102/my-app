import { Field } from "@base-ui/react/field";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/shadcn/original/input";
import { cn } from "@/lib/utils";

interface DateInputProps {
	id?: string;
	label?: string;
	type?: "date" | "month";
	value: string;
	onChange: (value: string) => void;
	errorMessage?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

function DateInput({
	id,
	label,
	type = "date",
	value,
	onChange,
	errorMessage,
	required,
	disabled,
	className,
}: DateInputProps) {
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

interface DateInputFieldProps<T extends FieldValues>
	extends Omit<DateInputProps, "value" | "onChange" | "errorMessage"> {
	control: Control<T>;
	name: Path<T>;
}

function DateInputField<T extends FieldValues>({
	control,
	name,
	...props
}: DateInputFieldProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<DateInput
					value={field.value}
					onChange={field.onChange}
					errorMessage={fieldState.error?.message}
					{...props}
				/>
			)}
		/>
	);
}

export type { DateInputFieldProps, DateInputProps };
export { DateInput, DateInputField };
