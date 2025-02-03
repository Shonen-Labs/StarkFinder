"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const token = process.env.MY_TOKEN;
if (!token)
    throw new Error("BOT_TOKEN is required");
const bot = new grammy_1.Bot(token);
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply("Welcome to StarkFinder Test Bot! 🚀");
}));
bot.on("message:text", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.message.text;
    if (text.toLowerCase().includes("bridge")) {
        yield ctx.reply("Bridge request received! This is a test response.");
    }
}));
console.log("Starting bot...");
bot.start();
