import qrcode from "qrcode";

export const generateQR = async (text: string): Promise<string> => {
    try {
        return await qrcode.toDataURL(text);
    } catch (err) {
        console.error(err);
        return '';
    }
}