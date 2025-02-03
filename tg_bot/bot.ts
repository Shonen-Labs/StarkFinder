import { Bot } from "grammy";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.MY_TOKEN;
if (!token) throw new Error("BOT_TOKEN is required");

const bot = new Bot(token);

bot.command("start", async (ctx) => {
  await ctx.reply("Welcome to StarkFinder Test Bot! 🚀");
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.toLowerCase().includes("bridge")) {
    await ctx.reply("Bridge request received! This is a test response.");
  }
});

console.log("Starting bot...");
bot.start();
