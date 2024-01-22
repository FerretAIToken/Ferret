import fs from "fs";
import path from "path";

interface Config {
    TOKEN: string,
    rateLimit: Record<string, number>
}

const config = fs.readFileSync(path.join(__dirname, "../../config.json"));

const JSONCONFIG: Config = JSON.parse(config.toString());

export default JSONCONFIG;