export interface WorkOrder {
    id: string;
    orderNumber: string;
    productName: string;
    quantity: number;
    status: 'planned' | 'in_progress' | 'quality_check' | 'completed';
    startDate?: Date;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    currentStep?: string; // e.g., 'Cutting', 'Assembly'
}
