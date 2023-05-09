import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Expense, ExpenseUpsertInput } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class ExpensesService {
    constructor(private prisma: PrismaService) {}

    async getExpense({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<Expense | null> {
        return this.prisma.expenses.findFirst({
            where: {
                id: expense_id,
                active: 1,
            },
        });
    }

    async getExpenses(): Promise<Expense[]> {
        return this.prisma.expenses.findMany({
            where: {
                active: 1,
            },
        });
    }

    async upsertExpense(expenseInput: ExpenseUpsertInput): Promise<Expense> {
        await this.validateUpsertExpense(expenseInput);

        return this.prisma.expenses.upsert({
            create: {
                amount: expenseInput.amount,
                supplier_id: expenseInput.supplier_id,
            },
            update: {
                amount: expenseInput.amount,
                supplier_id: expenseInput.supplier_id,
            },
            where: {
                id: expenseInput.id || 0,
            },
        });
    }

    async validateUpsertExpense(
        expenseUpsertInput: ExpenseUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // order production type cant change

        if (expenseUpsertInput.id) {
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteExpense({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<boolean> {
        const expense = await this.getExpense({ expense_id: expense_id });

        if (!expense_id) {
            throw new NotFoundException();
        }

        await this.prisma.expenses.update({
            data: {
                active: -1,
            },
            where: {
                id: expense_id,
            },
        });

        return true;
    }

    async isDeletable({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<boolean> {
        return true;
    }
}
