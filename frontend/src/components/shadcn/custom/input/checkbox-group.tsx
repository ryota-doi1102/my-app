import { Field } from "@base-ui/react/field";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Checkbox } from "@/components/shadcn/original/checkbox";
import { cn } from "@/lib/utils";

interface InputCheckboxGroupProps {
	/** チェックボックスのID生成に使用するプレフィックス */
	groupName?: string;
	label?: string;
	options: readonly string[];
	value: string[];
	onChange: (value: string[]) => void;
	errorMessage?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

function InputCheckboxGroup({
	groupName = "checkbox-group",
	label,
	options,
	value,
	onChange,
	errorMessage,
	required,
	disabled,
	className,
}: InputCheckboxGroupProps) {
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
			<div className="flex flex-wrap gap-4">
				{options.map((option) => (
					<div key={option} className="flex items-center gap-2">
						<Checkbox
							id={`${groupName}-${option}`}
							checked={value.includes(option)}
							onCheckedChange={(checked) => {
								onChange(checked ? [...value, option] : value.filter((v) => v !== option));
							}}
							disabled={disabled}
						/>
						<label
							htmlFor={`${groupName}-${option}`}
							className="text-sm font-medium leading-none cursor-pointer"
						>
							{option}
						</label>
					</div>
				))}
			</div>
			<Field.Error match={true} className="text-xs text-destructive">
				{errorMessage}
			</Field.Error>
		</Field.Root>
	);
}

// --- react-hook-form 連携 ---

interface InputCheckboxGroupFieldProps<T extends FieldValues>
	extends Omit<InputCheckboxGroupProps, "value" | "onChange" | "errorMessage"> {
	control: Control<T>;
	name: Path<T>;
}

function InputCheckboxGroupField<T extends FieldValues>({
	control,
	name,
	...props
}: InputCheckboxGroupFieldProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<InputCheckboxGroup
					groupName={name}
					value={(field.value as string[]) ?? []}
					onChange={field.onChange}
					errorMessage={fieldState.error?.message}
					{...props}
				/>
			)}
		/>
	);
}

export type { InputCheckboxGroupFieldProps, InputCheckboxGroupProps };
export { InputCheckboxGroup, InputCheckboxGroupField };
