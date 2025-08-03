import discord
import json

with open("config.json") as f:
    cfg = json.load(f)

intents = discord.Intents.default()
client = discord.Client(intents=intents)
prefix = cfg["prefix"]

@client.event
async def on_ready():
    print(f"Bot is online as {client.user}")

@client.event
async def on_message(msg):
    if msg.author.bot or not msg.content.startswith(prefix):
        return
    if msg.content == f"{prefix}ping":
        await msg.channel.send("Pong!")

client.run(cfg["token"])
