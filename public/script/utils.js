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