import TG from "node-telegram-bot-api";
import config from "../helpers/getConfig";

const client = new TG(config.TOKEN, { polling: true });

export default client;