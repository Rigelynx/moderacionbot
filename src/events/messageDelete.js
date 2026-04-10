import { setSnipe } from '../utils/snipeStore.js';

export default {
    name: 'messageDelete',
    once: false,

    async execute(message) {
        // Ignore bot messages and partials
        if (!message.author || message.author.bot) return;
        if (!message.content) return;

        setSnipe(message.channel.id, {
            content: message.content,
            author: message.author.username,
            avatar: message.author.displayAvatarURL({ size: 64 }),
            timestamp: Date.now()
        });
    }
};
