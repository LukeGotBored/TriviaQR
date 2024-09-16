export const getTip = () => {
    let tips = [
        "Scan the QR—phones are great, but they can't read minds… yet.",
        "The fastest scanner wins! (Kidding, but speed helps.)",
        "Keep steady—QR codes are shy!",
        "Team spirit is key—unless you're stealing the right answer.",
        "Try scanning with your non-dominant hand. Magic might happen!",
        "Can't scan? Blame the lighting. Always the lighting.",
        "Winning isn't everything… but it feels awesome!",
        "Clean your camera—blurry scans, blurry answers.",
        "Too tough? Stare at the QR. Maybe it'll blink twice.",
        "You're not just scanning; you're strategically scanning.",
        "It's about the journey… but winning is pretty cool too.",
        "Quick scans = quick wins!",
        "No pressure, but the right answer is just a scan away.",
        "Scanning is step one. The real challenge? Picking the answer!",
        "Clean lens = clear win.",
        "Watch the timer! Don't let the game leave you behind.",
        "Shaky hands? Hold your breath—it helps!",
        "QR not scanning? Find its good side.",
        "Guessing works—just don't tell your team!",
        "Double-check before you scan. Confidence is key!",
        "Treat your phone well—it might just help you win!"
    ];

    return tips[Math.floor(Math.random() * tips.length)];
}

export const characterBuilder = (characterID, emotion = 0) => {
    // characterID is a 2-digit string where the first digit is the head shape (0-3) and the second is the color (0-3)
    let head = characterID[0];
    let color = characterID[1];

    // if(head < 0 || head > 3 || color < 0 || color > 3 || emotion < 0 || emotion > 2) {
    //     console.error('Invalid character ID: ', characterID);
    //     return `Invalid character ID`;
    // }

    // Create a new div element called character
    let character = document.createElement('div');
    character.classList.add('character');

    // Build the inner HTML structure for the character
    character.innerHTML = `
        <div class="body-container">
            <img src="./assets/player/body.svg" class="body" alt="body">
            <div class="head-container">
                <img src="./assets/player/head/head-${head}.svg" class="head" alt="head">
                <div class="face-container">
                    <img src="./assets/player/face/face-${emotion}.svg" class="face" alt="face">
                </div>
            </div>
        </div>`;

    // Apply color class
    character.classList.add(`color-${color}`);

    return character;
};
