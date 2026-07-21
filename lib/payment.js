// Shown to customers on the payment step of the booking modal.
// This mirrors what's already printed on the QR code image itself
// (public/payment-qr.png), so update both together if it ever changes.
export const PAYMENT_INFO = {
  bank: 'GoTyme Bank',
  accountName: 'Lea Kimberly Deiparine',
  accountNumberLast4: '9696',
  instructions:
    'Scan the QR code below using your GCash, Maya, or bank app (InstaPay), then upload a screenshot or photo of the successful payment.',
};

export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
