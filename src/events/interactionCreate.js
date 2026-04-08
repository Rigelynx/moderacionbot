export default {
    name: 'interactionCreate',
    once: false,
    
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        
        console.log(`Botón presionado: ${interaction.customId}`);
    }
};
