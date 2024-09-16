import { characterBuilder } from './utils.js'

document.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 10; i++) {
        const randomFace = Math.floor(Math.random() * 3);
        const randomValue1 = Math.floor(Math.random() * 4);
        const randomValue2 = Math.floor(Math.random() * 4);
        const character = characterBuilder([randomValue1, randomValue2], randomFace);
        document.body.appendChild(character);
    }
});
