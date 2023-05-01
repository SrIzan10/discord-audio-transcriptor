import { discordEvent } from '@sern/handler';
import axios from 'axios';
import { appendFileSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { random as randomString } from '../util/randomstring.js';
import { execa } from 'execa';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getAudioDurationInSeconds } from 'get-audio-duration';

export default discordEvent({
    name: 'messageCreate',
    async execute(message) {
        if (message.attachments.size !== 1) return;
        if (message.attachments.first()!.contentType !== 'audio/ogg') return;
        const attachment = message.attachments.first()!
        const random = randomString(4)
        await message.channel.sendTyping()

        await axios.get(attachment.url, { responseType: 'arraybuffer' }).then(res => appendFileSync(`temp/${random}.ogg`, res.data))
        
        if (await getAudioDurationInSeconds(`./temp/${random}.ogg`) > 150) {
            await message.reply({ content: 'Audio is too long! Make sure it\'s less than 2 minutes 30 seconds in length!' })
            unlinkSync(`temp/${random}.ogg`)
            return;
        }

        await execa('ffmpeg', ['-i', `temp/${random}.ogg`, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', `temp/${random}.wav`])
        await execa('./util/whisper', ['-otxt', '-l', 'auto', '-m', 'models/small.bin', '-f', `temp/${random}.wav`])
        
        const transcripted = readFileSync(`temp/${random}.wav.txt`, 'utf8').toString()

        await axios.post('https://api.srizan.dev/transcriptor/save', {
            text: transcripted,
            username: message.author.username,
            guild: message.guild?.name,
            msgid: message.id,
            token: process.env.APITOKEN
        })
        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('View it on the web')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://transcriptor.srizan.dev?msgid=${message.id}`)
        )

        await message.reply({ content: `Message translated! Content is:\`\`\`${transcripted}\`\`\``, components: [button] })

        unlinkSync(`temp/${random}.ogg`)
        unlinkSync(`temp/${random}.wav`)
        unlinkSync(`temp/${random}.wav.txt`)
    }
})