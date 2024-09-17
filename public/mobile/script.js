import { characterBuilder } from '../script/utils.js';

// Script per caricare il personaggio nella schermata mobile
document.addEventListener('DOMContentLoaded', () => {
        const characterIdElement = document.getElementById('characterId');
        if (characterIdElement && characterIdElement.innerHTML !== "") {
                let element = characterBuilder(characterIdElement.innerHTML, 0);
                document.getElementById("character").innerHTML = element;
        }
});
