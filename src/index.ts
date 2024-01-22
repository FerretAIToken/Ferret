import "./bot/main";

process.on("uncaughtException", (e) => console.log(e.message));