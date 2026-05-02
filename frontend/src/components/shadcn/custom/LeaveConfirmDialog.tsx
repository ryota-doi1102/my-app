import { Button } from "@/components/shadcn/original/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/shadcn/original/dialog";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export function LeaveConfirmDialog({ open, onOpenChange, onConfirm }: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>入力内容を破棄しますか？</DialogTitle>
					<DialogDescription>入力内容が失われますが、よろしいですか？</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						キャンセル
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						OK
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
