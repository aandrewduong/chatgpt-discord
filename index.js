require("dotenv").config({ path: ".env" });
const { Client, GatewayIntentBits } = require("discord.js");
const { OpenAI } = require("openai");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const openAiClient = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

client.on("ready", () => console.log(`Running ${new Date().toISOString()}`));
client.login(process.env.DISCORD_BOT_TOKEN);

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    try {
        const attachmentUrls = message.attachments.size > 0 
            ? message.attachments.map(attachment => attachment.url)
            : null;
			
		message.channel.sendTyping();
        const messages = [
            {
                role: "system",
                content: "You are a helpful assistant."
            },
            {
                role: "user",
                content: [
                    { type: "text", text: message.content }
                ]
            }
        ];

        // If there are attachments, add their URLs to the messages array
        if (attachmentUrls) {
            attachmentUrls.forEach(url => {
                messages[1].content.push({
                    type: "image_url",
                    image_url: {
                        url: url
                    }
                });
            });
        }

        const chatCompletion = await openAiClient.chat.completions.create({
            model: "gpt-4o",
            messages: messages
        });

        const responseContent = chatCompletion.choices[0].message.content;
        if (responseContent.length > 2000) { // Adjusted to Discord's character limit for a single message
            const firstPart = responseContent.substring(0, 2000);
            const secondPart = responseContent.substring(2000);

            await message.reply(firstPart);
            return await message.reply(secondPart);
        } else {
            return message.reply(responseContent);
        }

        } catch (exception) {
        console.log(exception);
    }
});
