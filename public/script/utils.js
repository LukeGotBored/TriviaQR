export const getTip = () => {
    const tips = [
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
        "Treat your phone well—it might just help you win!",
        "If Trivia, only QR!",
        "The Trivia of QR will soon be told."
    ];

    return tips[Math.floor(Math.random() * tips.length)];
};

export const characterBuilder = (characterID, emotion = 0) => {
    // controlla se il characterID è una stringa o un array di numeri
    if (typeof characterID === 'string') {
        characterID = characterID.split(',').map(Number);
    }

    let body = parseInt(characterID[0]);
    let color = parseInt(characterID[1]);

    // Validate inputs
    if (isNaN(body) || isNaN(color) || body < 0 || body > 1 || color < 0 || color > 3 || emotion < 0 || emotion > 2) {
        console.error('Invalid character ID: ', characterID);
        return `Invalid character ID`;
    }

    // SVGs for body types (can be moved to a separate file if needed)
    const bodySVGs = [
        `
        <svg class="body" width="272" height="518" viewBox="0 0 272 518" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M83.2812 333.38V505.159" stroke="black" stroke-width="25" stroke-miterlimit="3.4" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
            <path d="M189.281 333.38V505.159" stroke="black" stroke-width="25" stroke-miterlimit="3.4" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
            <path d="M136.281 259C187.405 259 228.563 300.052 228.563 351.045V398.962H44V351.045C44 300.052 85.1575 259 136.281 259Z" stroke="black" stroke-width="25" stroke-miterlimit="3.4" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
            <path d="M136.138 259.277C204.146 259.277 259.277 204.146 259.277 136.138C259.277 68.131 204.146 13 136.138 13C68.131 13 13 68.131 13 136.138C13 204.146 68.131 259.277 136.138 259.277Z" stroke="black" stroke-width="25" stroke-miterlimit="3.4" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
        </svg>
        `,
        `
        <svg class="body" width="272" height="518" viewBox="0 0 272 518" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M83.2812 333.38V505.159" stroke="black" stroke-width="25" stroke-miterlimit="3.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M189.281 333.38V505.159" stroke="black" stroke-width="25" stroke-miterlimit="3.4" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
            <path d="M136.281 259C187.405 259 228.563 300.052 228.563 351.045V398.962H44V351.045C44 300.052 85.1575 259 136.281 259Z" stroke="black" stroke-width="25" stroke-miterlimit="3.4" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
            <rect x="12.5" y="12.5" width="247" height="247" rx="22.5" stroke="black" stroke-width="25" fill="currentColor"/>
        </svg>
        `
    ];

    const faceSVGs = [
        `
            <svg class="eyes" width="120" height="72" viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.0214 0C6.79874 0 0.179688 8.39053 0.179688 18.8125V52.3535C0.179688 62.7754 6.79874 71.1659 15.0214 71.1659C23.2442 71.1659 29.8632 62.7754 29.8632 52.3535V18.8125C29.8632 8.39053 23.2442 0 15.0214 0ZM105.021 0C96.7987 0 90.1797 8.39053 90.1797 18.8125V52.3535C90.1797 62.7754 96.7987 71.1659 105.021 71.1659C113.244 71.1659 119.863 62.7754 119.863 52.3535V18.8125C119.863 8.39053 113.244 0 105.021 0Z" fill="black"/>
            </svg>
        `,
        `
            <svg class="eyes" width="162" height="50" viewBox="0 0 162 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M35.7012 3.82031L25.961 13.5605L4 35.5214L13.7422 45.2618L35.7012 23.303L57.6602 45.2618L67.4024 35.5214L45.4415 13.5605L35.7012 3.82031ZM126.117 3.82031L116.377 13.5605L94.416 35.5214L104.158 45.2618L126.117 23.303L148.076 45.2618L157.818 35.5214L135.857 13.5605L126.117 3.82031Z" fill="black" stroke="black" stroke-width="7.64081" stroke-miterlimit="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        `
            <svg class="eyes" width="140" height="72" viewBox="0 0 140 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.9199 4L4.17969 13.7404L26.1386 35.6988L4.17969 57.6599L13.9199 67.4003L35.8809 45.4415L45.621 35.6988L35.8809 25.9588L13.9199 4ZM126.297 4L104.336 25.9588L94.5956 35.6988L104.336 45.4392L126.297 67.4003L136.037 57.6599L114.078 35.6988L136.037 13.7404L126.297 4Z" fill="black" stroke="black" stroke-width="7.64081" stroke-miterlimit="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `
    ];




    // Crea un div con la classe character
    let character = document.createElement('div');
    character.classList.add('character');

    // Inserisci l'HTML del character nel div
    character.innerHTML = `
        <div class="body-container">
            ${bodySVGs[body]}
            <div class="face-container" style="position: absolute; top: 25%; left: 50%; transform: translate(-50%, -50%);">
                ${faceSVGs[emotion]}
            </div>
        </div>`;

    // se la faccia è la faccia 1, imposta .character .body-container .face-container img { per essere leggermente più grande di 50px
    if (emotion == 1) {
        character.querySelector('.face').style.width = "60px";
        character.querySelector('.face').style.height = "60px";
        character.querySelector('.face-container').style.top = "10%";
    }
    
    const colorValues = {
        0: '#FF4D4D',  
        1: '#FFAD33',
        2: '#32FF34',
        3: '#33ADFF'
    };

    const paths = character.querySelectorAll('.body path, .body rect');

    paths.forEach(path => {
        if (path.getAttribute('fill') === 'currentColor') {
            path.setAttribute('fill', colorValues[color]); 
        }
    });

    return character.outerHTML;
};

export const TriviaCategories = [
    ["Any Category", "any"],
    ["General Knowledge", "9"],
    ["Entertainment: Books", "10"],
    ["Entertainment: Film", "11"],
    ["Entertainment: Music", "12"],
    ["Entertainment: Musicals & Theatres", "13"],
    ["Entertainment: Television", "14"],
    ["Entertainment: Video Games", "15"],
    ["Entertainment: Board Games", "16"],
    ["Science & Nature", "17"],
    ["Science: Computers", "18"],
    ["Science: Mathematics", "19"],
    ["Mythology", "20"],
    ["Sports", "21"],
    ["Geography", "22"],
    ["History", "23"],
    ["Politics", "24"],
    ["Art", "25"],
    ["Celebrities", "26"],
    ["Animals", "27"],
    ["Vehicles", "28"],
    ["Entertainment: Comics", "29"],
    ["Science: Gadgets", "30"],
    ["Entertainment: Japanese Anime & Manga", "31"],
    ["Entertainment: Cartoon & Animations", "32"]
];

export const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const calculateScore = (difficulty) => {
    const baseScore = 1000;
    const difficultyMultiplier = {
        easy: 1,
        medium: 1.5,
        hard: 2
    };
    return Math.round(baseScore * difficultyMultiplier[difficulty]);
};

export const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
