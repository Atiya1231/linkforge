import QRCode from "qrcode";

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
    color: {
      dark: "#080d1b",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: 320,
    margin: 2,
    color: {
      dark: "#080d1b",
      light: "#ffffff",
    },
  });
}

