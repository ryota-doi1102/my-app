import { Field } from "@base-ui/react/field";
import type React from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Checkbox } from "@/components/shadcn/original/checkbox";
import { cn } from "@/lib/utils";

interface InputCheckboxProps {
	id?: string;
	/** ラベル。JSX（リンク等）も受け付ける */
	label: React.ReactNode;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	errorMessage?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

function InputCheckbox({
	id = "checkbox",
	label,
	checked,
	onCheckedChange,
	errorMessage,
	required,
	disabled,
	className,
}: InputCheckboxProps) {
	return (
		<Field.Root invalid={!!errorMessage} className={cn("flex flex-col gap-1.5", className)}>
			<div className="flex items-start gap-3">
				<Checkbox
					id={id}
					checked={checked}
					onCheckedChange={onCheckedChange}
					disabled={disabled}
					className="mt-0.5"
				/>
				<Field.Label
					htmlFor={id}
					className="text-sm font-medium leading-relaxed cursor-pointer text-foreground"
				>
					{label}
					{required && (
						<span className="ml-1 text-destructive" aria-hidden="true">
							*
						</span>
					)}
				</Field.Label>
			</div>
			<Field.Error match={true} className="text-xs text-destructive">
				{errorMessage}
			</Field.Error>
		</Field.Root>
	);
}

// --- react-hook-form 連携 ---

interface InputCheckboxFieldProps<T extends FieldValues>
	extends Omit<InputCheckboxProps, "checked" | "onCheckedChange" | "errorMessage"> {
	control: Control<T>;
	name: Path<T>;
}

function InputCheckboxField<T extends FieldValues>({
	control,
	name,
	...props
}: InputCheckboxFieldProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<InputCheckbox
					checked={field.value as boolean}
					onCheckedChange={field.onChange}
					errorMessage={fieldState.error?.message}
					{...props}
				/>
			)}
		/>
	);
}

export type { InputCheckboxFieldProps, InputCheckboxProps };
export { InputCheckbox, InputCheckboxField };
