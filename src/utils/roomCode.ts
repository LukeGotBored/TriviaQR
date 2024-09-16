export function createRoomCode(existingCodes: Set<string>): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += characters[Math.floor(Math.random() * characters.length)];
        }
    } while (existingCodes.has(code));

    return code;
}
