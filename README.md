# SmartQR 

<img src="https://github.com/user-attachments/assets/05ec6a53-86dc-426b-b33e-0340f442ea3a" style="height:64px;" align="left"></img>Create dynamic, interactive presentations directly from JSON data. Each presentation slide and interaction is defined in JSON, and users control the presentation flow by scanning QR codes with their phones. This allows for seamless, real-time navigation and interaction with the presentation content.



## Installation

To install dependencies, run:

```bash
bun install
```

## Running the Project

To start the project, run:

```bash
bun run index.js
```

## About

This project was created using `bun init` in bun v1.1.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Features

- [x] Develop a system for generating and managing QR codes and NFC tags for commands.
- [ ] Implemnet a client-side presentation parser and renderer.
- [ ] Create a backend capable of processing user requests in real time (through the use of sockets).
- [ ] Implement basic (forward, backward, home) and advanced (opening predefined links) navigation features.
- [ ] Ensure compatibility with most modern smartphones without requiring dedicated apps.
- [ ] Implement a web interface to create and manage these presentations (a content editor).

## Requirements

- Node.js (compatible with Bun)
- Bun v1.1.13 or later

## Usage

1. Ensure you have all dependencies installed with `bun install`.
2. Run the project using `bun run index.ts`.
3. Load the generated QR codes on screen.
4. Users can scan the QR codes with their phones to interact with the presentation.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
