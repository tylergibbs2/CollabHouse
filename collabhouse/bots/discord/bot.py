from collections import defaultdict

import aiohttp
import asyncpg
import os
from pathlib import Path

from discord.ext import commands
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(".") / ".env")


bot = commands.Bot(command_prefix=commands.when_mentioned)

watched_channels = defaultdict(list)

@bot.event
async def on_ready():
    bot.sess = aiohttp.ClientSession()
    bot.db_pool = await asyncpg.create_pool(
        host=os.getenv("PSQL_HOST"),
        port=os.getenv("PSQL_PORT"),
        user=os.getenv("PSQL_USER"),
        password=os.getenv("PSQL_PASS"),
        database=os.getenv("PSQL_DB"),
        loop=bot.loop
    )

    async with bot.db_pool.acquire() as con:
        watching = await con.fetch("""
            SELECT
                channel_id,
                CAST(room_id as TEXT)
            FROM
                discord_watched_channels;
        """)

    for relation in watching:
        channel_id = relation["channel_id"]
        room_id = relation["room_id"]
        watched_channels[channel_id].append(room_id)

    print("Bot ready")

@bot.event
async def on_command_error(ctx, err):
    if isinstance(err, commands.MissingRequiredArgument):
        return await ctx.reply("Please enter a room ID!")
    else:
        print(err)

@bot.event
async def on_message(message):
    if message.author.bot:
        return

    await bot.process_commands(message)
    rooms = watched_channels.get(message.channel.id)
    if not rooms:
        return

    content = None
    if message.attachments:
        atchmt = message.attachments[0]
        if atchmt.url.endswith((".png", ".jpg", ".jpeg", ".gif")):
            content = atchmt.url
    else:
        content = message.content

    payload = {
        "room_ids": rooms,
        "content": content
    }

    try:
        await bot.sess.post("http://localhost:5000/api/receive", json=payload)
    except Exception:
        import traceback
        traceback.print_exc()

@bot.command()
async def watch(ctx, room_id: str):
    async with bot.db_pool.acquire() as con:
        try:
            exists = await con.fetchval("""
                SELECT
                    id
                FROM
                    rooms
                WHERE id=$1;
            """, room_id)
        except:
            exists = False
        finally:
            if not exists:
                return await ctx.reply("Sorry, a room with that ID does not exist!")

        try:
            await con.execute("""
                INSERT INTO
                    discord_watched_channels (
                        channel_id,
                        room_id
                    )
                VALUES
                    ($1, $2);
            """, ctx.channel.id, room_id)
        except Exception:
            await con.execute("""
                DELETE FROM
                    discord_watched_channels
                WHERE channel_id=$1 AND room_id=$2;
            """, ctx.channel.id, room_id)
            watched_channels[ctx.channel.id].remove(room_id)
            return await ctx.send(f"No longer watching messages for that room in `#{ctx.channel.name}`.")

    watched_channels[ctx.channel.id].append(room_id)

    await ctx.reply(f"Now watching for messages in `#{ctx.channel.name}`!")
