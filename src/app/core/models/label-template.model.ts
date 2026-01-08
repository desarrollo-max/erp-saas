export type LabelElementType = 'text' | 'image' | 'barcode' | 'qr' | 'shape';

export interface LabelElementStyle {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string; // 'bold', 'normal'
    fontStyle?: string; // 'italic', 'normal'
    textDecoration?: string; // 'underline', 'line-through'
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    zIndex?: number;
}

export interface LabelElement {
    id: string;
    type: LabelElementType;
    content: string; // Text content, Image URL, or Barcode value
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    style: LabelElementStyle;
    variableField?: string | null; // e.g., 'product.name', 'product.sku', 'product.price' for dynamic binding
}

export interface LabelTemplate {
    id: string;
    name: string;
    width: number; // in mm
    height: number; // in mm
    elements: LabelElement[];
    createdAt: Date;
    updatedAt: Date;
    isDefault?: boolean;
}
