// Layout Components
export { default as Header, type HeaderProps } from './layout/Header';
export { default as BottomNav } from './layout/BottomNav';

// UI Primitives
export { default as Card, type CardProps } from './ui/Card';
export { default as Badge, type BadgeProps, type BadgeVariant } from './ui/Badge';
export { default as DatePickerModal, type DatePickerModalProps } from './ui/DatePickerModal';

// Domain Feature Components
export { default as ProductionBatchCard, type ProductionBatchCardProps } from './production/ProductionBatchCard';
export { default as CustomerCard, type CustomerCardProps } from './customers/CustomerCard';
export { default as PaymentModeBadge, type PaymentModeBadgeProps } from './customers/PaymentModeBadge';
