import QRCode from 'qrcode';

export async function buildPixQrCodeDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 280,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
