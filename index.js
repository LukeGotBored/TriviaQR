// https://expressjs.com/en/4x/api.html

import { Socket } from 'socket.io';
import express from 'express';
import path from 'path';
import qrcode from 'qrcode';

const app = new express();
const port = 3000;

// questa path servirà i file statici
app.use('/public', express.static('public'));


app.use((req, res, next) => {
    console.log(`[🔵] ${req.method} ${req.url}`);
    next();
});

// --- Endpoint --- //

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/pages/index.html'));
});

app.get('/generate', (req, res) => {
    const url = req.query.url;
    qrcode.toDataURL(url, (err, src) => {
        res.send(`<img src="${src}">`);
    });
});


// ---------------- //


app.listen(port, () => {
    console.log(`[✅] Server is running on port http://localhost:${port}`);
});



/* 
Idea
- Viene creata una nuova sessione
- Quando la pagina display viene aperta, il client si connette al server tramite socket, creando una nuova stanza
- Il client andrà a richiedere i qr per ogni azione che deve fare


*/